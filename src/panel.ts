import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import {
  FONT_MAX,
  FONT_MIN,
  type ScopeName,
  type StateMessage,
  type StateReason,
  type WebviewMessage,
} from './messages';
import { NoteStore, PreferenceStore } from './storage';

function createNonce(): string {
  return randomBytes(16).toString('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isScope(value: unknown): value is ScopeName {
  return value === 'global' || value === 'workspace';
}

function parseMessage(value: unknown): WebviewMessage | null {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return null;
  }
  switch (value.type) {
    case 'ready':
    case 'create':
      return { type: value.type };
    case 'save':
      if (typeof value.id === 'string' && typeof value.body === 'string') {
        return { type: 'save', id: value.id, body: value.body };
      }
      return null;
    case 'setScope':
      if (isScope(value.scope)) {
        return { type: 'setScope', scope: value.scope };
      }
      return null;
    case 'select':
    case 'rename':
    case 'delete':
      if (typeof value.id === 'string') {
        return { type: value.type, id: value.id };
      }
      return null;
    case 'setFontSize':
      if (value.size === null || (typeof value.size === 'number' && Number.isInteger(value.size))) {
        return { type: 'setFontSize', size: value.size as number | null };
      }
      return null;
    case 'openLink':
      if (typeof value.href === 'string') {
        return { type: 'openLink', href: value.href };
      }
      return null;
    default:
      return null;
  }
}

function viewHtml(webview: vscode.Webview, scriptUri: vscode.Uri, nonce: string): string {
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    'img-src https:',
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>Side Notes</title>
</head>
<body>
<div id="app"></div>
<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

export class SideNotesViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'sideNotes.view';

  private view: vscode.WebviewView | undefined;
  private ready = false;
  private scope: ScopeName = 'global';
  private createOnReady = false;
  private chain: Promise<void> = Promise.resolve();
  private readonly stores = new Map<string, NoteStore>();
  private readonly prefs: PreferenceStore;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.prefs = new PreferenceStore(context.globalStorageUri.fsPath);
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.ready = false;
    const webview = webviewView.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
    };
    const nonce = createNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'webview.js'));
    webview.html = viewHtml(webview, scriptUri, nonce);
    webview.onDidReceiveMessage((message: unknown) => {
      this.enqueueMessage(message);
    });
    webviewView.onDidChangeVisibility(() => {
      if (!webviewView.visible) {
        void webview.postMessage({ type: 'flush' });
      }
    });
    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.view = undefined;
        this.ready = false;
      }
    });
  }

  async newNote(): Promise<void> {
    if (this.view && this.ready) {
      await this.view.webview.postMessage({ type: 'newNote' });
      return;
    }
    this.createOnReady = true;
    await vscode.commands.executeCommand(`${SideNotesViewProvider.viewId}.focus`);
  }

  dispose(): void {
    void this.view?.webview.postMessage({ type: 'flush' });
  }

  private enqueueMessage(message: unknown): void {
    this.chain = this.chain.then(() => this.handle(message)).catch((error: unknown) => this.fail(error));
  }

  private async handle(message: unknown): Promise<void> {
    const parsed = parseMessage(message);
    if (!parsed) {
      return;
    }
    switch (parsed.type) {
      case 'ready':
        this.ready = true;
        await this.postState('load');
        if (this.createOnReady) {
          this.createOnReady = false;
          const store = this.currentStore();
          if (store) {
            await store.createNote();
            await this.postState('create');
          }
        }
        return;
      case 'save': {
        const store = this.currentStore();
        if (!store) {
          return;
        }
        await store.saveBody(parsed.id, parsed.body);
        return;
      }
      case 'setScope':
        this.scope = parsed.scope;
        await this.postState('scope');
        return;
      case 'select': {
        const store = this.currentStore();
        if (!store) {
          return;
        }
        await store.selectNote(parsed.id);
        await this.postState('select');
        return;
      }
      case 'create': {
        const store = this.currentStore();
        if (!store) {
          return;
        }
        await store.createNote();
        await this.postState('create');
        return;
      }
      case 'rename':
        void this.renameFlow(parsed.id);
        return;
      case 'delete':
        void this.deleteFlow(parsed.id);
        return;
      case 'setFontSize':
        if (parsed.size !== null && (parsed.size < FONT_MIN || parsed.size > FONT_MAX)) {
          return;
        }
        await this.prefs.setFontSize(parsed.size);
        return;
      case 'openLink':
        await this.openLink(parsed.href);
        return;
      default:
        return;
    }
  }

  private async renameFlow(id: string): Promise<void> {
    try {
      const store = this.currentStore();
      if (!store) {
        return;
      }
      const snap = await store.load();
      const note = snap.notes.find((item) => item.id === id);
      if (!note) {
        return;
      }
      const title = await vscode.window.showInputBox({
        title: 'Rename note',
        prompt: 'Name this note',
        value: note.title,
        ignoreFocusOut: true,
        validateInput: (value) => (value.trim() ? undefined : 'Enter a title'),
      });
      if (!title) {
        return;
      }
      await store.renameNote(id, title);
      await this.postState('rename');
    } catch (error) {
      this.fail(error);
    }
  }

  private async deleteFlow(id: string): Promise<void> {
    try {
      const store = this.currentStore();
      if (!store) {
        return;
      }
      const snap = await store.load();
      const note = snap.notes.find((item) => item.id === id);
      if (!note) {
        return;
      }
      const choice = await vscode.window.showWarningMessage(`Delete "${note.title}"?`, { modal: true }, 'Delete');
      if (choice !== 'Delete') {
        return;
      }
      await store.deleteNote(id);
      await this.postState('delete');
    } catch (error) {
      this.fail(error);
    }
  }

  private async openLink(href: string): Promise<void> {
    let uri: vscode.Uri;
    try {
      uri = vscode.Uri.parse(href, true);
    } catch {
      return;
    }
    if (uri.scheme !== 'http' && uri.scheme !== 'https' && uri.scheme !== 'mailto') {
      return;
    }
    await vscode.env.openExternal(uri);
  }

  private async postState(reason: StateReason): Promise<void> {
    const view = this.view;
    if (!view) {
      return;
    }
    const workspaceAvailable = Boolean(this.context.storageUri);
    const fontSize = await this.prefs.getFontSize();
    const message: StateMessage = {
      type: 'state',
      reason,
      scope: this.scope,
      workspaceAvailable,
      notes: [],
      activeId: null,
      body: '',
      fontSize,
    };
    if (this.scope === 'global' || workspaceAvailable) {
      const store = this.currentStore();
      if (!store) {
        return;
      }
      const snap = await store.load();
      message.notes = snap.notes;
      message.activeId = snap.activeId;
      message.body = snap.body;
    }
    await view.webview.postMessage(message);
  }

  private currentStore(): NoteStore | undefined {
    if (this.scope === 'workspace') {
      if (!this.context.storageUri) {
        return undefined;
      }
      return this.storeFor(this.context.storageUri);
    }
    return this.storeFor(this.context.globalStorageUri);
  }

  private storeFor(uri: vscode.Uri): NoteStore {
    const key = uri.toString();
    const existing = this.stores.get(key);
    if (existing) {
      return existing;
    }
    const store = new NoteStore(uri.fsPath);
    this.stores.set(key, store);
    return store;
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Something went wrong in Side Notes.';
    void vscode.window.showErrorMessage(message);
  }
}

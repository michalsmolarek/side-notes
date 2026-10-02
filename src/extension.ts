import * as vscode from 'vscode';
import { SideNotesViewProvider } from './panel';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new SideNotesViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SideNotesViewProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand('sideNotes.newNote', () => provider.newNote()),
    vscode.commands.registerCommand('sideNotes.focus', () =>
      vscode.commands.executeCommand(`${SideNotesViewProvider.viewId}.focus`),
    ),
    { dispose: () => provider.dispose() },
  );
}

export function deactivate(): void {}

import { FONT_MAX, FONT_MIN, type HostMessage, type ScopeName, type StateMessage, type StateReason } from '../messages';
import { renderMarkdown } from './render';
import { webviewCss } from './style';

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

interface NoteSummary {
  id: string;
  title: string;
}

interface DraftCache {
  scope: ScopeName;
  activeId: string | null;
  body: string;
  dirty: boolean;
  mode: 'edit' | 'preview';
  fontSize: number | null;
}

const vscodeApi = acquireVsCodeApi();
const SAVE_DELAY = 400;

const plusIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.6v10.8M2.6 8h10.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
const moreIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="3.4" r="1.15" fill="currentColor"/><circle cx="8" cy="8" r="1.15" fill="currentColor"/><circle cx="8" cy="12.6" r="1.15" fill="currentColor"/></svg>';

function isDraft(value: unknown): value is DraftCache {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const draft = value as Partial<DraftCache>;
  return draft.scope === 'global' || draft.scope === 'workspace';
}

function clampFont(size: unknown): number | null {
  if (typeof size !== 'number' || !Number.isInteger(size) || size < FONT_MIN || size > FONT_MAX) {
    return null;
  }
  return size;
}

const cachedAtStart = isDraft(vscodeApi.getState()) ? vscodeApi.getState() as DraftCache : null;

const style = document.createElement('style');
style.textContent = webviewCss;
document.head.append(style);

const app = document.createElement('div');
app.className = 'app';
app.hidden = true;

const header = document.createElement('header');
header.className = 'header';

const scopeGroup = document.createElement('div');
scopeGroup.className = 'segments';
scopeGroup.setAttribute('role', 'group');
scopeGroup.setAttribute('aria-label', 'Scope');

const scopeGlobal = document.createElement('button');
scopeGlobal.type = 'button';
scopeGlobal.textContent = 'Global';
scopeGlobal.setAttribute('aria-pressed', 'true');

const scopeWorkspace = document.createElement('button');
scopeWorkspace.type = 'button';
scopeWorkspace.textContent = 'Workspace';
scopeWorkspace.setAttribute('aria-pressed', 'false');

scopeGroup.append(scopeGlobal, scopeWorkspace);

const actions = document.createElement('div');
actions.className = 'header-actions';

const addButton = document.createElement('button');
addButton.type = 'button';
addButton.className = 'icon-button';
addButton.title = 'Add note';
addButton.setAttribute('aria-label', 'Add note');
addButton.innerHTML = plusIcon;

const menuButton = document.createElement('button');
menuButton.type = 'button';
menuButton.className = 'icon-button';
menuButton.title = 'Note actions';
menuButton.setAttribute('aria-label', 'Note actions');
menuButton.setAttribute('aria-haspopup', 'menu');
menuButton.setAttribute('aria-expanded', 'false');
menuButton.innerHTML = moreIcon;

actions.append(addButton, menuButton);

const menu = document.createElement('div');
menu.className = 'menu';
menu.setAttribute('role', 'menu');
menu.hidden = true;

const renameButton = document.createElement('button');
renameButton.type = 'button';
renameButton.textContent = 'Rename';
renameButton.setAttribute('role', 'menuitem');

const deleteButton = document.createElement('button');
deleteButton.type = 'button';
deleteButton.textContent = 'Delete';
deleteButton.setAttribute('role', 'menuitem');

menu.append(renameButton, deleteButton);
header.append(scopeGroup, actions, menu);

const tabs = document.createElement('div');
tabs.className = 'tabs';
tabs.setAttribute('role', 'tablist');
tabs.setAttribute('aria-label', 'Notes');
tabs.hidden = true;

const stage = document.createElement('div');
stage.className = 'stage';

const notice = document.createElement('p');
notice.className = 'notice';
notice.textContent = 'Open a folder to keep notes for this workspace.';
notice.hidden = true;

const empty = document.createElement('p');
empty.className = 'empty';
empty.textContent = 'No notes yet.';
empty.hidden = true;

const textarea = document.createElement('textarea');
textarea.placeholder = 'Write';
textarea.spellcheck = true;
textarea.autocomplete = 'off';
textarea.autocapitalize = 'off';
textarea.setAttribute('aria-label', 'Note');

const preview = document.createElement('div');
preview.className = 'preview';
preview.setAttribute('aria-label', 'Preview');
preview.hidden = true;

stage.append(notice, empty, textarea, preview);

const footer = document.createElement('footer');
footer.className = 'footer';

const modeGroup = document.createElement('div');
modeGroup.className = 'segments';
modeGroup.setAttribute('role', 'group');
modeGroup.setAttribute('aria-label', 'Editor mode');

const editButton = document.createElement('button');
editButton.type = 'button';
editButton.textContent = 'Edit';
editButton.setAttribute('aria-pressed', 'true');

const previewButton = document.createElement('button');
previewButton.type = 'button';
previewButton.textContent = 'Preview';
previewButton.setAttribute('aria-pressed', 'false');

modeGroup.append(editButton, previewButton);

const fontControls = document.createElement('div');
fontControls.className = 'font-controls';
fontControls.setAttribute('role', 'group');
fontControls.setAttribute('aria-label', 'Font size');

const decreaseButton = document.createElement('button');
decreaseButton.type = 'button';
decreaseButton.textContent = 'A−';
decreaseButton.title = 'Decrease font size';
decreaseButton.setAttribute('aria-label', 'Decrease font size');

const resetButton = document.createElement('button');
resetButton.type = 'button';
resetButton.textContent = 'Reset';
resetButton.title = 'Reset font size';
resetButton.setAttribute('aria-label', 'Reset font size');

const increaseButton = document.createElement('button');
increaseButton.type = 'button';
increaseButton.textContent = 'A+';
increaseButton.title = 'Increase font size';
increaseButton.setAttribute('aria-label', 'Increase font size');

fontControls.append(decreaseButton, resetButton, increaseButton);
footer.append(modeGroup, fontControls);

app.append(header, tabs, stage, footer);
document.body.append(app);

let scope: ScopeName = 'global';
let workspaceAvailable = true;
let notes: NoteSummary[] = [];
let activeId: string | null = null;
let body = '';
let dirty = false;
let mode: 'edit' | 'preview' = cachedAtStart?.mode === 'preview' ? 'preview' : 'edit';
let fontSize: number | null = clampFont(cachedAtStart?.fontSize);
let previewSource: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let didFocus = false;

applyFont();

function persistCache(): void {
  const cache: DraftCache = { scope, activeId, body, dirty, mode, fontSize };
  vscodeApi.setState(cache);
}

function themeFontPx(): number {
  const raw = getComputedStyle(textarea).fontSize;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) {
    return 13;
  }
  return Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(value)));
}

function effectivePx(): number {
  return fontSize ?? themeFontPx();
}

function applyFont(): void {
  if (fontSize === null) {
    app.style.removeProperty('--note-font-size');
  } else {
    app.style.setProperty('--note-font-size', `${fontSize}px`);
  }
}

function updateFontButtons(): void {
  const size = effectivePx();
  decreaseButton.disabled = size <= FONT_MIN;
  increaseButton.disabled = size >= FONT_MAX;
  resetButton.disabled = fontSize === null;
}

function closeMenu(): void {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}

function flush(): void {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
  if (!dirty || !activeId) {
    return;
  }
  if (scope === 'workspace' && !workspaceAvailable) {
    return;
  }
  dirty = false;
  persistCache();
  vscodeApi.postMessage({ type: 'save', id: activeId, body });
}

function scheduleSave(): void {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    timer = undefined;
    flush();
  }, SAVE_DELAY);
}

function updatePreview(): void {
  if (mode !== 'preview') {
    return;
  }
  if (previewSource === body) {
    return;
  }
  previewSource = body;
  try {
    preview.innerHTML = renderMarkdown(body);
  } catch {
    preview.textContent = body;
  }
}

function renderTabs(): void {
  tabs.replaceChildren();
  for (const note of notes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', note.id === activeId ? 'true' : 'false');
    button.title = note.title;
    button.textContent = note.title;
    button.addEventListener('click', () => requestSelect(note.id));
    tabs.append(button);
  }
  const selected = tabs.querySelector<HTMLElement>('[aria-selected="true"]');
  if (!selected) {
    return;
  }
  const left = selected.offsetLeft;
  const right = left + selected.offsetWidth;
  if (left < tabs.scrollLeft) {
    tabs.scrollLeft = left;
  } else if (right > tabs.scrollLeft + tabs.clientWidth) {
    tabs.scrollLeft = right - tabs.clientWidth;
  }
}

function update(reason?: StateReason): void {
  scopeGlobal.setAttribute('aria-pressed', scope === 'global' ? 'true' : 'false');
  scopeWorkspace.setAttribute('aria-pressed', scope === 'workspace' ? 'true' : 'false');
  editButton.setAttribute('aria-pressed', mode === 'edit' ? 'true' : 'false');
  previewButton.setAttribute('aria-pressed', mode === 'preview' ? 'true' : 'false');

  const blocked = scope === 'workspace' && !workspaceAvailable;
  const hasNotes = !blocked && notes.length > 0;
  const showTabs = hasNotes && notes.length > 1;

  notice.hidden = !blocked;
  empty.hidden = blocked || hasNotes;
  textarea.hidden = !hasNotes || mode !== 'edit';
  preview.hidden = !hasNotes || mode !== 'preview';
  footer.hidden = !hasNotes;
  addButton.hidden = blocked;
  menuButton.hidden = !hasNotes || !activeId;
  tabs.hidden = !showTabs;
  if (!showTabs) {
    tabs.replaceChildren();
  } else {
    renderTabs();
  }
  if (!hasNotes) {
    closeMenu();
  }
  applyFont();
  updateFontButtons();
  if (hasNotes && mode === 'preview') {
    updatePreview();
  }
  if ((reason === 'create' || (reason === 'select' && mode === 'edit')) && !textarea.hidden) {
    textarea.focus();
  } else if (reason === 'load' && mode === 'edit' && !textarea.hidden && !didFocus) {
    textarea.focus();
    didFocus = true;
  }
}

function applyState(state: StateMessage): void {
  const switchingNote = scope !== state.scope || activeId !== state.activeId;
  if (switchingNote && dirty && activeId) {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    const saveId = activeId;
    const saveBody = body;
    dirty = false;
    vscodeApi.postMessage({ type: 'save', id: saveId, body: saveBody });
  }
  const cached = isDraft(vscodeApi.getState()) ? vscodeApi.getState() as DraftCache : null;
  const memoryDraft = dirty && scope === state.scope && activeId !== null && activeId === state.activeId;
  const cachedDraft =
    !memoryDraft &&
    cached?.dirty === true &&
    cached.scope === state.scope &&
    cached.activeId === state.activeId &&
    typeof cached.body === 'string';
  scope = state.scope;
  workspaceAvailable = state.workspaceAvailable;
  notes = Array.isArray(state.notes) ? state.notes : [];
  fontSize = clampFont(state.fontSize);
  if (state.reason === 'create') {
    mode = 'edit';
  } else if (state.reason === 'load' && (cached?.mode === 'edit' || cached?.mode === 'preview')) {
    mode = cached.mode;
  }

  if (memoryDraft) {
    activeId = state.activeId;
  } else if (cachedDraft && cached) {
    activeId = state.activeId;
    body = cached.body;
    dirty = true;
    textarea.value = body;
    previewSource = null;
    scheduleSave();
  } else {
    activeId = state.activeId;
    body = typeof state.body === 'string' ? state.body : '';
    dirty = false;
    if (textarea.value !== body) {
      textarea.value = body;
    }
    if (switchingNote) {
      textarea.setSelectionRange(0, 0);
      textarea.scrollTop = 0;
      preview.scrollTop = 0;
      previewSource = null;
    } else if (previewSource !== null && previewSource !== body) {
      previewSource = null;
    }
  }

  app.hidden = false;
  closeMenu();
  persistCache();
  update(state.reason);
}

function requestSelect(id: string): void {
  if (id === activeId) {
    return;
  }
  flush();
  vscodeApi.postMessage({ type: 'select', id });
}

function requestCreate(): void {
  if (scope === 'workspace' && !workspaceAvailable) {
    return;
  }
  flush();
  vscodeApi.postMessage({ type: 'create' });
}

function requestScope(next: ScopeName): void {
  if (next === scope) {
    return;
  }
  flush();
  vscodeApi.postMessage({ type: 'setScope', scope: next });
}

function stepFont(delta: number): void {
  const next = Math.min(FONT_MAX, Math.max(FONT_MIN, effectivePx() + delta));
  if (fontSize === next) {
    return;
  }
  fontSize = next;
  applyFont();
  updateFontButtons();
  persistCache();
  vscodeApi.postMessage({ type: 'setFontSize', size: fontSize });
}

function resetFont(): void {
  if (fontSize === null) {
    return;
  }
  fontSize = null;
  applyFont();
  updateFontButtons();
  persistCache();
  vscodeApi.postMessage({ type: 'setFontSize', size: null });
}

scopeGlobal.addEventListener('click', () => requestScope('global'));
scopeWorkspace.addEventListener('click', () => requestScope('workspace'));
addButton.addEventListener('click', () => requestCreate());
editButton.addEventListener('click', () => {
  if (mode === 'edit') {
    return;
  }
  mode = 'edit';
  persistCache();
  update();
  if (!textarea.hidden) {
    textarea.focus();
  }
});
previewButton.addEventListener('click', () => {
  if (mode === 'preview') {
    return;
  }
  flush();
  mode = 'preview';
  persistCache();
  update();
});
decreaseButton.addEventListener('click', () => stepFont(-1));
increaseButton.addEventListener('click', () => stepFont(1));
resetButton.addEventListener('click', () => resetFont());
menuButton.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = menu.hidden;
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
});
renameButton.addEventListener('click', () => {
  if (!activeId) {
    return;
  }
  closeMenu();
  flush();
  vscodeApi.postMessage({ type: 'rename', id: activeId });
});
deleteButton.addEventListener('click', () => {
  if (!activeId) {
    return;
  }
  closeMenu();
  flush();
  vscodeApi.postMessage({ type: 'delete', id: activeId });
});
document.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof Node && (menu.contains(target) || menuButton.contains(target))) {
    return;
  }
  closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});
textarea.addEventListener('input', () => {
  body = textarea.value;
  dirty = true;
  persistCache();
  scheduleSave();
});
textarea.addEventListener('blur', () => flush());
preview.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const anchor = target.closest('a');
  if (!anchor || !preview.contains(anchor)) {
    return;
  }
  event.preventDefault();
  const href = anchor.getAttribute('href');
  if (!href || href === '#' || anchor.getAttribute('data-blocked') === 'true') {
    return;
  }
  vscodeApi.postMessage({ type: 'openLink', href });
});
window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
  const message = event.data;
  if (!message || typeof message !== 'object') {
    return;
  }
  if (message.type === 'flush') {
    flush();
    return;
  }
  if (message.type === 'newNote') {
    requestCreate();
    return;
  }
  if (message.type === 'state') {
    applyState(message);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flush();
  }
});
window.addEventListener('blur', () => flush());
window.addEventListener('pagehide', () => flush());

vscodeApi.postMessage({ type: 'ready' });

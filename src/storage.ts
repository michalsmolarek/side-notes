import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { FONT_MAX, FONT_MIN, type NoteSummary } from './messages';

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface NotesSnapshot {
  notes: NoteSummary[];
  activeId: string | null;
  body: string;
}

interface IndexFile {
  activeId: string | null;
  notes: NoteSummary[];
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`,
  );
  try {
    await writeFile(tmp, contents, 'utf8');
    await rename(tmp, filePath);
  } catch (error) {
    await rm(tmp, { force: true });
    throw error;
  }
}

function nextTitle(notes: readonly NoteSummary[]): string {
  const titles = new Set(notes.map((note) => note.title));
  if (!titles.has('Note')) {
    return 'Note';
  }
  let n = 2;
  while (titles.has(`Note ${n}`)) {
    n += 1;
  }
  return `Note ${n}`;
}

function cleanTitle(title: string): string {
  const cleaned = title.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    throw new Error('Title cannot be empty');
  }
  return cleaned.length > 200 ? cleaned.slice(0, 200).trim() : cleaned;
}

function isValidFontSize(size: unknown): size is number {
  return typeof size === 'number' && Number.isInteger(size) && size >= FONT_MIN && size <= FONT_MAX;
}

export class NoteStore {
  private chain: Promise<void> = Promise.resolve();
  private cache: IndexFile | null = null;

  constructor(private readonly rootDir: string) {}

  load(): Promise<NotesSnapshot> {
    return this.enqueue(() => this.loadNow());
  }

  createNote(): Promise<NotesSnapshot> {
    return this.enqueue(() => this.createNow());
  }

  renameNote(id: string, title: string): Promise<NotesSnapshot> {
    return this.enqueue(() => this.renameNow(id, title));
  }

  deleteNote(id: string): Promise<NotesSnapshot> {
    return this.enqueue(() => this.deleteNow(id));
  }

  selectNote(id: string): Promise<NotesSnapshot> {
    return this.enqueue(() => this.selectNow(id));
  }

  saveBody(id: string, body: string): Promise<void> {
    return this.enqueue(() => this.saveNow(id, body));
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private get notesDir(): string {
    return path.join(this.rootDir, 'notes');
  }

  private get indexPath(): string {
    return path.join(this.notesDir, 'index.json');
  }

  private notePath(id: string): string {
    if (!ID_RE.test(id)) {
      throw new Error('Invalid note id');
    }
    return path.join(this.notesDir, `${id}.md`);
  }

  private async loadNow(): Promise<NotesSnapshot> {
    const index = await this.readIndex();
    if (!index) {
      return this.addNote({ activeId: null, notes: [] });
    }
    return this.toSnapshot(index);
  }

  private async createNow(): Promise<NotesSnapshot> {
    const index = (await this.readIndex()) ?? { activeId: null, notes: [] };
    return this.addNote(index);
  }

  private async renameNow(id: string, title: string): Promise<NotesSnapshot> {
    if (!ID_RE.test(id)) {
      throw new Error('Invalid note id');
    }
    const index = await this.requireIndex();
    const notes = index.notes.map((note) =>
      note.id === id ? { id: note.id, title: cleanTitle(title) } : { ...note },
    );
    if (!index.notes.some((note) => note.id === id)) {
      throw new Error('Note not found');
    }
    await this.persistIndex({ activeId: index.activeId, notes });
    return this.toSnapshot(this.cache ?? { activeId: index.activeId, notes });
  }

  private async deleteNow(id: string): Promise<NotesSnapshot> {
    if (!ID_RE.test(id)) {
      throw new Error('Invalid note id');
    }
    const index = await this.requireIndex();
    const position = index.notes.findIndex((note) => note.id === id);
    if (position < 0) {
      throw new Error('Note not found');
    }
    const notes = index.notes.filter((note) => note.id !== id).map((note) => ({ ...note }));
    let activeId = index.activeId;
    if (activeId === id) {
      activeId = notes[position - 1]?.id ?? notes[position]?.id ?? null;
    }
    await this.persistIndex({ activeId, notes });
    await rm(this.notePath(id), { force: true });
    return this.toSnapshot({ activeId, notes });
  }

  private async selectNow(id: string): Promise<NotesSnapshot> {
    if (!ID_RE.test(id)) {
      throw new Error('Invalid note id');
    }
    const index = await this.requireIndex();
    if (!index.notes.some((note) => note.id === id)) {
      throw new Error('Note not found');
    }
    if (index.activeId !== id) {
      await this.persistIndex({
        activeId: id,
        notes: index.notes.map((note) => ({ ...note })),
      });
    }
    return this.toSnapshot(this.cache ?? index);
  }

  private async saveNow(id: string, body: string): Promise<void> {
    if (!ID_RE.test(id) || typeof body !== 'string') {
      return;
    }
    const index = await this.readIndex();
    if (!index || !index.notes.some((note) => note.id === id)) {
      return;
    }
    await atomicWrite(this.notePath(id), body);
  }

  private async addNote(index: IndexFile): Promise<NotesSnapshot> {
    const notes = index.notes.map((note) => ({ ...note }));
    const id = randomUUID();
    const title = nextTitle(notes);
    notes.push({ id, title });
    await atomicWrite(this.notePath(id), '');
    const next = { activeId: id, notes };
    await this.persistIndex(next);
    return this.toSnapshot(next);
  }

  private async requireIndex(): Promise<IndexFile> {
    const index = await this.readIndex();
    if (!index) {
      throw new Error('Note not found');
    }
    return index;
  }

  private async readIndex(): Promise<IndexFile | null> {
    if (this.cache) {
      return this.cache;
    }
    let raw: string;
    try {
      raw = await readFile(this.indexPath, 'utf8');
    } catch (error) {
      if (isEnoent(error)) {
        return null;
      }
      throw error;
    }
    const parsed = parseIndex(raw);
    return this.normalize(parsed.index, parsed.dirty);
  }

  private async normalize(index: IndexFile, dirty: boolean): Promise<IndexFile> {
    let activeId = index.activeId;
    let changed = dirty;
    if (activeId && !index.notes.some((note) => note.id === activeId)) {
      activeId = index.notes[0]?.id ?? null;
      changed = true;
    } else if (!activeId && index.notes.length > 0) {
      activeId = index.notes[0].id;
      changed = true;
    }
    const next = { activeId, notes: index.notes.map((note) => ({ ...note })) };
    if (changed) {
      await this.persistIndex(next);
    } else {
      this.cache = next;
    }
    return this.cache ?? next;
  }

  private async persistIndex(index: IndexFile): Promise<void> {
    const copy: IndexFile = {
      activeId: index.activeId,
      notes: index.notes.map((note) => ({ id: note.id, title: note.title })),
    };
    await atomicWrite(this.indexPath, `${JSON.stringify(copy, null, 2)}\n`);
    this.cache = copy;
  }

  private async readBody(id: string): Promise<string> {
    try {
      return await readFile(this.notePath(id), 'utf8');
    } catch (error) {
      if (isEnoent(error)) {
        return '';
      }
      throw error;
    }
  }

  private async toSnapshot(index: IndexFile): Promise<NotesSnapshot> {
    const body = index.activeId ? await this.readBody(index.activeId) : '';
    return {
      notes: index.notes.map((note) => ({ id: note.id, title: note.title })),
      activeId: index.activeId,
      body,
    };
  }
}

function parseIndex(raw: string): { index: IndexFile; dirty: boolean } {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object') {
    throw new Error('Notes index is invalid');
  }
  const record = data as { activeId?: unknown; notes?: unknown };
  const notes: NoteSummary[] = [];
  const source = Array.isArray(record.notes) ? record.notes : [];
  let dirty = !Array.isArray(record.notes);
  for (const item of source) {
    if (!item || typeof item !== 'object') {
      dirty = true;
      continue;
    }
    const id = 'id' in item ? item.id : undefined;
    const title = 'title' in item ? item.title : undefined;
    if (typeof id !== 'string' || typeof title !== 'string' || !ID_RE.test(id)) {
      dirty = true;
      continue;
    }
    const cleaned = title.replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      dirty = true;
      continue;
    }
    if (cleaned !== title) {
      dirty = true;
    }
    notes.push({ id, title: cleaned });
  }
  if (Array.isArray(record.notes) && notes.length !== record.notes.length) {
    dirty = true;
  }
  const activeId = typeof record.activeId === 'string' ? record.activeId : null;
  if (record.activeId != null && typeof record.activeId !== 'string') {
    dirty = true;
  }
  return { index: { activeId, notes }, dirty };
}

export class PreferenceStore {
  private chain: Promise<void> = Promise.resolve();

  constructor(private readonly rootDir: string) {}

  getFontSize(): Promise<number | null> {
    return this.enqueue(() => this.read());
  }

  setFontSize(size: number | null): Promise<void> {
    if (size !== null && !isValidFontSize(size)) {
      return Promise.reject(new Error('Font size is out of range'));
    }
    return this.enqueue(() => this.write(size));
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    this.chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private get filePath(): string {
    return path.join(this.rootDir, 'preferences.json');
  }

  private async read(): Promise<number | null> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const data: unknown = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !('fontSize' in data)) {
        return null;
      }
      return isValidFontSize(data.fontSize) ? data.fontSize : null;
    } catch (error) {
      if (isEnoent(error)) {
        return null;
      }
      return null;
    }
  }

  private async write(size: number | null): Promise<void> {
    await atomicWrite(this.filePath, `${JSON.stringify({ fontSize: size }, null, 2)}\n`);
  }
}

import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { NoteStore, PreferenceStore } from './storage';

async function tempRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'side-notes-'));
}

test('first visit creates a note titled Note and keeps the body in its own file', async () => {
  const root = await tempRoot();
  try {
    const store = new NoteStore(root);
    const snap = await store.load();
    assert.equal(snap.notes.length, 1);
    assert.equal(snap.notes[0]?.title, 'Note');
    assert.equal(snap.activeId, snap.notes[0]?.id);
    assert.equal(snap.body, '');
    await store.saveBody(snap.activeId ?? '', 'hello');
    const again = await store.load();
    assert.equal(again.body, 'hello');
    const file = await readFile(path.join(root, 'notes', `${snap.activeId}.md`), 'utf8');
    assert.equal(file, 'hello');
    const index = JSON.parse(await readFile(path.join(root, 'notes', 'index.json'), 'utf8')) as {
      notes: Array<{ title: string; body?: string }>;
    };
    assert.equal(index.notes[0]?.title, 'Note');
    assert.equal(index.notes[0]?.body, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an existing empty index is not treated as a first visit', async () => {
  const root = await tempRoot();
  try {
    await mkdir(path.join(root, 'notes'), { recursive: true });
    await writeFile(
      path.join(root, 'notes', 'index.json'),
      `${JSON.stringify({ activeId: null, notes: [] }, null, 2)}\n`,
      'utf8',
    );
    const snap = await new NoteStore(root).load();
    assert.deepEqual(snap.notes, []);
    assert.equal(snap.activeId, null);
    assert.equal(snap.body, '');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('further notes are titled Note 2 and Note 3 and only the active body is returned', async () => {
  const root = await tempRoot();
  try {
    const store = new NoteStore(root);
    const first = await store.load();
    await store.saveBody(first.activeId ?? '', 'one');
    const second = await store.createNote();
    await store.saveBody(second.activeId ?? '', 'two');
    const third = await store.createNote();
    assert.deepEqual(
      third.notes.map((note) => note.title),
      ['Note', 'Note 2', 'Note 3'],
    );
    assert.equal(third.body, '');
    const back = await store.selectNote(first.notes[0]?.id ?? '');
    assert.equal(back.body, 'one');
    assert.notEqual(back.body, 'two');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rename updates the index title and leaves the file id in place', async () => {
  const root = await tempRoot();
  try {
    const store = new NoteStore(root);
    const snap = await store.load();
    const id = snap.activeId ?? '';
    const renamed = await store.renameNote(id, 'Scratch');
    assert.equal(renamed.notes[0]?.id, id);
    assert.equal(renamed.notes[0]?.title, 'Scratch');
    const names = await readdir(path.join(root, 'notes'));
    assert.equal(names.includes(`${id}.md`), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('delete removes the file and does not recreate a note on the next load', async () => {
  const root = await tempRoot();
  try {
    const store = new NoteStore(root);
    const snap = await store.load();
    const id = snap.activeId ?? '';
    const after = await store.deleteNote(id);
    assert.deepEqual(after.notes, []);
    const names = await readdir(path.join(root, 'notes'));
    assert.equal(names.includes(`${id}.md`), false);
    const again = await new NoteStore(root).load();
    assert.deepEqual(again.notes, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('writes are atomic and a per-root queue keeps concurrent updates intact', async () => {
  const root = await tempRoot();
  try {
    const store = new NoteStore(root);
    const snap = await store.load();
    const id = snap.activeId ?? '';
    await Promise.all([store.saveBody(id, 'alpha'), store.saveBody(id, 'beta'), store.renameNote(id, 'Queued')]);
    const after = await store.load();
    assert.equal(after.notes[0]?.title, 'Queued');
    assert.equal(after.body === 'alpha' || after.body === 'beta', true);
    const file = await readFile(path.join(root, 'notes', `${id}.md`), 'utf8');
    assert.equal(file, after.body);
    const leftovers = (await readdir(path.join(root, 'notes'))).filter((name) => name.endsWith('.tmp'));
    assert.deepEqual(leftovers, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('save ignores unknown ids and does not escape the notes directory', async () => {
  const root = await tempRoot();
  try {
    const store = new NoteStore(root);
    await store.load();
    await store.saveBody('../escape', 'nope');
    await store.saveBody('not-a-uuid', 'nope');
    const outside = path.join(root, 'escape.md');
    await assert.rejects(readFile(outside, 'utf8'));
    const names = await readdir(root);
    assert.equal(names.includes('escape.md'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('font size is stored beside the notes root and resets to the theme default', async () => {
  const root = await tempRoot();
  try {
    const prefs = new PreferenceStore(root);
    assert.equal(await prefs.getFontSize(), null);
    await prefs.setFontSize(16);
    assert.equal(await prefs.getFontSize(), 16);
    const raw = JSON.parse(await readFile(path.join(root, 'preferences.json'), 'utf8')) as { fontSize: number };
    assert.equal(raw.fontSize, 16);
    await prefs.setFontSize(null);
    assert.equal(await prefs.getFontSize(), null);
    await assert.rejects(prefs.setFontSize(9));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

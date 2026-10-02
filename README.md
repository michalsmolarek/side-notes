# Side Notes

Private notes beside the editor, for Cursor and VS Code 1.85 or newer.

**[Download side-notes-0.1.0.vsix](https://github.com/michalsmolarek/side-notes/releases/download/v0.1.0/side-notes-0.1.0.vsix)** · [v0.1.0 release](https://github.com/michalsmolarek/side-notes/releases/tag/v0.1.0)

The panel opens from the activity bar and can be dragged to the secondary sidebar or the bottom panel, like any other view. Notes stay in the extension's private storage. Nothing is written into the folder you have open.

## Features

- **Global** notes are shared across windows. **Workspace** notes belong to the folder that is open. With no folder open, Workspace explains that, and Global still works.
- One note is a single editor with an add button. Two or more notes get a tab strip for switching.
- Create, rename, and delete notes. The first note is titled Note. Further notes are Note 2, Note 3, and so on.
- **Edit** is a plain text area. **Preview** renders GitHub Flavored Markdown: headings, lists, task lists, tables, quotes, horizontal rules, links, `https` images, inline code, fenced code with syntax highlighting, strikethrough, and autolinks.
- Raw HTML in the note is not rendered. Links open outside the panel.
- Font size controls: **A−**, **Reset**, and **A+**. The step is 1 px, from 10 to 24. Reset returns to the editor font size from the current theme. The chosen size is kept after a restart.
- Changes save automatically. There is no Save button.
- Colors and type follow the active theme.
- Command Palette: **Side Notes: New note** and **Side Notes: Focus Side Notes**.

## Install

Cursor and VS Code use the same steps.

1. Download [side-notes-0.1.0.vsix](https://github.com/michalsmolarek/side-notes/releases/download/v0.1.0/side-notes-0.1.0.vsix).
2. Open the Command Palette: `Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows and Linux.
3. Run **Extensions: Install from VSIX…**.
4. Choose the downloaded file.
5. If the Side Notes icon is not on the activity bar, run **Developer: Reload Window**.
6. Click the Side Notes icon.

To build the package yourself, clone this repository and run:

```bash
npm install
npm run package
```

That writes `side-notes-0.1.0.vsix` in the project root. Install it with the same command.

## Where notes are stored

- Global notes: the extension's global storage directory, as `notes/index.json` plus one `notes/{id}.md` file per note.
- Workspace notes: the extension's workspace storage directory, same layout.
- Font size: `preferences.json` in global storage.

The title lives in the index. The body lives in its own file. Only the open note is loaded into the editor.

## Develop

```bash
npm install
npm test
```

Open this folder in Cursor or VS Code and press F5. The **Run Side Notes** launch config compiles the extension and opens an Extension Development Host. `npm run package` builds a VSIX.

## License

MIT

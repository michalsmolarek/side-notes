export const webviewCss = `
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { height: 100%; }
body {
  margin: 0;
  overflow: hidden;
  background: var(--vscode-sideBar-background);
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; }
:focus { outline: none; }
:focus-visible {
  outline: 1px solid var(--vscode-focusBorder);
  outline-offset: 1px;
}
* {
  scrollbar-width: thin;
  scrollbar-color: var(--vscode-scrollbarSlider-background) var(--vscode-sideBar-background);
}
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb {
  background: var(--vscode-scrollbarSlider-background);
  border-radius: 8px;
}
*::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
*::-webkit-scrollbar-thumb:active { background: var(--vscode-scrollbarSlider-activeBackground); }
.app {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--vscode-sideBar-background);
  color: var(--vscode-foreground);
}
.header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 6px 4px 8px;
  flex: 0 0 auto;
}
.header-actions {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  flex: 0 0 auto;
}
.segments {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.segments button {
  appearance: none;
  border: none;
  margin: 0;
  background: transparent;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}
.segments button:hover {
  color: var(--vscode-foreground);
  background: var(--vscode-toolbar-hoverBackground);
}
.segments button[aria-pressed="true"] {
  background: var(--vscode-toolbar-hoverBackground);
  color: var(--vscode-foreground);
  font-weight: 650;
}
body.vscode-high-contrast .segments button[aria-pressed="true"],
body.vscode-high-contrast-light .segments button[aria-pressed="true"] {
  font-weight: 700;
  box-shadow: inset 0 -2px 0 var(--vscode-focusBorder);
  outline: 1px solid var(--vscode-contrastBorder);
  outline-offset: 0;
}
.icon-button {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--vscode-icon-foreground, var(--vscode-foreground));
  cursor: pointer;
  flex: 0 0 28px;
  transition: background-color 120ms ease, color 120ms ease;
}
.icon-button:hover { background: var(--vscode-toolbar-hoverBackground); }
.icon-button svg { width: 16px; height: 16px; display: block; }
.tabs {
  display: flex;
  align-items: stretch;
  gap: 2px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 0 0 auto;
  padding: 0 8px;
  scroll-padding-inline: 8px;
}
.tab {
  appearance: none;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 500;
  padding: 6px 8px 4px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 0 0 auto;
  transition: background-color 120ms ease, color 120ms ease;
}
.tab:hover {
  color: var(--vscode-foreground);
  background: var(--vscode-toolbar-hoverBackground);
}
.tab[aria-selected="true"] {
  color: var(--vscode-foreground);
  font-weight: 650;
  border-bottom-color: var(--vscode-focusBorder);
}
body.vscode-high-contrast .tab[aria-selected="true"],
body.vscode-high-contrast-light .tab[aria-selected="true"] {
  font-weight: 700;
}
.stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
}
textarea, .preview {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  margin: 0;
  padding: 12px;
  border: none;
  background: var(--vscode-sideBar-background);
  color: var(--vscode-editor-foreground, var(--vscode-foreground));
  font-family: var(--vscode-editor-font-family);
  font-size: var(--note-font-size, var(--vscode-editor-font-size));
  font-weight: var(--vscode-editor-font-weight, normal);
  line-height: 1.55;
}
textarea {
  display: block;
  resize: none;
  outline: none;
  tab-size: 2;
  caret-color: var(--vscode-editorCursor-foreground, var(--vscode-foreground));
  overflow: auto;
}
textarea:focus, textarea:focus-visible { outline: none; }
textarea::placeholder {
  color: var(--vscode-input-placeholderForeground);
  opacity: 1;
}
.preview {
  overflow: auto;
  overflow-wrap: break-word;
  user-select: text;
}
.preview > :first-child { margin-top: 0; }
.preview > :last-child { margin-bottom: 0; }
.preview h1 { font-size: 1.25em; font-weight: 650; line-height: 1.3; margin: 0.15em 0 0.4em; }
.preview h2 { font-size: 1.12em; font-weight: 650; line-height: 1.3; margin: 0.85em 0 0.35em; }
.preview h3, .preview h4, .preview h5, .preview h6 {
  font-size: 1.02em;
  font-weight: 650;
  line-height: 1.35;
  margin: 0.8em 0 0.3em;
}
.preview p { margin: 0.45em 0; }
.preview ul, .preview ol { margin: 0.4em 0; padding-left: 1.25em; }
.preview li { margin: 0.15em 0; }
.preview li > p { margin: 0.15em 0; }
.preview a {
  color: var(--vscode-textLink-foreground);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}
.preview a:hover { color: var(--vscode-textLink-activeForeground); }
.preview blockquote {
  margin: 0.55em 0;
  padding: 0.05em 0 0.05em 10px;
  border-left: 2px solid var(--vscode-textBlockQuote-border, var(--vscode-focusBorder));
  background: var(--vscode-textBlockQuote-background, transparent);
  color: var(--vscode-foreground);
}
.preview hr {
  border: none;
  border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
  margin: 0.9em 0;
}
.preview img { max-width: 100%; height: auto; }
.preview :not(pre) > code {
  font-family: var(--vscode-editor-font-family);
  font-size: 0.92em;
  background: var(--vscode-textCodeBlock-background);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}
.preview pre {
  margin: 0.6em 0;
  padding: 10px 12px;
  overflow-x: auto;
  background: var(--vscode-textCodeBlock-background);
  color: var(--vscode-editor-foreground, var(--vscode-foreground));
  border-radius: 8px;
  line-height: 1.45;
}
.preview pre code {
  font-family: var(--vscode-editor-font-family);
  font-size: 0.92em;
  background: none;
  padding: 0;
  border-radius: 0;
  white-space: pre;
  word-break: normal;
}
.table-wrap { overflow-x: auto; max-width: 100%; margin: 0.6em 0; }
.preview table { border-collapse: collapse; width: max-content; min-width: 100%; }
.preview th, .preview td {
  border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
  padding: 4px 8px;
  text-align: left;
  vertical-align: top;
}
.preview th { font-weight: 650; }
.preview ul.contains-task-list { list-style: none; padding-left: 0.15em; }
.preview .task-list-item { list-style: none; }
.preview .task-list-item input {
  margin: 0 0.4em 0.1em 0;
  accent-color: var(--vscode-focusBorder);
  vertical-align: middle;
}
.notice, .empty {
  padding: 14px 12px;
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  line-height: 1.5;
}
.footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: nowrap;
  padding: 4px 6px 8px 8px;
}
.font-controls {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  flex: 0 0 auto;
}
.font-controls button {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
  line-height: 1;
  font-weight: 550;
  padding: 4px 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}
.font-controls button:hover:not(:disabled) {
  background: var(--vscode-toolbar-hoverBackground);
  color: var(--vscode-foreground);
}
.font-controls button:disabled {
  opacity: 0.38;
  cursor: default;
}
.menu {
  position: absolute;
  z-index: 5;
  top: calc(100% - 2px);
  right: 6px;
  min-width: 148px;
  padding: 4px;
  border-radius: 8px;
  background: var(--vscode-menu-background, var(--vscode-editorWidget-background));
  color: var(--vscode-menu-foreground, var(--vscode-foreground));
  border: 1px solid var(--vscode-menu-border, var(--vscode-widget-border, transparent));
}
.menu button {
  appearance: none;
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 12px;
  line-height: 1.2;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}
.menu button:hover {
  background: var(--vscode-menu-selectionBackground, var(--vscode-toolbar-hoverBackground));
  color: var(--vscode-menu-selectionForeground, var(--vscode-foreground));
}
body.vscode-high-contrast .menu,
body.vscode-high-contrast-light .menu {
  border-color: var(--vscode-contrastBorder);
}
body.vscode-high-contrast pre,
body.vscode-high-contrast-light pre {
  outline: 1px solid var(--vscode-contrastBorder);
  outline-offset: -1px;
}
.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in,
.hljs-literal,
.hljs-doctag {
  color: var(--vscode-symbolIcon-keywordForeground, var(--vscode-textLink-foreground));
}
.hljs-string,
.hljs-attr,
.hljs-attribute,
.hljs-regexp,
.hljs-addition {
  color: var(--vscode-symbolIcon-stringForeground, var(--vscode-textPreformat-foreground, var(--vscode-textLink-foreground)));
}
.hljs-title,
.hljs-section,
.hljs-name,
.hljs-selector-class,
.hljs-selector-id {
  color: var(--vscode-symbolIcon-functionForeground, var(--vscode-textLink-foreground));
}
.hljs-number,
.hljs-symbol,
.hljs-bullet {
  color: var(--vscode-symbolIcon-numberForeground, var(--vscode-textLink-foreground));
}
.hljs-type,
.hljs-variable,
.hljs-params,
.hljs-property,
.hljs-template-variable {
  color: var(--vscode-symbolIcon-variableForeground, var(--vscode-editor-foreground, var(--vscode-foreground)));
}
.hljs-meta,
.hljs-operator {
  color: var(--vscode-symbolIcon-operatorForeground, var(--vscode-descriptionForeground));
}
.hljs-comment, .hljs-quote { color: var(--vscode-descriptionForeground); font-style: italic; }
body.vscode-high-contrast .hljs-keyword,
body.vscode-high-contrast .hljs-selector-tag,
body.vscode-high-contrast-light .hljs-keyword,
body.vscode-high-contrast-light .hljs-selector-tag {
  color: var(--vscode-textLink-foreground);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}
body.vscode-high-contrast .hljs-string,
body.vscode-high-contrast .hljs-title,
body.vscode-high-contrast .hljs-number,
body.vscode-high-contrast-light .hljs-string,
body.vscode-high-contrast-light .hljs-title,
body.vscode-high-contrast-light .hljs-number {
  color: var(--vscode-editor-foreground, var(--vscode-foreground));
  font-weight: 700;
}
@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
}
`;

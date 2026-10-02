import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

const md = new MarkdownIt({
  html: false,
  xhtmlOut: false,
  breaks: false,
  linkify: true,
  typographer: false,
  langPrefix: 'language-',
});

md.use(taskLists, { enabled: false });

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

function isOpenable(url: string): boolean {
  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

function safeHighlight(code: string, lang: string): string {
  if (!lang || !hljs.getLanguage(lang)) {
    return '';
  }
  try {
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch {
    return '';
  }
}

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token?.info ? token.info.trim().split(/\s+/g)[0] ?? '' : '';
  const lang = info.slice(0, 40);
  const content = token?.content ?? '';
  const highlighted = safeHighlight(content, lang);
  if (highlighted && lang) {
    const safeLang = md.utils.escapeHtml(lang);
    return `<pre class="hljs"><code class="hljs language-${safeLang}">${highlighted}</code></pre>\n`;
  }
  const classAttr = lang ? ` class="language-${md.utils.escapeHtml(lang)}"` : '';
  return `<pre><code${classAttr}>${md.utils.escapeHtml(content)}</code></pre>\n`;
};

const renderImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token?.attrGet('src') ?? '';
  if (!token || !isHttps(src)) {
    return '';
  }
  token.attrSet('referrerpolicy', 'no-referrer');
  if (renderImage) {
    return renderImage(tokens, idx, options, env, self);
  }
  return self.renderToken(tokens, idx, options);
};

const renderLinkOpen = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (!token) {
    return '';
  }
  const href = token.attrGet('href') ?? '';
  if (!isOpenable(href)) {
    token.attrSet('href', '#');
    token.attrSet('data-blocked', 'true');
  }
  if (renderLinkOpen) {
    return renderLinkOpen(tokens, idx, options, env, self);
  }
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

export function renderMarkdown(source: string): string {
  return md.render(source);
}

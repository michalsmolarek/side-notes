declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';

  const taskLists: MarkdownIt.PluginWithOptions<{ enabled?: boolean }>;
  export default taskLists;
}

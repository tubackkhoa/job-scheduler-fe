declare module 'markdown-it-attrs' {
  import type MarkdownIt from 'markdown-it';

  interface MarkdownItAttrsOptions {
    leftDelimiter?: string;
    rightDelimiter?: string;
    allowedAttributes?: (string | RegExp)[];
  }

  const markdownItAttrs: (
    md: MarkdownIt,
    options?: MarkdownItAttrsOptions
  ) => void;

  export default markdownItAttrs;
}

import React from 'react';
import { EditorView } from '@codemirror/view';
import { MarkdownPreview } from './MarkdownPreview'; // Adjust import path as needed
import CodeMirror, { Extension } from '@uiw/react-codemirror'; // Or your CodeMirror React wrapper
import { JavascriptPreview } from './JavascriptPreview';
import { getCodeMirrorStyle } from '@/theme';

interface Props {
  lang: string;
  text: string;
  fullscreen: boolean;
  extensions: Extension[]; // You can be more specific based on your extensions type
}

export const TemplatePreview: React.FC<Props> = ({
  lang,
  text,
  fullscreen,
  extensions
}) => {
  switch (lang) {
    case 'markdown':
      return (
        <MarkdownPreview text={text} maxHeight={fullscreen ? '100%' : 600} />
      );
    case 'js':
      return (
        <JavascriptPreview
          text={text}
          fullscreen={fullscreen}
          providers={['solana', 'ethereum', 'keplr']}
        />
      );
    default:
      return (
        <CodeMirror
          {...getCodeMirrorStyle(fullscreen)}
          readOnly
          value={text}
          extensions={[...extensions, EditorView.lineWrapping]}
        />
      );
  }
};

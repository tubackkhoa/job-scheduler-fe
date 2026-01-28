import React from 'react';
import { EditorView } from '@codemirror/view';
import { MarkdownPreview } from './MarkdownPreview'; // Adjust import path as needed
import ReactCodeMirror, { Extension } from '@uiw/react-codemirror'; // Or your CodeMirror React wrapper
import { JavascriptPreview } from './JavascriptPreview';
import { getCodeMirrorStyle } from '@/theme';

type Props = {
  lang: string;
  text: string;
  fullscreen: boolean;
  extensions: Extension[]; // You can be more specific based on your extensions type
} & CodeSchema;

export const TemplatePreview: React.FC<Props> = ({
  lang,
  text,
  fullscreen,
  extensions,
  code,
  url
}) => {
  switch (lang) {
    case 'markdown':
      return (
        <MarkdownPreview
          code={code}
          url={url}
          text={text}
          maxHeight={fullscreen ? '100%' : 600}
        />
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
        <ReactCodeMirror
          {...getCodeMirrorStyle(fullscreen)}
          readOnly
          value={text}
          extensions={[...extensions, EditorView.lineWrapping]}
        />
      );
  }
};

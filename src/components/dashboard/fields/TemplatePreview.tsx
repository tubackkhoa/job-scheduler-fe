import React from 'react';
import { EditorView } from '@codemirror/view';
import { MarkdownPreview } from './MarkdownPreview'; // Adjust import path as needed
import CodeMirror, { Extension } from '@uiw/react-codemirror'; // Or your CodeMirror React wrapper
import { JavascriptPreview } from './JavascriptPreview';

interface Props {
  lang: string;
  text: string;
  fullscreen: boolean;
  extensions: Extension[]; // You can be more specific based on your extensions type
}

export const getCodeMirrorStyle = (fullscreen: boolean) => {
  return {
    style: {
      resize: fullscreen ? 'none' : 'vertical',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      minHeight: fullscreen ? '100%' : 200,
      maxHeight: fullscreen ? '100%' : 600,
      height: '100%'
    },
    minHeight: fullscreen ? '100%' : '200px',
    height: '100%',
    theme: 'dark',
    basicSetup: {
      lineNumbers: true,
      highlightActiveLine: true,
      foldGutter: false
    }
  };
};

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
          providers={['phantom', 'ethereum', 'keplr']}
        />
      );
    default:
      return (
        <CodeMirror
          {...(getCodeMirrorStyle(fullscreen) as any)}
          readOnly
          value={text}
          extensions={[...extensions, EditorView.lineWrapping]}
        />
      );
  }
};

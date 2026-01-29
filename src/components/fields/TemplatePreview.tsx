import React from 'react';
import { EditorView } from '@codemirror/view';
import { MarkdownPreview } from './MarkdownPreview'; // Adjust import path as needed
import ReactCodeMirror, { Extension } from '@uiw/react-codemirror'; // Or your CodeMirror React wrapper
import { JavascriptPreview } from './JavascriptPreview';
import { getCodeMirrorStyle } from '@/theme';
import { FieldPathId, FieldProps, RJSFSchema } from '@rjsf/utils';

type Props = {
  schema: RJSFSchema;
  fieldPathId: FieldPathId;
  registry: FieldProps['registry'];
  text: string;
  fullscreen: boolean;
  extensions: Extension[]; // You can be more specific based on your extensions type
} & CodeSchema;

export const TemplatePreview: React.FC<Props> = ({
  schema,
  text,
  fullscreen,
  fieldPathId,
  registry,
  extensions
}) => {
  switch (schema.type as string) {
    case 'markdown':
      return (
        <MarkdownPreview
          fieldPathId={fieldPathId}
          registry={registry}
          schema={schema}
          text={text}
          maxHeight={fullscreen ? '100%' : 'auto'}
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

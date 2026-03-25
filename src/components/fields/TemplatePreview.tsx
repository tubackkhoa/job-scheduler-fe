import React from 'react';
import { MarkdownPreview } from './MarkdownPreview'; // Adjust import path as needed
import CodeMirror, {
  Extension,
  ReactCodeMirrorProps,
} from '@uiw/react-codemirror'; // Or your CodeMirror React wrapper
import { JavascriptPreview } from './JavascriptPreview';
import { FieldPathId, FieldProps, RJSFSchema } from '@rjsf/utils';

type Props = {
  schema: RJSFSchema;
  fieldPathId: FieldPathId;
  registry: FieldProps['registry'];
  codeStyle: ReactCodeMirrorProps;
  text: string;
  fullscreen: boolean;
  extensions: Extension[]; // You can be more specific based on your extensions type
} & CodeSchema;

export const TemplatePreview: React.FC<Props> = ({
  schema,
  text,
  codeStyle,
  fullscreen,
  fieldPathId,
  registry,
  extensions,
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
      return <JavascriptPreview text={text} fullscreen={fullscreen} />;
    default:
      return (
        <CodeMirror
          {...codeStyle}
          readOnly
          value={text}
          extensions={extensions}
        />
      );
  }
};

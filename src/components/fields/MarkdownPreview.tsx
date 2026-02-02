import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import DOMPurify from 'dompurify';
import { Box, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import ReactCodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { SortableTable } from '../SortableTable';
import { FieldPathId, FieldProps, RJSFSchema } from '@rjsf/utils';
import DynamicField from './DynamicField';
import { mdCodeLanguages, useAppColorScheme } from '@/utils';

interface Props {
  text: string;
  maxHeight: string | number;
  schema: RJSFSchema;
  fieldPathId: FieldPathId;
  registry: FieldProps['registry'];
}

const sanitizeSchema = {
  ...defaultSchema,
  // pandas df.to_html thường dùng table/thead/tbody/tr/th/td
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'span',
    'div',
  ],
  attributes: {
    ...defaultSchema.attributes,
    table: ['className', 'style'],
    th: ['className', 'style', 'colspan', 'rowspan'],
    td: ['className', 'style', 'colspan', 'rowspan'],
    div: ['className', 'style'],
    span: ['className', 'style'],
  },
};

export const MarkdownPreview = ({
  text = '',
  fieldPathId,
  maxHeight,
  schema,
  registry,
}: Props) => {
  const [mode] = useAppColorScheme();
  const styles = useMemo(
    () => ({
      height: '100%',
      maxWidth: '100%',
      maxHeight,
      '& .cm-editor': {
        backgroundColor: 'transparent',
      },
      '& .cm-scroller': {
        backgroundColor: 'transparent',
      },
      typography: 'body2',
      '& h1': { typography: 'h4', mb: 2 },
      '& h2': { typography: 'h5', mt: 3 },
      '& h3': { typography: 'h6', mt: 2 },
      '& table': {
        width: '100%',
        borderCollapse: 'collapse',
        my: 2,
      },
      '& th, & td': {
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        whiteSpace: 'nowrap',
        font: 'inherit',
      },
      '& th': {
        bgcolor: 'action.hover',
        fontWeight: 'medium',
      },
    }),
    [maxHeight],
  );
  return (
    <Box sx={styles}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={{
          code({ className, children, node }) {
            const lang = className?.replace('language-', '');

            switch (lang) {
              case 'html':
                return (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(children as string),
                    }}
                  />
                );
              case 'module':
                // get name of the node as name
                return (
                  <DynamicField
                    fieldPathId={fieldPathId}
                    name={String(node.properties.name)}
                    onChange={undefined}
                    onBlur={undefined}
                    onFocus={undefined}
                    registry={registry}
                    schema={schema}
                    formData={children as string}
                  />
                );
              case 'json':
              case 'yml':
              case 'yaml':
              case 'markdown':
              case 'sql':
              case 'jinja':
              case 'js':
                return (
                  <ReactCodeMirror
                    theme={mode}
                    basicSetup={{
                      lineNumbers: false,
                      foldGutter: false,
                    }}
                    editable={false}
                    value={children as string}
                    extensions={[mdCodeLanguages[lang]]}
                  />
                );

              default:
                return <code className={className}>{children}</code>;
            }
          },

          table({ children, className }) {
            return (
              <SortableTable className={className}>{children}</SortableTable>
            );
          },
          thead({ children }) {
            return <TableHead>{children}</TableHead>;
          },
          tbody({ children }) {
            return <TableBody>{children}</TableBody>;
          },
          tr({ children }) {
            return <TableRow>{children}</TableRow>;
          },
          th({ children }) {
            return (
              <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }}>
                {children}
              </TableCell>
            );
          },
          td({ children }) {
            return <TableCell>{children}</TableCell>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </Box>
  );
};

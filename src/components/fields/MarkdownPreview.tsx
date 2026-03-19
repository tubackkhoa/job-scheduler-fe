import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Box, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { memo } from 'react';
import { SortableTable } from '../SortableTable';
import { resolveLanguageExtension } from '@/utils';
import { useAppColorScheme } from '@/hooks/useAppColorSchema';

interface Props {
  text: string;
  maxHeight?: string | number;
  renderModule?: (children: React.ReactNode) => React.ReactElement;
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
    table: ['class', 'style'],
    th: ['class', 'style', 'colspan', 'rowspan'],
    td: ['class', 'style', 'colspan', 'rowspan'],
    div: ['class', 'style'],
    span: ['class', 'style'],
  },
};

export const MarkdownPreview = memo(
  ({ text, maxHeight = 'auto', renderModule }: Props) => {
    const [mode] = useAppColorScheme();
    return (
      <Box
        sx={{
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
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
          components={{
            code({ className, children }) {
              const lang = className?.replace('language-', '');

              switch (lang) {
                case 'html':
                  return (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: children as string,
                      }}
                    />
                  );
                case 'module':
                  // get name of the node as name
                  return renderModule?.(children);
                case 'json':
                case 'yml':
                case 'yaml':
                case 'sql':
                case 'js':
                  return (
                    <CodeMirror
                      theme={mode}
                      basicSetup={{
                        lineNumbers: false,
                        foldGutter: false,
                      }}
                      editable={false}
                      value={children as string}
                      extensions={[resolveLanguageExtension(lang)]}
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
            img({ src, alt }) {
              return (
                <Box
                  component="img"
                  src={src}
                  alt={alt}
                  sx={{
                    maxWidth: {
                      xs: '100%',
                      sm: 600,
                      md: 800,
                    },
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    mx: 'auto',
                    my: 2,
                  }}
                />
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </Box>
    );
  },
);

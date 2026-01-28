import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Box, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { MarkdownChart } from '../MarkdownChart';
import { MarkdownModule } from '../MarkdownModule';
import ReactCodeMirror, { Extension } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { sql } from '@codemirror/lang-sql';
import { jinja } from '@codemirror/lang-jinja';
import { markdown } from '@codemirror/lang-markdown';
import { javascript } from '@codemirror/lang-javascript';
import { useMemo } from 'react';
import { SortableTable } from '../SortableTable';

const resolveLanguageExtensions = (lang: string): Extension[] => {
  switch (lang) {
    case 'json':
      return [json()];
    case 'yaml':
    case 'yml':
      return [yaml()];
    case 'markdown':
      return [markdown()];
    case 'sql':
      return [sql()];
    case 'js':
      return [javascript()];
    default:
      return [jinja()];
  }
};

export const MarkdownPreview = ({ text = '', maxHeight, code, url }) => {
  const styles = useMemo(
    () => ({
      height: '100%',
      maxWidth: '100%',
      maxHeight,
      '& .cm-editor': {
        backgroundColor: 'transparent'
      },
      '& .cm-scroller': {
        backgroundColor: 'transparent'
      },
      typography: 'body2',
      '& h1': { typography: 'h4', mb: 2 },
      '& h2': { typography: 'h5', mt: 3 },
      '& h3': { typography: 'h6', mt: 2 },
      '& table': {
        width: '100%',
        borderCollapse: 'collapse',
        my: 2
      },
      '& th, & td': {
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
        whiteSpace: 'nowrap',
        font: 'inherit'
      },
      '& th': {
        bgcolor: 'action.hover',
        fontWeight: 'medium'
      }
    }),
    [maxHeight]
  );
  return (
    <Box sx={styles}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const lang = className?.replace('language-', '');

            switch (lang) {
              case 'html':
                return (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(children as string)
                    }}
                  />
                );
              case 'chart':
                return <MarkdownChart source={children as string} />;
              case 'module':
                return (
                  <MarkdownModule
                    url={url}
                    code={code}
                    source={children as string}
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
                    theme="dark"
                    basicSetup={{
                      lineNumbers: false,
                      foldGutter: false
                    }}
                    editable={false}
                    value={children as string}
                    extensions={resolveLanguageExtensions(lang)}
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
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </Box>
  );
};

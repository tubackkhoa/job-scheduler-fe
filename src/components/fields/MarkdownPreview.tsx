import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { Box, useTheme } from '@mui/material';
import {
  getModule,
  makeCanvasCharts,
  makeTablesSortable,
  markdown
} from '@/utils';

// patch markdown for chartjs
const md_renderer_rules_fence = markdown.renderer.rules.fence.bind(
  markdown.renderer.rules
);

markdown.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const token = tokens[idx];
  const info = token.info.trim();

  switch (info) {
    case 'chart':
      return `<canvas class="chartjs">${markdown.utils.escapeHtml(
        token.content
      )}</canvas>`;

    default:
      return md_renderer_rules_fence(tokens, idx, options, env, slf);
  }
};

/* ---------- Component ---------- */

export const MarkdownPreview = ({ text = '', maxHeight, code, url }) => {
  const contentRef = useRef<HTMLElement>(null);
  const [ModComponent, setModComponent] =
    useState<React.ComponentType<any> | null>(null);
  const theme = useTheme();
  const boxStyles = useMemo(
    () => ({
      typography: 'body1',
      '--alert-bg':
        theme.palette.mode === 'dark'
          ? theme.palette.error.main + '29' // ~16% alpha
          : theme.palette.error.light,
      '--alert-text': theme.palette.error.contrastText,
      '--alert-icon': theme.palette.error.main,
      '& h1': { typography: 'h4', mb: 2 },
      '& h2': { typography: 'h5', mt: 3 },
      '& h3': { typography: 'h6', mt: 2 },

      '& p': { mb: 1.5 },

      '& ul': { pl: 3 },
      '& li': { mb: 0.5 },

      '& table': {
        width: '100%',
        borderCollapse: 'collapse',
        my: 2,
        minWidth: 'max-content'
      },
      '& th, & td': {
        border: '1px solid',
        borderColor: 'divider',
        p: 1,
        whiteSpace: 'nowrap'
      },
      '& th': {
        bgcolor: 'action.hover',
        fontWeight: 'bold'
      },

      '& pre': {
        bgcolor: 'grey.900',
        color: 'grey.100',
        p: 2,
        borderRadius: 1,
        overflowX: 'auto'
      },

      '& code': {
        bgcolor: 'action.hover',
        px: 0.5,
        borderRadius: 0.5,
        fontFamily: 'monospace'
      },

      '& blockquote': {
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        pl: 2,
        color: 'text.secondary',
        my: 2
      }
    }),
    [theme]
  );

  // ✅ Memoize markdown → HTML → sanitize
  const htmlContent = useMemo(() => {
    return DOMPurify.sanitize(markdown.render(text), {
      ADD_TAGS: ['canvas'],
      ADD_ATTR: ['class', 'data-*']
    });
  }, [text]);

  // ✅ Chart.js needs layout-ready DOM
  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    // ✅ NEW: enable table sorting
    makeTablesSortable(root.querySelectorAll('table.sortable'));

    const charts = makeCanvasCharts(root.querySelectorAll('canvas.chartjs'));

    // ✅ Cleanup on unmount OR text change
    return () => {
      charts.forEach((chart) => chart.destroy());
    };
  });

  /* ---------- Load module ---------- */
  useEffect(() => {
    if ((!url && !code) || !contentRef.current || !htmlContent) {
      setModComponent(null);
      return;
    }

    let mounted = true;

    getModule({ url, code }).then((mod) => {
      if (!mounted) return;
      setModComponent(() => mod.default);
    });

    return () => {
      mounted = false;
    };
  }, [url, code, htmlContent]);

  return (
    <Box sx={{ height: '100%', maxWidth: '100%', maxHeight }}>
      {/* Markdown HTML */}
      <Box
        sx={boxStyles}
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* React island (safe to re-render) */}
      {ModComponent && (
        <Box sx={{ mt: 2 }}>
          <ModComponent
            root={contentRef.current}
            createPortal={createPortal}
            {...window.globalProps}
          />
        </Box>
      )}
    </Box>
  );
};

import { useLayoutEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';
import { Box, useTheme } from '@mui/material';
import { makeCanvasCharts, makeTablesSortable, markdown } from '@/utils';

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

export const MarkdownPreview = ({ text = '', maxHeight }) => {
  const ref = useRef<HTMLElement>(null);
  const theme = useTheme();
  const boxStyles = useMemo(
    () => ({
      height: '100%',
      maxHeight,
      typography: 'body1',
      overflowX: 'auto',
      '--alert-bg':
        theme.palette.mode === 'dark'
          ? theme.palette.error.main + '29' // ~16% alpha
          : theme.palette.error.light,
      '--alert-text': theme.palette.error.contrastText,
      '--alert-icon': theme.palette.error.main,
      maxWidth: '100%',
      '&::-webkit-scrollbar': {
        height: '8px'
      },
      '&::-webkit-scrollbar-track': {
        bgcolor: 'rgba(0, 0, 0, 0.2)'
      },
      '&::-webkit-scrollbar-thumb': {
        bgcolor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.3)'
        }
      },

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
    [theme, maxHeight]
  );

  // ✅ Memoize markdown → HTML → sanitize
  const htmlContent = useMemo(() => {
    return DOMPurify.sanitize(markdown.render(text), {
      ADD_TAGS: ['canvas'],
      ADD_ATTR: ['class']
    });
  }, [text]);

  // ✅ Chart.js needs layout-ready DOM
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    // ✅ NEW: enable table sorting
    makeTablesSortable(root.querySelectorAll('table.sortable'));

    const charts = makeCanvasCharts(root.querySelectorAll('canvas.chartjs'));

    // ✅ Cleanup on unmount OR text change
    return () => {
      charts.forEach((chart) => chart.destroy());
    };
  });

  return (
    <Box
      ref={ref}
      sx={boxStyles}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

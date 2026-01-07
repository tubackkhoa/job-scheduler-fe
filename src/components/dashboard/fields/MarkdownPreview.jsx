import { useLayoutEffect, useMemo, useRef } from 'react';
import json5 from 'json5';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { Box } from '@mui/material';
import { Chart } from 'chart.js/auto';

import {
  CandlestickController,
  CandlestickElement
} from 'chartjs-chart-financial';

import 'chartjs-adapter-luxon';

Chart.register(CandlestickController, CandlestickElement);

/* ---------- Markdown instance (singleton) ---------- */

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
});

const md_renderer_rules_fence = md.renderer.rules.fence.bind(md.renderer.rules);

md.renderer.rules.fence = (tokens, idx, options, env, slf) => {
  const token = tokens[idx];
  const info = token.info.trim();

  switch (info) {
    case 'chart':
      return `<canvas class="chartjs">${md.utils.escapeHtml(
        token.content
      )}</canvas>`;

    default:
      return md_renderer_rules_fence(tokens, idx, options, env, slf);
  }
};

/* ---------- Component ---------- */

export const MarkdownPreview = ({ text = '', maxHeight }) => {
  const ref = useRef(null);

  // ✅ Memoize markdown → HTML → sanitize
  const htmlContent = useMemo(() => {
    return DOMPurify.sanitize(md.render(text), {
      ADD_TAGS: ['canvas'],
      ADD_ATTR: ['class']
    });
  }, [text]);

  // ✅ Chart.js needs layout-ready DOM
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const charts = [];
    const canvases = root.querySelectorAll('canvas.chartjs');

    canvases.forEach((canvas) => {
      try {
        const raw = canvas.textContent?.trim();
        if (!raw) return;
        // this is for human typing, not serialization
        const config = json5.parse(raw);
        canvas.textContent = '';

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        charts.push(new Chart(ctx, config));
      } catch (err) {
        console.error('Invalid chart JSON:', err);
      }
    });

    // ✅ Cleanup on unmount OR text change
    return () => {
      charts.forEach((chart) => chart.destroy());
    };
  });

  return (
    <Box
      ref={ref}
      sx={{
        height: '100%',
        maxHeight,
        typography: 'body1',
        overflowX: 'auto',
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
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

import { useLayoutEffect, useMemo, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { Box } from '@mui/material';
import { Chart } from 'chart.js/auto';

/* ---------- Markdown instance (singleton) ---------- */

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
});

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info.trim();

  if (info === 'chart') {
    return `<canvas class="chartjs">${md.utils.escapeHtml(
      token.content
    )}</canvas>`;
  }

  return `<pre><code class="language-${info}">${md.utils.escapeHtml(
    token.content
  )}</code></pre>`;
};

/* ---------- Component ---------- */

export const MarkdownPreview = ({ text = '' }) => {
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

        const config = JSON.parse(raw);
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
        pt: 3,
        mb: 2,
        typography: 'body1',
        '& canvas.chartjs': {
          maxWidth: '100%',
          height: 'auto'
        }
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

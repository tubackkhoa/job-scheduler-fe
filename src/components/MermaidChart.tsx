import { PaletteMode } from '@mui/material';
import { useEffect, useRef } from 'react';

interface MermaidProps {
  chart: string;
  theme?: PaletteMode;
}

export function MermaidChart({ chart, theme }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'light' ? 'neutral' : 'dark',
        securityLevel: 'loose',
      });
      if (!ref.current) return;

      const id = `mermaid-${Math.random().toString(36).slice(2)}`;

      try {
        const { svg } = await mermaid.render(id, chart);
        ref.current.innerHTML = svg;
      } catch (err) {
        ref.current.innerHTML = `<pre>${err}</pre>`;
      }
    };
    renderChart();
  }, [chart]);

  return <div ref={ref} />;
}

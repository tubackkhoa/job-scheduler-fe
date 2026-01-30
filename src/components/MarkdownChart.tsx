import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { Alert } from '@mui/material';

type MarkdownChartProps = {
  source: string;
};

export const MarkdownChart = ({ source }: MarkdownChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const config = useMemo(() => {
    try {
      // now support JS, so please do not hurt your self
      return new Function(`return (${source})`)();
    } catch {}
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;

    let chart: Chart;

    // 1️⃣ Parse config
    try {
      setError(null);
      // 🔥 Destroy ANY chart bound to this canvas (registry-safe)
      Chart.getChart(canvas)?.destroy();
      // 2️⃣ Create fresh chart
      chart = new Chart(canvas, config);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid chart config');
      return;
    }
    // watch the whole body
    const resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(document.getElementById('plugin-right-panel'));

    // 3️⃣ Cleanup on unmount / HMR
    return () => {
      resizeObserver.disconnect();
      chart.destroy();
    };
  }, [config]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return <canvas ref={canvasRef} />;
};

import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { Alert } from '@mui/material';
import {
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement
} from 'chartjs-chart-financial';
import 'chartjs-adapter-luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// 🔥 Register financial charts
Chart.register(
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement,
  ChartDataLabels
);

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

    let rafId: number | null = null;

    const handleResize = () => {
      // Debounce via requestAnimationFrame
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        chart.resize();
      });
    };

    window.addEventListener('resize', handleResize);

    // 3️⃣ Cleanup on unmount / HMR
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
      chart.destroy();
    };
  }, [config]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return <canvas ref={canvasRef} />;
};

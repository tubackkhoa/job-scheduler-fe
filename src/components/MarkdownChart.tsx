import { useEffect, useRef, useState } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import json5 from 'json5';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let config: ChartConfiguration;

    // 1️⃣ Parse config
    try {
      config = json5.parse(source);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid chart config');
      return;
    }

    // 🔥 Destroy ANY chart bound to this canvas (registry-safe)
    Chart.getChart(canvas)?.destroy();

    // 2️⃣ Create fresh chart
    const chart = new Chart(canvas, config);

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
  }, [source]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return <canvas ref={canvasRef} />;
};

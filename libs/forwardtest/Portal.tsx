import { FieldProps } from '@rjsf/utils';
import {
  createChart,
  ColorType,
  LineSeries,
  LineData,
  UTCTimestamp,
  AreaSeries,
} from 'lightweight-charts';
import { useRef, useEffect } from 'react';

const TOKENS = [
  { symbol: 'BTC', color: '#f7931a' },
  { symbol: 'ETH', color: '#627eea' },
  { symbol: 'SOL', color: '#14f195' },
  { symbol: 'BNB', color: '#f3ba2f' },
  { symbol: 'ARB', color: '#28a0f0' },
  { symbol: 'AVAX', color: '#e84142' },
  { symbol: 'MATIC', color: '#8247e5' },
  { symbol: 'OP', color: '#ff0420' },
  { symbol: 'DOT', color: '#e6007a' },
];
let ind = 0;
export default function RandomPnlChart({
  formData,
}: FieldProps<'line' | 'area'>) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const token = TOKENS[ind];
  ind++;
  if (ind === TOKENS.length) {
    ind = 0;
  }

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      height: 160,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280', // MUI text.secondary-ish
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    });

    const series =
      formData === 'area'
        ? chart.addSeries(AreaSeries, {
            lineColor: token.color,
            topColor: `${token.color}55`,
            bottomColor: 'transparent',
            lineWidth: 2,
          })
        : chart.addSeries(LineSeries, {
            color: token.color,
            lineWidth: 2,
          });

    // Generate random PnL data
    let pnl = 0;
    const data: LineData<UTCTimestamp>[] = Array.from({ length: 40 }).map(
      (_, i) => {
        pnl += (Math.random() - 0.45) * 10;
        return {
          time: i as UTCTimestamp,
          value: Number(pnl.toFixed(2)),
        };
      },
    );

    series.setData(data);

    const finalPnl = data[data.length - 1].value;
    series.applyOptions({
      color: finalPnl >= 0 ? '#2e7d32' : '#d32f2f',
    });

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, []);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
      }}
    />
  );
}

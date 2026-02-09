import { FieldProps } from '@rjsf/utils';
import {
  createChart,
  ColorType,
  LineSeries,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries,
  LineData,
  UTCTimestamp,
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

export default function RandomPnlChart({ formData }: FieldProps<PluginData>) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const token = TOKENS[ind];
  ind = (ind + 1) % TOKENS.length;

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      height: 200,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    });

    // 0 = Line, 1 = Area, 2 = Candlestick
    const chartType = Math.round(3 * Math.random());

    if (chartType === 2) {
      // ===== CANDLESTICK MODE =====
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#2e7d32',
        downColor: '#d32f2f',
        borderVisible: false,
        wickUpColor: '#2e7d32',
        wickDownColor: '#d32f2f',
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      let lastClose = 100;

      const ohlcData = Array.from({ length: 40 }).map((_, i) => {
        const open = lastClose;
        const change = (Math.random() - 0.5) * 8;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        const volume = Math.random() * 1000 + 200;

        lastClose = close;

        return {
          time: i as UTCTimestamp,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume,
        };
      });

      candleSeries.setData(ohlcData);

      volumeSeries.setData(
        ohlcData.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? '#2e7d3233' : '#d32f2f33',
        })),
      );
    } else {
      // ===== LINE / AREA MODE (original behavior) =====
      const series =
        chartType === 1
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
    }

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

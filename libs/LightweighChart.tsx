import { FieldProps } from '@rjsf/utils';

const { Box, Chip, Stack } = Mui;
const { useEffect, useRef, useState, useMemo } = React;
const { createChart, CandlestickSeries, BaselineSeries } = LightweightChart;

// -----------------------------
// Types
// -----------------------------
type Row = {
  timestamp: number;
  asset: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  prediction: -1 | 0 | 1;
};

// -----------------------------
// Color palette per symbol
// -----------------------------
const SYMBOL_COLORS: Record<
  string,
  { candleUp: string; candleDown: string; pnlTop: string; pnlBottom: string }
> = {
  BTC: {
    candleUp: '#f7931a',
    candleDown: '#b45309',
    pnlTop: '#fbbf24',
    pnlBottom: '#92400e',
  },
  ETH: {
    candleUp: '#627eea',
    candleDown: '#3730a3',
    pnlTop: '#818cf8',
    pnlBottom: '#312e81',
  },
  SOL: {
    candleUp: '#22d3ee',
    candleDown: '#0e7490',
    pnlTop: '#67e8f9',
    pnlBottom: '#155e75',
  },
  AVAX: {
    candleUp: '#ef4444',
    candleDown: '#7f1d1d',
    pnlTop: '#f87171',
    pnlBottom: '#991b1b',
  },
  LINK: {
    candleUp: '#3b82f6',
    candleDown: '#1e3a8a',
    pnlTop: '#60a5fa',
    pnlBottom: '#1e40af',
  },
  DOGE: {
    candleUp: '#facc15',
    candleDown: '#854d0e',
    pnlTop: '#fde047',
    pnlBottom: '#713f12',
  },
};

// -----------------------------
// Utilities
// -----------------------------

function groupRowsBySymbol(rows: Row[]) {
  const map: Record<string, Row[]> = {};
  for (const r of rows) {
    if (!map[r.asset]) map[r.asset] = [];
    map[r.asset].push(r);
  }
  for (const sym in map) map[sym].sort((a, b) => a.timestamp - b.timestamp);
  return map;
}

function generateSymbolSeries(
  rows: Row[],
  { positionSizeUsd = 10_000, fees = 0.0005 } = {},
) {
  const ohlcv: any[] = [];
  const pnl: any[] = [];

  let cumulativePnl = 0;
  let prevClose: number | null = null;
  let prevPosition = 0;

  for (const row of rows) {
    const time = Math.floor(row.timestamp / 1000);

    ohlcv.push({
      time,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
    });

    let pnlUsd = 0;
    if (prevClose !== null) {
      const ret = (row.close - prevClose) / prevClose;
      pnlUsd = prevPosition * ret * positionSizeUsd;
      const turnover = Math.abs(row.prediction - prevPosition);
      pnlUsd -= turnover * positionSizeUsd * fees;
    }

    cumulativePnl = +(cumulativePnl + pnlUsd).toFixed(2);
    pnl.push({ time, value: cumulativePnl });

    prevClose = row.close;
    prevPosition = row.prediction;
  }

  return { ohlcv, pnl };
}

function getTopSymbols(rowsBySymbol: Record<string, Row[]>, topN = 5) {
  return Object.entries(rowsBySymbol)
    .map(([symbol, rows]) => ({
      symbol,
      volume: rows.reduce((s, r) => s + r.volume, 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, topN)
    .map((r) => r.symbol);
}

// -----------------------------
// Component
// -----------------------------
export default function MultiSymbolChart({ formData }: FieldProps<string>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  // IMPORTANT: seriesRef stores ONLY live series references
  const seriesRef = useRef<Record<string, { candle: any; pnl: any }>>({});

  const [visible, setVisible] = useState<Set<string>>(new Set());

  const rows: Row[] | undefined = useMemo(() => {
    if (!formData) return;
    try {
      return new Function(formData)();
    } catch {
      return;
    }
  }, [formData]);

  const rowsBySymbol = useMemo(() => groupRowsBySymbol(rows), [rows]);
  const symbols = Object.keys(rowsBySymbol);
  const defaultSymbols = useMemo(
    () => getTopSymbols(rowsBySymbol, 5),
    [rowsBySymbol],
  );

  // -----------------------------
  // Chart init (ONCE)
  // -----------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: { background: { color: 'transparent' }, textColor: '#e5e7eb' },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: true },
      leftPriceScale: { borderColor: 'rgba(255,255,255,0.1)', visible: true },
    });

    chartRef.current = chart;

    // Add defaults synchronously
    defaultSymbols.forEach((s) => addSymbolInternal(s));
    setVisible(new Set(defaultSymbols));

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      chart.timeScale().fitContent();
    });

    ro.observe(container);

    return () => {
      ro.disconnect();

      // SAFELY remove everything on unmount
      Object.values(seriesRef.current).forEach((s) => {
        if (s.candle) chart.removeSeries(s.candle);
        if (s.pnl) chart.removeSeries(s.pnl);
      });

      seriesRef.current = {};
      chart.remove();
    };
  }, []);

  // -----------------------------
  // INTERNAL (non-react) helpers
  // -----------------------------
  function addSymbolInternal(symbol: string) {
    const chart = chartRef.current;
    if (!chart || seriesRef.current[symbol]) return;

    const colors = SYMBOL_COLORS[symbol] ?? SYMBOL_COLORS.BTC;
    const { ohlcv, pnl } = generateSymbolSeries(rowsBySymbol[symbol]);

    const candle = chart.addSeries(CandlestickSeries, {
      priceScaleId: symbol,
      upColor: colors.candleUp,
      downColor: colors.candleDown,
      wickUpColor: colors.candleUp,
      wickDownColor: colors.candleDown,
      borderVisible: false,
    });

    const pnlSeries = chart.addSeries(BaselineSeries, {
      priceScaleId: 'left',
      baseValue: { type: 'price', price: 0 },
      topLineColor: colors.pnlTop,
      bottomLineColor: colors.pnlBottom,
      topFillColor1: colors.pnlTop + '55',
      bottomFillColor1: colors.pnlBottom + '55',
    });

    candle.setData(ohlcv);
    pnlSeries.setData(pnl);

    seriesRef.current[symbol] = { candle, pnl: pnlSeries };
  }

  function removeSymbolInternal(symbol: string) {
    const chart = chartRef.current;
    const s = seriesRef.current[symbol];
    if (!chart || !s) return;

    chart.removeSeries(s.candle);
    chart.removeSeries(s.pnl);

    delete seriesRef.current[symbol];
  }

  // -----------------------------
  // React-facing toggle (SAFE)
  // -----------------------------
  function toggleSymbol(symbol: string) {
    setVisible((prev) => {
      const next = new Set(prev);

      if (next.has(symbol)) {
        removeSymbolInternal(symbol);
        next.delete(symbol);
      } else {
        addSymbolInternal(symbol);
        next.add(symbol);
      }

      return next;
    });
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Box sx={{ width: '100%', minHeight: 720 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
        {symbols.map((sym) => {
          const color = SYMBOL_COLORS[sym]?.candleUp ?? '#64748b';
          const active = visible.has(sym);

          return (
            <Chip
              key={sym}
              label={sym}
              clickable
              onClick={() => toggleSymbol(sym)}
              variant={active ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 700,
                borderColor: color,
                color: active ? '#020617' : color,
                backgroundColor: active ? color : 'transparent',
                '&:hover': {
                  backgroundColor: active ? color : color + '22',
                },
              }}
            />
          );
        })}
      </Stack>

      <Box ref={containerRef} sx={{ width: '100%', height: 640 }} />
    </Box>
  );
}

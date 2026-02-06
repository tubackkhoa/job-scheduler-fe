import { FieldProps } from '@rjsf/utils';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createChart,
  IChartApi,
  LineData,
  LineSeries,
  MouseEventParams,
  UTCTimestamp,
} from 'lightweight-charts';
import {
  ViewColumn,
  FilterList,
  Clear,
  Settings,
  ShowChart,
} from '@mui/icons-material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  TextField,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  IconButton,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Popover,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
} from '@mui/material';

type TooltipData = {
  time: string;
  openTime: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  pnl: number;
  accumulatedPnl: number;
};

type ChartTooltipProps = {
  visible: boolean;
  x: number;
  y: number;
  data?: TooltipData;
};

const THEME = {
  positive: '#28a745',
  negative: '#dc3545',
  neutral: '#6c757d',
  warning: '#ffc107',
} as const;

const ColorText: React.FC<{
  color: string;
  bold?: boolean;
  children: React.ReactNode;
}> = ({ color, bold, children }) => (
  <Box component="span" sx={{ color, fontWeight: bold ? 700 : 400 }}>
    {children}
  </Box>
);

function fmtPnl(v?: number | null): React.ReactNode {
  if (v == null || Number.isNaN(v)) return '-';

  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  const absFormatted = fmt.format(Math.abs(v));

  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  const arrow = v > 0 ? '↗' : v < 0 ? '↘' : '';
  const color = v > 0 ? THEME.positive : v < 0 ? THEME.negative : THEME.neutral;

  return (
    <ColorText color={color} bold={v !== 0}>
      {arrow} {sign}
      {absFormatted}
    </ColorText>
  );
}

function fmtStatus(
  status?: { state?: string; label?: string } | null,
): React.ReactNode {
  if (!status) return '-';

  if (status.state === 'active')
    return (
      <ColorText color={THEME.positive}>✓ Active ({status.label})</ColorText>
    );

  if (status.state === 'inactive')
    return (
      <ColorText color={THEME.warning}>⏸ Inactive ({status.label})</ColorText>
    );

  return <ColorText color={THEME.neutral}>⊘ No Job</ColorText>;
}

function fmtLatest(
  latest?: { symbol: string; direction: string; pnl: number } | null,
): React.ReactNode {
  if (!latest) return '-';

  const color =
    latest.direction === 'BUY' || latest.direction === 'LONG'
      ? THEME.positive
      : THEME.negative;

  return (
    <>
      <ColorText color={color} bold>
        {latest.symbol}
      </ColorText>{' '}
      {fmtPnl(latest.pnl)}
    </>
  );
}

function fmtWinrate(winrate?: number | null): React.ReactNode {
  if (winrate == null) return '-';

  const pct = winrate * 100;
  let color: string = THEME.negative;

  if (pct >= 50) color = THEME.positive;
  else if (pct >= 40) color = THEME.neutral;

  return (
    <ColorText color={color} bold>
      {pct.toFixed(1)}%
    </ColorText>
  );
}

const renderCell = (key: string, value: any) => {
  switch (key) {
    case 'Total PNL':
    case 'PNL 1H':
    case 'PNL 4H':
    case 'PNL 1D':
      return fmtPnl(value);

    case 'Winrate':
      return fmtWinrate(value);

    case 'Status':
      return fmtStatus(value);

    case 'Latest Position':
      return fmtLatest(value);

    case 'Started':
    case 'Latest Position Time':
      return Utils.formatUtcTime(value);

    default:
      return value;
  }
};

type AnyDict = Record<string, any>;

type IdentityState = { state: 'active' | 'inactive'; label: string };

function buildStatsTable(
  stats: AnyDict[],
  jobs: AnyDict[],
): {
  rows: AnyDict[];
  totals: {
    total_models: number;
    total_pnl: number;
    total_positions: number;
  };
} {
  if (!stats?.length) {
    return {
      rows: [],
      totals: {
        total_models: 0,
        total_pnl: 0,
        total_positions: 0,
      },
    };
  }

  // Deduplicate stats by identity (keep latest)
  const seenIdentities: Record<string, AnyDict> = {};
  for (const stat of stats) {
    const identity = stat.identity;
    if (identity) {
      seenIdentities[identity] = stat;
    }
  }
  stats = Object.values(seenIdentities);

  // Map model identity → job info
  const identityJob: Record<string, IdentityState> = {};

  for (const job of jobs) {
    const modelKey = job?.config?.model_key;
    if (modelKey) {
      identityJob[modelKey] = {
        state: job.active ? 'active' : 'inactive',
        label: job.description || 'No description',
      };
    }
  }

  const rows: AnyDict[] = [];
  let totalPnl = 0;
  let totalPositions = 0;

  for (const stat of stats) {
    const identity = stat.identity;
    if (!identity) continue;

    const pnl = stat.totalPnl ?? 0;
    const positions = Number(stat.totalPositions ?? 0);

    totalPnl += pnl;
    totalPositions += positions;

    // Convert lastPosition
    const lastPos = stat.lastPosition;
    const lastPosFormatted = lastPos
      ? {
          symbol: lastPos.symbol ?? '',
          direction: lastPos.side ?? '',
          pnl: lastPos.pnl ?? 0,
        }
      : null;

    const lastPosTime = lastPos?.time ?? null;
    const item = identityJob[identity];

    rows.push({
      Identity: identity,
      Model: stat.modelName,

      // STORE RAW VALUES (no JSX)
      'Total PNL': pnl,
      'PNL 1H': stat.pnlDelta1h ?? 0,
      'PNL 4H': stat.pnlDelta4h ?? 0,
      'PNL 1D': stat.pnlDelta1d ?? 0,

      Winrate: stat.winrate ?? null,
      'Max Drawdown': stat.maxDrawdown,

      'Latest Position': lastPosFormatted,
      'Latest Position Time': lastPosTime,

      Status: item,
      'Hide Status': item?.state ?? '',

      Started: stat.startedAt ?? '',
      'Total Positions': positions,
      'Total Runtime': stat.totalRunningTime ?? '-',
    });
  }

  return {
    rows,
    totals: {
      total_models: rows.length,
      total_pnl: totalPnl,
      total_positions: totalPositions,
    },
  };
}

function parseDate(value: any): string {
  // the date is 2026-01-19T15:41:59.216Z => convert 2026-01-19 15:41:59 UTC
  if (!value) return '';
  return new Date(value).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

const ChartTooltip: React.FC<ChartTooltipProps> = React.memo(
  ({ visible, x, y, data }) => {
    if (!visible || !data) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          left: x,
          top: y,
          bgcolor: 'rgba(0,0,0,0.85)',
          color: '#fff',
          px: 1.5,
          py: 1,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: 220,
          boxShadow: 3,
        }}
      >
        <Typography variant="caption" display="block">
          <strong>Open time:</strong> {data.openTime}
        </Typography>
        <Typography variant="caption" display="block">
          <strong>Close time:</strong> {data.time}
        </Typography>

        <Typography variant="caption" display="block">
          <strong>Symbol:</strong> {data.symbol} | <strong>Side:</strong>{' '}
          <Box
            component="span"
            sx={{
              color: data.side === 'BUY' ? '#4caf50' : '#f44336',
              fontWeight: 600,
            }}
          >
            {data.side}
          </Box>
        </Typography>

        <Box sx={{ my: 0.5, borderTop: '1px solid rgba(255,255,255,0.2)' }} />

        <Typography variant="caption" display="block">
          <strong>PnL:</strong>{' '}
          <Box
            component="span"
            sx={{
              color: data.pnl >= 0 ? '#4caf50' : '#f44336',
              fontWeight: 600,
            }}
          >
            {data.pnl >= 0 ? '+' : ''}
            {data.pnl.toFixed(4)}
          </Box>
        </Typography>

        <Typography variant="caption" display="block">
          <strong>Accumulated:</strong>{' '}
          <Box
            component="span"
            sx={{
              color: data.accumulatedPnl >= 0 ? '#2962FF' : '#f44336',
              fontWeight: 600,
            }}
          >
            {data.accumulatedPnl >= 0 ? '+' : ''}
            {data.accumulatedPnl.toFixed(4)}
          </Box>
        </Typography>
      </Box>
    );
  },
);

/* ---------- Helpers ---------- */

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const clean = value.replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  return 0;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const valA = a[orderBy];
  const valB = b[orderBy];

  // 1. Strings that look like dates?
  if (
    typeof valA === 'string' &&
    typeof valB === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(valA) &&
    /^\d{4}-\d{2}-\d{2}T/.test(valB)
  ) {
    const da = Date.parse(valA);
    const db = Date.parse(valB);
    if (!isNaN(da) && !isNaN(db)) {
      if (db < da) return -1;
      if (db > da) return 1;
      return 0;
    }
  }

  // 2. Numeric
  const av = parseNumber(valA);
  const bv = parseNumber(valB);

  if (av !== bv) {
    return av < bv ? 1 : -1; // Descending: bigger is first (return -1) -> Wait.
  }

  // 3. String Fallback
  const as = String(valA ?? '').toLowerCase();
  const bs = String(valB ?? '').toLowerCase();

  if (bs < as) return -1;
  if (bs > as) return 1;
  return 0;
}

function getComparator<Key extends keyof any>(
  order: 'asc' | 'desc',
  orderBy: Key,
) {
  return order === 'desc'
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

/* ---------- Config Modal ---------- */
const EDITABLE_FIELDS = [
  'num_session',
  'num_signal',
  'signal_direction',
  'sl_percent',
  'total_volume',
  'tp_percent',
  'volatility',
];

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  editingRow: any;
  initialValues: Record<string, any>;
  onSave: (values: Record<string, any>) => void;
  saving: boolean;
}

const ConfigModal = ({
  open,
  onClose,
  editingRow,
  initialValues,
  onSave,
  saving,
}: ConfigModalProps) => {
  const [internalValues, setInternalValues] = useState(initialValues || {});

  useEffect(() => {
    setInternalValues(initialValues || {});
  }, [initialValues, open]);

  const handleChange = (field: string, value: any) => {
    setInternalValues((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(internalValues);
  };

  if (!editingRow) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit Config: {editingRow['Identity'] || 'Unknown'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          {EDITABLE_FIELDS.map((field) => {
            const val = internalValues[field];
            const isNumber = typeof val === 'number';

            return (
              <Grid size={{ sm: 6 }} key={field}>
                <TextField
                  fullWidth
                  size="small"
                  label={field}
                  value={val ?? ''}
                  type={isNumber ? 'number' : 'text'}
                  onChange={(e) => {
                    const newVal = isNumber
                      ? parseFloat(e.target.value)
                      : e.target.value;
                    handleChange(field, newVal);
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} variant="contained">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------- Equity Chart Modal ---------- */
interface EquityChartModalProps {
  open: boolean;
  onClose: () => void;
  row: any;
  registry: any;
}

const EquityChartModal = ({
  open,
  onClose,
  row,
  registry,
}: EquityChartModalProps) => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>();
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>(null);
  const theme = useTheme();

  const [tooltip, setTooltip] = useState<ChartTooltipProps>({
    visible: false,
    x: 0,
    y: 0,
  });

  const fetchChartData = useCallback(async () => {
    if (!row) return;

    setLoading(true);
    setError(null);

    try {
      const render = Utils.buildJinjaContext(
        registry.formContext.pluginPackage,
        registry.formContext.formData,
      );

      const identity = row.Identity || row.id;

      // Convert datetime-local format to ISO: "2025-12-01T08:00" -> "2025-12-01T08:00:00Z"
      const formatToISO = (dateStr: string) => {
        if (!dateStr) return '';
        return `${dateStr}:00Z`;
      };

      const start = formatToISO(startTime);
      const end = formatToISO(endTime);

      const result = await render(
        '{{ get_equity_curve_forward_test(identity, startTime, endTime) }}',
        { identity, startTime: start, endTime: end },
      );

      if (result && Array.isArray(result)) {
        setChartData(result);
      } else {
        setChartData([]);
      }
    } catch (e) {
      console.error('Failed to fetch equity curve', e);
      setError('Failed to load chart data: ' + (e as Error).message);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [row, startTime, endTime, Utils, registry]);

  useEffect(() => {
    if (!open) {
      setTooltip((t) => ({ ...t, visible: false }));
    }
  }, [open]);

  // Initial fetch when modal opens
  useEffect(() => {
    if (open && row) {
      fetchChartData();
    }
  }, [open, row, fetchChartData]);

  useEffect(() => {
    if (!open || !chartContainerRef.current || !chartData) return;

    // Cleanup any existing chart (StrictMode-safe)
    chartRef.current?.remove();
    chartRef.current = null;

    const { background, textColor, grid, crosshair, border } =
      theme.palette.chart;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: background },
        textColor,
      },
      grid: {
        vertLines: { color: grid },
        horzLines: { color: grid },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: crosshair,
          style: 3,
          labelBackgroundColor: crosshair,
        },
        horzLine: {
          width: 1,
          color: crosshair,
          style: 3,
          labelBackgroundColor: crosshair,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: border,
      },
      rightPriceScale: {
        borderColor: border,
      },
    });

    chartRef.current = chart;

    const pnlSeries = chart.addSeries(LineSeries, {
      color: '#FF6B00',
      lineWidth: 2,
      title: 'PnL',
    });

    const accPnlSeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'Accumulated PnL',
    });

    const pnlData: LineData<UTCTimestamp>[] = chartData.map((item) => ({
      time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
      value: item.pnl,
    }));

    const accPnlData: LineData<UTCTimestamp>[] = chartData.map((item) => ({
      time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
      value: item.accumulatedPnl,
    }));

    pnlSeries.setData(pnlData);
    accPnlSeries.setData(accPnlData);
    chart.timeScale().fitContent();

    // ---- Crosshair handler (stable & safe) ----
    const handleCrosshairMove = Utils._.throttle((param: MouseEventParams) => {
      if (!param?.time || !param?.point) {
        setTooltip((t) => ({ ...t, visible: false }));
        return;
      }

      if (param.point.x < 0 || param.point.y < 0) {
        setTooltip((t) => ({ ...t, visible: false }));
        return;
      }

      const accData = param.seriesData.get(accPnlSeries);
      if (!accData) {
        setTooltip((t) => ({ ...t, visible: false }));
        return;
      }

      const timestamp = (accData.time as number) * 1000;

      const dataPoint = chartData.find(
        (d) => Math.abs(new Date(d.time).getTime() - timestamp) < 1000,
      );

      if (!dataPoint) return;

      const maxX = chartContainerRef.current.clientWidth - 240;
      const maxY = chartContainerRef.current.clientHeight - 120;
      setTooltip({
        visible: true,
        x: Math.min(param.point.x + 15, maxX),
        y: Math.min(param.point.y + 15, maxY),
        data: {
          time: parseDate(dataPoint.time),
          openTime: parseDate(dataPoint.openTime),
          symbol: dataPoint.symbol,
          side: dataPoint.side,
          pnl: dataPoint.pnl,
          accumulatedPnl: dataPoint.accumulatedPnl,
        },
      });
    }, 40);

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // ---- Resize ----
    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };

    window.addEventListener('resize', handleResize);

    // ---- Cleanup ----
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
    };
  }, [chartData, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>Equity Curve: {row?.Identity || 'Unknown'}</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={2} sx={{ mb: 2, mt: 1 }}>
          <TextField
            label="Start Time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="End Time"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={fetchChartData}
            disabled={loading}
            sx={{ height: 40, alignSelf: 'flex-start' }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#FF6B00' }} />
            <Typography variant="body2">PnL (Individual Trade)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 3, bgcolor: '#2962FF' }} />
            <Typography variant="body2">Accumulated PnL</Typography>
          </Box>
        </Box>
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={400}
          >
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Box
            minHeight={400}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        {chartData &&
          (chartData.length ? (
            <Box
              ref={chartContainerRef}
              sx={{
                position: 'relative',
                width: '100%',
                height: 540,
                mt: 2,
              }}
            >
              <ChartTooltip {...tooltip} />
            </Box>
          ) : (
            <Box
              minHeight={400}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Typography color="text.secondary">No data available</Typography>
            </Box>
          ))}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="warning" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------- Component ---------- */

export default ({ formData, registry }: FieldProps) => {
  /* ---------- State ---------- */
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<string>('');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Column Visibility Popover
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Config Modal State
  const [editingRow, setEditingRow] = useState<any>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  // Chart Modal State
  const [chartOpen, setChartOpen] = useState(false);
  const [chartRow, setChartRow] = useState<any>(null);

  // Hidden rows (manual hide)
  const [hiddenRowIds, setHiddenRowIds] = useState<Record<string, boolean>>({});

  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    if (!formData) {
      return;
    }
    try {
      const { models, jobList, stats } = Utils.convertByType(
        formData,
        'object',
      );
      const { rows } = buildStatsTable(stats, jobList);
      const cfg = Object.fromEntries(
        models.map((m) => [m.identity, m.currentConfig]),
      );

      const parsed = rows.map((r) => ({
        ...r,
        'Hide currentConfig': cfg[r.Identity],
      }));

      setTableData(parsed);
    } catch (e) {
      console.error(e);
    }
  }, [formData]);

  // Discover columns from the first filtered row or first row
  const allColumns = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]).filter(
      (item) => !item.includes('Hide') && item !== 'config',
    );
  }, [tableData]);

  // Init visible columns (all true by default)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {},
  );

  // Initialize visible columns once when proper columns appear
  // Initialize visible columns once when proper columns appear, or when new columns are added
  useEffect(() => {
    if (allColumns.length > 0) {
      setVisibleColumns((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        allColumns.forEach((col) => {
          if (next[col] === undefined) {
            next[col] = true;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [allColumns]);

  const filteredRows = useMemo(() => {
    if (!tableData) return [];
    let r = tableData;

    // 1. Manual hide
    r = r.filter((row) => !hiddenRowIds[row.Identity || row.id]);

    // 2. Text Search
    if (filter) {
      const q = filter.toLowerCase();
      r = r.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q)),
      );
    }

    // 3. Status Filter
    if (statusFilter !== 'All') {
      r = r.filter((row) => {
        const val = String(row['Hide Status']).toLowerCase();
        if (!val) return false;
        return val === statusFilter;
      });
    }

    return r;
  }, [tableData, filter, hiddenRowIds, statusFilter]);

  const sortedRows = useMemo(() => {
    if (!orderBy) return filteredRows;
    return [...filteredRows].sort(getComparator(order, orderBy));
  }, [filteredRows, order, orderBy]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  /* ---------- Summary Calculation ---------- */
  const summary = useMemo(() => {
    const totalModels = filteredRows.length;
    let totalPnl = 0;
    let totalPositions = 0;

    filteredRows.forEach((row) => {
      totalPnl += parseNumber(row['Total PNL']);
      totalPositions += parseNumber(row['Total Positions']);
    });

    return {
      totalModels,
      totalPnl,
      totalPositions,
    };
  }, [filteredRows]);

  /* ---------- Handlers ---------- */

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleHideRow = (row: any) => {
    // Use Identity or fallback
    const id = row.Identity || JSON.stringify(row);
    setHiddenRowIds((prev) => ({ ...prev, [id]: true }));
  };

  /* ---------- Config Logic ---------- */

  const handleEditConfig = (row: any) => {
    setEditingRow(row);
    // Prefer "Hide currentConfig" as per user request, fallback to "config"
    const configData = row['Hide currentConfig'] || row.config || {};
    setConfigValues(configData['config']);
    setConfigOpen(true);
  };

  const handleOpenChart = (row: any) => {
    setChartRow(row);
    setChartOpen(true);
  };

  const handleSaveConfig = async (newValues: any) => {
    if (!editingRow || !registry) return;

    setSavingConfig(true);
    try {
      const render = Utils.buildJinjaContext(
        registry.formContext.pluginPackage,
        registry.formContext.formData,
      );

      // Construct payload
      const payload = { ...newValues };
      const identity = editingRow['Identity'];

      await render('{{ update_model_config(identity, payload) }}', {
        identity,
        payload,
      });

      // Optimistic Update: Update table data immediately
      setTableData((prev) =>
        prev.map((row) => {
          const rId = row.Identity;
          const eId = editingRow.Identity;

          if (rId === eId) {
            if (row['Hide currentConfig']) {
              return {
                ...row,
                'Hide currentConfig': {
                  ...row['Hide currentConfig'],
                  config: {
                    ...row['Hide currentConfig']['config'],
                    ...newValues,
                  },
                },
              };
            } else if (row.config) {
              return {
                ...row,
                config: {
                  ...row.config,
                  ...newValues,
                },
              };
            }
          }
          return row;
        }),
      );

      setConfigOpen(false);
      setEditingRow(null);
      alert('Update config completed');
    } catch (e) {
      console.error('Failed to update config', e);
      alert('Failed to update config: ' + (e as Error).message);
    } finally {
      setSavingConfig(false);
    }
  };

  const activeColumns = allColumns.filter((c) => visibleColumns[c]);

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total models
              </Typography>
              <Typography variant="h6">{summary.totalModels}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total PNL
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: summary.totalPnl >= 0 ? 'success.main' : 'error.main',
                }}
              >
                {summary.totalPnl >= 0 ? '+' : ''}
                {summary.totalPnl.toFixed(4)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Total Positions
              </Typography>
              <Typography variant="h6">{summary.totalPositions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
            <CardContent sx={{ pb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Equity (each model)
              </Typography>
              <Typography variant="h6">10</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          size="small"
          placeholder="Search..."
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <FilterList
                sx={{ color: 'action.active', mr: 1, fontSize: 20 }}
              />
            ),
            endAdornment: filter && (
              <IconButton size="small" onClick={() => setFilter('')}>
                <Clear fontSize="small" />
              </IconButton>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: 300 }}
        />

        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          sx={{ width: 50, flex: 1 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>

        <Box sx={{ flexGrow: 1 }} />

        {Object.keys(hiddenRowIds).length > 0 && (
          <Button size="small" onClick={() => setHiddenRowIds({})}>
            Show {Object.keys(hiddenRowIds).length} Hidden Rows
          </Button>
        )}

        <Button
          startIcon={<ViewColumn />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          variant="outlined"
          size="small"
        >
          Columns
        </Button>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Visible Columns
            </Typography>
            <Stack>
              {allColumns.map((col) => (
                <FormControlLabel
                  key={col}
                  control={
                    <Checkbox
                      size="small"
                      checked={!!visibleColumns[col]}
                      onChange={() => toggleColumn(col)}
                    />
                  }
                  label={col}
                />
              ))}
            </Stack>
          </Box>
        </Popover>
      </Stack>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ width: 40 }} padding="none" />
              {activeColumns.map((key) => (
                <TableCell key={key} sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={orderBy === key}
                    direction={orderBy === key ? order : 'asc'}
                    onClick={() => handleSort(key)}
                  >
                    {key}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedRows.map((row, index) => (
              <TableRow key={`${row.Identity || index}`} hover>
                <TableCell padding="none" align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleHideRow(row)}
                    sx={{
                      opacity: 0.3,
                      '&:hover': { opacity: 1, color: 'error.main' },
                    }}
                  >
                    <Clear fontSize="small" sx={{ fontSize: 14 }} />
                  </IconButton>
                </TableCell>
                {activeColumns.map((key) => {
                  return (
                    <TableCell key={key}>{renderCell(key, row[key])}</TableCell>
                  );
                })}
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditConfig(row)}
                    color="primary"
                    title="Edit Config"
                  >
                    <Settings fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenChart(row)}
                    color="primary"
                    title="View Equity Curve"
                  >
                    <ShowChart fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pagedRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={activeColumns.length + 2}
                  align="center"
                  sx={{ py: 3 }}
                >
                  <Typography color="text.secondary">
                    No matching records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      />
      <ConfigModal
        open={configOpen}
        onClose={() => !savingConfig && setConfigOpen(false)}
        editingRow={editingRow}
        initialValues={configValues}
        onSave={handleSaveConfig}
        saving={savingConfig}
      />
      <EquityChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        row={chartRow}
        registry={registry}
      />
    </Box>
  );
};

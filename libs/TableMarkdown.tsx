import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Box,
  Button,
  Popover,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';

type Direction = 'LONG' | 'SHORT' | 'NONE';
const COLOR_LONG = '#24fc03';
const COLOR_SHORT = '#fc0303';
const COLOR_NEUTRAL = 'text.secondary';

type Message = {
  message: string;
  model_key: string;
};

type Position = {
  symbol?: string;
  modelKey?: string;
  entryTime?: string;
  pnl?: number | null;
};

type ParsedTable = {
  header: string[];
  rows: string[][];
};

type FlatRow = {
  pred_time: Date;
  base_asset: string;
  direction: Direction;
  new_mu: number;
  is_gated: boolean;
  _identity: string;
};

type SignalCell = {
  symbol: string;
  direction: Direction;
  pnl: number;
  has_position: boolean;
  is_gated: boolean;
  new_mu: number;
  pred_hour: string;
} | null;

type OutputRow = {
  time: string;
  symbol: string;
  signals: Record<string, SignalCell>;
};

type Output = {
  columns: string[];
  rows: OutputRow[];
  message?: string;
};

/* ---------- Helpers ---------- */

function coerceFloat(value: any): number {
  if (typeof value === 'boolean') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function floorToHour(d: Date): Date {
  const copy = new Date(d);
  copy.setMinutes(0, 0, 0);
  return copy;
}

function parseUtcNoOffset(s: string) {
  return new Date(s.replace(' ', 'T') + 'Z');
}

function floorToMinuteUtc(input: string) {
  const d = new Date(input);
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

const positionsCache: Record<string, Position[]> = {};

function buildPnlMap(positions: Position[]): Map<string, number> {
  const pnlMap = new Map<string, number>();
  for (const pos of positions) {
    const symbol = pos.symbol ?? '';
    const modelKey = pos.modelKey ?? '';
    const entryTimeStr = pos.entryTime ?? '';
    const pnl = Number(pos.pnl ?? 0);
    if (!symbol || !modelKey || !entryTimeStr) continue;
    const entryTimeIso = floorToMinuteUtc(entryTimeStr);
    const key = `${symbol}|${modelKey}|${entryTimeIso}`;
    pnlMap.set(key, pnl);
  }
  return pnlMap;
}

function parseTableMessage(message: string): ParsedTable | null {
  if (!message) return null;
  const cleaned = message.trim();
  if (!cleaned) return null;
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;

  let headerIndex = -1;
  let header: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.toUpperCase().includes('PRED_TIME') ||
      line.toUpperCase().includes('BASE_ASSET')
    ) {
      const cols = line.split(/\s+/).filter(Boolean);
      if (cols.some((h) => h.toUpperCase() === 'PRED_TIME')) {
        header = cols;
        headerIndex = i;
        break;
      }
    }
  }
  if (headerIndex === -1 || header.length < 2) return null;

  let predTimeIndex = -1;
  for (let i = 0; i < header.length; i++) {
    if (header[i].toLowerCase() === 'pred_time') {
      predTimeIndex = i;
      break;
    }
  }

  const dataRows: string[][] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    let line = lines[i];
    if (!line || line.length < 3) continue;
    let cells = line.split(/\s+/).filter(Boolean);
    if (cells.length && /^\d+$/.test(cells[0])) cells = cells.slice(1);

    if (predTimeIndex >= 0 && predTimeIndex < cells.length - 1) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const timePattern = /^\d{2}:\d{2}:\d{2}$/;
      if (
        datePattern.test(cells[predTimeIndex]) &&
        timePattern.test(cells[predTimeIndex + 1])
      ) {
        cells[predTimeIndex] =
          `${cells[predTimeIndex]} ${cells[predTimeIndex + 1]}`;
        cells.splice(predTimeIndex + 1, 1);
      }
    }

    while (cells.length < header.length) cells.push('');
    cells = cells.slice(0, header.length);
    if (cells.length >= Math.min(header.length, 2)) dataRows.push(cells);
  }
  if (!dataRows.length) return null;
  return { header, rows: dataRows };
}

async function buildSignalComparison(
  pluginPackage: string,
  modelKeys: string[],
  messages: Message[],
): Promise<Output> {
  const flatRows: FlatRow[] = [];
  for (const msg of messages) {
    const parsed = parseTableMessage(msg.message);
    if (!parsed) continue;
    const { header, rows } = parsed;
    let predTimeIdx = -1,
      baseAssetIdx = -1,
      newMuIdx = -1,
      gatedFlagIdx = -1;
    header.forEach((col, i) => {
      const c = col.toLowerCase();
      if (c === 'pred_time') predTimeIdx = i;
      else if (c === 'base_asset') baseAssetIdx = i;
      else if (c === 'new_mu') newMuIdx = i;
      else if (c === 'gated_flag' || c === 'effective_gated_flag')
        gatedFlagIdx = i;
    });
    for (const row of rows) {
      if (predTimeIdx < 0 || baseAssetIdx < 0) continue;
      let predTime = row[predTimeIdx] ?? '';
      if (predTime && !predTime.includes(' ')) predTime += ' 00:00:00';
      const dt = parseUtcNoOffset(predTime);
      if (isNaN(dt.getTime())) continue;
      const baseAsset = row[baseAssetIdx] ?? '';
      const newMuStr = row[newMuIdx] ?? '';
      const gatedFlag = row[gatedFlagIdx];
      let newMu = Number(newMuStr);
      if (!Number.isFinite(newMu)) newMu = 0;
      const isGated =
        gatedFlag === '1' || gatedFlag === '1.0' || gatedFlag === 'True';
      let direction: Direction = 'NONE';
      if (newMu > 0) direction = 'LONG';
      else if (newMu < 0) direction = 'SHORT';
      flatRows.push({
        pred_time: dt,
        base_asset: baseAsset,
        direction,
        new_mu: newMu,
        is_gated: isGated,
        _identity: msg.model_key,
      });
    }
  }

  if (!flatRows.length) {
    return { columns: modelKeys, rows: [], message: 'No valid signals parsed' };
  }

  const minTime = new Date(
    Math.min(...flatRows.map((r) => r.pred_time.getTime())),
  );
  const startTime = minTime.toISOString();
  const positions =
    positionsCache[startTime] ??
    (await Utils.jinjaEvaluate(
      pluginPackage,
      '{{fetch_positions(startTime=startTime) | tojson }}',
      { startTime },
    ));
  positionsCache[startTime] = positions;

  const pnlMap = buildPnlMap(positions);

  const grouped = new Map<string, any>();
  for (const r of flatRows) {
    const key = `${r.pred_time.toISOString()}|${r.base_asset}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        pred_time: r.pred_time,
        base_asset: r.base_asset,
        signals: {},
      });
    }
    const pnlKey = `${r.base_asset}|${r._identity}|${r.pred_time.toISOString()}`;
    const pnl = coerceFloat(pnlMap.get(pnlKey));
    const hasPosition = pnlMap.has(pnlKey);
    grouped.get(key).signals[r._identity] = {
      symbol: r.base_asset,
      direction: r.direction,
      new_mu: r.new_mu,
      pnl,
      has_position: hasPosition,
      is_gated: r.is_gated,
      model: r._identity,
      pred_hour: r.pred_time.toISOString(),
    };
  }

  const sorted = Array.from(grouped.values()).sort((a, b) => {
    const timeDiff = b.pred_time.getTime() - a.pred_time.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.base_asset.localeCompare(b.base_asset);
  });

  const rowsOut: OutputRow[] = [];
  for (const r of sorted) {
    const timeStr = r.pred_time.toISOString().slice(0, 16).replace('T', ' ');
    const signals: Record<string, SignalCell> = {};
    for (const m of modelKeys) {
      signals[m] = r.signals[m] ?? null;
    }
    rowsOut.push({ time: timeStr, symbol: r.base_asset, signals });
  }

  return { columns: modelKeys, rows: rowsOut };
}

/* ---------- Memoized Cell ---------- */
const SignalCellRenderer = memo(({ cell }: { cell: SignalCell }) => {
  if (!cell) return <TableCell>—</TableCell>;

  const isLong = cell.direction === 'LONG';
  const isShort = cell.direction === 'SHORT';
  const symbolColor = isLong
    ? COLOR_LONG
    : isShort
      ? COLOR_SHORT
      : COLOR_NEUTRAL;
  const pnlColor =
    cell.pnl > 0 ? COLOR_LONG : cell.pnl < 0 ? COLOR_SHORT : COLOR_NEUTRAL;
  const arrow = isLong ? '↑' : isShort ? '↓' : '';

  return (
    <TableCell
      sx={{
        fontWeight: 700,
        textDecoration: cell.is_gated ? 'line-through' : 'none',
        opacity: cell.has_position ? 1 : 0.6,
      }}
    >
      <span style={{ color: symbolColor }}>{cell.symbol}</span>
      <span
        style={{
          color: pnlColor,
          margin: '0 6px',
          fontSize: '1.2em',
          fontWeight: 'bold',
        }}
      >
        {arrow}
      </span>
      <span style={{ color: pnlColor }}>{cell.pnl.toFixed(4)}</span>
    </TableCell>
  );
});

/* ---------- Memoized Row ---------- */
const SignalRow = memo(
  ({
    row,
    activeModels,
    showTime,
  }: {
    row: OutputRow;
    activeModels: string[];
    showTime: boolean;
  }) => (
    <TableRow hover>
      <TableCell
        sx={{
          verticalAlign: 'top',
          fontWeight: 600,
          borderRight: '1px solid rgba(224, 224, 224, 1)',
          bgcolor: showTime ? 'rgba(0,0,0,0.02)' : 'transparent',
        }}
      >
        {showTime ? row.time : ''}
      </TableCell>
      <TableCell>{row.symbol}</TableCell>
      {activeModels.map((model) => (
        <SignalCellRenderer key={model} cell={row.signals[model]} />
      ))}
    </TableRow>
  ),
);

/* ---------- Main Component ---------- */
const SignalComparisonTable = memo(function SignalComparisonTable({
  formData,
  registry,
}: ConfigFieldProps<string>) {
  const [sort, setSort] = useState<{
    order: 'asc' | 'desc';
    orderBy: 'time' | 'symbol';
  }>({
    order: 'desc',
    orderBy: 'time',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filter, setFilter] = useState('');
  const [data, setData] = useState<Output | undefined>(undefined);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    async function run() {
      if (!formData) {
        setData(undefined);
        return;
      }
      try {
        const { messages, modelKeys } = Utils.convertByType(formData, 'object');
        const result = await buildSignalComparison(
          registry.formContext.pluginPackage,
          modelKeys,
          messages,
        );
        setData(result);
      } catch {
        setData(undefined);
      }
    }
    run();
  }, [formData]);

  const rows = data?.rows ?? [];
  const models = data?.columns ?? [];

  useEffect(() => {
    if (!models.length) return;
    setVisibleColumns((prev) => {
      if (Object.keys(prev).length) return prev;
      const init: Record<string, boolean> = {};
      models.forEach((m) => (init[m] = true));
      return init;
    });
  }, [models]);

  const activeModels = useMemo(
    () => models.filter((m) => visibleColumns[m] ?? true),
    [models, visibleColumns],
  );

  const toggleColumn = useCallback((col: string) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  }, []);

  const handleRequestSort = useCallback((property: 'time' | 'symbol') => {
    setSort((prev) => ({
      orderBy: property,
      order:
        prev.orderBy === property
          ? prev.order === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    }));
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows.length) return [];
    const q = filter.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.time.toLowerCase().includes(q) || r.symbol.toLowerCase().includes(q),
    );
  }, [rows, filter]);

  const sortedRows = useMemo(() => {
    return Utils._.orderBy(filteredRows, [sort.orderBy], [sort.order]);
  }, [filteredRows, sort]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const handlePageChange = useCallback(
    (_: unknown, newPage: number) => setPage(newPage),
    [],
  );
  const handleRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(0);
    },
    [],
  );

  if (!data) return null;

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
        <Button
          startIcon={<AppIcon.ViewColumn />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 120 }}
        >
          Columns ({activeModels.length})
        </Button>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
            <Box sx={{ mb: 1, fontWeight: 600 }}>Visible Columns</Box>
            <Stack>
              {models.map((col) => (
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

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sort.orderBy === 'time'}
                  direction={sort.order}
                  onClick={() => handleRequestSort('time')}
                >
                  Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sort.orderBy === 'symbol'}
                  direction={sort.order}
                  onClick={() => handleRequestSort('symbol')}
                >
                  Symbol
                </TableSortLabel>
              </TableCell>
              {activeModels.map((model) => (
                <TableCell key={model}>{model}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((row, i) => {
              const prevTime = pagedRows[i - 1]?.time;
              const showTime = i === 0 || prevTime !== row.time;
              return (
                <SignalRow
                  key={`${row.time}-${row.symbol}-${page * rowsPerPage + i}`}
                  row={row}
                  activeModels={activeModels}
                  showTime={showTime}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </>
  );
});

export default SignalComparisonTable;

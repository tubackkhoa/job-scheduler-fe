import { useEffect, useMemo, useState } from 'react';
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
import { ViewColumn } from '@mui/icons-material';

type Direction = 'LONG' | 'SHORT' | 'NONE';

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

type Order = 'asc' | 'desc';

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

function parseUtcNoOffset(s) {
  // "2026-02-04 06:00:00" -> "2026-02-04T06:00:00Z"
  return new Date(s.replace(' ', 'T') + 'Z');
}
function floorToMinuteUtc(input) {
  const d = new Date(input);

  d.setUTCSeconds(0, 0); // set giây = 0, ms = 0 (UTC)
  return d.toISOString();
}

const positionsCache = {};

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

  // --------------------------------------------------
  // Find header line
  // --------------------------------------------------
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

  if (headerIndex === -1 || header.length < 2) {
    return null;
  }

  // Find pred_time column index
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

    // Remove leading numeric index (e.g. "1 BTC ...")
    if (cells.length && /^\d+$/.test(cells[0])) {
      cells = cells.slice(1);
    }

    // Merge date + time into pred_time
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

    // Pad cells to header length
    while (cells.length < header.length) {
      cells.push('');
    }

    // Truncate extra cells
    cells = cells.slice(0, header.length);

    if (cells.length >= Math.min(header.length, 2)) {
      dataRows.push(cells);
    }
  }

  if (!dataRows.length) return null;

  return {
    header,
    rows: dataRows,
  };
}

async function buildSignalComparison(
  pluginPackage: string,
  modelKeys: string[],
  messages: Message[],
): Promise<Output> {
  /* -------------------------------------------------- */
  /* 1. Parse messages into flat rows                    */
  /* -------------------------------------------------- */

  const flatRows: FlatRow[] = [];

  for (const msg of messages) {
    const parsed = parseTableMessage(msg.message);
    if (!parsed) continue;

    const { header, rows } = parsed;

    let predTimeIdx = -1;
    let baseAssetIdx = -1;
    let newMuIdx = -1;
    let gatedFlagIdx = -1;

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
      if (predTime && !predTime.includes(' ')) {
        predTime += ' 00:00:00';
      }

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
    return {
      columns: modelKeys,
      rows: [],
      message: 'No valid signals parsed',
    };
  }

  /* -------------------------------------------------- */
  /* 2. Fetch PNL                                       */
  /* -------------------------------------------------- */

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
    // Key by Time + Symbol so we create a row for every symbol at every time
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

  /* -------------------------------------------------- */
  /* 4. Build final rows                                */
  /* -------------------------------------------------- */

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

    rowsOut.push({
      time: timeStr,
      symbol: r.base_asset,
      signals,
    });
  }

  return {
    columns: modelKeys,
    rows: rowsOut,
  };
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator<Key extends keyof any>(order: Order, orderBy: Key) {
  return order === 'desc'
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

/* ---------- Component ---------- */

export default function SignalComparisonTable({
  formData,
  registry,
}: ConfigFieldProps<string>) {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<'time' | 'symbol'>('time');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filter, setFilter] = useState('');
  const [data, setData] = useState<Output | undefined>(undefined);

  // Column Visibility
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
      } catch (err) {
        setData(undefined);
      }
    }

    run();
  }, [formData]);

  const rows = data?.rows;
  const models = data?.columns ?? [];

  // Init visible columns
  useEffect(() => {
    if (models.length > 0) {
      setVisibleColumns((prev) => {
        const next = { ...prev };
        let hasChanges = false;
        models.forEach((col) => {
          if (next[col] === undefined) {
            next[col] = true;
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });
    }
  }, [models]);

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const activeModels = models.filter((m) => visibleColumns[m]);

  /* ---------- Sorting ---------- */

  const handleRequestSort = (property: 'time' | 'symbol') => {
    setOrder((prevOrder) => {
      const isSameColumn = orderBy === property;
      if (isSameColumn) {
        return prevOrder === 'asc' ? 'desc' : 'asc';
      }
      return 'asc';
    });
    setOrderBy(property);
  };

  /* ---------- Filtering ---------- */

  const filteredRows = useMemo(() => {
    if (!rows) return;

    const q = filter.toLowerCase();

    return rows.filter((r) =>
      [r.symbol, r.time]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [rows, filter]);

  /* ---------- Sorting ---------- */

  const sortedRows = useMemo(() => {
    if (!filteredRows) return;
    return [...filteredRows].sort(getComparator(order, orderBy));
  }, [filteredRows, order, orderBy]);

  /* ---------- Paging ---------- */

  const pagedRows = useMemo(() => {
    if (!sortedRows) return;
    const start = page * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  if (!pagedRows || !data) return null;

  return (
    <>
      {/* 🔍 Filter & Columns */}
      <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
        <Button
          startIcon={<ViewColumn />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 120 }}
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
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'time'}
                  direction={order}
                  onClick={() => handleRequestSort('time')}
                >
                  Time
                </TableSortLabel>
              </TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === 'symbol'}
                  direction={order}
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
              // Determine if this is the first row in a time group
              const isFirstInGroup =
                i === 0 || pagedRows[i - 1].time !== row.time;

              // Count how many consecutive rows share the same time
              let rowSpan = 1;
              if (isFirstInGroup && row.time) {
                let j = i + 1;
                while (j < pagedRows.length && pagedRows[j].time === row.time) {
                  rowSpan++;
                  j++;
                }
              }

              return (
                <TableRow key={`${row.time}-${row.symbol}-${i}`} hover>
                  {/* Only render Time cell if this is the first row in the group */}
                  {isFirstInGroup && row.time && (
                    <TableCell
                      sortDirection={false}
                      rowSpan={rowSpan}
                      sx={{
                        verticalAlign: 'top',
                        fontWeight: 600,
                        borderRight: '1px solid rgba(224, 224, 224, 1)',
                        bgcolor: 'rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      {row.time}
                    </TableCell>
                  )}

                  {/* If time is empty (merged), don't render anything */}
                  {!row.time && !isFirstInGroup && null}

                  <TableCell sortDirection={false}>{row.symbol}</TableCell>

                  {activeModels.map((model) => {
                    const cell = row.signals[model];

                    if (!cell) {
                      return <TableCell key={model}>—</TableCell>;
                    }

                    const isLong = cell.direction === 'LONG';
                    const isShort = cell.direction === 'SHORT';

                    const symbolColor = isLong
                      ? '#24fc03'
                      : isShort
                        ? '#fc0303'
                        : 'text.secondary';

                    const pnlVal = cell.pnl;
                    const isProfit = pnlVal > 0;
                    const isLoss = pnlVal < 0;
                    const pnlColor = isProfit
                      ? '#24fc03'
                      : isLoss
                        ? '#fc0303'
                        : 'text.secondary';

                    return (
                      <TableCell
                        key={model}
                        sx={{
                          fontWeight: 700,
                          textDecoration: cell.is_gated
                            ? 'line-through'
                            : 'none',
                          opacity: cell.has_position ? 1 : 0.6,
                        }}
                      >
                        <Box component="span" sx={{ color: symbolColor }}>
                          {cell.symbol}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            color: pnlColor,
                            mx: 0.5,
                            fontSize: '1.2em',
                            fontWeight: 'bold',
                          }}
                        >
                          {isLong ? '↑' : isShort ? '↓' : ''}
                        </Box>
                        <Box component="span" sx={{ color: pnlColor }}>
                          {cell.pnl.toFixed(4)}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedRows?.length ?? 0}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      />
    </>
  );
}

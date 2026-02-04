import { FieldProps } from '@rjsf/utils';
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
  TextField,
  Chip,
} from '@mui/material';

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

const positionsCache = {};
async function fetchPositions(
  baseUrl: string,
  apiKey: string,
  startTime?: string,
): Promise<Position[]> {
  const url = new URL(`${baseUrl}/api/test-system/models/positions`);

  if (startTime) {
    url.searchParams.set('startTime', startTime);
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'test-system-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`fetchPositions failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return Array.isArray(data?.positions) ? data.positions : [];
}

function buildPnlMap(positions: Position[]): Map<string, number> {
  const pnlMap = new Map<string, number>();

  for (const pos of positions) {
    const symbol = pos.symbol ?? '';
    const modelKey = pos.modelKey ?? '';
    const entryTimeStr = pos.entryTime ?? '';
    const pnl = Number(pos.pnl ?? 0);

    if (!symbol || !modelKey || !entryTimeStr) continue;

    const entryTime = new Date(entryTimeStr);
    if (isNaN(entryTime.getTime())) continue;

    // Floor to hour (UTC-safe)
    const entryHour = floorToHour(entryTime);

    // Python removes timezone before isoformat()
    const entryHourIso = entryHour.toISOString().replace('Z', '');

    const key = `${symbol}|${modelKey}|${entryHourIso}`;

    pnlMap.set(key, pnl);
  }

  return pnlMap;
}

function parseTableMessage(message: string): ParsedTable | null {
  if (!message) return null;

  const cleaned = message.trim();
  if (!cleaned) return null;

  // Split lines, trim, remove empty
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

  // --------------------------------------------------
  // Parse data rows
  // --------------------------------------------------
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
  baseUrl: string,
  apiKey: string,
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

      const dt = new Date(predTime);
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
  const startTimeIso = minTime.toISOString();

  const positions =
    positionsCache[startTimeIso] ??
    (await fetchPositions(baseUrl, apiKey, startTimeIso));
  positionsCache[startTimeIso] = positions;

  const pnlMap = buildPnlMap(positions);

  /* -------------------------------------------------- */
  /* 3. Build signal payloads                           */
  /* -------------------------------------------------- */

  const grouped = new Map<string, any>();

  for (const r of flatRows) {
    const hour = floorToHour(r.pred_time).toISOString();
    const key = `${r.pred_time.toISOString()}|${r.base_asset}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        pred_time: r.pred_time,
        base_asset: r.base_asset,
        signals: {},
      });
    }

    const pnlKey = `${r.base_asset}|${r._identity}|${hour}`;
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
      pred_hour: hour,
    };
  }

  /* -------------------------------------------------- */
  /* 4. Build final rows                                */
  /* -------------------------------------------------- */

  const sorted = Array.from(grouped.values()).sort(
    (a, b) => b.pred_time - a.pred_time,
  );

  let lastTime = '';
  const rowsOut: OutputRow[] = [];

  for (const r of sorted) {
    const timeStr = r.pred_time.toISOString().slice(0, 16).replace('T', ' ');

    const displayTime = timeStr === lastTime ? '' : timeStr;
    lastTime = timeStr;

    const signals: Record<string, SignalCell> = {};

    for (const m of modelKeys) {
      signals[m] = r.signals[m] ?? null;
    }

    rowsOut.push({
      time: displayTime,
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
}: FieldProps<string>) {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<'time' | 'symbol'>('time');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filter, setFilter] = useState('');
  const [data, setData] = useState<Output | undefined>(undefined);

  useEffect(() => {
    async function run() {
      if (!formData) {
        setData(undefined);
        return;
      }

      try {
        const { messages, modelKeys } = Utils.convertByType(formData, 'object');

        const { webhook_url, webhook_api_key } = registry.formContext.formData;

        const result = await buildSignalComparison(
          webhook_url,
          webhook_api_key,
          modelKeys,
          messages,
        );

        setData(result);
      } catch (err) {
        setData(undefined);
      }
    }

    run();
  }, [formData, registry.formContext.formData]);

  console.log(data);

  const rows = data?.rows;
  const models = data?.columns ?? [];

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
      {/* 🔍 Filter */}
      <Box mb={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter by time or symbol…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'time'}
                  direction={order}
                  onClick={() => setOrderBy('time')}
                >
                  Time
                </TableSortLabel>
              </TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === 'symbol'}
                  direction={order}
                  onClick={() => setOrderBy('symbol')}
                >
                  Symbol
                </TableSortLabel>
              </TableCell>

              {models.map((model) => (
                <TableCell key={model}>{model}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedRows.map((row, i) => (
              <TableRow key={`${row.time}-${row.symbol}-${i}`} hover>
                <TableCell>{row.time}</TableCell>
                <TableCell>{row.symbol}</TableCell>

                {models.map((model) => {
                  const cell = row.signals[model];

                  if (!cell) {
                    return <TableCell key={model}>—</TableCell>;
                  }

                  const color =
                    cell.direction === 'LONG'
                      ? 'success.main'
                      : cell.direction === 'SHORT'
                        ? 'error.main'
                        : 'text.secondary';

                  return (
                    <TableCell
                      key={model}
                      sx={{
                        color,
                        fontWeight: 600,
                        textDecoration: cell.is_gated ? 'line-through' : 'none',
                        opacity: cell.has_position ? 1 : 0.6,
                      }}
                    >
                      {cell.symbol}
                      <Chip
                        size="small"
                        label={cell.direction}
                        color={
                          cell.direction === 'LONG'
                            ? 'success'
                            : cell.direction === 'SHORT'
                              ? 'error'
                              : 'default'
                        }
                        sx={{ mx: 0.5 }}
                      />
                      {cell.pnl.toFixed(4)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
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

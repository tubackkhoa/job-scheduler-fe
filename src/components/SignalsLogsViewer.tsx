import { useEffect, useState, useCallback, useMemo, Fragment } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  SxProps,
  Theme,
} from '@mui/material';
import api from '@/api';
import { formatMessage, transformSignals } from '@/utils';
import { LoadingSkeleton } from './Loading';
import _ from 'lodash';

/* -------------------------------- Utilities -------------------------------- */

type ParsedTable = {
  header: string[];
  rows: Record<string, string>[];
};

const extractRowsFromMessage = (message: string): ParsedTable | null => {
  if (!message) return null;

  let cleaned = message.trim();
  cleaned = cleaned.replace(
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+\[.*?\]\s+/,
    '',
  );

  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const header = lines[0].split(/\s+/).filter(Boolean);
  if (header.length < 2) return null;

  const predTimeIndex = header.findIndex(
    (c) => c.toLowerCase() === 'pred_time',
  );

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    let cells = lines[i].split(/\s+/).filter(Boolean);

    if (/^\d+$/.test(cells[0])) cells = cells.slice(1);

    if (predTimeIndex >= 0 && predTimeIndex < cells.length - 1) {
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(cells[predTimeIndex]);
      const isTime = /^\d{2}:\d{2}:\d{2}$/.test(cells[predTimeIndex + 1]);

      if (isDate && isTime) {
        cells[predTimeIndex] =
          cells[predTimeIndex] + ' ' + cells[predTimeIndex + 1];
        cells.splice(predTimeIndex + 1, 1);
      }
    }

    while (cells.length < header.length) cells.push('');
    cells = cells.slice(0, header.length);

    const rowObj: Record<string, string> = {};
    header.forEach((h, idx) => {
      rowObj[h] = cells[idx] ?? '';
    });

    rows.push(rowObj);
  }

  return { header, rows };
};

/* ------------------------------ Main Viewer ------------------------------ */

export default function SignalsLogsViewer({
  jobId = 0,
  description,
  setError,
  signals: providedSignals,
  hideHeader = false,
  hideFilter = false,
  sx,
}: {
  limit?: number;
  keyword?: string;
  jobId?: number;
  description?: string;
  setError?: (msg: string) => void;
  signals?: any[];
  hideHeader?: boolean;
  hideFilter?: boolean;
  sx?: SxProps<Theme>;
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Native datetime-local filter values
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const derivedGroups = useMemo(() => {
    if (providedSignals?.length) {
      return transformSignals(providedSignals);
    }
    return null;
  }, [providedSignals]);

  const fetchSignals = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const data = await api.getSignals({ jobId });
      setGroups(transformSignals(data.signals || []));
    } catch (e: any) {
      console.error('Failed to fetch signals:', e);
      setError?.(e?.message || 'Failed to fetch signals');
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, setError]);

  useEffect(() => {
    if (derivedGroups) {
      setGroups(derivedGroups);
    } else if (jobId) {
      fetchSignals();
    }
  }, [derivedGroups, jobId, fetchSignals]);

  /* -------- Merge all messages -> extract rows -> group by pred_time ------- */

  const groupedTable = useMemo(() => {
    const allRows: Record<string, string>[] = [];
    let header: string[] = [];

    const processMessage = (msg?: string) => {
      if (!msg) return;
      const parsed = extractRowsFromMessage(formatMessage(msg));
      if (!parsed) return;

      if (!header.length) header = parsed.header;
      allRows.push(...parsed.rows);
    };

    groups.forEach((g) => {
      processMessage(g.matched_entry?.message);
      g.following_entries?.forEach((f: any) => processMessage(f.message));
    });

    if (!allRows.length || !header.length) return null;

    const map = new Map<string, Record<string, string>[]>();

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    allRows.forEach((row) => {
      const pred = row.pred_time;
      if (!pred) return;

      const predDate = new Date(pred.replace(' ', 'T'));

      if (from && predDate < from) return;
      if (to && predDate > to) return;

      const key = pred;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });

    if (map.size === 0) return null;

    return { header, map };
  }, [groups, fromDate, toDate]);

  const columns = useMemo(() => {
    if (!groupedTable) return [];
    return groupedTable.header.filter((h) => h !== 'pred_time');
  }, [groupedTable]);

  const totalColumns = columns.length;

  /* -------------------------------- Render -------------------------------- */

  return (
    <Stack spacing={2}>
      {!hideHeader && (
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            <AppIcon.SignalCellularAlt fontSize="small" />
            <Typography variant="body2">
              Signals Logs for {description}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Refresh signals">
              <IconButton
                onClick={fetchSignals}
                size="small"
                disabled={isLoading || !!providedSignals}
              >
                <AppIcon.Refresh fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Clear signals">
              <IconButton
                onClick={async () => {
                  if (providedSignals) return;
                  try {
                    await api.clearLogs(jobId);
                  } catch (e) {
                    console.error('Failed to clear signals:', e);
                  } finally {
                    setGroups([]);
                  }
                }}
                size="small"
                disabled={!!providedSignals}
              >
                <AppIcon.Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      )}

      <Box
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          flex: 1,
          ...sx,
        }}
      >
        {/* Native date-time filters */}
        {!hideFilter && (
          <Stack direction="row" gap={1}>
            <TextField
              label="From"
              type="datetime-local"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="To"
              type="datetime-local"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Tooltip title="Clear filter">
              <IconButton
                disableRipple
                size="small"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
              >
                <AppIcon.Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : !groupedTable ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
            }}
          >
            No tabular signals found
          </Box>
        ) : (
          <TableContainer sx={{ overflow: 'auto', maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 800 }}>
                      {_.startCase(col)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {[...groupedTable.map.entries()].map(([predTime, rows]) => (
                  <Fragment key={predTime}>
                    <TableRow>
                      <TableCell
                        colSpan={totalColumns}
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {predTime} ({rows.length})
                      </TableCell>
                    </TableRow>

                    {rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map((col) => {
                          const val = row[col] || '-';
                          const isNumeric = Number.isFinite(Number(val));

                          return (
                            <TableCell
                              key={col}
                              sx={{
                                color: isNumeric
                                  ? 'text.primary'
                                  : 'text.secondary',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {val}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
}

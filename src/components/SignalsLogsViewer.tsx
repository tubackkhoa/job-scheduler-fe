import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress,
  List,
  ListItem,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { SignalCellularAlt, Delete, Refresh } from '@mui/icons-material';
import api from '@/api';
import { formatMessage, getLevelColor, transformSignals } from '@/utils';

/* -------------------------------- Utilities -------------------------------- */

const parseTableMessage = (message) => {
  if (!message) return null;

  let cleanedMessage = message.trim();
  cleanedMessage = cleanedMessage.replace(
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+\[.*?\]\s+/,
    ''
  );

  const lines = cleanedMessage
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);
  if (lines.length < 2) return null;

  const header = lines[0].split(/\s+/).filter((h) => h.length > 0);
  if (header.length < 2) return null;

  // Find pred_time column index
  const predTimeIndex = header.findIndex(
    (col) => col.toLowerCase() === 'pred_time'
  );

  const dataRows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.length < 3) continue;

    let cells = line.split(/\s+/).filter((c) => c.length > 0);

    // Remove index if present (first column is a number)
    if (cells.length > 0 && /^\d+$/.test(cells[0])) {
      cells = cells.slice(1);
    }

    // Merge date and time for pred_time column if needed
    if (predTimeIndex >= 0 && predTimeIndex < cells.length - 1) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const timePattern = /^\d{2}:\d{2}:\d{2}$/;

      // Check if current cell is a date and next cell is a time
      if (
        datePattern.test(cells[predTimeIndex]) &&
        timePattern.test(cells[predTimeIndex + 1])
      ) {
        // Merge date and time: "2026-01-02 09:00:00"
        cells[predTimeIndex] = `${cells[predTimeIndex]} ${
          cells[predTimeIndex + 1]
        }`;
        // Remove the time cell
        cells.splice(predTimeIndex + 1, 1);
      }
    }

    // Pad or trim to match header length
    while (cells.length < header.length) {
      cells.push('');
    }
    cells = cells.slice(0, header.length);

    if (cells.length >= Math.min(header.length, 2)) {
      dataRows.push(cells);
    }
  }

  if (dataRows.length === 0) return null;

  return { header, rows: dataRows };
};

// Component to render table message beautifully
const TableMessage = ({ message }) => {
  const tableData = parseTableMessage(message);

  if (!tableData) {
    // Not a table, render as plain text with horizontal scroll
    return (
      <Box
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          maxWidth: '100%'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            whiteSpace: 'pre',
            fontSize: '0.75rem',
            minWidth: 'max-content'
          }}
        >
          {formatMessage(message)}
        </Typography>
      </Box>
    );
  }

  const { header, rows } = tableData;

  return (
    <TableContainer
      component={Box}
      sx={{
        bgcolor: 'rgba(0, 0, 0, 0.3)',
        maxHeight: 500,
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        borderRadius: 1,
        border: '1px solid rgba(255, 193, 7, 0.2)',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px'
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'rgba(0, 0, 0, 0.2)'
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(255, 193, 7, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            bgcolor: 'rgba(255, 193, 7, 0.5)'
          }
        }
      }}
    >
      <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            {header.map((col, idx) => (
              <TableCell
                key={idx}
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(255, 193, 7, 0.25)',
                  color: 'warning.light',
                  borderBottom: '2px solid rgba(255, 193, 7, 0.4)',
                  whiteSpace: 'nowrap',
                  px: 1.5,
                  py: 1,
                  textTransform: 'uppercase'
                }}
              >
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIdx) => (
            <TableRow
              key={rowIdx}
              sx={{
                '&:nth-of-type(even)': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)'
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 193, 7, 0.15)'
                },
                transition: 'background-color 0.2s'
              }}
            >
              {header.map((_, colIdx) => {
                const cellValue = row[colIdx] || '-';
                const isNumeric =
                  !isNaN(parseFloat(cellValue)) && isFinite(cellValue);
                const isNone = cellValue === 'None' || cellValue === 'none';

                return (
                  <TableCell
                    key={colIdx}
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.7rem',
                      color: isNone
                        ? 'text.disabled'
                        : isNumeric
                          ? 'primary.light'
                          : 'text.secondary',
                      py: 0.75,
                      px: 1.5,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cellValue}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* ------------------------------ Signal Group Row --------------------------- */

const SignalGroupRow = ({ group }: { group: ResultGroup }) => {
  return (
    <Box>
      <ListItem
        disableGutters
        sx={{
          py: 1,
          px: 0,
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        {/* Matched Entry */}
        <Paper
          sx={{
            bgcolor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            p: 1.5,
            mb: 1
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Chip
              label="MATCHED"
              size="small"
              color="warning"
              sx={{ fontWeight: 600, minWidth: 80 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  display: 'block',
                  mb: 0.5
                }}
              >
                {group.matched_entry.timestamp}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: getLevelColor(group.matched_entry.level),
                  display: 'block',
                  mb: 0.5
                }}
              >
                [{group.matched_entry.level}]
              </Typography>
              <TableMessage
                message={formatMessage(group.matched_entry.message)}
              />
            </Box>
          </Stack>
        </Paper>

        {/* Following Entries - Each with horizontal scroll */}
        {group.following_entries && group.following_entries.length > 0 && (
          <Box
            sx={{
              pl: 2,
              borderLeft: '2px solid rgba(255, 193, 7, 0.3)',
              mt: 0.5
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                mb: 0.5,
                display: 'block',
                fontSize: '0.7rem'
              }}
            >
              Following ({group.following_entries.length}):
            </Typography>
            <Stack spacing={0.5}>
              {group.following_entries.map((item, idx) => (
                <Box
                  key={item.id || idx}
                  sx={{
                    p: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 1,
                    maxWidth: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    '&::-webkit-scrollbar': {
                      height: '6px'
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'rgba(0, 0, 0, 0.2)'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(255, 193, 7, 0.3)',
                      borderRadius: '3px',
                      '&:hover': {
                        bgcolor: 'rgba(255, 193, 7, 0.5)'
                      }
                    }
                  }}
                >
                  <TableMessage message={formatMessage(item.message)} />
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </ListItem>
      <Divider sx={{ my: 1 }} />
    </Box>
  );
};

export default function SignalsLogsViewer({
  jobId = 0,
  description,
  setError,
  keyword,
  limit = 2,
  signals: providedSignals,
  hideHeader = false,
  sx
}: {
  jobId?: number;
  description?: string;
  keyword?: string;
  limit?: number;
  setError?: (msg: string) => void;
  signals?: any[]; // Signal[]
  hideHeader?: boolean;
  sx?: any;
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ... refs ...
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -------------------------- Fetch Signals -------------------------- */

  const fetchSignals = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    try {
      const data = await api.getSignals({ jobId });
      const transformedGroups = transformSignals(data.signals || []);
      setGroups(transformedGroups);
    } catch (e) {
      console.error('Failed to fetch signals:', e);
      if (setError) setError(e.message);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  /* ------------------------------ Load ---------------------------------- */

  useEffect(() => {
    if (providedSignals && providedSignals.length > 0) {
      setGroups(transformSignals(providedSignals as any[]));
    } else if (jobId) {
      fetchSignals();
    }
  }, [jobId, fetchSignals, providedSignals]);

  /* ---------------------------- Filtering ------------------------------- */

  /* ----------------------------- Render -------------------------------- */

  return (
    <Stack spacing={2} sx={{ height: 'auto' }}>
      {/* Header */}
      {!hideHeader && (
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            <SignalCellularAlt fontSize="small" />
            <Typography variant="body2">
              Signals Logs for {description}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Refresh signals">
              <span>
                <IconButton
                  onClick={() => {
                    // Cancel any pending debounce and force reload
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current as any);
                      debounceRef.current = null;
                    }
                    fetchSignals();
                  }}
                  size="small"
                  disabled={isLoading || !!providedSignals} // Disable refresh if using external signals
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Clear signals">
              <IconButton
                onClick={async () => {
                  if (providedSignals) return; // Can't clear external props
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
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      )}

      {/* Signals Container */}
      <Paper
        sx={{
          height: '600px',
          overflow: 'auto',
          bgcolor: 'rgba(0,0,0,0.4)',
          fontFamily: '"JetBrains Mono", monospace',
          p: 1,
          flex: 1,
          ...sx
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : groups.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          ></Box>
        ) : (
          <List disablePadding>
            {groups.map((group, idx) => (
              <SignalGroupRow key={group.offset || idx} group={group} />
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
}

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo
} from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  TextField,
  CircularProgress,
  Slider,
  List,
  ListItem
} from '@mui/material';
import { Terminal, Delete, Search, Refresh } from '@mui/icons-material';
import { API_BASE_URL } from './api';
import { formatMessage, getLevelColor } from './utils';

/* -------------------------------- Utilities -------------------------------- */

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMessage = (text, search) => {
  if (!search || !text) return text;
  const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <mark key={i} style={{ backgroundColor: 'rgba(255,255,0,0.3)' }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
};

/* ------------------------------ Log Row ------------------------------------ */

const LogRow = function LogRow({ log, searchText }) {
  return (
    <ListItem
      disableGutters
      sx={{
        py: 0.2,
        px: 0,
        fontFamily: '"JetBrains Mono", monospace'
      }}
    >
      <Stack direction="row" spacing={2}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ minWidth: 140, fontFamily: 'inherit' }}
        >
          {log.time || ''}
        </Typography>

        <Typography
          variant="caption"
          sx={{
            minWidth: 80,
            fontFamily: 'inherit',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: getLevelColor(log.level)
          }}
        >
          [{log.level}]
        </Typography>

        <Box
          sx={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            '&::-webkit-scrollbar': {
              height: '4px'
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'rgba(0, 0, 0, 0.2)'
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)'
              }
            }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'inherit',
              opacity: 0.9,
              whiteSpace: 'pre',
              minWidth: 'max-content'
            }}
          >
            {highlightMessage(formatMessage(log.message), searchText)}
          </Typography>
        </Box>
      </Stack>
    </ListItem>
  );
};

/* ------------------------------ Main ---------------------------------------- */

export default function LogViewer({
  jobId,
  maxMessages: _maxMessages = 1500,
  description
}) {
  const [logs, setLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sliderOffset, setSliderOffset] = useState(0);

  const _ws = useRef(null);
  const _logIdRef = useRef(0);
  const debounceRef = useRef(null);
  const totalLogRef = useRef(0);
  const _reconnectTimeoutRef = useRef(null);

  // useEffect(() => {
  //   maxMessagesRef.current = maxMessages;
  // }, [maxMessages]);

  /* -------------------------- Fetch Historical -------------------------- */

  const fetchHistoricalLogs = useCallback(
    async (searchText, limit = 100) => {
      if (!jobId) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchText) params.append('search', searchText);
        params.append('limit', limit);
        params.append('sort', 'desc');

        const res = await fetch(`${API_BASE_URL}/api/logs/${jobId}?${params}`);
        const data = await res.json();

        totalLogRef.current = data.total;

        setLogs(
          data.logs
            .map((log) => ({
              id: log.offset,
              offset: log.offset,
              time: log.timestamp,
              level: log.level,
              message: log.message
            }))
            .sort((a, b) => a.offset - b.offset)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [jobId]
  );

  /* ------------------------------ Load ---------------------------------- */

  useEffect(() => {
    if (!jobId) return;
    fetchHistoricalLogs(null, 500);
  }, [jobId, fetchHistoricalLogs]);

  /* ---------------------------- WebSocket ------------------------------- */

  // useEffect(() => {
  //   if (!jobId) return;

  //   let isActive = true;

  //   const connect = () => {
  //     if (!isActive) return;

  //     const url = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/logs/${jobId}`;
  //     const socket = new WebSocket(url);
  //     ws.current = socket;

  //     socket.onmessage = (e) => {
  //       const data = JSON.parse(e.data);
  //       const items = Array.isArray(data) ? data : [data];

  //       setLogs((prev) => {
  //         const next = [
  //           ...prev,
  //           ...items.map((item) => ({
  //             ...item,
  //             id: logIdRef.current++,
  //           })),
  //         ];
  //         // Keep only the last maxMessages items
  //         return next.slice(-maxMessages);
  //       });
  //     };

  //     const scheduleReconnect = () => {
  //       if (!isActive) return;
  //       if (reconnectTimeoutRef.current) {
  //         clearTimeout(reconnectTimeoutRef.current);
  //       }
  //       // simple fixed-delay reconnect; can be replaced with exponential backoff if needed
  //       reconnectTimeoutRef.current = setTimeout(() => {
  //         connect();
  //       }, 2000);
  //     };

  //     socket.onclose = scheduleReconnect;
  //     socket.onerror = () => {
  //       // close triggers onclose -> scheduleReconnect
  //       socket.close();
  //     };
  //   };

  //   connect();

  //   return () => {
  //     isActive = false;

  //     if (reconnectTimeoutRef.current) {
  //       clearTimeout(reconnectTimeoutRef.current);
  //       reconnectTimeoutRef.current = null;
  //     }

  //     if (ws.current && ws.current.readyState === WebSocket.OPEN) {
  //       ws.current.close();
  //     }
  //   };
  // }, [jobId, maxMessages]);

  /* ---------------------------- Filtering ------------------------------- */

  const filteredLogs = useMemo(() => {
    if (!searchText) return logs;
    const s = searchText.toLowerCase();
    return logs.filter(
      (l) =>
        l.message?.toLowerCase().includes(s) ||
        l.level?.toLowerCase().includes(s)
    );
  }, [logs, searchText]);

  /* ----------------------------- Render -------------------------------- */

  return (
    <Stack spacing={2} sx={{ height: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1}>
          <Terminal fontSize="small" />
          <Typography variant="body2">Logs for {description}</Typography>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Refresh logs">
            <IconButton
              onClick={() => {
                // Cancel any pending debounce and force reload
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                  debounceRef.current = null;
                }
                debounceRef.current = setTimeout(() => {
                  fetchHistoricalLogs(
                    searchText || null,
                    sliderOffset > 500 ? sliderOffset : 500
                  );
                }, 500);
              }}
              size="small"
              disabled={isLoading}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear logs">
            <IconButton
              onClick={async () => {
                try {
                  await fetch(`${API_BASE_URL}/api/logs/${jobId}/clear`, {
                    method: 'POST'
                  });
                } catch (e) {
                  console.error('Failed to clear logs:', e);
                } finally {
                  setLogs([]);
                }
              }}
              size="small"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search logs..."
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            fetchHistoricalLogs(
              e.target.value || null,
              sliderOffset > 500 ? sliderOffset : 500
            );
          }, 500);
        }}
        InputProps={{
          startAdornment: <Search fontSize="small" sx={{ mr: 1 }} />
        }}
      />

      {/* Slider (commit-only = no jank) */}
      <Slider
        value={sliderOffset}
        min={0}
        max={Math.max(0, totalLogRef.current - 1)}
        onChangeCommitted={(_, v) => {
          setSliderOffset(v);
          fetchHistoricalLogs(searchText, v > 500 ? v : 500);
        }}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `Latest-${v}`}
      />

      <Paper
        sx={{
          height: '600px',
          overflow: 'auto',
          bgcolor: 'rgba(0,0,0,0.4)',
          fontFamily: '"JetBrains Mono", monospace',
          p: 1,
          flex: 1
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
        ) : filteredLogs.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2">No logs</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredLogs.map((log) => (
              <LogRow key={log.id} log={log} searchText={searchText} />
            ))}
          </List>
        )}
      </Paper>

      {/* Refresh Button at Bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
        <Tooltip title="Refresh logs">
          <IconButton
            onClick={() => {
              // Cancel any pending debounce and force reload
              if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
              }
              fetchHistoricalLogs(searchText || null, 500, sliderOffset || 0);
            }}
            size="small"
            disabled={isLoading}
            sx={{
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(99, 102, 241, 0.2)'
              }
            }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Stack>
  );
}

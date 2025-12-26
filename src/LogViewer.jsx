import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
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
  ListItem,
} from '@mui/material';
import { Terminal, Delete, Search } from '@mui/icons-material';
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

const LogRow = React.memo(function LogRow({ log, searchText }) {
  return (
    <ListItem
      disableGutters
      sx={{
        py: 0.25,
        px: 0,
        fontFamily: '"JetBrains Mono", monospace',
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
            color: getLevelColor(log.level),
          }}
        >
          [{log.level}]
        </Typography>

        <Typography
          variant="caption"
          sx={{ fontFamily: 'inherit', opacity: 0.9, whiteSpace: 'pre-wrap' }}
        >
          {highlightMessage(formatMessage(log.message), searchText)}
        </Typography>
      </Stack>
    </ListItem>
  );
});

/* ------------------------------ Main ---------------------------------------- */

export default function LogViewer({ jobId, maxMessages = 500, description }) {
  const [logs, setLogs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [sliderOffset, setSliderOffset] = useState(0);

  const ws = useRef(null);
  const logIdRef = useRef(0);
  const maxMessagesRef = useRef(maxMessages);

  useEffect(() => {
    maxMessagesRef.current = maxMessages;
  }, [maxMessages]);

  /* -------------------------- Fetch Historical -------------------------- */

  const fetchHistoricalLogs = useCallback(
    async (search, limit = 100) => {
      if (!jobId) return;

      const offset = Math.max(0, totalLogs - sliderOffset - limit);

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (offset != null) params.append('offset', offset);
        params.append('limit', limit);

        const res = await fetch(`${API_BASE_URL}/api/logs/${jobId}?${params}`);
        const data = await res.json();

        setTotalLogs(data.total);

        setLogs(
          data.logs.map((log) => ({
            id: log.offset,
            offset: log.offset,
            time: log.timestamp,
            level: log.level,
            message: log.message,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    },
    [jobId, totalLogs, sliderOffset]
  );

  /* ------------------------------ Load ---------------------------------- */

  useEffect(() => {
    if (!jobId) return;

    const limit = 100;

    fetchHistoricalLogs(searchText || null, limit);
  }, [jobId, sliderOffset, searchText, fetchHistoricalLogs]);

  /* ---------------------------- WebSocket ------------------------------- */

  useEffect(() => {
    if (!jobId) return;

    const url = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/logs/${jobId}`;

    ws.current = new WebSocket(url);

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const items = Array.isArray(data) ? data : [data];

      setLogs((prev) => {
        const next = [
          ...prev,
          ...items.map((item) => ({
            ...item,
            id: logIdRef.current++,
          })),
        ];
        return next.slice(-maxMessagesRef.current);
      });
    };

    return () => {
      ws.current?.close();
      setSliderOffset(0);
      // setLogs([]);
    };
  }, [jobId]);

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
    <Stack spacing={2}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1}>
          <Terminal fontSize="small" />
          <Typography variant="body2">Logs for {description}</Typography>
        </Stack>

        <Tooltip title="Clear logs">
          <IconButton onClick={() => setLogs([])} size="small">
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search logs..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        InputProps={{
          startAdornment: <Search fontSize="small" sx={{ mr: 1 }} />,
        }}
      />

      {/* Slider (commit-only = no jank) */}
      <Slider
        value={sliderOffset}
        min={0}
        max={Math.max(0, totalLogs - 1)}
        onChangeCommitted={(_, v) => setSliderOffset(v)}
        valueLabelDisplay="auto"
        valueLabelFormat={(v) => `Latest-${v}`}
      />

      {/* Log Container */}
      <Paper
        sx={{
          height: 300,
          overflow: 'auto',
          bgcolor: 'rgba(0,0,0,0.4)',
          fontFamily: '"JetBrains Mono", monospace',
          p: 1,
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              justifyContent: 'center',
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
    </Stack>
  );
}

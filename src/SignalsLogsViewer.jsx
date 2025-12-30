import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
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
  List,
  ListItem,
  Chip,
  Divider,
} from '@mui/material';
import { SignalCellularAlt, Delete, Search, Refresh } from '@mui/icons-material';
import { API_BASE_URL } from './api';
import { formatMessage, getLevelColor } from './utils';

/* -------------------------------- Utilities -------------------------------- */

// Removed highlightMessage as it's no longer used in compact view

/* ------------------------------ Signal Group Row --------------------------- */

const SignalGroupRow = React.memo(function SignalGroupRow({ group }) {
  console.log(group.matched_entry);
  
  // Concatenate following entries into compact format
  const followingEntriesText = group.following_entries
    ?.map((entry) => {
      const time = entry.timestamp || '';
      const level = entry.level || '';
      const message = formatMessage(entry.message) || '';
      return `${time} [${level}] ${message}`;
    })
    .join(' | ') || '';

  return (
    <Box>
      <ListItem
        disableGutters
        sx={{
          py: 1,
          px: 0,
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* Matched Entry */}
        <Paper
          sx={{
            bgcolor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            p: 1.5,
            mb: 1,
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
                sx={{ fontFamily: '"JetBrains Mono", monospace', display: 'block', mb: 0.5 }}
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
                  mb: 0.5,
                }}
              >
                [{group.matched_entry.level}]
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'pre-wrap' }}
              >
                {formatMessage(group.matched_entry.message)}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Following Entries - Compact */}
        {group.following_entries && group.following_entries.length > 0 && (
          <Box
            sx={{
              pl: 2,
              borderLeft: '2px solid rgba(255, 193, 7, 0.3)',
              mt: 0.5,
            }}
          >
            <Box
              sx={{
                p: 1,
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 1,
                maxWidth: '100%',
                overflow: 'auto',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  opacity: 0.8,
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.7rem',
                  lineHeight: 1.4,
                }}
              >
                {followingEntriesText}
              </Typography>
            </Box>
          </Box>
        )}
      </ListItem>
      <Divider sx={{ my: 1 }} />
    </Box>
  );
});

const KEYWORD = 'Total inference features'
const LIMIT = 10

export default function SignalsLogsViewer({ jobId, description }) {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debounceRef = useRef(null);

  /* -------------------------- Fetch Signals -------------------------- */

  const fetchSignals = useCallback(
    async (searchKeyword, nFollowingEntries = 10) => {
      if (!jobId) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchKeyword) params.append('keyword', searchKeyword);
        params.append('n_following', nFollowingEntries);
        params.append('sort', 'desc');

        const res = await fetch(`${API_BASE_URL}/api/logs/${jobId}/signals?${params}`);
        const data = await res.json();

        setGroups(data.groups || []);
      } catch (e) {
        console.error('Failed to fetch signals:', e);
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    },
    [jobId]
  );

  /* ------------------------------ Load ---------------------------------- */

  useEffect(() => {
    if (!jobId) return;
    fetchSignals(KEYWORD, LIMIT);
  }, [jobId, fetchSignals]);

  /* ---------------------------- Filtering ------------------------------- */


  /* ----------------------------- Render -------------------------------- */

  return (
    <Stack spacing={2} sx={{ height: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={1}>
          <SignalCellularAlt fontSize="small" />
          <Typography variant="body2">Signals Logs for {description}</Typography>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Refresh signals">
            <IconButton
              onClick={() => {
                // Cancel any pending debounce and force reload
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                  debounceRef.current = null;
                }
                fetchSignals(KEYWORD, LIMIT);
              }}
              size="small"
              disabled={isLoading}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear signals">
            <IconButton onClick={() => setGroups([])} size="small">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Signals Container */}
      <Paper
        sx={{
          height: '600px',
          overflow: 'auto',
          bgcolor: 'rgba(0,0,0,0.4)',
          fontFamily: '"JetBrains Mono", monospace',
          p: 1,
          flex: 1,
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
        ) : groups.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
          </Box>
        ) : (
          <List disablePadding>
            {groups.map((group, idx) => (
              <SignalGroupRow
                key={group.offset || idx}
                group={group}
              />
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
}


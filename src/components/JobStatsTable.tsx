import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Stack,
  Switch,
  Tooltip,
  Divider,
  Paper,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Card,
  Autocomplete
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Memory,
  Storage,
  AccessTime,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  Search,
  FilterList,
  Clear,
  SignalCellularAlt,
  Edit
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '@/api';
import SignalsLogsViewer from './SignalsLogsViewer';
import { SESSIONS } from '@/constants/session';

// --- Utils ---

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function JobRowComponent({
  job,
  onToggle
}: {
  job: JobStatsItem;
  onToggle: (active: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  // Parse config if it is a string, otherwise use as is
  const configObj =
    typeof job.config === 'string' ? JSON.parse(job.config) : job.config;

  return (
    <Fragment>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          '& > *': { borderBottom: 'unset' },
          bgcolor: open ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
          transition: 'background-color 0.2s'
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small">
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {job.description || 'Untitled job'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              #{job.id}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            icon={
              job.active ? (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 }
                    }
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'text.disabled'
                  }}
                />
              )
            }
            label={job.active ? 'Active' : 'Paused'}
            size="small"
            color={job.active ? 'success' : 'default'}
            variant={job.active ? 'filled' : 'outlined'}
          />
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Memory sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {(configObj as any)?.model_key ||
                (job.config as any)?.model_key ||
                '-'}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Tooltip title={job.sql_version?.description || ''}>
              <Typography variant="body2">
                {job.sql_version?.name || '-'}
              </Typography>
            </Tooltip>
          </Stack>
        </TableCell>
        <TableCell>
          <Tooltip title="Last Signal">
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">
                {job.last_signal
                  ? dayjs.utc(job.last_signal).format('DD:MM:YY HH:mm:ss') +
                    ' UTC'
                  : '-'}
              </Typography>
            </Stack>
          </Tooltip>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              checked={!!job.active}
              onChange={(e) => onToggle(e.target.checked)}
              color="success"
              size="small"
            />
            <Tooltip title="Edit Job Details">
              <IconButton
                size="small"
                to={`/plugins/${job.plugin_id}/sessions/${job.session_id}/jobs/${job.id}`}
                component={RouterLink}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>

      {/* Expanded content */}
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, bgcolor: 'rgba(0,0,0,0.2)' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 3, px: 2 }}>
              <Stack direction="column" spacing={3}>
                {/* Latest Signals */}
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <SignalCellularAlt
                      sx={{ fontSize: 18, color: 'secondary.main' }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Latest Signals
                    </Typography>
                  </Stack>
                  <Paper
                    variant="outlined"
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.3)',
                      maxHeight: 400,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <SignalsLogsViewer
                      jobId={job.id}
                      signals={job.signals}
                      limit={1}
                      hideHeader
                      sx={{
                        height: 'auto',
                        maxHeight: '100%',
                        bgcolor: 'transparent',
                        boxShadow: 'none'
                      }}
                    />
                  </Paper>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function JobStatsTable() {
  // State
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<JobStatsItem[]>([]);
  const [total, setTotal] = useState(0);

  // Pagination State
  const [page, setPage] = useState(0); // 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filter State
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 500);

  const [activeFilter, setActiveFilter] = useState<boolean | 'all'>('all');
  const [selectedPluginId, setSelectedPluginId] = useState<number | 'all'>(
    'all'
  );
  const [selectedSqlVersion, setSelectedSqlVersion] = useState<number | 'all'>(
    'all'
  );
  const [selectedSession, setSelectedSession] = useState<number | 'all'>('all');

  // Metadata State
  const [sqlVersions, setSqlVersions] = useState<SqlVersion[]>([]);
  const [plugins, setPlugins] = useState<PluginData[]>([]);

  // --- Fetch Metadata ---
  useEffect(() => {
    api
      .getSqlVersions({ limit: 100 })
      .then((res) => setSqlVersions(res.versions))
      .catch(console.error);
    api.fetchPlugins().then(setPlugins).catch(console.error);
  }, []);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getJobStats({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search_text: debouncedSearchText || undefined,
        active: activeFilter === 'all' ? undefined : (activeFilter as boolean),
        plugin_id:
          selectedPluginId === 'all' ? undefined : [selectedPluginId as number],
        sql_id:
          selectedSqlVersion === 'all'
            ? undefined
            : [selectedSqlVersion as number],
        session_id:
          selectedSession === 'all' ? undefined : [selectedSession as number],
        include_signals: true, // Always fetch signals to populate the expanded view
        sort: 'desc',
        order_by: 'id'
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    debouncedSearchText,
    activeFilter,
    selectedPluginId,
    selectedSqlVersion,
    selectedSession
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleJob = async (id: number, active: boolean) => {
    try {
      await api.activateJob(id, active);
      // Optimistic update
      setRows((prev) =>
        prev.map((job) =>
          job.id === id ? { ...job, active: active ? 1 : 0 } : job
        )
      );
    } catch (err) {
      console.error('Failed to toggle job', err);
      fetchData();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.ceil(total / rowsPerPage);
  const startRow = page * rowsPerPage + 1;
  const endRow = Math.min((page + 1) * rowsPerPage, total);

  return (
    <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
      {/* Search & Filter Bar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search jobs by name, ID, or config..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                sx: { borderRadius: 2, bgcolor: 'background.default' }
              }
            }}
            size="medium"
          />

          {/* Filters Row */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" color="action" />
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.secondary"
              >
                Filters
              </Typography>
            </Box>

            <Autocomplete
              options={plugins}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props as any;
                return (
                  <li key={key} {...otherProps}>
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%'
                      }}
                    >
                      {option.package}
                    </div>
                  </li>
                );
              }}
              getOptionLabel={(option) => option?.package ?? ''}
              value={plugins.find((p) => p.id === selectedPluginId) || null}
              onChange={(_, newValue) =>
                setSelectedPluginId(newValue ? newValue.id : 'all')
              }
              renderInput={(params) => (
                <TextField {...params} label="Plugins" size="small" />
              )}
              sx={{ minWidth: 300 }}
              size="small"
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={activeFilter}
                label="Status"
                onChange={(e) =>
                  setActiveFilter(e.target.value as boolean | 'all')
                }
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Paused</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sessions</InputLabel>
              <Select
                value={selectedSession}
                label="Sessions"
                onChange={(e) =>
                  setSelectedSession(e.target.value as number | 'all')
                }
              >
                <MenuItem value="all">All Sessions</MenuItem>
                {SESSIONS.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={sqlVersions}
              getOptionLabel={(option) => option.name}
              value={
                sqlVersions.find((v) => v.id === selectedSqlVersion) || null
              }
              onChange={(_, newValue) =>
                setSelectedSqlVersion(newValue ? newValue.id : 'all')
              }
              renderInput={(params) => (
                <TextField {...params} label="SQL Version" size="small" />
              )}
              sx={{ minWidth: 300 }}
              size="small"
            />

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="outlined"
              startIcon={<Clear />}
              size="small"
              onClick={() => {
                setSearchText('');
                setActiveFilter('all');
                setSelectedPluginId('all');
                setSelectedSqlVersion('all');
              }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Table Content */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
              <TableCell sx={{ width: 50 }} />
              <TableCell>Job</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>SQL Version</TableCell>
              <TableCell>Last Signal</TableCell>
              <TableCell sx={{ width: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <LinearProgress sx={{ width: '50%', mx: 'auto', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading jobs...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((job) => (
                <JobRowComponent
                  key={job.id}
                  job={job}
                  onToggle={(active) => handleToggleJob(job.id, active)}
                />
              ))
            )}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No jobs found matching your filters.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          px: 2,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'rgba(255,255,255,0.02)'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <FormControl size="small" variant="standard" sx={{ minWidth: 60 }}>
            <Select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              disableUnderline
              sx={{ fontWeight: 600, fontSize: '0.875rem' }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {total === 0 ? '0-0 of 0' : `${startRow}–${endRow} of ${total}`}
          </Typography>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="First page">
            <span>
              <IconButton
                size="small"
                onClick={() => handlePageChange(0)}
                disabled={page === 0}
              >
                <FirstPage fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Previous page">
            <span>
              <IconButton
                size="small"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Chip
            label={`Page ${page + 1} of ${Math.max(1, totalPages)}`}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 500,
              borderColor: 'divider',
              bgcolor: 'rgba(255,255,255,0.05)'
            }}
          />

          <Tooltip title="Next page">
            <span>
              <IconButton
                size="small"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Last page">
            <span>
              <IconButton
                size="small"
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={page >= totalPages - 1}
              >
                <LastPage fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Card>
  );
}

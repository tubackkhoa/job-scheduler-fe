import { FieldProps } from '@rjsf/utils';
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
  Paper,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  TableSortLabel,
  Card,
  Autocomplete,
} from '@mui/material';
import { useState, Fragment, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';

const { dayjs } = Utils;
const { SignalsLogsViewer } = Components;

const SESSIONS = [
  {
    id: 1,
    name: 'UAT',
  },
  {
    id: 2,
    name: 'Production',
  },
  {
    id: 3,
    name: 'Develop',
  },
];

// --- Utils ---

function JobRowComponent({
  job,
  valueVersion,

  signals,
  onToggle,
  pluginName,
  env,
}: {
  job: Job;
  signals: Signal[];
  valueVersion?: ValueVersion;
  onToggle: (active: boolean) => void;
  pluginName?: string;
  env?: string;
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
          transition: 'background-color 0.2s',
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small">
            {open ? <AppIcon.KeyboardArrowUp /> : <AppIcon.KeyboardArrowDown />}
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
                    bgcolor: 'success.main',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'text.disabled',
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
            <AppIcon.Memory sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2">
              {(configObj as any)?.model_key || (job as any)?.model_key || '-'}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <AppIcon.Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Tooltip title={valueVersion?.name || ''}>
              <Typography variant="body2">
                {valueVersion?.name || '-'}
              </Typography>
            </Tooltip>
          </Stack>
        </TableCell>

        <TableCell sx={{ maxWidth: 250 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <AppIcon.Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Tooltip title={pluginName}>
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pluginName || '-'}
              </Typography>
            </Tooltip>
          </Stack>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <AppIcon.Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Tooltip title={env}>
              <Typography variant="body2">{env}</Typography>
            </Tooltip>
          </Stack>
        </TableCell>

        <TableCell>
          <Tooltip title="Last Signal">
            <Stack direction="row" spacing={1} alignItems="center">
              <AppIcon.AccessTime
                sx={{ fontSize: 16, color: 'text.secondary' }}
              />
              <Typography variant="body2">
                {signals.length
                  ? dayjs(signals[0].captured_at).format('DD:MM:YYYY HH:mm:ss')
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
                <AppIcon.Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>

      {/* Expanded content */}
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, bgcolor: 'rgba(0,0,0,0.2)' }}>
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
                    <AppIcon.SignalCellularAlt
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
                      flexDirection: 'column',
                    }}
                  >
                    <SignalsLogsViewer
                      jobId={job.id}
                      signals={signals}
                      hideHeader
                      hideFilter
                      sx={{
                        p: 2,
                        bgcolor: 'transparent',
                        boxShadow: 'none',
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

export default function JobStatsTable({
  formData,
}: FieldProps<{ fieldId: string; fieldName: string }>) {
  const { fieldId = 'sql_id', fieldName = 'Sql version' } = formData;
  // State
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [signalsMap, setSignalsMap] = useState<JobStatsResponse['signals_map']>(
    {},
  );
  const [versions, setVersions] = useState<JobStatsResponse['versions']>({});

  // Pagination State
  const [page, setPage] = useState(0); // 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filter State
  const [searchText, setSearchText] = useState('');
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
  const debouncedSearchText = useDebounce(searchText, 500);

  const [activeFilter, setActiveFilter] = useState<boolean | 'all'>('all');
  const [selectedPluginId, setSelectedPluginId] = useState<number | 'all'>(
    'all',
  );
  const [selectedValueVersion, setSelectedValueVersion] = useState<
    number | 'all'
  >('all');
  const [selectedSession, setSelectedSession] = useState<number | 'all'>('all');

  // Metadata State
  const [valueVersions, setValueVersions] = useState<ValueVersion[]>([]);
  const [plugins, setPlugins] = useState<PluginData[]>([]);

  const [order, setOrder] = useState<Order>('desc');

  // --- Fetch Metadata ---
  useEffect(() => {
    api
      .getValueVersions({ field_id: fieldId })
      .then((res) => setValueVersions(res.versions))
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
        active: activeFilter === 'all' ? undefined : activeFilter,
        plugin_id: selectedPluginId === 'all' ? undefined : [selectedPluginId],
        session_id:
          selectedSession === 'all' ? undefined : [selectedSession as number],
        config:
          selectedValueVersion === 'all'
            ? undefined
            : {
                [fieldId]: [selectedValueVersion],
              },
        version_id: [fieldId],
        include_signals: true, // Always fetch signals to populate the expanded view
        sort: order,
        order_by: 'id',
      });
      setRows(res.jobs);
      setTotal(res.total);
      setSignalsMap(res.signals_map);
      setVersions(res.versions);
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
    selectedValueVersion,
    selectedSession,
    order,
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
          job.id === id ? { ...job, active: active ? 1 : 0 } : job,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle job', err);
      fetchData();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleJobSort = () => {
    setOrder(order === 'asc' ? 'desc' : 'asc');
    setPage(0);
  };

  const totalPages = Math.ceil(total / rowsPerPage);
  const startRow = page * rowsPerPage + 1;
  const endRow = Math.min((page + 1) * rowsPerPage, total);

  return (
    <Card sx={{ bgcolor: 'background.paper', borderRadius: 2, my: 4 }}>
      {/* Search & Filter Bar */}
      <Box
        sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack spacing={2}>
          {/* Search */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search jobs by name, ID, or config..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <AppIcon.Search color="action" sx={{ mr: 1 }} />
                ),
                sx: { borderRadius: 2, bgcolor: 'background.default' },
              },
            }}
            size="medium"
          />

          {/* Filters */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            {/* Filters label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AppIcon.FilterList fontSize="small" color="action" />
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
              getOptionLabel={(option) => option?.package ?? ''}
              value={plugins.find((p) => p.id === selectedPluginId) || null}
              onChange={(_, v) => setSelectedPluginId(v ? v.id : 'all')}
              renderInput={(params) => (
                <TextField {...params} label="Plugins" size="small" fullWidth />
              )}
              sx={{ minWidth: { md: 260 } }}
            />

            <FormControl size="small" fullWidth sx={{ minWidth: { md: 180 } }}>
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

            <FormControl size="small" fullWidth sx={{ minWidth: { md: 180 } }}>
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
              options={valueVersions}
              getOptionLabel={(option) => option.name}
              value={
                valueVersions.find((v) => v.id === selectedValueVersion) || null
              }
              onChange={(_, v) => setSelectedValueVersion(v ? v.id : 'all')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={fieldName}
                  size="small"
                  fullWidth
                />
              )}
              sx={{ minWidth: { md: 260 } }}
            />

            {/* Spacer only on desktop */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

            <Button
              variant="outlined"
              startIcon={<AppIcon.Clear />}
              size="small"
              fullWidth
              sx={{ alignSelf: { md: 'center' } }}
              onClick={() => {
                setSearchText('');
                setActiveFilter('all');
                setSelectedPluginId('all');
                setSelectedValueVersion('all');
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
              <TableCell sortDirection={order}>
                <TableSortLabel
                  active
                  direction={order}
                  onClick={handleJobSort}
                >
                  Job
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>{fieldName}</TableCell>
              <TableCell>Plugin</TableCell>
              <TableCell>Environment</TableCell>
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
              rows.map((job) => {
                const signals = signalsMap[job.id] ?? [];
                const valueId = job.config?.[fieldId];
                const valueVersion = valueId
                  ? versions[fieldId].find((v) => v.id === valueId)
                  : undefined;
                return (
                  <JobRowComponent
                    key={job.id}
                    valueVersion={valueVersion}
                    signals={signals}
                    job={job}
                    pluginName={
                      plugins.find(
                        (item) => Number(item.id) === Number(job.plugin_id),
                      )?.package
                    }
                    env={
                      SESSIONS.find(
                        (item) => Number(item.id) === Number(job.session_id),
                      )?.name
                    }
                    onToggle={(active) => handleToggleJob(job.id, active)}
                  />
                );
              })
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
          bgcolor: 'rgba(255,255,255,0.02)',
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
                <AppIcon.FirstPage fontSize="small" />
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
                <AppIcon.ChevronLeft fontSize="small" />
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
              bgcolor: 'rgba(255,255,255,0.05)',
            }}
          />

          <Tooltip title="Next page">
            <span>
              <IconButton
                size="small"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
              >
                <AppIcon.ChevronRight fontSize="small" />
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
                <AppIcon.LastPage fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Card>
  );
}

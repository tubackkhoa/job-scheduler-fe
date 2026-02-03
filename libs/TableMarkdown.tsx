import { FieldProps } from '@rjsf/utils';

const { useState, useMemo } = React;
const {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  TablePagination,
  TextField,
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  IconButton,
  Button,
  Switch,
} = Mui;

type LatestInfo = {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  pnl: number;
} | null;

type Row = {
  Model: string;
  Identity: string;
  PNL: number;
  'Job Status': 'active' | 'inactive' | 'none';
  'Created At': string;
  Latest: LatestInfo;
};

type Order = 'asc' | 'desc';

/* ---------- Sorting helpers ---------- */

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const av = a[orderBy];
  const bv = b[orderBy];

  if (bv == null && av == null) return 0;
  if (bv == null) return -1;
  if (av == null) return 1;

  if (bv < av) return -1;
  if (bv > av) return 1;
  return 0;
}

function getComparator<Key extends keyof any>(order: Order, orderBy: Key) {
  return order === 'desc'
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

/* ---------- Module Entry ---------- */

export default ({ formData }: FieldProps<string>) => {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Row>('PNL');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ---------- Column config ---------- */

  const columnConfig: Record<keyof Row, { label: string; visible: boolean }> = {
    Model: { label: 'Model', visible: true },
    Identity: { label: 'Identity', visible: true },
    PNL: { label: 'PNL', visible: true },
    'Job Status': { label: 'Job Status', visible: true },
    Latest: { label: 'Latest', visible: true },
    'Created At': { label: 'Created At', visible: false },
  };

  const [visibleColumns, setVisibleColumns] = useState<
    Record<keyof Row, boolean>
  >(
    Object.fromEntries(
      Object.entries(columnConfig).map(([k, v]) => [k, v.visible]),
    ) as Record<keyof Row, boolean>,
  );

  /* ---------- Row visibility ---------- */

  const [hiddenRows, setHiddenRows] = useState<Record<string, boolean>>({});
  const [hideInactive, setHideInactive] = useState(false);

  const hideRow = (id: string) => {
    setHiddenRows((prev) => ({ ...prev, [id]: true }));
  };

  const restoreAllRows = () => {
    setHiddenRows({});
    setHideInactive(false);
  };

  const handleSort = (property: keyof Row) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  /* ---------- Data ---------- */

  const rows: Row[] | undefined = useMemo(() => {
    if (!formData) return;
    try {
      return JSON.parse(formData);
    } catch {
      return;
    }
  }, [formData]);

  /* ---------- Filtering (row hiding happens first) ---------- */

  const filteredRows = useMemo(() => {
    if (!rows) return;

    return rows
      .filter((r) => !hiddenRows[r.Identity])
      .filter((r) => (hideInactive ? r['Job Status'] !== 'inactive' : true))
      .filter((r) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return [r.Model, r.Identity, r['Job Status'], r.Latest?.symbol]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
  }, [rows, filter, hiddenRows, hideInactive]);

  /* ---------- Sorting ---------- */

  const sortedRows = useMemo(
    () => filteredRows && [...filteredRows].sort(getComparator(order, orderBy)),
    [filteredRows, order, orderBy],
  );

  /* ---------- Paging ---------- */

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedRows && sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  if (!pagedRows) return null;

  const activeColumns = (Object.keys(columnConfig) as (keyof Row)[]).filter(
    (c) => visibleColumns[c],
  );

  return (
    <>
      {/* 🔍 Filter */}
      <Box mb={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter by model, identity, status, symbol…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        />
      </Box>

      {/* 👁 Controls */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        flexWrap="wrap"
        mb={1}
      >
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={hideInactive}
              onChange={(e) => setHideInactive(e.target.checked)}
            />
          }
          label="Hide inactive rows"
        />

        <Button size="small" onClick={restoreAllRows}>
          Restore all hidden rows
        </Button>
      </Stack>

      {/* 👁 Column toggles */}
      <Stack direction="row" gap={1} flexWrap="wrap" mb={1}>
        {(Object.keys(columnConfig) as (keyof Row)[]).map((key) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                size="small"
                checked={visibleColumns[key]}
                onChange={() =>
                  setVisibleColumns((p) => ({ ...p, [key]: !p[key] }))
                }
              />
            }
            label={columnConfig[key].label}
          />
        ))}
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={48} />
              {activeColumns.map((key) => (
                <TableCell key={key}>
                  <TableSortLabel
                    active={orderBy === key}
                    direction={orderBy === key ? order : 'asc'}
                    onClick={() => handleSort(key)}
                  >
                    {columnConfig[key].label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedRows.map((row) => (
              <TableRow key={row.Identity} hover>
                {/* ❌ Remove row */}
                <TableCell>
                  <IconButton
                    disableRipple
                    size="small"
                    onClick={() => hideRow(row.Identity)}
                    title="Hide row"
                  >
                    x
                  </IconButton>
                </TableCell>

                {activeColumns.map((key) => {
                  switch (key) {
                    case 'PNL':
                      return (
                        <TableCell
                          key={key}
                          sx={{
                            color: row.PNL > 0 ? 'success.main' : 'error.main',
                            fontWeight: 600,
                          }}
                        >
                          {row.PNL.toFixed(2)}
                        </TableCell>
                      );

                    case 'Job Status':
                      return (
                        <TableCell key={key}>
                          <Chip
                            size="small"
                            label={row['Job Status']}
                            color={
                              row['Job Status'] === 'active'
                                ? 'success'
                                : row['Job Status'] === 'inactive'
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                        </TableCell>
                      );

                    case 'Latest':
                      return (
                        <TableCell key={key}>
                          {row.Latest ? (
                            <>
                              {row.Latest.symbol}
                              <Chip
                                size="small"
                                label={row.Latest.direction}
                                color={
                                  row.Latest.direction === 'LONG'
                                    ? 'success'
                                    : 'error'
                                }
                                sx={{ mx: 0.5 }}
                              />
                              {row.Latest.pnl.toFixed(2)}
                            </>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      );

                    default:
                      return (
                        <TableCell key={key}>
                          {String(row[key] ?? '—')}
                        </TableCell>
                      );
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 📄 Pagination */}
      {sortedRows && (
        <TablePagination
          component="div"
          count={sortedRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0); // reset to first page
          }}
        />
      )}
    </>
  );
};

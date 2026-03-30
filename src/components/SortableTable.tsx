import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  TableSortLabel,
  Paper,
  TablePagination,
} from '@mui/material';
import { useMemo } from 'react';
import { useSortableTable } from '@/hooks/useSortableTable';

type Props = {
  children: any;
  className?: string;
};

export const SortableTable = ({ children, className }: Props) => {
  // 🧠 Extract data
  const { headers, rows } = useMemo(() => {
    const [thead, tbody] = children || [];

    const extractText = (node: any): string => {
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (node?.props?.children) return extractText(node.props.children);
      return '';
    };

    const headers =
      thead?.props?.children?.props?.children?.map((th: any) =>
        extractText(th),
      ) || [];

    const rows =
      tbody?.props?.children?.map((tr: any) =>
        tr.props.children.map((td: any) => extractText(td)),
      ) || [];

    return { headers, rows };
  }, [children]);

  const {
    paginatedRows,
    filteredRows,
    sortConfig,
    filters,
    setFilters,
    handleSort,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useSortableTable(rows);

  return (
    <TableContainer component={Paper} className={className}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((header: string, i: number) => (
              <TableCell key={i}>
                <TableSortLabel
                  active={sortConfig?.index === i}
                  direction={
                    sortConfig?.index === i ? sortConfig.direction : 'asc'
                  }
                  onClick={() => handleSort(i)}
                >
                  {header}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            {headers.map((_, i) => (
              <TableCell key={i}>
                <TextField
                  variant="standard"
                  value={filters[i] || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      [i]: e.target.value,
                    }))
                  }
                  placeholder="Filter..."
                  fullWidth
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {paginatedRows.map((row: string[], i: number) => (
            <TableRow key={i}>
              {row.map((cell: string, j: number) => (
                <TableCell key={j}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}

          {paginatedRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={headers.length} align="center">
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </TableContainer>
  );
};

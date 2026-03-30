import { useEffect, useMemo, useState } from 'react';

type SortConfig = {
  index: number;
  direction: 'asc' | 'desc';
} | null;

export const useSortableTable = (rows: string[][]) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ⏱ debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(0);
    }, 300);

    return () => clearTimeout(t);
  }, [filters]);

  const parseValue = (val: string) => {
    const num = Number(val);
    return isNaN(num) ? val.toLowerCase() : num;
  };

  // 🔀 sorting
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;

    return [...rows].sort((a, b) => {
      const valA = parseValue(a[sortConfig.index]);
      const valB = parseValue(b[sortConfig.index]);

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  // 🔍 filtering
  const filteredRows = useMemo(() => {
    return sortedRows.filter((row) =>
      Object.entries(debouncedFilters).every(([colIndex, value]) =>
        row[+colIndex]?.toLowerCase().includes(value.toLowerCase()),
      ),
    );
  }, [sortedRows, debouncedFilters]);

  // 📄 pagination
  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleSort = (index: number) => {
    setSortConfig((prev) => {
      if (prev?.index === index) {
        return {
          index,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { index, direction: 'asc' };
    });
  };

  return {
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
  };
};

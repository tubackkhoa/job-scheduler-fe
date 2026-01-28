import { useSortableTable } from '@/hooks/useSortableTable';
import { Table, TableContainer } from '@mui/material';

export const SortableTable = ({ children, className }) => {
  const ref = useSortableTable();

  return (
    <TableContainer>
      <Table
        ref={ref}
        className={[className, 'sortable'].filter(Boolean).join(' ')}
      >
        {children}
      </Table>
    </TableContainer>
  );
};

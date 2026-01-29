import { useSortableTable } from '@/hooks/useSortableTable';
import { Table } from '@mui/material';

export const SortableTable = ({ children, className }) => {
  const ref = useSortableTable();

  return (
    <Table
      ref={ref}
      className={[className, 'sortable'].filter(Boolean).join(' ')}
    >
      {children}
    </Table>
  );
};

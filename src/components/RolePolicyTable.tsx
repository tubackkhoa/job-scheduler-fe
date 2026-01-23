import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';

interface RolePolicyProps {
  roleMap: Record<string, string[]>;
}

export function RolePolicyTable({ roleMap }: RolePolicyProps) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Role</TableCell>
          <TableCell>Permissions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {Object.entries(roleMap).map(([role, permissions]) => (
          <TableRow key={role}>
            <TableCell sx={{ fontWeight: 600 }}>
              <Chip color="primary" label={role} size="small"></Chip>
            </TableCell>
            <TableCell>
              <Box display="flex" gap={1} flexWrap="wrap">
                {permissions.map((perm) => (
                  <Chip
                    key={perm}
                    label={perm}
                    size="small"
                    color={perm === '*' ? 'success' : 'secondary'}
                  />
                ))}
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

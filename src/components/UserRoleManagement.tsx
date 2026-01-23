import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useEffect, useState } from 'react';
import api from '@/api';

function extractRolesFromPolicy(policy: string[][]): string[] {
  return Array.from(new Set(policy.map((rule) => rule[0])));
}

export default function UserRoleManagement() {
  const [allRoles, setAllRoles] = useState([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const policy = await api.getPolicy();
      const roles = extractRolesFromPolicy(policy);
      setAllRoles(roles);
      const users = await api.getUsers();
      setUsers(users);
      setLoading(false);
    })();
  }, []);

  const updateRoles = async (userId: number, roles: string[]) => {
    setSavingUserId(userId);
    await fetch(`/api/users/${userId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles })
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roles } : u))
    );
    setSavingUserId(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h5" mb={2}>
        User Role Management
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>

              <TableCell>
                <Select
                  multiple
                  value={user.roles}
                  onChange={(e) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === user.id
                          ? { ...u, roles: e.target.value as string[] }
                          : u
                      )
                    )
                  }
                  renderValue={(selected) => (
                    <Box display="flex" gap={1}>
                      {(selected as string[]).map((role) => (
                        <Chip key={role} label={role} size="small" />
                      ))}
                    </Box>
                  )}
                  size="small"
                >
                  {allRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>

              <TableCell align="right">
                <IconButton
                  onClick={() => updateRoles(user.id, user.roles)}
                  disabled={savingUserId === user.id}
                >
                  <SaveIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

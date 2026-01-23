import {
  Box,
  CircularProgress,
  IconButton,
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
import { Select } from './fields';
import useNotifications from '@/hooks/useNotifications/useNotifications';
import { RolePolicyTable } from './RolePolicyTable';

function groupPolicyByRole(policy: [string, string][]) {
  return policy.reduce<Record<string, string[]>>((acc, [role, perm]) => {
    acc[role] ??= [];
    acc[role].push(perm);
    return acc;
  }, {});
}

export default function UserRoleManagement() {
  const [roleMap, setRoleMap] = useState({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const notifications = useNotifications();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const policy = await api.getPolicy();
      const rolePermissions = groupPolicyByRole(policy);
      setRoleMap(rolePermissions);
      const users = await api.getUsers();
      setUsers(users);
      setLoading(false);
    })();
  }, []);

  const updateRoles = async (userId: number, roles: string[]) => {
    setSavingUserId(userId);
    try {
      const user = await api.updateRoles(userId, roles);
      setUsers((prev) => prev.map((u) => (u.id === userId ? user : u)));
      notifications.show('Update roles for user succeeded', {
        severity: 'success'
      });
    } catch (ex) {
      notifications.show(ex.message, { severity: 'error' });
    }
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

      <RolePolicyTable roleMap={roleMap} />

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
                  schema={{
                    type: 'array',
                    title: 'Roles',
                    enum: Object.keys(roleMap)
                  }}
                  uiSchema={{
                    'ui:options': {
                      multiple: true
                    }
                  }}
                  formData={user.roles}
                  onChange={(value) =>
                    setUsers((prev) =>
                      prev.map((u) =>
                        u.id === user.id ? { ...u, roles: value } : u
                      )
                    )
                  }
                />
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

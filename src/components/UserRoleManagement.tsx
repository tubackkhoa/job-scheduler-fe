import {
  Box,
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

const allRoles = new Set<string>();

function groupPolicyByRole(policy: [string, string][]) {
  return policy.reduce<Record<string, string[]>>((acc, [role, perm]) => {
    allRoles.add(role);
    acc[role] ??= [];
    acc[role].push(perm);
    return acc;
  }, {});
}

export default function UserRoleManagement({ setError, setLoading }) {
  const [roleMap, setRoleMap] = useState({});
  const [users, setUsers] = useState<User[]>([]);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);

  const notifications = useNotifications();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const policy = await api.getPolicy();
        const rolePermissions = groupPolicyByRole(policy);
        setRoleMap(rolePermissions);
        const users = await api.getUsers();
        users.flatMap((u) => u.roles).forEach((r) => allRoles.add(r));
        setUsers(users);
      } catch (ex) {
        // setError(ex.message);
      }
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
                    enum: Array.from(allRoles)
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

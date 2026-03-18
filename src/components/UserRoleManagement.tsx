import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '@/api';
import useNotifications from '@/hooks/useNotifications/useNotifications';
import { RolePolicyTable } from './RolePolicyTable';
import { SelectField } from './fields/SelectField';
import { useTranslation } from 'react-i18next';

function groupPolicyByRole(policy: [string, string][]) {
  return policy.reduce<Record<string, string[]>>((acc, [role, perm]) => {
    acc[role] ??= [];
    acc[role].push(perm);
    return acc;
  }, {});
}

const selectProps: any = {
  uiSchema: {
    'ui:options': {
      multiple: true,
    },
  },
};

export default function UserRoleManagement({ setError, setLoading }) {
  const [roleMap, setRoleMap] = useState({});
  const [users, setUsers] = useState<User[]>([]);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const { t } = useTranslation();
  const notifications = useNotifications();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [policy, users] = await Promise.all([
          api.getPolicy(),
          api.getUsers(),
        ]);

        if (!mounted) return;

        setRoleMap(groupPolicyByRole(policy));
        setUsers(users);
      } catch (ex) {
        setError(ex.message);
      }

      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateRoles = async (userId: number, roles: string[]) => {
    setSavingUserId(userId);
    try {
      const user = await api.updateRoles(userId, roles);
      setUsers((prev) => prev.map((u) => (u.id === userId ? user : u)));
      notifications.show('Update roles for user succeeded', {
        severity: 'success',
      });
    } catch (ex) {
      notifications.show(ex.message, { severity: 'error' });
    }
    setSavingUserId(null);
  };

  // collect all roles from policies and from current users
  const allRoles = [
    ...new Set([...Object.keys(roleMap), ...users.flatMap((u) => u.roles)]),
  ];

  return (
    <Box sx={{ my: 3, mx: 1 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('user role management')}
      </Typography>
      <TableContainer>
        <RolePolicyTable roleMap={roleMap} />

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('user')}</TableCell>
              <TableCell>{t('roles')}</TableCell>
              <TableCell align="right">{t('action')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>

                <TableCell>
                  <SelectField
                    schema={{
                      type: 'array',
                      title: t('roles'),
                      enum: allRoles,
                    }}
                    formData={user.roles}
                    onChange={(value) =>
                      setUsers((prev) =>
                        prev.map((u) =>
                          u.id === user.id ? { ...u, roles: value } : u,
                        ),
                      )
                    }
                    {...selectProps}
                  />
                </TableCell>

                <TableCell align="right">
                  <IconButton
                    onClick={() => updateRoles(user.id, user.roles)}
                    disabled={savingUserId === user.id}
                  >
                    <AppIcon.Save />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

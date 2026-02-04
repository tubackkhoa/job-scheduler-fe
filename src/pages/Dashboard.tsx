import api from '@/api';
import UserRoleManagement from '@/components/UserRoleManagement';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { PluginSitemap } from '@/components/PluginSitemap';
import { PortalPage } from '@/components/Portal';

export default function Dashboard({ setLoading, setError }) {
  const [health, setHealth] = useState<HealthResponse>();
  const [plugins, setPlugins] = useState<PluginData[]>();

  useEffect(() => {
    api.health().then(setHealth);
    api.fetchPlugins().then(setPlugins);
  }, []);
  return (
    <Box>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          my: 4,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Dashboard
        </Typography>
      </Box>

      {/* Summary cards */}
      {health && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Plugins
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {health.plugins}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Active Jobs
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {health.active_jobs}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">
                {health.status}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>{plugins && <PortalPage plugins={plugins} />}</Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Site map
        </Typography>
        {plugins && <PluginSitemap plugins={plugins} />}
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          User Role Management
        </Typography>
        <UserRoleManagement setError={setError} setLoading={setLoading} />
      </Box>
    </Box>
  );
}

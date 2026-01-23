import UserRoleManagement from '@/components/UserRoleManagement';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';

export default function Dashboard() {
  return (
    <Box>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Dashboard
        </Typography>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Plugins
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              12
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Active Jobs
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              5
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="h5" fontWeight={600} color="success.main">
              Healthy
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained">Create Plugin</Button>
            <Button variant="outlined">View Logs</Button>
          </Box>
        </Paper>
      </Box>

      <UserRoleManagement />
    </Box>
  );
}

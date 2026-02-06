import { Grid, Typography } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import { useEffect, useState } from 'react';

const { LoadingSkeleton } = Components;

export default function HealthPortal({}: FieldProps) {
  const [health, setHealth] = useState<HealthResponse>();

  useEffect(() => {
    api.health().then(setHealth);
  }, []);

  if (!health) {
    return <LoadingSkeleton />;
  }

  return (
    <Grid container spacing={3} sx={{ width: '100%', maxHeight: 100 }}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Plugins
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          {health.plugins}
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Active Jobs
        </Typography>
        <Typography variant="h5" fontWeight={600}>
          {health.active_jobs}
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Status
        </Typography>
        <Typography variant="h5" fontWeight={600} color="success.main">
          {health.status}
        </Typography>
      </Grid>
    </Grid>
  );
}

import { useEffect, useState } from 'react';
import { Grid, Paper, Typography } from '@mui/material';

export default function Reports({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [data, setData] = useState<any>();

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        '{{ crm_reports() | tojson }}',
        {},
      ),
    );

    setData(res);
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) return null;

  return (
    <Grid container spacing={3}>
      <Grid size={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Deals</Typography>
          <Typography variant="h4">{data.total_deals}</Typography>
        </Paper>
      </Grid>

      <Grid size={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Revenue</Typography>
          <Typography variant="h4">${data.revenue}</Typography>
        </Paper>
      </Grid>

      <Grid size={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Deals by Stage</Typography>

          {data.stages.map((s: any) => (
            <Typography key={s.stage}>
              {s.stage}: {s.count}
            </Typography>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
}

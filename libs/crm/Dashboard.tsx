import { useEffect, useRef, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Skeleton } from '@mui/material';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';

export default function Dashboard({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [stats, setStats] = useState<any>();
  const chartRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        '{{ crm_dashboard() | tojson }}',
        {},
      ),
    );

    setStats(res);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!stats || !chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#888',
      },
      width: chartRef.current.clientWidth,
      height: 300,
    });

    const lineSeries = chart.addSeries(LineSeries);

    const data = stats.revenue.map((r: any, i: number) => ({
      time: `2024-${String(i + 1).padStart(2, '0')}-01`,
      value: r.value,
    }));

    lineSeries.setData(data);

    return () => chart.remove();
  }, [stats]);

  if (!stats)
    return (
      <Stack spacing={3}>
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={300} />
      </Stack>
    );

  return (
    <Grid container spacing={3}>
      {/* KPI CARDS */}

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Contacts
          </Typography>

          <Typography variant="h4" fontWeight={600}>
            {stats.contacts}
          </Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Leads
          </Typography>

          <Typography variant="h4" fontWeight={600}>
            {stats.leads}
          </Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Deals
          </Typography>

          <Typography variant="h4" fontWeight={600}>
            {stats.deals}
          </Typography>
        </Paper>
      </Grid>

      {/* REVENUE CHART */}

      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Revenue Trend
          </Typography>

          <Box
            ref={chartRef}
            sx={{
              width: '100%',
              height: 320,
            }}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}

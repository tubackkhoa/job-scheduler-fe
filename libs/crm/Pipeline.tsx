import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Card, CardContent } from '@mui/material';

const stages = ['prospecting', 'qualified', 'proposal', 'won', 'lost'];

export default function Pipeline({
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [pipeline, setPipeline] = useState<any>({});

  const load = async () => {
    const res = JSON.parse(
      await api.renderTemplate(
        pluginPackage,
        `{{ get_pipeline() | tojson }}`,
        {},
      ),
    );
    setPipeline(res);
  };

  const move = async (deal_id: number, stage: string) => {
    await api.renderTemplate(
      pluginPackage,
      '{{ update_deal_stage(deal_id, stage) }}',
      { deal_id, stage },
    );
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Grid container spacing={2}>
      {stages.map((stage) => (
        <Grid size={2.4} key={stage}>
          <Paper sx={{ p: 2, minHeight: 400 }}>
            <Typography variant="h6">{stage}</Typography>

            {(pipeline[stage] || []).map((d: any) => (
              <Card
                key={d.id}
                sx={{ mt: 2, cursor: 'pointer' }}
                onClick={() => {
                  const next =
                    stages[(stages.indexOf(stage) + 1) % stages.length];
                  move(d.id, next);
                }}
              >
                <CardContent>
                  <Typography>{d.title}</Typography>
                  <Typography variant="caption">${d.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

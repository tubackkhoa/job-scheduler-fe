import api from '@/api';
import UserRoleManagement from '@/components/UserRoleManagement';
import { Box, Grid, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { PluginSitemap } from '@/components/PluginSitemap';
import { PortalPage } from '@/components/Portal';

export default function Dashboard({ setLoading, setError }) {
  const [health, setHealth] = useState<HealthResponse>();
  const [plugins, setPlugins] = useState<PluginData[]>();
  const [routeState, setRouteState] = useState<RouteState>({});

  const loadRoutes = useCallback(
    async (pluginId: number) => {
      const state = routeState[pluginId];
      if (state?.routes || state?.loading) return;

      setRouteState((prev) => ({
        ...prev,
        [pluginId]: { loading: true },
      }));
      let routes: string[];
      let portal: CodeSchema;
      try {
        const data = await api.fetchRoutes(pluginId);
        portal = data.routes[1];
        routes = data.routes[0].filter((r) => !r.includes(':'));
      } catch (err) {
        setError(err.message);
      } finally {
        // in case return
        setRouteState((prev) => ({
          ...prev,
          [pluginId]: {
            loading: false,
            routes,
            portal,
          },
        }));
      }
    },
    [routeState],
  );

  useEffect(() => {
    if (!plugins) return;
    const load = async () => {
      try {
        const routesMap = await api.fetchAllRoutes();
        setRouteState(
          Object.fromEntries(
            plugins
              .filter((p) => routesMap[p.package])
              .map((p) => {
                const [routes, portal] = routesMap[p.package];
                return [p.id, { loading: false, routes, portal }];
              }),
          ),
        );
      } catch (err) {
        setError(err.message);
      }
    };

    load();
  }, [plugins]);

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

      <Box sx={{ mt: 4 }}>
        {plugins && <PortalPage plugins={plugins} routeState={routeState} />}
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Site map
        </Typography>
        {plugins && (
          <PluginSitemap
            plugins={plugins}
            routeState={routeState}
            loadRoutes={loadRoutes}
          />
        )}
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

import api from '@/api';
import UserRoleManagement from '@/components/UserRoleManagement';
import { Box, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { PluginSitemap } from '@/components/PluginSitemap';
import { PortalPage } from '@/components/Portal';

export default function Dashboard({ setLoading, setError }) {
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
    api.fetchPlugins().then(setPlugins);
  }, []);
  return (
    <Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Portal
        </Typography>
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

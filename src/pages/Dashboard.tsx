import api from '@/api';
import UserRoleManagement from '@/components/UserRoleManagement';
import { Box, Grid } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { PluginSitemap } from '@/components/PluginSitemap';
import { PortalPage } from '@/components/Portal';
import DownloadModuleForm from '@/components/DownloadModuleForm';

const convertToRouteStateItem = (item: RoutesItem): RouteStateItem => {
  const [routes, portal] = item;
  return {
    loading: false,
    routes: routes.filter((r) => !r.includes(':')),
    portal,
  };
};

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
      let newState: RouteStateItem;
      try {
        const data = await api.fetchRoutes(pluginId);
        newState = convertToRouteStateItem(data.routes);
      } catch (err) {
        setError(err.message);
        newState = { loading: false };
      } finally {
        // in case return
        setRouteState((prev) => ({
          ...prev,
          [pluginId]: newState,
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
                const newState = convertToRouteStateItem(routesMap[p.package]);
                return [p.id, newState];
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
      {plugins && <PortalPage plugins={plugins} routeState={routeState} />}

      <Grid container spacing={3}>
        {plugins && (
          <Grid size={{ xs: 12, md: 8 }}>
            <PluginSitemap
              plugins={plugins}
              routeState={routeState}
              loadRoutes={loadRoutes}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 4 }}>
          <DownloadModuleForm />
        </Grid>
      </Grid>
      <UserRoleManagement setError={setError} setLoading={setLoading} />
    </Box>
  );
}

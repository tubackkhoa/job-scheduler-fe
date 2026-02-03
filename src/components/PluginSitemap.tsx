import {
  List,
  ListItemButton,
  ListItemText,
  Box,
  IconButton,
  Typography,
  ListItemIcon,
  Tooltip,
  Alert,
} from '@mui/material';
import { Edit, Extension, Route } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import api from '@/api';
import { LoadingSkeleton } from './Loading';

type RouteState = {
  loading: boolean;
  routes?: string[];
};

export function PluginSitemap() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [routeState, setRouteState] = useState<Record<number, RouteState>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const plugins = await api.fetchPlugins();
        setPlugins(plugins);

        const routesMap = await api.fetchAllRoutes();
        setRouteState(
          Object.fromEntries(
            plugins
              .filter((p) => routesMap[p.package])
              .map((p) => [
                p.id,
                { loading: false, routes: routesMap[p.package] },
              ]),
          ),
        );
      } catch (err) {
        setError(err.message);
      }
    };

    load();
  }, []);

  const loadRoutes = useCallback(
    async (pluginId: number) => {
      const state = routeState[pluginId];
      if (state?.routes || state?.loading) return;

      setRouteState((prev) => ({
        ...prev,
        [pluginId]: { loading: true },
      }));
      let routes: string[];
      try {
        const data = await api.fetchRoutes(pluginId);
        routes = data.filter((r) => !r.includes(':'));
      } catch (err) {
        setError(err.message);
      } finally {
        // in case return
        setRouteState((prev) => ({
          ...prev,
          [pluginId]: {
            loading: false,
            routes,
          },
        }));
      }
    },
    [routeState],
  );

  return (
    <>
      {error && (
        <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <List component="nav" disablePadding>
        {plugins.map((plugin) => {
          const state = routeState[plugin.id];

          return (
            <Box key={plugin.id}>
              <ListItemButton onClick={() => loadRoutes(plugin.id)}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Extension fontSize="small" />
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      fontWeight={500}
                    >
                      {state?.routes ? '▾' : '▸'} {plugin.package}
                    </Typography>
                  }
                  secondary={plugin.description}
                />

                <Tooltip title="Edit Plugin">
                  <IconButton
                    size="small"
                    component={RouterLink}
                    to={`/plugins/${plugin.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>

              {state?.loading ? (
                <LoadingSkeleton />
              ) : (
                state?.routes && (
                  <List component="div" disablePadding>
                    {state.routes.map((route) => (
                      <ListItemButton
                        key={route}
                        sx={{ pl: 6 }}
                        onClick={() =>
                          navigate(`/plugins/${plugin.id}/${route}`)
                        }
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Route fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={route}
                          slotProps={{
                            primary: {
                              variant: 'body2',
                              color: 'text.secondary',
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )
              )}
            </Box>
          );
        })}
      </List>
    </>
  );
}

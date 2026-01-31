import {
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box,
  IconButton,
  Typography,
  ListItemIcon,
  Collapse,
  Tooltip,
} from '@mui/material';
import { ChevronRight, Edit, Extension, Route } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import api from '@/api';

type RouteState = {
  loading: boolean;
  routes?: string[];
};

export function PluginSitemap() {
  const navigate = useNavigate();

  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [routeState, setRouteState] = useState<Record<number, RouteState>>({});

  useEffect(() => {
    api.fetchPlugins().then(setPlugins).catch(console.error);
  }, []);

  const loadRoutes = useCallback(
    async (pluginId: number) => {
      const state = routeState[pluginId];
      if (state?.routes || state?.loading) return;

      setRouteState((prev) => ({
        ...prev,
        [pluginId]: { loading: true },
      }));

      try {
        const data = await api.fetchRoutes(pluginId);
        setRouteState((prev) => ({
          ...prev,
          [pluginId]: {
            loading: false,
            routes: data.filter((r) => !r.includes(':')),
          },
        }));
      } catch (err) {
        console.error(err);
        setRouteState((prev) => ({
          ...prev,
          [pluginId]: { loading: false },
        }));
      }
    },
    [routeState],
  );

  return (
    <List component="nav" disablePadding>
      {plugins.map((plugin) => {
        const state = routeState[plugin.id];
        const isLoading = state?.loading;
        const routes = state?.routes ?? [];
        const isOpen = Boolean(state?.routes);

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
                    {plugin.package}
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

              {isLoading ? <CircularProgress size={16} /> : null}
            </ListItemButton>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {routes.map((route) => (
                  <ListItemButton
                    key={route}
                    sx={{ pl: 6 }}
                    onClick={() => navigate(`/plugins/${plugin.id}/${route}`)}
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
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

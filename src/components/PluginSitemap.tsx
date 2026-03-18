import {
  List,
  ListItemButton,
  ListItemText,
  Box,
  IconButton,
  Typography,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from './Loading';
import { useTranslation } from 'react-i18next';

interface Props {
  plugins: PluginData[];
  routeState: RouteState;
  loadRoutes: (pluginId: number) => void;
}

export function PluginSitemap({ plugins, routeState, loadRoutes }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Box sx={{ my: 3, mx: 1 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('site map')}
      </Typography>
      <List component="nav" disablePadding>
        {plugins.map((plugin) => {
          const state = routeState[plugin.id];

          return (
            <Box key={plugin.id}>
              <ListItemButton onClick={() => loadRoutes(plugin.id)}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AppIcon.Extension fontSize="small" />
                </ListItemIcon>

                <ListItemText
                  primary={`${state?.routes ? '▾' : '▸'} ${plugin.package}`}
                  secondary={plugin.description}
                  slotProps={{
                    primary: {
                      noWrap: true,
                    },
                  }}
                />

                <Tooltip title="Edit Plugin">
                  <IconButton
                    size="small"
                    component={RouterLink}
                    to={`/plugins/${plugin.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AppIcon.Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemButton>

              {state?.loading ? (
                <LoadingSkeleton />
              ) : (
                state?.routes && (
                  <List component="div" disablePadding>
                    {state.routes.filter(Boolean).map((route) => (
                      <ListItemButton
                        key={route}
                        sx={{ pl: 6 }}
                        onClick={() => navigate(`/${plugin.id}/${route}`)}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <AppIcon.Route fontSize="small" />
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
    </Box>
  );
}

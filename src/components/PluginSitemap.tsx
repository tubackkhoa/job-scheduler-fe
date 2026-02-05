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
import { Edit, Extension, Route } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from './Loading';

interface Props {
  plugins: PluginData[];
  routeState: RouteState;
  loadRoutes: (pluginId: number) => void;
}

export function PluginSitemap({ plugins, routeState, loadRoutes }: Props) {
  const navigate = useNavigate();

  return (
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
                  {state.routes.filter(Boolean).map((route) => (
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
              )
            )}
          </Box>
        );
      })}
    </List>
  );
}

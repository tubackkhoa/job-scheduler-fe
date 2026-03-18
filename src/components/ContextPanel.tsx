import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
  Button,
  TextField,
  Autocomplete,
  ListItem,
  ListItemText,
} from '@mui/material';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Props {
  sessions: Session[];
  plugins: PluginData[];
  sessionId: number;
  pluginId: string | number;
  ctx?: any;
  onReloadPlugin: () => void;
  onCreatePlugin: () => void;
  isLoading: boolean;
}

export function ContextPanel({
  sessions,
  plugins,
  sessionId,
  ctx,
  pluginId,
  onReloadPlugin,
  onCreatePlugin,
  isLoading,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectedPlugin = plugins.find((p) => p.id === pluginId) || pluginId;

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        flex: 1,
        backgroundImage:
          'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 44,
              height: 44,
            }}
          >
            <AppIcon.Person />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {ctx.user?.username || 'Context'}
            </Typography>

            <Typography
              variant="body2"
              sx={{ textTransform: 'capitalize' }}
              color="text.secondary"
            >
              {t('choose session and plugin')}
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2.5}>
          {/* Session selector */}
          <FormControl fullWidth>
            <InputLabel>{t('session')}</InputLabel>
            <Select
              value={sessionId}
              onChange={(e) => {
                const newSessionId = Number(e.target.value);
                navigate(`/plugins/${pluginId}/sessions/${newSessionId}`);
              }}
              label={t('session')}
            >
              {sessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  {session.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Plugin selector (Autocomplete) */}
          <Autocomplete
            size="small"
            freeSolo
            fullWidth
            options={plugins}
            value={selectedPlugin}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              if (typeof option === 'number')
                return option > 0 ? option.toString() : '';
              return option?.package ?? '';
            }}
            isOptionEqualToValue={(opt: PluginData, val: PluginData) =>
              opt.id === val.id
            }
            onChange={(event, value: PluginData) => {
              const isUserPlugin = typeof value === 'string';
              const valueId = isUserPlugin ? value : value?.id;
              if (valueId) {
                navigate(
                  isUserPlugin
                    ? `/plugins/${valueId}`
                    : `/plugins/${valueId}/sessions/${sessionId}`,
                );
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Plugin"
                placeholder={t('select or type template plugin name')}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {Number(pluginId) > 0 && (
                          <InputAdornment position="start">
                            <Tooltip title={t('reload plugin (development)')}>
                              <IconButton
                                onClick={onReloadPlugin}
                                disabled={isLoading}
                                size="small"
                                color="warning"
                                sx={{
                                  p: 0,
                                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                                  '&:hover': {
                                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                                  },
                                }}
                              >
                                <AppIcon.Refresh
                                  sx={{
                                    animation: isLoading
                                      ? 'spin 1s linear infinite'
                                      : 'none',
                                    '@keyframes spin': {
                                      '0%': { transform: 'rotate(0deg)' },
                                      '100%': { transform: 'rotate(360deg)' },
                                    },
                                  }}
                                />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        )}
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            renderOption={({ key, ...props }, option: PluginData) => (
              <ListItem key={option.id} {...props} disablePadding>
                <ListItemText
                  primary={option.package}
                  secondary={option.description}
                  slotProps={{
                    primary: { noWrap: true },
                    secondary: { noWrap: true },
                  }}
                />
              </ListItem>
            )}
          />

          {/* Create plugin */}
          <Button
            variant="outlined"
            startIcon={<AppIcon.Add />}
            onClick={onCreatePlugin}
            disabled={isLoading}
            fullWidth
            sx={{
              mt: 1,
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              textTransform: 'capitalize',
              color: 'primary.main',
              '&:hover': {
                borderStyle: 'solid',
                bgcolor: 'rgba(99, 102, 241, 0.08)',
              },
            }}
          >
            {t('create new plugin')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

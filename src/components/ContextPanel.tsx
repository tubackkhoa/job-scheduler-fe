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
  Autocomplete
} from '@mui/material';
import { Refresh, Person, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function ContextPanel({
  sessions,
  plugins,
  sessionId,
  ctx,
  pluginId,
  onSessionChange,
  onReloadPlugin,
  onCreatePlugin,
  isLoading
}) {
  const navigate = useNavigate();

  const pluginOptions = plugins.map((p) => ({
    id: p.id,
    label: p.package,
    description: p.description,
    interval: p.interval
  }));

  const selectedPlugin =
    pluginOptions.find((p) => p.id === pluginId) || pluginId;

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        backgroundImage:
          'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 44,
              height: 44
            }}
          >
            <Person />
          </Avatar>
          <Box>
            {ctx?.user && (
              <Typography variant="h6" fontWeight={600}>
                {ctx.user.username || 'Context'}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Choose session and plugin
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2.5}>
          {/* Session selector */}
          <FormControl fullWidth>
            <InputLabel>Session</InputLabel>
            <Select
              value={sessionId}
              onChange={(e) => onSessionChange(Number(e.target.value))}
              label="Session"
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
            freeSolo
            fullWidth
            options={pluginOptions}
            value={selectedPlugin}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              if (typeof option === 'number')
                return option > 0 ? option.toString() : '';
              return option?.label ?? '';
            }}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            onChange={(event, value) => {
              const isUserPlugin = typeof value === 'string';
              const valueId = isUserPlugin ? value : value?.id;
              if (valueId) {
                navigate(
                  isUserPlugin
                    ? `/plugins/${valueId}`
                    : `/plugins/${valueId}/sessions/${sessionId}`
                );
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Plugin"
                placeholder="Select or type template plugin name"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        {pluginId > 0 && (
                          <InputAdornment position="start">
                            <Tooltip title="Reload plugin (development)">
                              <IconButton
                                onClick={onReloadPlugin}
                                disabled={isLoading}
                                size="small"
                                color="warning"
                                sx={{
                                  p: 0,
                                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                                  '&:hover': {
                                    bgcolor: 'rgba(245, 158, 11, 0.2)'
                                  }
                                }}
                              >
                                <Refresh
                                  sx={{
                                    animation: isLoading
                                      ? 'spin 1s linear infinite'
                                      : 'none',
                                    '@keyframes spin': {
                                      '0%': { transform: 'rotate(0deg)' },
                                      '100%': { transform: 'rotate(360deg)' }
                                    }
                                  }}
                                />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        )}
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }
                }}
              />
            )}
            renderOption={({ key, ...props }, option) => (
              <Tooltip
                arrow
                placement="right"
                title={option.description}
                key={option.id}
              >
                <Box component="li" {...props}>
                  <Stack width="100%">
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      interval {option.interval}s
                    </Typography>
                  </Stack>
                </Box>
              </Tooltip>
            )}
          />

          {/* Create plugin */}
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={onCreatePlugin}
            disabled={isLoading}
            fullWidth
            sx={{
              mt: 1,
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderStyle: 'solid',
                bgcolor: 'rgba(99, 102, 241, 0.08)'
              }
            }}
          >
            Create New Plugin
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

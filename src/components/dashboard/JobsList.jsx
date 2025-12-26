import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Stack,
  Chip,
  Switch,
} from '@mui/material';
import { Add } from '@mui/icons-material';

export function JobsList({
  jobs,
  selectedJobId,
  pluginPackage,
  onSelectJob,
  onToggleJob,
  onNewJob,
  disabled,
}) {
  const filteredJobs = jobs.filter((j) => j.id !== 0);

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title="Jobs"
        subheader="Select, start, pause, or add a job"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={onNewJob}
            disabled={disabled}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              },
            }}
          >
            New
          </Button>
        }
        slotProps={{
          title: {
            variant: 'h6',
            fontWeight: 600,
          },
          subheader: {
            variant: 'body2',
          },
        }}
      />
      <CardContent sx={{ pt: 0, maxHeight: 450, overflowY: 'auto' }}>
        <List disablePadding>
          {filteredJobs.map((job) => (
            <ListItemButton
              key={job.id}
              selected={selectedJobId === job.id}
              onClick={() => onSelectJob(job.id)}
              sx={{
                mb: 1,
                borderRadius: 2,
                border: 1,
                borderColor:
                  selectedJobId === job.id ? 'primary.main' : 'divider',
                bgcolor:
                  selectedJobId === job.id
                    ? 'rgba(99, 102, 241, 0.08)'
                    : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.light',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body1" fontWeight={500}>
                      {job.description || 'Untitled job'}
                    </Typography>
                    <Chip
                      label={job.active ? 'Active' : 'Paused'}
                      size="small"
                      color={job.active ? 'success' : 'default'}
                      variant={job.active ? 'filled' : 'outlined'}
                      icon={
                        job.active ? (
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'success.light',
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                              },
                            }}
                          />
                        ) : undefined
                      }
                      sx={{ height: 24 }}
                    />
                  </Stack>
                }
                secondary={
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    #{job.id} • {pluginPackage || 'Plugin'}
                  </Typography>
                }
              />
              <Switch
                edge="end"
                checked={!!job.active}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleJob(job.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                color="success"
              />
            </ListItemButton>
          ))}

          {filteredJobs.length === 0 && (
            <Box
              sx={{
                py: 6,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No jobs yet. Pick a plugin to load defaults.
              </Typography>
            </Box>
          )}
        </List>
      </CardContent>
    </Card>
  );
}

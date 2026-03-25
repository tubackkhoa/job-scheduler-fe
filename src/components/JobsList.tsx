import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Stack,
  Chip,
  Switch,
  CircularProgress,
  Autocomplete,
  TextField,
  ListItemText,
  ListItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface JobsListProps {
  jobs: Job[];
  selectedJobId: number;
  pluginPackage?: string;
  pluginId: string | number;
  sessionId: number;
  onToggleJob: (active: boolean, jobId: number) => void | Promise<void>;
  onNewJob: () => void;
  isNewJobMode: boolean;
  disabled?: boolean;
  togglingJobId: number | null;
}

export function JobsList({
  jobs,
  selectedJobId,
  pluginPackage,
  pluginId,
  sessionId,
  onToggleJob,
  onNewJob,
  isNewJobMode,
  disabled,
  togglingJobId,
}: JobsListProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const filteredJobs = jobs.filter((j) => j.id !== 0);

  const selectedJob = filteredJobs.find((j) => j.id === selectedJobId) || null;

  return (
    <Card>
      <CardHeader
        title={t('job')}
        subheader={t('select, start, pause, or add a job')}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AppIcon.Add />}
            onClick={onNewJob}
            disabled={disabled}
          >
            {t('new')}
          </Button>
        }
      />

      <CardContent sx={{ pt: 0 }}>
        {isNewJobMode && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              border: 2,
              borderColor: 'secondary.main',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AppIcon.NoteAdd sx={{ color: 'secondary.main' }} />

              <Typography fontWeight={600} color="secondary.main">
                ✨ Creating New Job
              </Typography>

              <Chip label="Draft" size="small" color="secondary" />
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Fill in the form and save to create this job
            </Typography>
          </Box>
        )}

        {filteredJobs.length > 0 ? (
          <Autocomplete
            size="small"
            options={filteredJobs}
            value={selectedJob}
            disabled={disabled}
            getOptionLabel={(option) =>
              option.description || `Job #${option.id}`
            }
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(e, job) => {
              if (!job) return;

              navigate(
                `/plugins/${pluginId}/sessions/${sessionId}/jobs/${job.id}`,
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Job"
                placeholder="Search jobs..."
              />
            )}
            renderOption={({ key, ...props }, job) => {
              const updating = togglingJobId === job.id;
              const active = !!job.active;

              return (
                <ListItem component="li" key={job.id} {...props}>
                  <ListItemText
                    slotProps={{
                      primary: { noWrap: true },
                      secondary: { noWrap: true },
                    }}
                    primary={job.description || 'Untitled job'}
                    secondary={`#${job.id} • ${pluginPackage || 'Plugin'}`}
                  />

                  <Stack alignItems="flex-end">
                    <Chip
                      size="small"
                      label={
                        updating ? 'Updating...' : active ? 'Active' : 'Paused'
                      }
                      color={
                        updating ? 'default' : active ? 'success' : 'default'
                      }
                      variant={active ? 'filled' : 'outlined'}
                      icon={
                        updating ? <CircularProgress size={12} /> : undefined
                      }
                      sx={{
                        height: 20,
                        flexShrink: 0,
                      }}
                    />
                    <Switch
                      checked={active}
                      disabled={updating}
                      size="small"
                      color="success"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleJob(e.target.checked, job.id);
                      }}
                    />
                  </Stack>
                </ListItem>
              );
            }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{ py: 4, textAlign: 'center' }}
            color="text.secondary"
          >
            No jobs yet. Pick a plugin to load defaults.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

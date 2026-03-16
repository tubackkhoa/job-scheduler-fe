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
} from '@mui/material';
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

  const filteredJobs = jobs.filter((j) => j.id !== 0);

  const selectedJob = filteredJobs.find((j) => j.id === selectedJobId) || null;

  return (
    <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
      <CardHeader
        title="Jobs"
        subheader="Select, start, pause, or add a job"
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<AppIcon.Add />}
            onClick={onNewJob}
            disabled={disabled}
          >
            New
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
                <Box component="li" key={job.id} {...props}>
                  <Stack
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Title */}
                    <Typography fontWeight={500}>
                      {job.description || 'Untitled job'}
                      <Chip
                        size="small"
                        label={
                          updating
                            ? 'Updating...'
                            : active
                              ? 'Active'
                              : 'Paused'
                        }
                        color={
                          updating ? 'default' : active ? 'success' : 'default'
                        }
                        variant={active ? 'filled' : 'outlined'}
                        icon={
                          updating ? <CircularProgress size={12} /> : undefined
                        }
                        sx={{
                          float: 'right',
                          ml: 1,
                          height: 20,
                          flexShrink: 0,
                        }}
                      />
                    </Typography>

                    <Typography variant="caption" color="text.secondary" noWrap>
                      #{job.id} • {pluginPackage || 'Plugin'}
                    </Typography>
                  </Stack>

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
                    sx={{ mt: -3, ml: 1 }}
                  />
                </Box>
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

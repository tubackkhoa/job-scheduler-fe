import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Typography,
  Stack,
  Tabs,
  CircularProgress,
  Tab,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Settings,
  Terminal,
  Delete,
  Save,
  AddCircleOutline,
  SignalCellularAlt,
  SettingsApplications
} from '@mui/icons-material';
import { ConfigForm } from './ConfigForm';
import LogViewer from '../../LogViewer';
import SignalsLogsViewer from '../../SignalsLogsViewer';
import JinjaEnvDocs from './JinjaEnvDocs';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function JobDetails({
  jobId,
  jobDesc,
  pluginPackage,
  pluginInterval,
  isActive,
  formData,
  schema,
  env,
  onDescChange,
  onToggleActive,
  onSave,
  onSaveAsNew,
  onDelete,
  isSubmitting
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [localFormData, setLocalFormData] = useState();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  if (!schema) {
    return (
      <Card
        sx={{
          bgcolor: 'background.paper',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        {pluginPackage ? (
          <CircularProgress />
        ) : (
          <Typography variant="body1" color="text.secondary">
            Pick a plugin to load its schema and jobs.
          </Typography>
        )}
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title="Job Details"
        subheader={
          pluginPackage
            ? `${pluginPackage} • every ${pluginInterval}s`
            : 'Select a plugin to begin'
        }
        action={
          jobId !== 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant={isActive ? 'outlined' : 'contained'}
                color={isActive ? 'warning' : 'success'}
                size="small"
                startIcon={isActive ? <Pause /> : <PlayArrow />}
                onClick={onToggleActive}
                disabled={isSubmitting}
              >
                {isActive ? 'Pause' : 'Start'}
              </Button>
            </Stack>
          )
        }
        slotProps={{
          title: {
            variant: 'h6',
            fontWeight: 600
          },
          subheader: {
            variant: 'body2',
            sx: {
              wordBreak: 'break-word'
            }
          }
        }}
      />

      <Divider />

      <CardContent>
        <Stack spacing={3}>
          {/* Description field */}
          <TextField
            label="Description"
            value={jobDesc}
            onChange={(e) => onDescChange(e.target.value)}
            placeholder="Short note for this job"
            fullWidth
          />

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              value={tabIndex}
              onChange={(_, v) => {
                setTabIndex(v);
                // Prevent scroll jump
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 0);
              }}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none'
                }
              }}
            >
              <Tab
                icon={<Settings sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Config Form"
              />
              <Tab
                icon={<SettingsApplications sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Environment"
              />
              <Tab
                icon={<Terminal sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Live Logs"
              />
              {schema.keyword && (
                <Tab
                  icon={<SignalCellularAlt sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Signals Logs"
                />
              )}
            </Tabs>
          </Box>

          {/* Tab panels */}
          <TabPanel value={tabIndex} index={0}>
            <ConfigForm
              pluginPackage={pluginPackage}
              schema={schema}
              env={env}
              formData={localFormData ?? formData}
              onChange={(data) => {
                setIsDirty(true);
                setLocalFormData(data);
              }}
            />
          </TabPanel>

          <TabPanel value={tabIndex} index={1}>
            <JinjaEnvDocs
              data={env}
              pluginPackage={pluginPackage}
              params={formData}
            />
          </TabPanel>

          <TabPanel value={tabIndex} index={2}>
            <LogViewer jobId={jobId} description={jobDesc} />
          </TabPanel>

          {schema.keyword && (
            <TabPanel value={tabIndex} index={3}>
              <SignalsLogsViewer
                jobId={jobId}
                description={jobDesc}
                keyword={schema.keyword}
              />
            </TabPanel>
          )}

          {/* Actions */}
          <Divider />
          {isDirty && (
            <Typography variant="caption" color="warning.main">
              You have unsaved changes
            </Typography>
          )}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            gap={2}
          >
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => {
                setIsDirty(false);
                onSave(localFormData);
              }}
              disabled={isSubmitting}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                }
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
            {jobId > 0 && (
              <Button
                variant="outlined"
                startIcon={<AddCircleOutline />}
                onClick={() => {
                  setIsDirty(false);
                  onSaveAsNew(localFormData);
                }}
                disabled={isSubmitting}
              >
                Save new
              </Button>
            )}

            {jobId !== 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={onDelete}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

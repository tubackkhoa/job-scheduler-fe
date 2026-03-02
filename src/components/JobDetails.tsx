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
  Divider,
} from '@mui/material';
import { ConfigForm } from './ConfigForm';
import LogViewer from './LogViewer';
import SignalsLogsViewer from './SignalsLogsViewer';
import JinjaEnvDocs from './JinjaEnvDocs';
import api from '@/api';
import UserPluginCode from './UserPluginCode';
import { LoadingSkeleton } from './Loading';
import useNotifications from '@/hooks/useNotifications/useNotifications';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';

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
  pluginId,
  onRefresh,
  sessionId,
  jobDesc,
  pluginPackage,
  pluginInterval,
  setError,
  isActive,
  formData,
  schema,
  env,
  onDescChange,
  onToggleActive,
  onSave,
  onSaveAsNew,
  onDelete,
  isSubmitting,
  isToggling,
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [localFormData, setLocalFormData] = useState();
  const [isDirty, setIsDirty] = useState(false);
  const notifications = useNotifications();
  const { confirm } = useDialogs();

  useEffect(() => {
    setLocalFormData(formData);
    setIsDirty(false);
    if (tabIndex !== 0) {
      setTabIndex(0);
    }
  }, [formData]);

  if (!schema) {
    return (
      <Card
        sx={{
          bgcolor: 'background.paper',
          minHeight: 400,
          p: 3,
        }}
      >
        {pluginPackage ? (
          <LoadingSkeleton size={2} />
        ) : (
          <Typography variant="body1" color="text.secondary">
            Pick a plugin to load its schema and jobs.
          </Typography>
        )}
      </Card>
    );
  }

  const isUserPlugin = typeof pluginId === 'string';

  // -------------------------
  // Confirm Handlers
  // -------------------------

  const handleSave = async () => {
    if (typeof pluginId === 'string') {
      return onSave(localFormData);
    }

    const confirmed = await confirm(
      'Are you sure you want to save these changes?',
      {
        title: 'Save Job Configuration',
        details:
          'This will update the job configuration. If you have selected a SQL version, the SQL value from that version will be used to run the job.\n\nNote: The preview value will be replaced by the saved version value.',
        severity: 'warning',
        okText: 'Save Changes',
      },
    );

    if (!confirmed) return;

    setIsDirty(false);
    await onSave(localFormData);
  };

  const handleSaveAsNew = async () => {
    const confirmed = await confirm(
      'Are you sure you want to create a new job with this configuration?',
      {
        title: 'Create New Job',
        details:
          'This will create a new job entry. If you have selected a SQL version, the SQL value from that version will be used to run the new job.\n\nNote: The preview value will be replaced by the saved version value.',
        severity: 'info',
        okText: 'Create New Job',
      },
    );

    if (!confirmed) return;

    setIsDirty(false);
    await onSaveAsNew(localFormData);
  };

  const handleDelete = async () => {
    const confirmed = await confirm(
      'Are you sure you want to delete this job?',
      {
        title: 'Delete Job',
        details:
          'This action cannot be undone. The job and all its configuration will be permanently deleted.',
        severity: 'error',
        okText: 'Delete Job',
      },
    );

    if (!confirmed) return;

    await onDelete();
  };

  return (
    <Card sx={{ bgcolor: 'background.paper', p: 1 }}>
      <CardHeader
        title={isUserPlugin ? 'User Plugin' : 'Job Details'}
        subheader={
          pluginPackage
            ? `${pluginPackage}${pluginInterval ? ` • every ${pluginInterval}s` : ''}`
            : 'Select a plugin to begin'
        }
        action={
          (typeof pluginId == 'string' || jobId !== 0) && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant={isActive ? 'outlined' : 'contained'}
                color={isActive ? 'warning' : 'success'}
                size="small"
                startIcon={
                  isToggling ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : isActive ? (
                    <AppIcon.Pause />
                  ) : (
                    <AppIcon.PlayArrow />
                  )
                }
                onClick={async () => {
                  if (typeof pluginId === 'string') {
                    try {
                      const result = await api.runTemplatePlugin(
                        pluginId,
                        localFormData,
                      );
                      notifications.show(result, { severity: 'success' });
                      setIsDirty(false);
                    } catch (e) {
                      setError(e.message);
                    }
                    return;
                  }
                  onToggleActive();
                }}
                disabled={isSubmitting || isToggling}
              >
                {typeof pluginId == 'string'
                  ? 'Run'
                  : isToggling
                    ? 'Processing...'
                    : isActive
                      ? 'Pause'
                      : 'Start'}
              </Button>
            </Stack>
          )
        }
        slotProps={{
          title: {
            variant: 'h6',
            fontWeight: 600,
          },
          subheader: {
            variant: 'body2',
            sx: {
              wordBreak: 'break-word',
            },
          },
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
              }}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                value={0}
                icon={<AppIcon.Settings sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Config Form"
              />
              <Tab
                value={1}
                icon={<AppIcon.SettingsApplications sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Environment"
              />

              <Tab
                value={2}
                icon={<AppIcon.Terminal sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Live Logs"
              />

              {schema.keyword && (
                <Tab
                  value={3}
                  icon={<AppIcon.SignalCellularAlt sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Signals Logs"
                />
              )}

              {isUserPlugin && (
                <Tab
                  value={4}
                  icon={<AppIcon.Code sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Code"
                />
              )}
            </Tabs>
          </Box>

          {/* Tab panels */}
          <TabPanel value={tabIndex} index={0}>
            {localFormData && (
              <ConfigForm
                pluginId={pluginId}
                pluginPackage={pluginPackage}
                schema={schema}
                sessionId={sessionId}
                env={env}
                formData={localFormData}
                onChange={(data) => {
                  setIsDirty(true);
                  setLocalFormData(data);
                }}
              />
            )}
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
                setError={setError}
                jobId={jobId}
                description={jobDesc}
              />
            </TabPanel>
          )}

          {isUserPlugin && (
            <TabPanel value={tabIndex} index={4}>
              <UserPluginCode
                pluginPackage={pluginPackage}
                onRefresh={onRefresh}
                formData={localFormData}
                setError={setError}
                env={env}
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
              startIcon={<AppIcon.Save />}
              onClick={handleSave}
              disabled={isSubmitting}
              color="primary"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
            {jobId > 0 && (
              <Button
                variant="outlined"
                startIcon={<AppIcon.AddCircleOutline />}
                onClick={handleSaveAsNew}
                disabled={isSubmitting}
              >
                Save new
              </Button>
            )}

            {jobId !== 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<AppIcon.Delete />}
                onClick={handleDelete}
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

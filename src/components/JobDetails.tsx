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
import { ConfirmationDialog } from './ConfirmationDialog';
import {
  PlayArrow,
  Pause,
  Settings,
  Terminal,
  Delete,
  Save,
  AddCircleOutline,
  SignalCellularAlt,
  SettingsApplications,
  Code
} from '@mui/icons-material';

import { ConfigForm } from './ConfigForm';
import LogViewer from './LogViewer';
import SignalsLogsViewer from './SignalsLogsViewer';
import JinjaEnvDocs from './JinjaEnvDocs';
import api from '@/api';
import UserPluginCode from './UserPluginCode';

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
  setResult,
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
  isSubmitting
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [localFormData, setLocalFormData] = useState();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null // 'save', 'saveAsNew', 'delete'
  });

  const openConfirmDialog = (type) => setConfirmDialog({ open: true, type });
  const closeConfirmDialog = () =>
    setConfirmDialog({ open: false, type: null });

  const handleConfirm = () => {
    closeConfirmDialog();
    setIsDirty(false);

    switch (confirmDialog.type) {
      case 'save':
        onSave(localFormData);
        break;
      case 'saveAsNew':
        onSaveAsNew(localFormData);
        break;
      case 'delete':
        onDelete();
        break;
      default:
        break;
    }
  };

  const getConfirmDialogProps = () => {
    switch (confirmDialog.type) {
      case 'save':
        return {
          title: 'Save Job Configuration',
          message: 'Are you sure you want to save these changes?',
          details:
            'This will update the job configuration. If you have selected a SQL version, the SQL value from that version will be used to run the job.\n\nNote: The preview value will be replaced by the saved version value.',
          severity: 'warning',
          confirmText: 'Save Changes'
        };
      case 'saveAsNew':
        return {
          title: 'Create New Job',
          message:
            'Are you sure you want to create a new job with this configuration?',
          details:
            'This will create a new job entry. If you have selected a SQL version, the SQL value from that version will be used to run the new job.\n\nNote: The preview value will be replaced by the saved version value.',
          severity: 'info',
          confirmText: 'Create New Job'
        };
      case 'delete':
        return {
          title: 'Delete Job',
          message: 'Are you sure you want to delete this job?',
          details:
            'This action cannot be undone. The job and all its configuration will be permanently deleted.',
          severity: 'error',
          confirmText: 'Delete Job'
        };
      default:
        return {};
    }
  };

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

  const isUserPlugin = typeof pluginId === 'string';

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
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
                startIcon={isActive ? <Pause /> : <PlayArrow />}
                onClick={async () => {
                  if (typeof pluginId === 'string') {
                    try {
                      const result = await api.runTemplatePlugin(
                        pluginId,
                        localFormData
                      );
                      setResult(result);
                      setIsDirty(false);
                    } catch (e) {
                      setError(e.message);
                    }
                    return;
                  }
                  onToggleActive();
                }}
                disabled={isSubmitting}
              >
                {typeof pluginId == 'string'
                  ? 'Run'
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
              }}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none'
                }
              }}
            >
              <Tab
                value={0}
                icon={<Settings sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Config Form"
              />
              <Tab
                value={1}
                icon={<SettingsApplications sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Environment"
              />

              <Tab
                value={2}
                icon={<Terminal sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Live Logs"
              />

              {schema.keyword && (
                <Tab
                  value={3}
                  icon={<SignalCellularAlt sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Signals Logs"
                />
              )}

              {isUserPlugin && (
                <Tab
                  value={4}
                  icon={<Code sx={{ fontSize: 18 }} />}
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
                keyword={schema.keyword}
              />
            </TabPanel>
          )}

          {isUserPlugin && (
            <TabPanel value={tabIndex} index={4}>
              <UserPluginCode
                pluginPackage={pluginPackage}
                onRefresh={onRefresh}
                formData={localFormData}
                setResult={setResult}
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
              startIcon={<Save />}
              onClick={() => {
                if (typeof pluginId === 'string') {
                  return onSave(localFormData);
                }
                openConfirmDialog('save');
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
                onClick={() => openConfirmDialog('saveAsNew')}
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
                onClick={() => openConfirmDialog('delete')}
                disabled={isSubmitting}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirm}
        isLoading={isSubmitting}
        {...getConfirmDialogProps()}
      />
    </Card>
  );
}

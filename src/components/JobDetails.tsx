import React, { useState, useEffect } from 'react';
import {
  Box,
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
import useNotifications from '@/hooks/useNotifications/useNotifications';
import { useDialogs } from '@/hooks/useDialogs/useDialogs';
import { useTranslation } from 'react-i18next';
import { getDefaultFormState } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

function TabPanel(
  props: React.PropsWithChildren<{ value: number; index: number }>,
) {
  const { children, value, index, ...other } = props;
  return (
    <Box role="tabpanel" hidden={value !== index} {...other}>
      {value === index && children}
    </Box>
  );
}

export function JobDetails({
  jobId,
  pluginId,
  onRefresh,
  sessionId,
  jobDesc,
  jobCronExpr,
  pluginPackage,
  setError,
  isActive,
  formData,
  schema,
  env,
  onDescChange,
  onCronExprChange,
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
  const { t } = useTranslation();

  useEffect(() => {
    const localData = getDefaultFormState(validator, schema, formData, schema);
    setLocalFormData(localData);
    setIsDirty(false);
  }, [formData]);

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
          'This will update the job configuration. If you have selected a value version, the value from that version will be used to run the job.\n\nNote: The preview value will be replaced by the saved version value.',
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
          'This will create a new job entry. If you have selected a value version, the value from that version will be used to run the new job.\n\nNote: The preview value will be replaced by the saved version value.',
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
    <>
      <CardHeader
        title={isUserPlugin ? t('user plugin') : t('job details')}
        subheader={
          pluginPackage ? `${pluginPackage}` : t('select a plugin to begin')
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
                    ? t('processing') + '...'
                    : isActive
                      ? t('pause')
                      : t('start')}
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
          <TextField
            label={t('cron expression')}
            value={jobCronExpr}
            onChange={(e) => onCronExprChange(e.target.value)}
            fullWidth
            helperText={t('format: second minute hour day month weekday')}
          />

          <TextField
            label={t('description')}
            value={jobDesc}
            onChange={(e) => onDescChange(e.target.value)}
            placeholder={t('short note for this job')}
            fullWidth
          />

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
                },
              }}
            >
              <Tab
                value={0}
                icon={<AppIcon.Settings sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={t('config form')}
              />
              <Tab
                value={1}
                icon={<AppIcon.SettingsApplications sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={t('environment')}
              />

              <Tab
                value={2}
                icon={<AppIcon.Terminal sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={t('live logs')}
              />

              {schema.keyword && (
                <Tab
                  value={3}
                  icon={<AppIcon.SignalCellularAlt sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={t('signals logs')}
                />
              )}

              {isUserPlugin && (
                <Tab
                  value={4}
                  icon={<AppIcon.Code sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={t('code')}
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
              onPointerDown={handleSave}
              disabled={isSubmitting}
              color="primary"
            >
              {isSubmitting ? t('saving') + '...' : t('save')}
            </Button>
            {jobId > 0 && (
              <Button
                variant="outlined"
                startIcon={<AppIcon.AddCircleOutline />}
                onPointerDown={handleSaveAsNew}
                disabled={isSubmitting}
              >
                {t('save new')}
              </Button>
            )}

            {jobId !== 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<AppIcon.Delete />}
                onPointerDown={handleDelete}
                disabled={isSubmitting}
              >
                {t('delete')}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </>
  );
}

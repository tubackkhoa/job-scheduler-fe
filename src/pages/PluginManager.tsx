import { Box, Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { ContextPanel } from '../components/ContextPanel';
import { JobsList } from '../components/JobsList';
import { JobDetails } from '../components/JobDetails';
import { CreatePluginModal } from '../components/CreatePluginModal';
import { SESSIONS, JINJA_ENV } from '../constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDefaultFormState } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import api from '@/api';
import { useParams } from 'react-router-dom';
import useNotifications from '@/hooks/useNotifications/useNotifications';
import storage from '@/storage';

export default function PluginManager({ setLoading, setError }) {
  const { plugin_id, session_id, job_id } = useParams<{
    plugin_id?: string;
    session_id?: string;
    job_id?: string;
  }>();

  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [pluginId, setPluginId] = useState<string | number>(0);
  const [sessionId, setSessionId] = useState(SESSIONS[0].id);

  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState(0);
  const [jobDesc, setJobDesc] = useState('');
  const [jobCronExpr, setJobCronExpr] = useState('');
  const [isNewJobMode, setIsNewJobMode] = useState(false);

  const [schema, setSchema] = useState<any>(null);
  const [env, setEnv] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [createPluginModalOpen, setCreatePluginModalOpen] = useState(false);

  const notifications = useNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(() =>
    storage.getPanelOpen(),
  );

  /* ----------------------------------------
   * Initial load (plugins list)
   * ------------------------------------- */
  useEffect(() => {
    api
      .fetchPlugins()
      .then(setPlugins)
      .catch((err) => setError(err.message));
  }, []);

  /* ----------------------------------------
   * Plugin change (ONLY when plugin_id changes)
   * ------------------------------------- */
  useEffect(() => {
    if (!plugin_id || plugins.length === 0) return;

    const resolved = Number.isNaN(Number(plugin_id))
      ? plugin_id
      : Number(plugin_id);

    if (resolved === pluginId) return;

    loadSchema(resolved, sessionId);
  }, [plugin_id, plugins]);

  /* ----------------------------------------
   * Session change (URL-driven)
   * ------------------------------------- */
  useEffect(() => {
    if (!session_id) return;

    const next = Number(session_id);
    if (next === sessionId) return;

    setSessionId(next);
    loadSchema(pluginId, next);
  }, [session_id]);

  /* ----------------------------------------
   * Job change (URL-driven, no reload)
   * ------------------------------------- */
  useEffect(() => {
    if (!job_id || jobs.length === 0) return;

    const next = Number(job_id);
    if (next === jobId) return;
    handleChangeJob(next, jobs);
  }, [job_id, jobs]);

  /* ----------------------------------------
   * Core loaders
   * ------------------------------------- */
  const loadSchema = async (
    targetPluginId: string | number,
    targetSessionId?: number,
    targetJobId?: number,
  ) => {
    if (!targetPluginId) return;

    setPluginId(targetPluginId);
    setLoading(true);
    setError(null);

    setSchema(null);
    setJobs([]);

    try {
      const response =
        typeof targetPluginId === 'string'
          ? await api.fetchTemplatePluginSchema(targetPluginId)
          : await api.fetchSchema(targetSessionId ?? sessionId, targetPluginId);

      const { schema, jobs, user, globals } = response;
      const sortedJobs = jobs.sort((a, b) => a.id - b.id);
      setEnv({ ...JINJA_ENV, globals: { ...JINJA_ENV.globals, ...globals } });
      setSchema(schema);
      setJobs(sortedJobs);

      const resolvedJobId = targetJobId ?? sortedJobs[0]?.id ?? 0;
      handleChangeJob(resolvedJobId, sortedJobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
   * Job helpers
   * ------------------------------------- */
  const handleChangeJob = async (newJobId: number, sourceJobs: Job[]) => {
    const job = sourceJobs.find((j) => j.id === newJobId);
    if (!job) throw new Error('Job not found');

    let finalJob = job;

    if (!job.config) {
      const config = await api.getJobConfig(newJobId);
      finalJob = { ...job, config };
      setJobs((prev) => prev.map((j) => (j.id === newJobId ? finalJob : j)));
    }

    setJobId(newJobId);
    setIsNewJobMode(false);
    setJobDesc(finalJob.description ?? '');
    setJobCronExpr(finalJob.cron_expr);
  };

  const handleNewJob = useCallback(() => {
    setIsNewJobMode(true);
    setJobId(0);
    setJobDesc('');
    setJobCronExpr('');
  }, []);

  const [togglingJobId, setTogglingJobId] = useState<number | null>(null);

  const handleJobActivation = useCallback(
    async (active: boolean, targetJobId = jobId) => {
      if (!targetJobId) return;

      setTogglingJobId(targetJobId);
      try {
        const response = await api.activateJob(targetJobId, active);
        if (response.success) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === targetJobId ? { ...j, active: active ? 1 : 0 } : j,
            ),
          );
          notifications.show(
            `Plugin ${active ? 'activated' : 'deactivated'} successfully`,
            {
              severity: 'success',
            },
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setTogglingJobId(null);
      }
    },
    [jobId],
  );

  /* ----------------------------------------
   * Submit / delete
   * ------------------------------------- */
  const handleSubmit = async ({ formData, saveNew = false }) => {
    if (!pluginId) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        config: formData,
        description: jobDesc,
        cron_expr: jobCronExpr,
      };

      if (typeof pluginId === 'string') {
        await api.updateTemplatePlugin(pluginId, payload);
      } else {
        const data =
          saveNew || !jobId
            ? { ...payload, plugin_id: pluginId, session_id: sessionId }
            : payload;
        await api.saveJob(saveNew || !jobId ? 0 : jobId, data);
      }
      notifications.show('Update config successfully!', {
        severity: 'success',
      });
      await loadSchema(pluginId, sessionId, jobId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobId) return;

    setSubmitting(true);
    try {
      await api.deleteJob(jobId);
      await loadSchema(pluginId, sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reloadPlugin = async () => {
    if (!pluginId) return;

    setSubmitting(true);
    setError(null);

    try {
      const pkg = plugins.find((p) => p.id === pluginId).package;
      const response = await api.reloadPlugin(pkg);
      if (response.success)
        notifications.show('Plugin reloaded successfully', {
          severity: 'success',
        });
      // update schema
      loadSchema(pluginId, sessionId, jobId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlugin = async (data: PluginData) => {
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await api.createPlugin(data.package, data.description);
      // new plugin data
      const newPlugin: PluginData = {
        ...data,
        id,
      };
      setPlugins((prev) => [...prev, newPlugin]);
      notifications.show('Plugin created successfully', {
        severity: 'success',
      });
      setCreatePluginModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------------------
   * Memoized derived state
   * ------------------------------------- */

  const pluginInfo = useMemo(
    () =>
      typeof pluginId === 'number'
        ? plugins.find((p) => p.id === pluginId)
        : { package: pluginId },
    [pluginId, plugins],
  );

  const currentJob = jobs.find((j) => j.id === jobId);

  const formData = useMemo(() => {
    if (!schema) return undefined;

    return getDefaultFormState(validator, schema, currentJob?.config, schema);
  }, [schema, currentJob]);

  const isActive = !!currentJob?.active;
  const panelOpen = isMobile || isPanelOpen;

  /* ----------------------------------------
   * Render
   * ------------------------------------- */
  return (
    <>
      {!isMobile && (
        <IconButton
          size="small"
          onClick={() =>
            setIsPanelOpen((v) => {
              const newState = !v;
              storage.setPanelOpen(newState);
              return newState;
            })
          }
          sx={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            bgcolor: 'action.hover',
            '&:hover': {
              bgcolor: 'action.focus',
            },
            zIndex: 9999,
          }}
        >
          {isPanelOpen ? <AppIcon.ChevronLeft /> : <AppIcon.ChevronRight />}
        </IconButton>
      )}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: panelOpen ? 4 : 12 }}>
          <Box
            sx={{
              display: 'flex',
              position: 'sticky',
              top: 150,
              flexDirection: panelOpen ? 'column' : 'row',
              gap: 3,
            }}
          >
            <ContextPanel
              sessions={SESSIONS}
              plugins={plugins}
              ctx={window.ctx}
              sessionId={sessionId}
              pluginId={pluginId}
              onReloadPlugin={reloadPlugin}
              onCreatePlugin={() => setCreatePluginModalOpen(true)}
              isLoading={submitting}
            />

            {typeof pluginId === 'number' && (
              <JobsList
                jobs={jobs}
                pluginId={pluginId}
                selectedJobId={jobId}
                pluginPackage={pluginInfo?.package}
                sessionId={sessionId}
                onToggleJob={handleJobActivation}
                onNewJob={handleNewJob}
                isNewJobMode={isNewJobMode}
                disabled={!schema}
                togglingJobId={togglingJobId}
              />
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: panelOpen ? 8 : 12 }}>
          <JobDetails
            jobId={jobId}
            jobDesc={jobDesc}
            jobCronExpr={jobCronExpr}
            pluginPackage={pluginInfo?.package}
            isActive={isActive}
            onRefresh={() => loadSchema(pluginId, sessionId, jobId)}
            setError={setError}
            formData={formData}
            schema={schema}
            env={env}
            sessionId={sessionId}
            pluginId={pluginId}
            isSubmitting={submitting}
            onCronExprChange={setJobCronExpr}
            onDescChange={setJobDesc}
            onToggleActive={() => handleJobActivation(!isActive)}
            onSave={(data) => handleSubmit({ formData: data })}
            isToggling={togglingJobId === jobId}
            onSaveAsNew={(data) =>
              handleSubmit({ formData: data, saveNew: true })
            }
            onDelete={handleDeleteJob}
          />
        </Grid>
      </Grid>

      <CreatePluginModal
        open={createPluginModalOpen}
        onClose={() => setCreatePluginModalOpen(false)}
        onSubmit={handleCreatePlugin}
        isLoading={submitting}
      />
    </>
  );
}

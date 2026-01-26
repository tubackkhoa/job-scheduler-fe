import { Box, Grid } from '@mui/material';
import { ContextPanel } from '../components/ContextPanel';
import { JobsList } from '../components/JobsList';
import { JobDetails } from '../components/JobDetails';
import { ResponseCard } from '../components/ResponseCard';
import { CreatePluginModal } from '../components/CreatePluginModal';
import { SESSIONS } from '../constants/session';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDefaultFormState } from '@rjsf/utils';
import api from '@/api';
import { getEnvDoc } from '@/utils';
import { useParams } from 'react-router-dom';

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
  const [isNewJobMode, setIsNewJobMode] = useState(false);

  const [schema, setSchema] = useState<any>(null);
  const [env, setEnv] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [createPluginModalOpen, setCreatePluginModalOpen] = useState(false);

  const mountedRef = useRef(false);

  /* ----------------------------------------
   * Initial load (plugins list)
   * ------------------------------------- */
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

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
    targetJobId?: number
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

      window.ctx = { user };
      setEnv(await getEnvDoc(globals));
      setSchema(schema);
      setJobs(jobs);

      const resolvedJobId = targetJobId ?? jobs[0]?.id ?? 0;
      handleChangeJob(resolvedJobId, jobs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------
   * Job helpers
   * ------------------------------------- */
  const handleChangeJob = useCallback(
    (newJobId: number, sourceJobs?: any[]) => {
      setJobId(newJobId);
      setIsNewJobMode(false);

      const list = sourceJobs ?? jobs;
      const found = list.find((j) => j.id === newJobId);
      setJobDesc(found?.description ?? '');
    },
    [jobs]
  );

  const handleNewJob = useCallback(() => {
    setIsNewJobMode(true);
    setJobId(0);
    setJobDesc('');
  }, []);

  const handleJobActivation = useCallback(
    async (active: boolean, targetJobId = jobId) => {
      if (!targetJobId) return;

      try {
        const response = await api.activateJob(targetJobId, active);
        if (response.success) {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === targetJobId ? { ...j, active: active ? 1 : 0 } : j
            )
          );
        }
        setResult(response);
      } catch (err: any) {
        setError(err.message);
      }
    },
    [jobId]
  );

  /* ----------------------------------------
   * Submit / delete
   * ------------------------------------- */
  const handleSubmit = async ({ formData, saveNew = false }) => {
    if (!pluginId) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = { config: formData, description: jobDesc };

      if (typeof pluginId === 'string') {
        await api.updateTemplatePlugin(pluginId, payload);
      } else {
        await api.updateConfig(
          saveNew || !jobId ? 0 : jobId,
          saveNew ? { ...payload, pluginId, sessionId } : payload
        );
      }

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

  /* ----------------------------------------
   * Memoized derived state
   * ------------------------------------- */
  const pluginInfo = useMemo(
    () =>
      typeof pluginId === 'number'
        ? plugins.find((p) => p.id === pluginId)
        : { package: pluginId, interval: 0 },
    [pluginId, plugins]
  );

  const currentJob = useMemo(
    () => jobs.find((j) => j.id === jobId),
    [jobs, jobId]
  );

  const formData = useMemo(
    () =>
      currentJob?.config ??
      (isNewJobMode && schema
        ? getDefaultFormState(schema, undefined, schema)
        : undefined),
    [currentJob, isNewJobMode, schema]
  );

  const isActive = !!currentJob?.active;

  /* ----------------------------------------
   * Render
   * ------------------------------------- */
  return (
    <>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ContextPanel
              sessions={SESSIONS}
              plugins={plugins}
              ctx={window.ctx}
              sessionId={sessionId}
              pluginId={pluginId}
              onSessionChange={setSessionId}
              onReloadPlugin={() => loadSchema(pluginId, sessionId, jobId)}
              onCreatePlugin={() => setCreatePluginModalOpen(true)}
              isLoading={submitting}
            />

            {typeof pluginId === 'number' && (
              <JobsList
                jobs={jobs}
                pluginId={pluginId}
                selectedJobId={jobId}
                pluginPackage={pluginInfo?.package}
                onSelectJob={handleChangeJob}
                onToggleJob={(id, a) => handleJobActivation(a, id)}
                onNewJob={handleNewJob}
                isNewJobMode={isNewJobMode}
                disabled={!schema}
              />
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <JobDetails
            jobId={jobId}
            jobDesc={jobDesc}
            pluginPackage={pluginInfo?.package}
            pluginInterval={pluginInfo?.interval}
            isActive={isActive}
            onRefresh={() => loadSchema(pluginId, sessionId, jobId)}
            setResult={setResult}
            setError={setError}
            formData={formData}
            schema={schema}
            env={env}
            sessionId={sessionId}
            pluginId={pluginId}
            isSubmitting={submitting}
            onDescChange={setJobDesc}
            onToggleActive={() => handleJobActivation(!isActive)}
            onSave={(data) => handleSubmit({ formData: data })}
            onSaveAsNew={(data) =>
              handleSubmit({ formData: data, saveNew: true })
            }
            onDelete={handleDeleteJob}
          />

          {result && (
            <ResponseCard result={result} onClose={() => setResult(null)} />
          )}
        </Grid>
      </Grid>

      <CreatePluginModal
        open={createPluginModalOpen}
        onClose={() => setCreatePluginModalOpen(false)}
        onSubmit={async (data) => {
          await api.createPlugin(data.package, data.interval, data.description);
          setPlugins(await api.fetchPlugins());
        }}
        isLoading={submitting}
      />
    </>
  );
}

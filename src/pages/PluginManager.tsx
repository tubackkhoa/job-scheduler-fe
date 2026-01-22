import { Box, Grid } from '@mui/material';
import { ContextPanel } from '../components/dashboard/ContextPanel';
import { JobsList } from '../components/dashboard/JobsList';
import { JobDetails } from '../components/dashboard/JobDetails';
import { ResponseCard } from '../components/dashboard/ResponseCard';
import { CreatePluginModal } from '../components/dashboard/CreatePluginModal';
import { SESSIONS } from '../constants/session';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDefaultFormState } from '@rjsf/utils';
import api from '../api';
import { getEnvDoc } from '../utils';
import { useParams } from 'react-router-dom';

export default function PluginManager({ setLoading, setError }) {
  const { plugin_id } = useParams<{ plugin_id?: string }>();
  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [pluginId, setPluginId] = useState<string | number>(0);
  const [jobId, setJobId] = useState(0);
  const [jobDesc, setJobDesc] = useState('');
  const [jobs, setJobs] = useState([]);
  const [schema, setSchema] = useState(null);
  const [env, setEnv] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(SESSIONS[0].id);
  const [createPluginModalOpen, setCreatePluginModalOpen] = useState(false);
  const [isNewJobMode, setIsNewJobMode] = useState(false);

  // Load plugin list
  useEffect(() => {
    api
      .fetchPlugins()
      .then((data) => {
        setPlugins(data);
        if (!plugin_id) return;
        const pluginIdAsNumber = Number(plugin_id);
        if (
          !Number.isNaN(pluginIdAsNumber) &&
          data.some((p) => p.id == pluginIdAsNumber)
        ) {
          loadSchema(pluginIdAsNumber);
        } else {
          loadSchema(plugin_id);
        }
      })
      .catch((err) => setError(err.message));
  }, [plugin_id]);

  const handleSetResult = (ret) => {
    setResult(ret);
    setTimeout(() => setResult(null), 3000);
  };

  const loadSchema = async (
    currentPluginId: string | number,
    currentSessionId?: number,
    currentJobId?: number
  ) => {
    if (!currentPluginId) return;
    setPluginId(currentPluginId);
    setLoading(true);
    setError(null);
    // schema and configs should be clear before processing
    setSchema(null);
    setJobs([]);

    try {
      const {
        schema: fetchedSchema,
        jobs,
        user,
        globals
      } = typeof currentPluginId === 'string'
        ? await api.fetchTemplatePluginSchema(currentPluginId)
        : await api.fetchSchema(currentSessionId ?? sessionId, currentPluginId);
      // assign global ctx
      window.ctx = { user: { ...user, roles: new Set(user.roles) } };
      setEnv(await getEnvDoc(globals));
      setSchema(fetchedSchema);
      setJobs(jobs);
      const newJobId = currentJobId ?? jobs[0]?.id ?? 0;
      handleChangeJob(newJobId, jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async ({ formData, saveNew = false }) => {
    if (!pluginId) return;
    setSubmitting(true);
    setError(null);

    try {
      const jobItem = {
        config: formData,
        description: jobDesc
      };

      let response;
      if (typeof pluginId === 'string') {
        response = await api.updateTemplatePlugin(pluginId, jobItem);
      } else {
        if (!jobId || saveNew) {
          // add new job
          response = await api.updateConfig(0, {
            ...jobItem,
            sessionId,
            pluginId
          });
        } else {
          response = await api.updateConfig(jobId, jobItem);
        }
        await loadSchema(pluginId, sessionId, jobId);
      }
      handleSetResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJobActivation = async (activation, targetJobId = jobId) => {
    setError(null);
    if (!targetJobId) return;
    try {
      const response = await api.activateJob(targetJobId, activation);
      if (response.success) {
        // update the config at local to sync with server
        setJobs((prev) =>
          prev.map((v) =>
            v.id === targetJobId ? { ...v, active: activation ? 1 : 0 } : v
          )
        );
        setJobId(targetJobId);
      }
      handleSetResult(response);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeJob = (newJobId, newJobs) => {
    setJobId(newJobId);
    setIsNewJobMode(false);
    const collection = newJobs ?? jobs;
    const found = collection.find((version) => version.id === newJobId);
    setJobDesc(found?.description ?? '');
  };

  const handleNewJob = useCallback(() => {
    setIsNewJobMode(true);
    setJobId(0);
    setJobDesc('');
  }, []);

  const handleChangeSession = async (currentSessionId) => {
    setSessionId(currentSessionId);
    // reload schema
    await loadSchema(pluginId, currentSessionId);
  };

  const handleDeleteJob = async () => {
    if (!pluginId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.deleteJob(jobId);
      handleSetResult(response);
      await loadSchema(pluginId, sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reloadPlugins = async () => {
    if (!pluginId) return;

    setSubmitting(true);
    setError(null);

    try {
      const pkg = plugins.find((p) => p.id === pluginId).package;
      const response = await api.reloadPlugin(pkg);
      handleSetResult(response);
      // update schema
      loadSchema(pluginId, sessionId, jobId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePlugin = async (pluginData) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.createPlugin(
        pluginData.package,
        pluginData.interval,
        pluginData.description
      );
      handleSetResult({
        success: true,
        message: 'Plugin created successfully'
      });
      setCreatePluginModalOpen(false);
      // Reload plugins list
      const updatedPlugins = await api.fetchPlugins();
      setPlugins(updatedPlugins);
      // Optionally select the newly created plugin
      if (response.id) {
        await loadSchema(response.id, sessionId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pluginInfo = useMemo(() => {
    return typeof pluginId === 'number'
      ? plugins.find((p) => p.id === pluginId)
      : { package: pluginId, interval: undefined };
  }, [pluginId]);

  const currentJob = jobs.find((version) => version.id === jobId);

  const formData = useMemo(
    () =>
      currentJob?.config ??
      (isNewJobMode && schema
        ? getDefaultFormState(schema, undefined, schema)
        : undefined),
    [currentJob, isNewJobMode, schema]
  );

  const isActive = !!currentJob?.active;

  return (
    <>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Left sidebar */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              position: { xs: 'static', md: 'sticky' },
              top: 30
            }}
          >
            <ContextPanel
              sessions={SESSIONS}
              plugins={plugins}
              ctx={window.ctx}
              sessionId={sessionId}
              pluginId={pluginId}
              onSessionChange={handleChangeSession}
              onReloadPlugin={reloadPlugins}
              onCreatePlugin={() => setCreatePluginModalOpen(true)}
              isLoading={submitting}
            />

            {typeof pluginId === 'number' && (
              <JobsList
                jobs={jobs}
                selectedJobId={jobId}
                pluginPackage={pluginInfo?.package}
                onSelectJob={handleChangeJob}
                onToggleJob={(id, active) => handleJobActivation(active, id)}
                onNewJob={handleNewJob}
                isNewJobMode={isNewJobMode}
                disabled={!schema}
              />
            )}
          </Box>
        </Grid>

        {/* Main content */}
        <Grid size={{ xs: 12, md: 9 }}>
          <JobDetails
            jobId={jobId}
            jobDesc={jobDesc}
            pluginPackage={pluginInfo?.package}
            pluginInterval={pluginInfo?.interval}
            setResult={setResult}
            setError={setError}
            isActive={isActive}
            formData={formData}
            env={env}
            schema={schema}
            onDescChange={setJobDesc}
            onToggleActive={() => handleJobActivation(!isActive)}
            onSave={(data) => handleSubmit({ formData: data, saveNew: false })}
            onSaveAsNew={(data) =>
              handleSubmit({ formData: data, saveNew: true })
            }
            onDelete={handleDeleteJob}
            isSubmitting={submitting}
            sessionId={sessionId}
            pluginId={pluginId}
          />

          {result && (
            <ResponseCard result={result} onClose={() => setResult(null)} />
          )}
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

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Container, Grid, CssBaseline } from '@mui/material';
import { Header } from './components/dashboard/Header';
import { ContextPanel } from './components/dashboard/ContextPanel';
import { JobsList } from './components/dashboard/JobsList';
import { JobDetails } from './components/dashboard/JobDetails';
import { LoadingBar } from './components/dashboard/LoadingBar';
import { ErrorAlert } from './components/dashboard/ErrorAlert';
import { ResponseCard } from './components/dashboard/ResponseCard';
import { CreatePluginModal } from './components/dashboard/CreatePluginModal';
import api from './api';
import { SESSIONS } from './constants/session';
import { getEnvDoc } from './utils';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5'
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777'
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a'
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706'
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626'
    },
    background: {
      default: '#0a0a0f',
      paper: '#111119'
    },
    divider: 'rgba(255, 255, 255, 0.08)'
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small'
      }
    },
    MuiSelect: {
      defaultProps: {
        size: 'small'
      }
    }
  }
});

export default function App() {
  const [plugins, setPlugins] = useState([]);
  const [pluginId, setPluginId] = useState(0);
  const [jobId, setJobId] = useState(0);
  const [jobDesc, setJobDesc] = useState('');
  const [jobs, setJobs] = useState([]);
  const [schema, setSchema] = useState(null);
  const [env, setEnv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(SESSIONS[0].id);
  const [error, setError] = useState(null);
  const [createPluginModalOpen, setCreatePluginModalOpen] = useState(false);
  const [isNewJobMode, setIsNewJobMode] = useState(false);

  // Extract default values from JSON Schema
  const getDefaultsFromSchema = useCallback((schemaObj) => {
    if (!schemaObj || !schemaObj.properties) return {};

    const defaults = {};
    for (const [key, propSchema] of Object.entries(schemaObj.properties)) {
      if (propSchema.default !== undefined) {
        defaults[key] = propSchema.default;
      } else if (propSchema.type === 'object' && propSchema.properties) {
        defaults[key] = getDefaultsFromSchema(propSchema);
      } else if (propSchema.type === 'array') {
        defaults[key] = [];
      } else if (propSchema.type === 'string') {
        defaults[key] = '';
      } else if (
        propSchema.type === 'number' ||
        propSchema.type === 'integer'
      ) {
        defaults[key] = 0;
      } else if (propSchema.type === 'boolean') {
        defaults[key] = false;
      }
    }
    return defaults;
  }, []);

  // Load plugin list
  useEffect(() => {
    api
      .fetchPlugins()
      .then((data) => {
        setPlugins(data);
        const params = new URLSearchParams(window.location.search);
        const pluginId = params.get('plugin_id');
        if (!pluginId) return;
        if (data.some((p) => p.id == pluginId)) {
          loadSchema(Number(pluginId));
        } else {
          loadSchema(pluginId);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSetResult = (ret) => {
    setResult(ret);
    setTimeout(() => setResult(null), 3000);
  };

  const loadSchema = async (
    currentPluginId,
    currentSessionId,
    currentJobId
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
        globals
      } = typeof currentPluginId === 'string'
        ? await api.fetchTemplatePluginSchema(currentPluginId)
        : await api.fetchSchema(currentSessionId ?? sessionId, currentPluginId);
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

  const pluginInfo = plugins.find((p) => p.id === pluginId);
  const currentJob = jobs.find((version) => version.id === jobId);

  const formData = useMemo(() => {
    const cfg = currentJob?.config;
    if (cfg) {
      return typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
    }
    // When in new job mode, use schema defaults instead of null
    if (isNewJobMode && schema) {
      return getDefaultsFromSchema(schema);
    }
    return null;
  }, [currentJob, isNewJobMode, schema, getDefaultsFromSchema]);

  const isActive = !!currentJob?.active;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <LoadingBar isLoading={loading || submitting} />

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, sm: 3, md: 4 } }}>
          <Header isLoading={submitting} />

          {error && (
            <Box sx={{ mt: 3 }}>
              <ErrorAlert message={error} onClose={() => setError(null)} />
            </Box>
          )}

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
                  sessionId={sessionId}
                  pluginId={pluginId}
                  onSessionChange={handleChangeSession}
                  onPluginChange={loadSchema}
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
                    onToggleJob={(id, active) =>
                      handleJobActivation(active, id)
                    }
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
                onSave={(data) =>
                  handleSubmit({ formData: data, saveNew: false })
                }
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
        </Container>

        <CreatePluginModal
          open={createPluginModalOpen}
          onClose={() => setCreatePluginModalOpen(false)}
          onSubmit={handleCreatePlugin}
          isLoading={submitting}
        />
      </Box>
    </ThemeProvider>
  );
}

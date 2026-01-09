import { useEffect, useState, useMemo } from 'react';
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

const sessions = [
  {
    id: 1,
    name: 'Staging'
  },
  {
    id: 2,
    name: 'Production'
  }
];

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
  const [jobConfigs, setJobConfigs] = useState([]);
  const [schema, setSchema] = useState(null);
  const [env, setEnv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(sessions[0].id);
  const [error, setError] = useState(null);
  const [createPluginModalOpen, setCreatePluginModalOpen] = useState(false);

  // Load plugin list
  useEffect(() => {
    api
      .fetchPlugins()
      .then(setPlugins)
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
    setJobConfigs([]);

    try {
      const {
        schema: fetchedSchema,
        configs,
        env
      } = await api.fetchSchema(currentSessionId ?? sessionId, currentPluginId);
      setSchema(fetchedSchema);
      setEnv(env);
      setJobConfigs(configs);

      const newJobId = currentJobId ?? configs[0]?.id ?? 0;
      handleChangeJob(newJobId, configs);
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

      handleSetResult(response);
      await loadSchema(pluginId, sessionId, jobId);
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
        const newConfigVersions = [...jobConfigs];
        for (const version of newConfigVersions) {
          if (version.id === targetJobId) {
            version.active = activation ? 1 : 0;
          }
          // Don't deactivate other jobs - allow multiple active jobs
        }
        setJobConfigs(newConfigVersions);
        setJobId(targetJobId);
      }
      handleSetResult(response);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeJob = (newJobId, configs) => {
    setJobId(newJobId);
    const collection = configs ?? jobConfigs;
    const found = collection.find((version) => version.id === newJobId);
    setJobDesc(found?.description ?? '');
  };

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
  const currentConfig = jobConfigs.find((version) => version.id === jobId);

  const formData = useMemo(() => {
    return currentConfig?.config ? JSON.parse(currentConfig.config) : null;
  }, [currentConfig, schema]); // ← Only recompute when the jobId actually changes, or currentConfig is update when reloading

  const isActive = !!currentConfig?.active;

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
            <Grid item xs={12} size={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  position: 'sticky',
                  top: 30
                }}
              >
                <ContextPanel
                  sessions={sessions}
                  plugins={plugins}
                  sessionId={sessionId}
                  pluginId={pluginId}
                  onSessionChange={handleChangeSession}
                  onPluginChange={loadSchema}
                  onReloadPlugin={reloadPlugins}
                  onCreatePlugin={() => setCreatePluginModalOpen(true)}
                  isLoading={submitting}
                />

                <JobsList
                  jobs={jobConfigs}
                  selectedJobId={jobId}
                  pluginPackage={pluginInfo?.package}
                  onSelectJob={(id) => {
                    handleChangeJob(id);
                  }}
                  onToggleJob={(id, active) => handleJobActivation(active, id)}
                  onNewJob={() => {
                    setJobId(0);
                    setJobDesc('');
                  }}
                  disabled={!schema}
                />
              </Box>
            </Grid>

            {/* Main content */}
            <Grid item xs={12} size={9}>
              <JobDetails
                jobId={jobId}
                jobDesc={jobDesc}
                pluginPackage={pluginInfo?.package}
                pluginInterval={pluginInfo?.interval}
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

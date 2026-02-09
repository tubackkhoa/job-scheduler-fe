import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Box,
  TextField,
  Chip,
  Divider,
} from '@mui/material';

const { ConfigForm } = Components;
const { SESSIONS } = Constants;
const { buildJinjaContext } = Utils;

const USER_PLUGIN_PACKAGE = 'alpha_miner.plugins.LiveTradeForUserPlugin';
const MONITOR_PLUGIN_PACKAGE = 'alpha_miner.plugins.LiveTradeForMonitorPlugin';

const PRODUCTION_SESSION_ID = SESSIONS[1].id;
const MARKETPLACE_ENV = 'production';
const JINJA_CONTEXT = {
  env: MARKETPLACE_ENV,
  url: null,
  apikey: null,
} as const;

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  modelIdentity: string;
}

export function PublishModal({
  open,
  onClose,
  modelIdentity,
}: PublishModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schema & Config state
  const [userPluginId, setUserPluginId] = useState<number | null>(null);
  const [userSchema, setUserSchema] = useState<any>(null);
  const [env, setEnv] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Job state
  const [productionJob, setProductionJob] = useState<any>(null);

  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerDescription, setRegisterDescription] = useState('');

  useEffect(() => {
    if (open && modelIdentity) {
      resetState();
      loadData();
    }
  }, [open, modelIdentity]);

  const resetState = () => {
    setLoading(false);
    setActionLoading(false);
    setError(null);
    setProductionJob(null);
    setIsRegistered(false);
    setFormData({});
    setRegisterName('');
    setRegisterDescription('');
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const plugins = await api.fetchPlugins();
      const userPlugin = plugins.find((p) => p.package === USER_PLUGIN_PACKAGE);
      const monitorPlugin = plugins.find(
        (p) => p.package === MONITOR_PLUGIN_PACKAGE,
      );

      if (!userPlugin) {
        throw new Error(`Plugin ${USER_PLUGIN_PACKAGE} not found.`);
      }

      setUserPluginId(userPlugin.id);

      // 1. Fetch User Plugin Schema & Env
      const userSessionId = PRODUCTION_SESSION_ID; // Use production session for user plugin
      const userResponse = await api.fetchSchema(userSessionId, userPlugin.id);
      setUserSchema(userResponse.schema);
      setEnv(await Utils.getEnvDoc(userResponse.globals || {}));

      // 2. Fetch Monitor Plugin Job for Defaults
      let combinedConfig = {};
      if (monitorPlugin) {
        try {
          const monitorResponse = await api.fetchSchema(
            PRODUCTION_SESSION_ID,
            monitorPlugin.id,
          );
          const monitorJob = monitorResponse.jobs?.find(
            (j) => j.config?.model_key === modelIdentity,
          );

          if (monitorJob) {
            combinedConfig = { ...monitorJob.config };
          } else {
            const monitorResponse0 = await api.fetchSchema(
              SESSIONS[0].id,
              monitorPlugin.id,
            );
            const monitorJob0 = monitorResponse0.jobs?.find(
              (j) => j.config?.model_key === modelIdentity,
            );
            if (monitorJob0) {
              combinedConfig = { ...monitorJob0.config };
            }
          }
        } catch (e) {
          console.warn('Could not fetch monitor plugin jobs', e);
        }
      }

      // 3. Prepare Config
      // Start with schema defaults
      const schemaDefaults = Object.fromEntries(
        Object.entries(userResponse.schema.properties || {}).map(
          ([key, value]) => [key, (value as any).default],
        ),
      );

      // Overrides
      const overrides = {
        webhook_url: '',
        webhook_api_key: '',
        model_tag: 'production',
        model_key: modelIdentity,
      };

      setFormData({
        ...schemaDefaults,
        ...combinedConfig,
        ...overrides,
      });

      // 4. Check Existing User Job
      if (userResponse.jobs && Array.isArray(userResponse.jobs)) {
        const found = userResponse.jobs.find(
          (j) => j.config?.model_key === modelIdentity,
        );
        if (found) {
          setProductionJob(found);
        }
      }

      // 5. Check Registration Status (Marketplace)
      await checkRegistrationStatus();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const render = buildJinjaContext(USER_PLUGIN_PACKAGE, {}, true);
      const result = await render(
        `{{ list_trade_models(env, url, apikey) }}`,
        JINJA_CONTEXT,
      );
      const models = (
        typeof result === 'string'
          ? JSON.parse(result.replace(/'/g, '"'))
          : result
      )['versions'];

      const registered = Array.isArray(models)
        ? models.some((model: any) => model.id === modelIdentity)
        : false;

      setIsRegistered(registered);
    } catch (err: any) {
      console.warn('Error checking registration status:', err);
      setIsRegistered(false);
    }
  };

  const handleSubscribe = async () => {
    if (!userPluginId) return;
    setActionLoading(true);
    setError(null);
    try {
      // 1. Register Model
      const render = buildJinjaContext(USER_PLUGIN_PACKAGE, {}, true);
      const payload = {
        key: modelIdentity,
        name: registerName || undefined,
        description: registerDescription || undefined,
      };

      await render(`{{ create_trade_model(payload, url, apikey, env) }}`, {
        payload,
        ...JINJA_CONTEXT,
      });

      const cleanConfig = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== undefined),
      );

      const jobPayload = {
        config: cleanConfig,
        description: `Live Trading for ${modelIdentity}`,
        pluginId: userPluginId,
        sessionId: PRODUCTION_SESSION_ID,
      };

      await api.updateConfig(0, jobPayload);

      // Refresh
      await loadData();
      setIsRegistered(true);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setActionLoading(true);
    setError(null);
    try {
      // 1. Deactivate Model
      const render = buildJinjaContext(USER_PLUGIN_PACKAGE, {}, true);
      await render(`{{ deactivate_trade_model(key, url, apikey, env) }}`, {
        key: modelIdentity,
        ...JINJA_CONTEXT,
      });

      // 2. Delete Job if exists
      if (productionJob) {
        await api.deleteJob(productionJob.id);
      }

      // Refresh
      await loadData();
      setIsRegistered(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Publish Model: {modelIdentity}</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {isRegistered ? (
              // ----- UNPUBLISH VIEW -----
              <Stack spacing={3} alignItems="center" py={4}>
                <AppIcon.CheckCircle color="success" sx={{ fontSize: 64 }} />
                <Typography variant="h5">Model Published</Typography>

                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    my: 2,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Production Status
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">Job State:</Typography>
                    {productionJob ? (
                      <Chip
                        label={productionJob.active ? 'Running' : 'Paused'}
                        color={productionJob.active ? 'success' : 'warning'}
                        size="small"
                      />
                    ) : (
                      <Chip label="Missing Job" color="error" size="small" />
                    )}
                  </Stack>
                  {productionJob && (
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                      mt={1}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">Job ID:</Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {productionJob.id}
                        </Typography>
                      </Stack>

                      <Button
                        size="small"
                        variant="contained"
                        onClick={() =>
                          window.open(
                            `/plugins/${userPluginId}/sessions/${PRODUCTION_SESSION_ID}/jobs/${productionJob.id}`,
                            '_blank',
                          )
                        }
                      >
                        View jobs
                      </Button>
                    </Stack>
                  )}
                </Box>

                <Alert
                  severity="warning"
                  icon={<AppIcon.Warning />}
                  sx={{ maxWidth: 500, width: '100%' }}
                >
                  Unpublishing will deactivate the model in the marketplace and
                  DELETE the production job.
                </Alert>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<AppIcon.Delete />}
                  onClick={handleUnsubscribe}
                  disabled={actionLoading}
                  size="large"
                >
                  {actionLoading ? 'Unpublishing...' : 'Unpublish Model'}
                </Button>
              </Stack>
            ) : (
              // ----- PUBLISH VIEW -----
              <Stack spacing={4}>
                <Alert severity="info" icon={<AppIcon.Info />}>
                  Subscribe this model to the Marketplace. This will register
                  the model and automatically create a production job using the
                  configuration from the Monitor plugin.
                </Alert>

                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    1. Model Details
                  </Typography>
                  <Stack spacing={2} direction="row">
                    <TextField
                      fullWidth
                      label="Model Name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Display name"
                      disabled={actionLoading}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={registerDescription}
                      onChange={(e) => setRegisterDescription(e.target.value)}
                      placeholder="Description"
                      disabled={actionLoading}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  {/* <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    2. Job Configuration Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    The following configuration matches the monitor plugin's
                    settings for this model (if available), with necessary
                    overrides for production.
                  </Typography> */}

                  {/* Read-only config preview */}
                  {/* {userSchema && (
                    <Box
                      sx={{
                        maxHeight: 500,
                        overflow: 'auto',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        p: 2,
                      }}
                    >
                      <fieldset
                        style={{ border: 'none', padding: 0, margin: 0 }}
                        disabled
                      >
                        <ConfigForm
                          pluginId={userPluginId}
                          pluginPackage={USER_PLUGIN_PACKAGE}
                          sessionId={PRODUCTION_SESSION_ID}
                          schema={userSchema}
                          formData={formData}
                          onChange={() => {}}
                          env={env}
                        />
                      </fieldset>
                    </Box>
                  )} */}
                </Box>

                <Box display="flex" justifyContent="flex-end" pt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AppIcon.CloudUpload />}
                    onClick={handleSubscribe}
                    disabled={actionLoading || !userPluginId}
                    size="large"
                  >
                    {actionLoading
                      ? 'Subscribing...'
                      : 'Subscribe & Create Job'}
                  </Button>
                </Box>
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={actionLoading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

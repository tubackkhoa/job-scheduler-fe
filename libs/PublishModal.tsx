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
  Tabs,
  Tab,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { Storefront, Work, CheckCircle } from '@mui/icons-material';
import api from '@/api';
import { ConfigForm } from '@/components/ConfigForm';
import { SESSIONS } from '@/constants';

declare const Utils: any;

const PLUGIN_PACKAGE = 'alpha_miner.plugins.LiveTradeForUserPlugin';
const PRODUCTION_SESSION_ID = SESSIONS[1].id;
const MARKETPLACE_ENV = 'production';
const JINJA_CONTEXT = {
  env: MARKETPLACE_ENV,
  url: null,
  apikey: null,
} as const;

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

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
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  // Schema state
  const [pluginId, setPluginId] = useState<number | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [env, setEnv] = useState<any>(null);
  const [productionJob, setProductionJob] = useState<any>(null);

  const [formData, setFormData] = useState<any>({});
  const [creatingJob, setCreatingJob] = useState(false);
  const [togglingJob, setTogglingJob] = useState(false);

  // Registration state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerDescription, setRegisterDescription] = useState('');

  useEffect(() => {
    if (open && modelIdentity) {
      setProductionJob(null);
      setIsRegistered(false);

      loadPluginData();
      checkRegistrationStatus();
    }
  }, [open, modelIdentity]);

  const loadPluginData = async () => {
    setLoading(true);
    setError(null);
    try {
      const plugins = await api.fetchPlugins();
      const targetPlugin = plugins.find((p) => p.package === PLUGIN_PACKAGE);

      if (!targetPlugin) {
        throw new Error(
          `Plugin ${PLUGIN_PACKAGE} not found. Available plugins: ${plugins.map((p) => p.package).join(', ')}`,
        );
      }

      setPluginId(targetPlugin.id);

      const sessionId = PRODUCTION_SESSION_ID;

      const response = await api.fetchSchema(sessionId, targetPlugin.id);
      const { schema, globals, jobs } = response;
      setSchema(schema);
      const defaultFormData = Object.fromEntries(
        Object.entries(schema.properties).map(([key, value]) => [
          key,
          (value as any).default,
        ]),
      );

      setEnv(await Utils.getEnvDoc(globals || {}));
      setFormData({
        ...defaultFormData,
        model_key: modelIdentity,
        model_tag: 'production',
      });

      if (jobs && Array.isArray(jobs)) {
        const found = jobs.find((j) => j.config?.model_key === modelIdentity);
        if (found) {
          setProductionJob(found);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const render = Utils.buildJinjaContext(PLUGIN_PACKAGE, {}, true);
      const result = await render(
        `{{ list_trade_models(env, url, apikey) }}`,
        JINJA_CONTEXT,
      );
      const models = (
        typeof result === 'string'
          ? JSON.parse(result.replace(/'/g, '"'))
          : result
      )['versions'];
      const isRegistered = Array.isArray(models)
        ? models.some((model: any) => model.id === modelIdentity)
        : false;

      setIsRegistered(isRegistered);
    } catch (err: any) {
      console.error('Error checking registration status:', err);
      // On error, assume not registered
      setIsRegistered(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    try {
      const render = Utils.buildJinjaContext(PLUGIN_PACKAGE, {}, true);
      const payload = {
        key: modelIdentity,
        name: registerName || undefined,
        description: registerDescription || undefined,
      };

      await render(`{{ create_trade_model(payload, url, apikey, env) }}`, {
        payload,
        ...JINJA_CONTEXT,
      });

      setIsRegistered(true);
      // Reload to check if there's now a production job
      await loadPluginData();
    } catch (err: any) {
      setError(err.message || 'Failed to register model');
    } finally {
      setRegistering(false);
    }
  };

  const handleUnsubscribe = async () => {
    setRegistering(true);
    setError(null);
    try {
      const render = Utils.buildJinjaContext(PLUGIN_PACKAGE, {}, true);

      await render(`{{ deactivate_trade_model(key, url, apikey, env) }}`, {
        key: modelIdentity,
        ...JINJA_CONTEXT,
      });

      setIsRegistered(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe model');
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateJob = async () => {
    if (!pluginId) return;
    setCreatingJob(true);
    setError(null);
    try {
      const sessionId = PRODUCTION_SESSION_ID;

      // Remove undefined values to prevent JSON serialization error
      const cleanConfig = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== undefined),
      );

      const payload = {
        config: cleanConfig,
        description: `Live Trading for ${modelIdentity}`,
        pluginId,
        sessionId,
      };

      await api.updateConfig(0, payload);
      // Reload to find the new job
      loadPluginData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingJob(false);
    }
  };
  const handleToggleJob = async () => {
    if (!productionJob) return;
    setTogglingJob(true);
    setError(null);
    try {
      const newActiveState = !productionJob.active;
      await api.activateJob(productionJob.id, newActiveState);
      // Update local state
      setProductionJob({ ...productionJob, active: newActiveState ? 1 : 0 });
    } catch (err: any) {
      setError(err.message || 'Failed to toggle job status');
    } finally {
      setTogglingJob(false);
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
            <Tabs
              value={tabIndex}
              onChange={(_, v) => setTabIndex(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab
                icon={<Storefront />}
                iconPosition="start"
                label="Marketplace"
              />
              <Tab
                icon={<Work />}
                iconPosition="start"
                label="Production Job"
              />
            </Tabs>

            <TabPanel value={tabIndex} index={0}>
              <Stack spacing={3} alignItems="center" py={4}>
                <Typography variant="h6">
                  Marketplace Status:{' '}
                  {isRegistered ? 'Registered' : 'Not Registered'}
                </Typography>

                {isRegistered ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleUnsubscribe}
                    disabled={registering}
                  >
                    Unsubscribe Model
                  </Button>
                ) : (
                  <Stack spacing={2} width="100%" maxWidth={400}>
                    <TextField
                      fullWidth
                      label="Model Name (Optional)"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Enter a display name for your model"
                      disabled={registering}
                    />
                    <TextField
                      fullWidth
                      label="Description (Optional)"
                      value={registerDescription}
                      onChange={(e) => setRegisterDescription(e.target.value)}
                      placeholder="Describe your model's strategy"
                      multiline
                      rows={3}
                      disabled={registering}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircle />}
                      onClick={handleRegister}
                      disabled={registering}
                    >
                      Register Model
                    </Button>
                  </Stack>
                )}
                <Typography variant="body2" color="text.secondary">
                  Registering allows other users to subscribe to this model's
                  signals.
                </Typography>
              </Stack>
            </TabPanel>

            <TabPanel value={tabIndex} index={1}>
              {productionJob ? (
                <Stack spacing={2} alignItems="center" py={4}>
                  <CheckCircle color="success" sx={{ fontSize: 48 }} />
                  <Typography variant="h6">Production Job Found</Typography>
                  <Typography>Job ID: {productionJob.id}</Typography>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      label={productionJob.active ? 'Active' : 'Inactive'}
                      color={productionJob.active ? 'success' : 'default'}
                      size="medium"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!productionJob.active}
                          onChange={handleToggleJob}
                          disabled={togglingJob}
                        />
                      }
                      label="Active"
                    />
                  </Stack>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      window.open(
                        `/plugins/${pluginId}/sessions/${PRODUCTION_SESSION_ID}/jobs/${productionJob.id}`,
                        '_blank',
                      )
                    }
                  >
                    View Job Details
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Alert severity="info">
                    No production job found. Configure settings below to create
                    one.
                  </Alert>

                  {schema && (
                    <ConfigForm
                      pluginId={pluginId}
                      pluginPackage={PLUGIN_PACKAGE}
                      sessionId={SESSIONS[1].id}
                      schema={schema}
                      formData={formData}
                      onChange={setFormData}
                      env={env}
                    />
                  )}

                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCreateJob}
                    disabled={creatingJob}
                  >
                    {creatingJob ? 'Creating...' : 'Create Production Job'}
                  </Button>
                </Stack>
              )}
            </TabPanel>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

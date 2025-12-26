import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Typography,
  Stack,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  ContentCopy,
  Check,
  Settings,
  Code,
  Terminal,
  Delete,
  Save,
  AddCircleOutline,
} from '@mui/icons-material';
import { ConfigForm } from './ConfigForm';
import LogViewer from '../../LogViewer';

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
  jobDesc,
  pluginPackage,
  pluginInterval,
  isActive,
  formData,
  schema,
  onDescChange,
  onToggleActive,
  onSave,
  onSaveAsNew,
  onDelete,
  isSubmitting,
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [localFormData, setLocalFormData] = useState(formData);
  const formRef = useRef(null);

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  const handleCopyJson = async () => {
    if (!formData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  if (!schema) {
    return (
      <Card
        sx={{
          bgcolor: 'background.paper',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Pick a plugin to load its schema and jobs.
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title="Job Details"
        subheader={
          pluginPackage
            ? `${pluginPackage} • every ${pluginInterval}s`
            : 'Select a plugin to begin'
        }
        action={
          jobId !== 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={isActive ? 'Active' : 'Paused'}
                size="small"
                color={isActive ? 'success' : 'default'}
                variant={isActive ? 'filled' : 'outlined'}
                icon={
                  isActive ? (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'success.light',
                        animation: 'pulse 2s infinite',
                        ml: 1,
                      }}
                    />
                  ) : undefined
                }
              />
              <Button
                variant={isActive ? 'outlined' : 'contained'}
                color={isActive ? 'warning' : 'success'}
                size="small"
                startIcon={isActive ? <Pause /> : <PlayArrow />}
                onClick={onToggleActive}
                disabled={isSubmitting}
              >
                {isActive ? 'Pause' : 'Start'}
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
              value={tabIndex}
              onChange={(_, v) => {
                setTabIndex(v);
                // Prevent scroll jump
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 0);
              }}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                icon={<Settings sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Config Form"
              />
              <Tab
                icon={<Code sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Config JSON"
              />
              <Tab
                icon={<Terminal sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label="Live Logs"
              />
            </Tabs>
          </Box>

          {/* Tab panels */}
          <TabPanel value={tabIndex} index={0}>
            <ConfigForm
              schema={schema}
              formData={localFormData}
              onChange={setLocalFormData}
              formRef={formRef}
            />
          </TabPanel>

          <TabPanel value={tabIndex} index={1}>
            <Box sx={{ position: 'relative' }}>
              <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
                <IconButton
                  onClick={handleCopyJson}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    bgcolor: 'action.hover',
                  }}
                  size="small"
                >
                  {copied ? (
                    <Check color="success" fontSize="small" />
                  ) : (
                    <ContentCopy fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.4)',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  m: 0,
                  maxHeight: 500,
                  overflow: 'auto',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.85rem',
                  color: 'primary.light',
                }}
              >
                {JSON.stringify(formData, null, 2)}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabIndex} index={2}>
            <LogViewer jobId={jobId} description={jobDesc} />
          </TabPanel>

          {/* Actions */}
          <Divider />
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={() => {
                  const currentData =
                    formRef.current?.state?.formData || localFormData || {};
                  onSave(currentData);
                }}
                disabled={isSubmitting}
                sx={{
                  background:
                    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddCircleOutline />}
                onClick={() => {
                  const currentData =
                    formRef.current?.state?.formData || localFormData || {};
                  onSaveAsNew(currentData);
                }}
                disabled={isSubmitting}
              >
                Save as new
              </Button>
            </Stack>

            {jobId !== 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={onDelete}
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

import { useState, useEffect, useRef, useCallback } from 'react';
import _ from 'lodash';
import {
  Stack,
  Typography,
  Box,
  Autocomplete,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  Checkbox,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { Save, PublishedWithChanges } from '@mui/icons-material';
import { buildJinjaContext } from '../../../utils';
import { ConfirmationDialog } from '../ConfirmationDialog';
export function VersionField({
  formData,
  onChange,
  schema,
  fieldPathId,
  registry
}) {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [applyConfirmDialogOpen, setApplyConfirmDialogOpen] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState([]);

  const render = useCallback(
    buildJinjaContext(
      registry.formContext.pluginPackage,
      registry.formContext.env.filters,
      registry.formContext.formData
    ),
    [registry.formContext]
  );

  // Generic evaluate wrapper
  const evaluateExpr = useCallback(
    (exprKey, data) => render(schema['model:expr'][exprKey], data),
    [schema, render]
  );

  const listVersions = useCallback(
    (field_id, searchTerm = '', limit = 20, offset = 0) =>
      evaluateExpr('list', { field_id, search: searchTerm, limit, offset }),
    [evaluateExpr]
  );

  const getVersion = useCallback(
    (id) => evaluateExpr('detail', { id }),
    [evaluateExpr]
  );

  const updateVersion = useCallback(
    (id, payload) => evaluateExpr('update', { id, payload }),
    [evaluateExpr]
  );

  const createVersion = useCallback(
    (payload) => evaluateExpr('create', { payload }),
    [evaluateExpr]
  );

  const applyVersion = useCallback(
    (job_ids) => evaluateExpr('apply', { job_ids }),
    [evaluateExpr]
  );

  const localValue = useCallback(
    () => _.get(registry.formContext.formData, schema['model:binding']) || '',
    [registry, schema['model:binding']]
  );

  const debounceTimeout = useRef(null);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await listVersions(fieldPathId?.$id, searchInput);
        const items = result?.versions || [];
        setVersions(items);

        // If formData exists, select corresponding version
        if (formData) {
          const matched = items.find((v) => v.id === formData);
          if (matched) {
            setSelectedVersion(matched);
            setVersionName(matched.name);
          }
        }
      } catch (e) {
        setVersions([]);
        setError(e.message || 'Failed to load versions');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchInput, formData, fieldPathId]);

  const handleSelect = async (version) => {
    if (!version) {
      setSelectedVersion(null);
      setVersionName('');
      // onChange('', schema['model:binding']);
      if (fieldPathId?.path) onChange(0, fieldPathId.path);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const fullVersion = await getVersion(version.id);
      setSelectedVersion(fullVersion);
      setVersionName(fullVersion.name);
      onChange(fullVersion.value, schema['model:binding']);
      if (fieldPathId?.path) onChange(fullVersion.id, fieldPathId.path);
    } catch (e) {
      setError(e.message || 'Failed to load version details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    const nameTrimmed = versionName.trim();
    const value = localValue().trim();

    if (!nameTrimmed) {
      setMessage('Version name is required');
      return;
    }
    if (!value) {
      setMessage('Version value cannot be empty');
      return;
    }

    setConfirmDialogOpen(true);
  };

  const doSave = async () => {
    setConfirmDialogOpen(false);
    const nameTrimmed = versionName.trim();
    const value = localValue().trim();

    setSaving(true);
    setError('');
    setMessage('');

    try {
      let savedVersion;

      if (selectedVersion) {
        savedVersion = await updateVersion(selectedVersion.id, {
          name: nameTrimmed,
          value
        });
        setMessage(`Updated version #${savedVersion.id}`);
      } else {
        savedVersion = await createVersion({
          field_id: fieldPathId?.$id,
          name: nameTrimmed,
          value,
          description: '',
          tags: ''
        });
        setMessage(`Saved as version #${savedVersion.id}`);
      }

      setSelectedVersion(savedVersion);

      // Refresh list
      const updatedList = await listVersions(searchInput);
      setVersions(updatedList?.versions || []);
    } catch (e) {
      setError(e.message || 'Failed to save version');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyClick = () => {
    if (!selectedVersion) {
      setError('Please select a version to apply');
      return;
    }
    setApplyConfirmDialogOpen(true);
  };

  const doApply = async () => {
    setApplyConfirmDialogOpen(false);
    if (!selectedVersion || !selectedJobIds.length) return;

    setApplying(true);
    setError('');
    setMessage('');

    try {
      await applyVersion(selectedJobIds);
      setMessage(`Applied version "${selectedVersion.name}" to all jobs`);
    } catch (e) {
      setError(e.message || 'Failed to apply version');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: 'rgba(99, 102, 241, 0.08)',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Autocomplete
            size="small"
            options={versions}
            getOptionLabel={(option) => option.name || ''}
            value={selectedVersion}
            onChange={(_, v) => handleSelect(v)}
            inputValue={searchInput}
            onInputChange={(_, val) => setSearchInput(val)}
            loading={loading}
            sx={{ flex: 1, minWidth: 200 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={schema.title}
                placeholder="Type to search..."
              />
            )}
            renderOption={({ key, ...props }, option) => (
              <Box component="li" key={option.id} {...props}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ width: '100%' }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {option.name}
                  </Typography>
                  {option.is_active && (
                    <Chip label="Active" size="small" color="success" />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    #{option.id}
                  </Typography>
                </Stack>
              </Box>
            )}
          />
          <TextField
            size="small"
            label="Version Name"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="e.g. v1.0 - Production"
            sx={{ flex: 1, minWidth: 200 }}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<Save />}
            onClick={handleSaveClick}
            disabled={
              saving || applying || !versionName.trim() || !localValue().trim()
            }
            sx={{ minWidth: 100 }}
          >
            {saving ? 'Saving...' : selectedVersion ? 'Update' : 'Save'}
          </Button>
          {selectedVersion && schema['model:expr']?.apply && (
            <Button
              variant="contained"
              size="small"
              color="warning"
              startIcon={<PublishedWithChanges />}
              onClick={handleApplyClick}
              disabled={applying || saving}
              sx={{ minWidth: 100 }}
            >
              {applying ? 'Applying...' : 'Apply All'}
            </Button>
          )}
        </Stack>

        {message && (
          <Typography variant="caption" color="success.main">
            {message}
          </Typography>
        )}

        {error && (
          <Typography variant="caption" color="error.main">
            {error}
          </Typography>
        )}
      </Stack>

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={doSave}
        title={selectedVersion ? 'Update SQL Version' : 'Save SQL Version'}
        message="Are you sure you want to proceed?"
        details={`When you ${
          selectedVersion ? 'update' : 'save'
        } this version "${versionName.trim()}", the SQL value from this version will be used to run jobs.\n\nNote: The preview value in the editor will be replaced by the saved SQL version value.`}
        severity="warning"
        confirmText={selectedVersion ? 'Update Version' : 'Save Version'}
        isLoading={saving}
      />

      <ConfirmationDialog
        open={applyConfirmDialogOpen}
        onClose={() => setApplyConfirmDialogOpen(false)}
        onConfirm={doApply}
        title="Apply Version to All Jobs"
        details={
          <ApplyMessage
            render={render}
            selectedJobIds={selectedJobIds}
            sessionId={registry.formContext.sessionId}
            onToggle={(id) => {
              setSelectedJobIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              );
            }}
          />
        }
        message={`This action will apply the SQL version "${
          selectedVersion?.name || ''
        }" to ALL jobs in this plugin.\n\n⚠️ Important:\n• All jobs will use the SQL value from this version\n• This will override any custom SQL configurations in individual jobs\n• The change takes effect immediately for all jobs`}
        severity="warning"
        confirmText="Apply to All Jobs"
        isLoading={applying}
      />
    </Box>
  );
}

const ApplyMessage = ({ sessionId, render, onToggle, selectedJobIds }) => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    render(
      `{{ get_jobs_by_plugin_and_session(plugin_id, session_id) | tolist("id", "description") | tojson }}`,
      { session_id: sessionId }
    ).then((ret) => {
      setJobs(ret);
    });
  }, [sessionId, render]);

  return (
    <Stack>
      Are you sure you want to apply this version to all jobs?
      <List>
        {jobs.map((job) => (
          <ListItem dense key={job.id} disablePadding>
            <ListItemButton
              onClick={() => onToggle(job.id)}
              sx={{ alignItems: 'center' }}
            >
              <Checkbox
                edge="start"
                checked={selectedJobIds.includes(job.id)}
                tabIndex={-1}
                disableRipple
                sx={{ mr: 1 }}
              />
              <ListItemText primary={job.description} sx={{ my: 0 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
};

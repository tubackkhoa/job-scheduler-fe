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
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { buildJinjaContext } from '@/utils';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { SESSIONS } from '@/constants';
import { FieldProps } from '@rjsf/utils';

export function VersionField({
  formData,
  onChange,
  schema,
  fieldPathId,
  registry,
}: FieldProps) {
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
  const [selectedDeleteJobIds, setSelectedDeleteJobIds] = useState([]);
  const [updateChoiceDialogOpen, setUpdateChoiceDialogOpen] = useState(false);
  const [saveAsNewDialogOpen, setSaveAsNewDialogOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const render = useCallback(
    buildJinjaContext(
      registry.formContext.pluginPackage,
      registry.formContext.formData,
    ),
    [registry.formContext],
  );

  // Generic evaluate wrapper
  const evaluateExpr = useCallback(
    (exprKey, data) => render(schema['model:expr'][exprKey], data),
    [schema, render],
  );

  const listVersions = useCallback(
    (field_id, searchTerm = '', version_id = null, limit = 100, offset = 0) =>
      evaluateExpr('list', {
        field_id,
        search: searchTerm,
        id: version_id,
        limit,
        offset,
      }),
    [evaluateExpr],
  );

  const getVersion = useCallback(
    (id) => evaluateExpr('detail', { id }),
    [evaluateExpr],
  );

  const updateVersion = useCallback(
    (id, payload) => evaluateExpr('update', { id, payload }),
    [evaluateExpr],
  );

  const createVersion = useCallback(
    (payload) => evaluateExpr('create', { payload }),
    [evaluateExpr],
  );

  const applyVersion = useCallback(
    (id, job_ids) => evaluateExpr('apply', { id, job_ids }),
    [evaluateExpr],
  );

  const deleteVersion = useCallback(
    (id) => evaluateExpr('delete', { id }),
    [evaluateExpr],
  );

  const localValue = useCallback(
    () => _.get(registry.formContext.formData, schema['model:binding']) || '',
    [registry, schema['model:binding']],
  );

  const debounceTimeout = useRef(null);

  const prevFormDataRef = useRef(formData);

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const formDataChanged = prevFormDataRef.current !== formData;
        let searchTerm = searchInput;
        if (formDataChanged) {
          searchTerm = '';
        }
        const result = await listVersions(
          fieldPathId?.$id,
          searchTerm,
          formData,
        );
        const items = result?.versions || [];
        setVersions(items);

        // If formData exists, select corresponding version
        if (formData) {
          const matched = items.find((v) => Number(v.id) === formData);
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
        prevFormDataRef.current = formData;
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

    // If updating an existing version, show choice dialog
    if (selectedVersion) {
      setUpdateChoiceDialogOpen(true);
    } else {
      // If creating new, show direct confirmation
      setConfirmDialogOpen(true);
    }
  };

  const doSave = async (forceNew = false) => {
    setConfirmDialogOpen(false);
    setUpdateChoiceDialogOpen(false);
    const nameTrimmed =
      forceNew && newVersionName ? newVersionName.trim() : versionName.trim();
    const value = localValue().trim();

    setSaving(true);
    setError('');
    setMessage('');

    try {
      let savedVersion;

      if (selectedVersion && !forceNew) {
        // Update existing version
        savedVersion = await updateVersion(selectedVersion.id, {
          name: nameTrimmed,
          value,
        });
        setMessage(`Updated version #${savedVersion.id}`);
      } else {
        // Create new version
        savedVersion = await createVersion({
          field_id: fieldPathId?.$id,
          name: nameTrimmed,
          value,
          description: '',
          tags: '',
        });
        setMessage(`Saved as version #${savedVersion.id}`);

        // For "save as new", update the selected version and name
        if (forceNew) {
          setSelectedVersion(savedVersion);
          setVersionName(savedVersion.name);
        }
      }

      if (!forceNew) {
        setSelectedVersion(savedVersion);
      }

      // Refresh list
      const updatedList = await listVersions(fieldPathId?.$id, searchInput);
      setVersions(updatedList?.versions || []);
    } catch (e) {
      setError(e.message || 'Failed to save version');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChoice = (choice) => {
    setUpdateChoiceDialogOpen(false);
    if (choice === 'update') {
      // Directly call update without additional confirmation
      doSave(false);
    } else if (choice === 'save-as-new') {
      // Show save as new dialog
      setNewVersionName(versionName + ' (Copy)');
      setSaveAsNewDialogOpen(true);
    }
  };

  const handleSaveAsNew = () => {
    if (!newVersionName.trim()) {
      setError('New version name is required');
      return;
    }
    setSaveAsNewDialogOpen(false);
    doSave(true);
  };

  const handleDeleteClick = () => {
    if (!selectedVersion) {
      setError('Please select a version to delete');
      return;
    }

    setDeleteDialogOpen(true);
  };

  const doDelete = async () => {
    setDeleteDialogOpen(false);
    if (!selectedVersion) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteVersion(selectedVersion.id);
      setMessage(`Deleted version "${selectedVersion.name}"`);

      // Clear selection and refresh list
      setSelectedVersion(null);
      setVersionName('');
      onChange('', schema['model:binding']);
      if (fieldPathId?.path) onChange(0, fieldPathId.path);

      const updatedList = await listVersions(fieldPathId?.$id, searchInput);
      setVersions(updatedList?.versions || []);
    } catch (e) {
      setError(e.message || 'Failed to delete version');
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
      await applyVersion(selectedVersion.id, selectedJobIds);
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
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
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
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AppIcon.Save />}
            onClick={handleSaveClick}
            disabled={
              saving || applying || !versionName.trim() || !localValue().trim()
            }
            sx={{ minWidth: 100 }}
          >
            {saving ? 'Saving...' : selectedVersion ? 'Update' : 'Save'}
          </Button>
          {selectedVersion && schema['model:expr']?.delete && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleDeleteClick}
              disabled={saving || applying}
              sx={{ minWidth: 100 }}
            >
              Delete
            </Button>
          )}
          {selectedVersion && schema['model:expr']?.apply && (
            <Button
              variant="contained"
              size="small"
              color="warning"
              startIcon={<AppIcon.PublishedWithChanges />}
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
        title={selectedVersion ? 'Update value version' : 'Save value version'}
        message="Are you sure you want to proceed?"
        details={`When you ${
          selectedVersion ? 'update' : 'save'
        } this version "${versionName.trim()}", the value value from this version will be used to run jobs.\n\nNote: The preview value in the editor will be replaced by the saved value version value.`}
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
            onToggle={(id) => {
              setSelectedJobIds((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              );
            }}
            onSelectAll={(ids, select) => {
              setSelectedJobIds((prev) =>
                select
                  ? [...new Set([...prev, ...ids])]
                  : prev.filter((id) => !ids.includes(id)),
              );
            }}
          />
        }
        message={`This action will apply the value version "${
          selectedVersion?.name || ''
        }" to ALL jobs in this plugin.\n\n⚠️ Important:\n• All jobs will use the value value from this version\n• This will override any custom value configurations in individual jobs\n• The change takes effect immediately for all jobs`}
        severity="warning"
        confirmText="Apply to All Jobs"
        isLoading={applying}
      />

      {/* Update Choice Dialog */}
      <ConfirmationDialog
        open={updateChoiceDialogOpen}
        onClose={() => setUpdateChoiceDialogOpen(false)}
        onConfirm={() => handleUpdateChoice('update')}
        title="Update Version"
        message={
          <Stack spacing={2}>
            <Typography variant="body2">
              You are about to modify version{' '}
              <strong>"{selectedVersion?.name}"</strong>. How would you like to
              proceed?
            </Typography>
            <Stack spacing={1}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleUpdateChoice('update')}
              >
                <Stack spacing={0.5} sx={{ width: '100%', textAlign: 'left' }}>
                  <Typography variant="button">
                    Update Existing Version
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This will replace the current version's content. All jobs
                    using this version will be affected. This will replace the
                    current version's content. All jobs using this version will
                    be affected.
                  </Typography>
                </Stack>
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleUpdateChoice('save-as-new')}
              >
                <Stack spacing={0.5} sx={{ width: '100%', textAlign: 'left' }}>
                  <Typography variant="button">Save as New Version</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Create a new version with this content. The original version
                    remains unchanged. Create a new version with this content.
                    The original version remains unchanged.
                  </Typography>
                </Stack>
              </Button>
            </Stack>
          </Stack>
        }
        severity="info"
        confirmText="Update"
        cancelText="Cancel"
      />

      {/* Save As New Dialog */}
      <ConfirmationDialog
        open={saveAsNewDialogOpen}
        onClose={() => setSaveAsNewDialogOpen(false)}
        onConfirm={handleSaveAsNew}
        title="Save as New Version"
        message={
          <Stack spacing={2}>
            <Typography variant="body2">
              Enter a name for the new version:
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="New Version Name"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="e.g. v2.0 - Enhanced Query"
              autoFocus
            />
            <Typography variant="caption" color="text.secondary">
              This will create a new version while keeping the original version
              "{selectedVersion?.name}" intact. This will create a new version
              while keeping the original version "{selectedVersion?.name}"
              intact.
            </Typography>
          </Stack>
        }
        severity="info"
        confirmText="Save as New"
        isLoading={saving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={doDelete}
        title="Delete Version"
        message={
          <DeleteMessage
            render={render}
            selectedVersion={selectedVersion}
            selectedDeleteJobIds={selectedDeleteJobIds}
            onToggle={(id) => {
              setSelectedDeleteJobIds((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              );
            }}
            onSelectAll={(ids, select) => {
              setSelectedDeleteJobIds((prev) =>
                select
                  ? [...new Set([...prev, ...ids])]
                  : prev.filter((id) => !ids.includes(id)),
              );
            }}
          />
        }
        details="This action cannot be undone. If jobs depend on this version, they may be affected."
        severity="warning"
        confirmText="Delete Version"
        isLoading={saving}
      />
    </Box>
  );
}

const ApplyMessage = ({ render, onToggle, selectedJobIds, onSelectAll }) => {
  const [jobsBySession, setJobsBySession] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllJobs = async () => {
      setLoading(true);
      const results = {};
      const jobs: Job[] = await render(
        `{{ dao.get_jobs_by_plugin_and_session(plugin_id) | list | pick("id", "description", "session_id") }}`,
      );
      SESSIONS.map((session) => {
        try {
          if (jobs?.filter) {
            results[session.id] = {
              name: session.name,
              jobs: jobs.filter((j) => j.session_id === session.id),
            };
          }
        } catch (e) {
          console.error(`Failed to fetch jobs for session ${session.name}:`, e);
        }
      });
      setJobsBySession(results);
      setLoading(false);
    };

    fetchAllJobs();
  }, [render]);

  if (loading) {
    return <Typography variant="body2">Loading jobs...</Typography>;
  }

  const sessionIds = Object.keys(jobsBySession);
  if (!sessionIds.length) {
    return <Typography variant="body2">No jobs found.</Typography>;
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        Select the jobs you want to apply this version to:
      </Typography>
      {sessionIds.map((sessionId) => {
        const { name, jobs } = jobsBySession[sessionId];
        const sessionJobIds = jobs.map((j) => j.id);
        const allSelected = sessionJobIds.every((id) =>
          selectedJobIds.includes(id),
        );
        const someSelected = sessionJobIds.some((id) =>
          selectedJobIds.includes(id),
        );

        return (
          <Box key={sessionId}>
            <ListItemButton
              onClick={() => onSelectAll(sessionJobIds, !allSelected)}
              sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText
                primary={name}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Typography variant="caption" color="text.secondary">
                {
                  sessionJobIds.filter((id) => selectedJobIds.includes(id))
                    .length
                }
                /{jobs.length}
              </Typography>
            </ListItemButton>
            <List dense disablePadding sx={{ pl: 2 }}>
              {jobs.map((job) => (
                <ListItem key={job.id} disablePadding>
                  <ListItemButton onClick={() => onToggle(job.id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedJobIds.includes(job.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={job.description} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        );
      })}
    </Stack>
  );
};

const DeleteMessage = ({
  render,
  selectedVersion,
  selectedDeleteJobIds,
  onToggle,
  onSelectAll,
}) => {
  const [jobsBySession, setJobsBySession] = useState({});
  const [loading, setLoading] = useState(true);
  const [dependentJobs, setDependentJobs] = useState([]);

  useEffect(() => {
    const fetchDependentJobs = async () => {
      if (!selectedVersion?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const jobs = await render(
          `{{ dao.get_jobs_depending_on_version(${selectedVersion.id}) | tojson }}`,
        );
        setDependentJobs(jobs || []);

        // Group jobs by session
        const grouped = {};
        (jobs || []).forEach((job) => {
          const session = SESSIONS.find((s) => s.id === job.session_id);
          const sessionId = job.session_id || 'unknown';
          const sessionName = session?.name || 'Unknown Session';

          if (!grouped[sessionId]) {
            grouped[sessionId] = { name: sessionName, jobs: [] };
          }
          grouped[sessionId].jobs.push(job);
        });

        setJobsBySession(grouped);
      } catch (e) {
        console.error('Failed to fetch dependent jobs:', e);
        setDependentJobs([]);
        setJobsBySession({});
      } finally {
        setLoading(false);
      }
    };

    fetchDependentJobs();
  }, [render, selectedVersion?.id]);

  if (loading) {
    return <Typography variant="body2">Loading dependent jobs...</Typography>;
  }

  if (dependentJobs.length === 0) {
    return (
      <Stack spacing={2}>
        <Typography variant="body2">
          Are you sure you want to delete version{' '}
          <strong>"{selectedVersion?.name}"</strong>?
        </Typography>
        <Typography variant="body2" color="success.main">
          ✓ No jobs are currently using this version. It's safe to delete.
        </Typography>
      </Stack>
    );
  }

  const sessionIds = Object.keys(jobsBySession);

  return (
    <Stack spacing={2}>
      <Typography variant="body2">
        Are you sure you want to delete version{' '}
        <strong>"{selectedVersion?.name}"</strong>?
      </Typography>

      <Typography variant="body2" color="error.main" fontWeight={600}>
        ⚠️ Warning: This version is being used by {dependentJobs.length} job
        {dependentJobs.length > 1 ? 's' : ''}
      </Typography>

      <Box
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          bgcolor: 'background.paper',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: 'block' }}
        >
          Jobs that depend on this version
        </Typography>

        {sessionIds.map((sessionId) => {
          const { name, jobs } = jobsBySession[sessionId];

          return (
            <Box key={sessionId} sx={{ mb: 1 }}>
              <ListItemButton
                sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }}
              >
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
              <List dense disablePadding sx={{ pl: 2 }}>
                {jobs.map((job) => (
                  <ListItem key={job.id} disablePadding>
                    <ListItemButton>
                      <ListItemText primary={job.description} />
                      <ListItemText primary={job.description} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

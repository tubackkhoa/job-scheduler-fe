import { useState, useEffect, useRef, useCallback } from 'react';
import _ from 'lodash';
import {
  Stack,
  Typography,
  Box,
  Autocomplete,
  TextField,
  Button,
  Chip
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { buildJinjaContext, evaluate } from '../../../utils';

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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getContext = useCallback(
    (extraData = {}) =>
      Object.assign(
        buildJinjaContext(
          registry.formContext.pluginPackage,
          registry.formContext.env.filters,
          registry.formContext.formData
        ),
        extraData
      ),
    [registry.formContext]
  );

  // Generic evaluate wrapper
  const evaluateExpr = useCallback(
    (exprKey, data) =>
      evaluate(schema['model:expr'][exprKey], getContext(data)),
    [schema, getContext]
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
    (id, payload) =>
      evaluateExpr('update', { id, payload: JSON.stringify(payload) }),
    [evaluateExpr]
  );

  const createVersion = useCallback(
    (payload) => evaluateExpr('create', { payload: JSON.stringify(payload) }),
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
  }, [searchInput, formData]);

  const handleSelect = async (version) => {
    if (!version) {
      setSelectedVersion(null);
      setVersionName('');
      onChange('', schema['model:binding']);
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

  const handleSave = async () => {
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
            renderOption={(props, option) => (
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
            onClick={handleSave}
            disabled={saving || !versionName.trim() || !localValue().trim()}
            sx={{ minWidth: 100 }}
          >
            {saving ? 'Saving...' : selectedVersion ? 'Update' : 'Save'}
          </Button>
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
    </Box>
  );
}

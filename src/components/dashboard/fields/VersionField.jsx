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
import api from '../../../api';
import { Save } from '@mui/icons-material';

export function VersionField({
  formData,
  onChange,
  schema,
  fieldPathId,
  registry
}) {
  // Added missing states
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [versionSearchInput, setVersionSearchInput] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const searchDebounceRef = useRef(null);

  const getLocalValue = useCallback(() => {
    return _.get(
      registry.formContext.formRef.current?.state.formData,
      schema.binding
    );
  }, [registry, schema.binding]);

  useEffect(() => {
    const searchVersions = async (searchTerm = '') => {
      setLoadingVersions(true);
      try {
        const result = await api.listSqlVersions({
          search: searchTerm,
          limit: 20,
          offset: 0
        });
        setVersions(result.versions || []);
        if (formData) {
          const selected = result.versions.find((v) => v.id === formData);
          if (selected) setSelectedVersion(selected);
        }
      } catch (err) {
        console.error('Failed to load SQL versions:', err);
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      searchVersions(versionSearchInput);
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [versionSearchInput, formData]);

  const handleVersionSelect = async (version) => {
    if (!version) {
      setSelectedVersion(null);
      setVersionName('');

      // clear binding?
      onChange('', schema.binding);
      onChange(0, fieldPathId?.path);

      return;
    }

    setLoadingVersions(true);
    setVersionMessage('');
    setErrorMessage('');
    try {
      const fullVersion = await api.getSqlVersion(version.id);
      setSelectedVersion(fullVersion);
      setVersionName(fullVersion.name);
      onChange(fullVersion.sql_query, schema.binding);
      onChange(fullVersion.id, fieldPathId?.path);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load SQL version');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      setVersionMessage('Version name is required');
      return;
    }
    if (!getLocalValue().trim()) {
      setVersionMessage('SQL query cannot be empty');
      return;
    }

    setSavingVersion(true);
    setVersionMessage('');
    setErrorMessage('');

    try {
      if (selectedVersion) {
        // Update existing version
        const updated = await api.updateSqlVersion(selectedVersion.id, {
          name: versionName.trim(),
          sql_query: getLocalValue()
        });
        setSelectedVersion(updated);
        setVersionMessage(`Updated version #${updated.id}`);

        const result = await api.listSqlVersions({
          search: versionSearchInput,
          limit: 20,
          offset: 0
        });
        setVersions(result.versions || []);
      } else {
        // Create new version
        const newVersion = await api.createSqlVersion({
          name: versionName.trim(),
          sql_query: getLocalValue(),
          description: '',
          tags: null
        });
        setSelectedVersion(newVersion);
        setVersionMessage(`Saved as version #${newVersion.id}`);

        const result = await api.listSqlVersions({
          search: versionSearchInput,
          limit: 20,
          offset: 0
        });
        setVersions(result.versions || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save SQL version');
    } finally {
      setSavingVersion(false);
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
            onChange={(_, newValue) => handleVersionSelect(newValue)}
            inputValue={versionSearchInput}
            onInputChange={(_, newInputValue) =>
              setVersionSearchInput(newInputValue)
            }
            loading={loadingVersions}
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
            onClick={handleSaveVersion}
            disabled={
              savingVersion || !versionName.trim() || !getLocalValue().trim()
            }
            sx={{ minWidth: 100 }}
          >
            {savingVersion ? 'Saving...' : selectedVersion ? 'Update' : 'Save'}
          </Button>
        </Stack>

        {versionMessage && (
          <Typography variant="caption" color="success.main">
            {versionMessage}
          </Typography>
        )}

        {errorMessage && (
          <Typography variant="caption" color="error.main">
            {errorMessage}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

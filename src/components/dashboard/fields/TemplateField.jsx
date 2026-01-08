import { useMemo, useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {
  Stack,
  Typography,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  CircularProgress,
  IconButton,
  Box,
  Autocomplete,
  TextField,
  Button,
  Chip
} from '@mui/material';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { jinja } from '@codemirror/lang-jinja';
import { markdown } from '@codemirror/lang-markdown';
import { LanguageDescription } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { JinjaCompletionBuilder, jinjaLinter } from '../../../utils';
import api from '../../../api';
import _ from 'lodash';
import {
  Check,
  ContentCopySharp,
  Save,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';
import { MarkdownPreview } from './MarkdownPreview';

const resolveLanguageExtension = (type, schema) => {
  switch (type) {
    case 'json':
      return json();
    case 'yaml':
    case 'yml':
      return yaml();
    case 'markdown':
      return markdown({
        codeLanguages: [
          LanguageDescription.of({
            name: 'chart',
            support: json()
          })
        ]
      });
    case 'sql':
      return sql({ dialect: PostgreSQL, schema: schema.schema });
    default:
      return undefined;
  }
};

export function TemplateField({
  formData,
  onChange,
  schema,
  fieldPathId,
  registry
}) {
  const languageType = schema?.type ?? 'jinja';
  const extensions = useMemo(() => {
    const completions = JinjaCompletionBuilder.build(
      _.omit(
        registry.formContext.formRef.current?.state.formData,
        fieldPathId?.path
      ),
      registry.formContext.env
    );
    return [
      jinja({
        base: resolveLanguageExtension(languageType, schema),
        ...completions
      }),
      jinjaLinter(completions)
    ];
  }, [languageType, registry.formContext.formRef.current]);

  // Local state for editor content during typing
  const [localValue, setLocalValue] = useState(formData);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Fullscreen state
  const [fullscreen, setFullscreen] = useState(false);

  // SQL Version management state (only for SQL type)
  const isSqlType = languageType === 'sql';
  const [sqlVersions, setSqlVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionName, setVersionName] = useState('');
  const [versionSearchInput, setVersionSearchInput] = useState('');
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const searchDebounceRef = useRef(null);
  const handleCopyCode = async () => {
    if (!formData) return;
    try {
      await navigator.clipboard.writeText(previewCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  // Disable body scroll when fullscreen is active
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreen]);

  // Sync local state if formData changes externally
  useEffect(() => {
    setLocalValue(formData);
    setIsDirty(false);
  }, [formData]);

  useEffect(() => {
    if (!isSqlType) return;

    const searchVersions = async (searchTerm = '') => {
      setLoadingVersions(true);
      try {
        const result = await api.listSqlVersions({
          search: searchTerm,
          limit: 20,
          offset: 0
        });
        setSqlVersions(result.versions || []);
      } catch (err) {
        console.error('Failed to load SQL versions:', err);
        setSqlVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };

    // Debounce search
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      searchVersions(versionSearchInput);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [isSqlType, versionSearchInput]);

  const handleVersionSelect = async (version) => {
    if (!version) {
      setSelectedVersion(null);
      setVersionName('');
      setIsDirty(false);
      return;
    }

    setLoadingVersions(true);
    setVersionMessage('');
    try {
      const fullVersion = await api.getSqlVersion(version.id);
      setSelectedVersion(fullVersion);
      setVersionName(fullVersion.name);
      setLocalValue(fullVersion.sql_query);
      setIsDirty(false);
      // Update parent form data
      onChange(fullVersion.sql_query, fieldPathId?.path);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load SQL version');
    } finally {
      setLoadingVersions(false);
    }
  };

  // Handle save version
  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      setVersionMessage('Version name is required');
      return;
    }

    if (!localValue.trim()) {
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
          sql_query: localValue
        });
        setSelectedVersion(updated);
        setVersionMessage(`Updated version #${updated.id}`);
        setIsDirty(false);
        // Refresh versions list
        const result = await api.listSqlVersions({
          search: versionSearchInput,
          limit: 20,
          offset: 0
        });
        setSqlVersions(result.versions || []);
      } else {
        // Create new version
        const newVersion = await api.createSqlVersion({
          name: versionName.trim(),
          sql_query: localValue,
          description: '',
          tags: null
        });
        setSelectedVersion(newVersion);
        setVersionMessage(`Saved as version #${newVersion.id}`);
        setIsDirty(false);
        // Refresh versions list
        const result = await api.listSqlVersions({
          search: versionSearchInput,
          limit: 20,
          offset: 0
        });
        setSqlVersions(result.versions || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save SQL version');
    } finally {
      setSavingVersion(false);
    }
  };

  // Track changes in editor
  const handleEditorChange = (value) => {
    setLocalValue(value);
    setIsDirty(true);
    setVersionMessage('');
  };

  // Only notify parent on blur (when user finishes editing)
  const handleBlur = () => {
    if (localValue !== formData) {
      onChange(localValue, fieldPathId?.path);
    }
  };

  const updatePrewiewCode = async (tpl) => {
    setLoadingPreview(true);
    setErrorMessage('');
    try {
      const ret = await api.renderTemplate(
        registry.formContext.pluginPackage,
        tpl,
        _.omit(
          registry.formContext.formRef.current.state.formData,
          fieldPathId?.path
        )
      );
      setPreviewCode(ret.result.trim());
    } catch (ex) {
      setErrorMessage(ex.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleTabChange = async (event, newValue) => {
    if (newValue === 0) {
      setErrorMessage('');
    }
    setTabIndex(newValue);
  };

  // Fullscreen style object
  const fullscreenStyles = fullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--mui-palette-background-default, #121212)',
        zIndex: 1300,
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }
    : {};

  const codeMirrorStyle = {
    style: {
      resize: fullscreen ? 'none' : 'vertical',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      minHeight: fullscreen ? '100%' : 200,
      maxHeight: fullscreen ? '100%' : 600,
      height: '100%'
    },
    minHeight: fullscreen ? '100%' : '200px',
    height: '100%',
    theme: 'dark',
    basicSetup: {
      lineNumbers: true,
      highlightActiveLine: true,
      foldGutter: false
    }
  };

  return (
    <Stack spacing={1} sx={fullscreenStyles}>
      <Typography variant="subtitle2">{schema.title}</Typography>

      {/* SQL Version Management Bar (only for SQL type) */}
      {isSqlType && (
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
            <Stack direction="row" spacing={1} alignItems="center">
              <Autocomplete
                size="small"
                options={sqlVersions}
                getOptionLabel={(option) => option.name || ''}
                value={selectedVersion}
                onChange={(_, newValue) => handleVersionSelect(newValue)}
                inputValue={versionSearchInput}
                onInputChange={(_, newInputValue) => {
                  setVersionSearchInput(newInputValue);
                }}
                loading={loadingVersions}
                sx={{ flex: 1, minWidth: 200 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search / Select SQL Version"
                    placeholder="Type to search..."
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
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
                  savingVersion || !versionName.trim() || !localValue.trim()
                }
                sx={{ minWidth: 100 }}
              >
                {savingVersion
                  ? 'Saving...'
                  : selectedVersion
                  ? 'Update'
                  : 'Save'}
              </Button>
            </Stack>
            {versionMessage && (
              <Typography variant="caption" color="success.main">
                {versionMessage}
              </Typography>
            )}
            {isDirty && selectedVersion && (
              <Typography variant="caption" color="warning.main">
                You have unsaved changes
              </Typography>
            )}
          </Stack>
        </Box>
      )}

      {/* Tabs with fullscreen toggle button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ flexGrow: 1 }}>
          <Tab label="Code" />
          <Tab label="Preview" onClick={() => updatePrewiewCode(localValue)} />
        </Tabs>
        <Tooltip title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
          <IconButton
            onClick={() => setFullscreen((f) => !f)}
            size="small"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            sx={{ ml: 1 }}
          >
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Box>

      {errorMessage && (
        <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
          {errorMessage}
        </Alert>
      )}

      <Box
        sx={{
          position: 'relative',
          minHeight: 200,
          overflow: 'auto',
          flexGrow: fullscreen ? 1 : 'unset'
        }}
      >
        {loadingPreview && tabIndex === 1 && (
          <Box
            sx={{
              position: 'absolute',
              display: 'flex',
              top: 100,
              left: '50%',
              transform: 'translateX(-50%)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              borderRadius: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Box
          sx={{
            display: tabIndex === 1 ? 'none' : 'block',
            height: fullscreen ? '100%' : 'unset'
          }}
        >
          <CodeMirror
            {...codeMirrorStyle}
            value={localValue}
            extensions={extensions}
            onChange={handleEditorChange}
            onBlur={handleBlur}
          />
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: tabIndex === 0 ? 'none' : 'block',
            height: fullscreen ? '100%' : 'unset'
          }}
        >
          <Tooltip title={copied ? 'Copied!' : 'Copy Code'}>
            <IconButton
              onClick={handleCopyCode}
              disabled={loadingPreview}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                bgcolor: 'action.hover'
              }}
              size="small"
            >
              {copied ? (
                <Check color="success" fontSize="small" />
              ) : (
                <ContentCopySharp fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {languageType === 'markdown' ? (
            <MarkdownPreview
              text={previewCode}
              maxHeight={fullscreen ? '100%' : 600}
            />
          ) : (
            <CodeMirror
              {...codeMirrorStyle}
              readOnly
              value={previewCode}
              extensions={[...extensions, EditorView.lineWrapping]}
            />
          )}
        </Box>
      </Box>
    </Stack>
  );
}

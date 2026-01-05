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
import { EditorView } from '@codemirror/view';
import { JinjaCompletionBuilder } from '../../../utils';
import api from '../../../api';
import _ from 'lodash';
import { Check, ContentCopySharp, Save } from '@mui/icons-material';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const resolveLanguageExtension = (type, schema) => {
  switch (type) {
    case 'json':
      return json();
    case 'yaml':
    case 'yml':
      return yaml();
    case 'markdown':
      return markdown();
    case 'sql':
      return sql({ dialect: PostgreSQL, schema: schema.schema });
    default:
      return undefined;
  }
};

const codeMirrorStyle = {
  style: {
    resize: 'vertical',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 200,
    maxHeight: 600,
    height: '100%'
  },
  minHeight: '200px',
  height: '100%',
  theme: 'dark',
  basicSetup: {
    lineNumbers: true,
    highlightActiveLine: true,
    foldGutter: false
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
      })
    ];
  }, [languageType, registry.formContext.formRef.current]);

  // Local state for editor content during typing
  const [localValue, setLocalValue] = useState(formData);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!isSqlType) return;

    let mounted = true;
    api
      .listSqlVersions({ limit: 20, offset: 0 })
      .then((result) => {
        if (mounted) {
          setSqlVersions(result.versions || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load SQL versions:', err);
      });

    return () => {
      mounted = false;
    };
  }, [isSqlType]);

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

  return (
    <Stack spacing={1}>
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

      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Code" />
        <Tab label="Preview" onClick={() => updatePrewiewCode(localValue)} />
      </Tabs>

      {errorMessage && (
        <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
          {errorMessage}
        </Alert>
      )}

      <Box
        sx={{
          position: 'relative',
          minHeight: 200,
          maxHeight: 800,
          overflow: 'auto'
        }}
      >
        {loadingPreview && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.4)',
              zIndex: 2,
              borderRadius: 1
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Box sx={{ display: tabIndex === 1 ? 'none' : 'block' }}>
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
            display: tabIndex === 0 ? 'none' : 'block'
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
            <MarkdownPreview text={previewCode} />
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

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

const MarkdownPreview = ({ text = '' }) => (
  <Box
    sx={{
      pt: 3,
      mb: 2,
      typography: 'body1',
      overflowX: 'auto',
      maxWidth: '100%',
      '&::-webkit-scrollbar': {
        height: '8px'
      },
      '&::-webkit-scrollbar-track': {
        bgcolor: 'rgba(0, 0, 0, 0.2)'
      },
      '&::-webkit-scrollbar-thumb': {
        bgcolor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.3)'
        }
      },

      '& h1': { typography: 'h4', mb: 2 },
      '& h2': { typography: 'h5', mt: 3 },
      '& h3': { typography: 'h6', mt: 2 },

      '& p': { mb: 1.5 },

      '& ul': { pl: 3 },
      '& li': { mb: 0.5 },

      '& table': {
        width: '100%',
        borderCollapse: 'collapse',
        my: 2,
        minWidth: 'max-content'
      },
      '& th, & td': {
        border: '1px solid',
        borderColor: 'divider',
        p: 1,
        whiteSpace: 'nowrap'
      },
      '& th': {
        bgcolor: 'action.hover',
        fontWeight: 'bold'
      },

      '& pre': {
        bgcolor: 'grey.900',
        color: 'grey.100',
        p: 2,
        borderRadius: 1,
        overflowX: 'auto'
      },

      '& code': {
        bgcolor: 'action.hover',
        px: 0.5,
        borderRadius: 0.5,
        fontFamily: 'monospace'
      },

      '& blockquote': {
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        pl: 2,
        color: 'text.secondary',
        my: 2
      }
    }}
    dangerouslySetInnerHTML={{
      __html: DOMPurify.sanitize(md.render(text))
    }}
  />
);

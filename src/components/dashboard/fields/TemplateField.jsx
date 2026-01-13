import { useMemo, useState, useEffect } from 'react';
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
  Box
} from '@mui/material';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { jinja } from '@codemirror/lang-jinja';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { LanguageDescription } from '@codemirror/language';
import { TemplatePreview } from './TemplatePreview';
import {
  JinjaCompletionBuilder,
  jinjaLinter,
  jinjaEvaluate
} from '../../../utils';
import _ from 'lodash';
import {
  Check,
  ContentCopySharp,
  Fullscreen,
  FullscreenExit
} from '@mui/icons-material';

import { getCodeMirrorStyle } from './TemplatePreview';

const resolveLanguageExtension = (schema) => {
  switch (schema.type) {
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
      return sql({ dialect: PostgreSQL, schema: schema.meta });
    case 'js':
      return javascript({ jsx: true, typescript: true });
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
  const extensions = useMemo(() => {
    const params = _.omit(registry.formContext.formData, fieldPathId?.path);
    const completions = JinjaCompletionBuilder.build(
      params,
      registry.formContext.env
    );

    return [
      jinja({
        base: resolveLanguageExtension(schema),
        ...completions
      }),
      jinjaLinter(params, registry.formContext.env)
    ];
  }, [schema, registry.formContext]);

  // Local state for editor content during typing
  const [localValue, setLocalValue] = useState(formData);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Fullscreen state
  const [fullscreen, setFullscreen] = useState(false);

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
  }, [formData]);

  // Track changes in editor
  const handleEditorChange = (value) => {
    setLocalValue(value);
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
      const params = _.omit(registry.formContext.formData, fieldPathId?.path);
      // render raw output
      const result = await jinjaEvaluate(
        registry.formContext.pluginPackage,
        tpl,
        registry.formContext.env.filters,
        params,
        true
      );

      setPreviewCode(result);
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

  return (
    <Stack spacing={1} sx={fullscreenStyles}>
      <Typography variant="subtitle2">{schema.title}</Typography>
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
            {...getCodeMirrorStyle(fullscreen)}
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
          <TemplatePreview
            lang={schema.type}
            fullscreen={fullscreen}
            text={previewCode}
            extensions={extensions}
          />
        </Box>
      </Box>
    </Stack>
  );
}

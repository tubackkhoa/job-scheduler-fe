import { useMemo, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {
  Stack,
  Typography,
  Tabs,
  Tab,
  Alert,
  Tooltip,
  IconButton,
  Box
} from '@mui/material';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { jinja } from '@codemirror/lang-jinja';
import { EditorView } from '@codemirror/view';
import { JinjaCompletionBuilder } from '../../../utils';
import api from '../../../api';
import _ from 'lodash';
import { Check, ContentCopySharp } from '@mui/icons-material';

function resolveLanguageExtension(type, schema) {
  switch (type) {
    case 'json':
      return json();
    case 'yaml':
    case 'yml':
      return yaml();
    case 'sql':
      return sql({ dialect: PostgreSQL, schema: schema.schema });
    default:
      return undefined;
  }
}

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
  const [previewCode, setPreviewCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);
  const [copied, setCopied] = useState(false);
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
  }, [formData]);

  // Only notify parent on blur (when user finishes editing)
  const handleBlur = () => {
    if (localValue !== formData) {
      onChange(localValue, fieldPathId?.path);
    }
  };

  const updatePrewiewCode = async (tpl) => {
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
      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Code" />
        <Tab label="Preview" onClick={() => updatePrewiewCode(localValue)} />
      </Tabs>

      <Box sx={{ position: 'relative' }}>
        {tabIndex == 1 && (
          <Tooltip title={copied ? 'Copied!' : 'Copy Code'}>
            <IconButton
              onClick={handleCopyCode}
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
        )}

        {errorMessage ? (
          <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
            {errorMessage}
          </Alert>
        ) : (
          <CodeMirror
            style={{
              resize: 'vertical',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 200,
              maxHeight: 600,
              height: '100%'
            }}
            minHeight="200px"
            height="100%"
            readOnly={tabIndex !== 0}
            value={tabIndex === 0 ? localValue : previewCode}
            extensions={
              tabIndex === 0
                ? extensions
                : [...extensions, EditorView.lineWrapping]
            }
            onChange={setLocalValue}
            onBlur={handleBlur}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              foldGutter: false
            }}
            theme="dark"
          />
        )}
      </Box>
    </Stack>
  );
}

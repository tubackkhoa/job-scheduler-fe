import { useMemo, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Stack, Typography, Tabs, Tab, Alert } from '@mui/material';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { jinja } from '@codemirror/lang-jinja';
import { EditorView } from '@codemirror/view';
import { JinjaCompletionBuilder } from '../../../utils';
import api from '../../../api';
import _ from 'lodash';

function resolveLanguageExtension(type) {
  switch (type) {
    case 'json':
      return json();
    case 'yaml':
    case 'yml':
      return yaml();
    case 'sql':
      return sql({ dialect: PostgreSQL });
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
        base: resolveLanguageExtension(languageType),
        ...completions
      })
    ];
  }, [languageType, registry.formContext.formRef.current]);

  // Local state for editor content during typing
  const [localValue, setLocalValue] = useState(formData);
  const [previewCode, setPreviewCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

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
          editable={tabIndex === 0}
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
    </Stack>
  );
}

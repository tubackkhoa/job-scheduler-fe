import { useMemo, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Stack, Typography, Tabs, Tab } from '@mui/material';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { initPyodide } from '../../../utils';

initPyodide; // Preload Pyodide
// Global map to cache tabIndex by fieldPathId
const tabIndexCache = {};

export function SqlField({
  formData,
  onChange,
  schema,
  fieldPathId,
  registry,
  formContext
}) {
  const extensions = useMemo(() => [sql({ dialect: PostgreSQL })], []);
  const cacheId = fieldPathId?.path?.join('.');
  // Local state for editor content during typing
  const [localValue, setLocalValue] = useState(formData);
  const [previewCode, setPreviewCode] = useState('');
  const [tabIndex, setTabIndex] = useState(() => tabIndexCache[cacheId] || 0);

  // Whenever tabIndex changes, update the global cache
  useEffect(() => {
    tabIndexCache[cacheId] = tabIndex;
  }, [cacheId, tabIndex]);

  // Sync local state if formData changes externally
  useEffect(() => {
    setLocalValue(formData);
    updatePrewiewCode(formData);
  }, [formData]);

  // Only notify parent on blur (when user finishes editing)
  const handleBlur = () => {
    if (localValue !== formData) {
      onChange(localValue, fieldPathId?.path);
    }
  };

  const updatePrewiewCode = async (tpl) => {
    const pyodide = await initPyodide;
    const renderTemplate = pyodide.globals.get('render_template');
    const pyContext = pyodide.toPy(
      registry.formContext.formRef.current.state.formData
    );
    const output = renderTemplate(tpl, pyContext);
    setPreviewCode(output);
  };

  const handleTabChange = async (event, newValue) => {
    if (newValue === 1) {
      updatePrewiewCode(localValue);
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
        extensions={extensions}
        onChange={(value) => {
          setLocalValue(value);
        }} // update local only
        onBlur={handleBlur} // sync on blur
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          foldGutter: false
        }}
        theme="dark"
      />
    </Stack>
  );
}

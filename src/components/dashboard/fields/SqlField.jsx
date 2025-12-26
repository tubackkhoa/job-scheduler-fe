import { useMemo, useState, useEffect } from 'react';
import { Stack, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL } from '@codemirror/lang-sql';

export function SqlField({ formData, onChange, schema, fieldPathId }) {
  const extensions = useMemo(() => [sql({ dialect: PostgreSQL })], []);

  // Local state for editor content during typing
  const [localValue, setLocalValue] = useState(formData || '');

  // Sync local state if formData changes externally
  useEffect(() => {
    setLocalValue(formData || '');
  }, [formData]);

  // Only notify parent on blur (when user finishes editing)
  const handleBlur = () => {
    if (localValue !== formData) {
      onChange(localValue, fieldPathId?.path);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{schema.title}</Typography>

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
        value={localValue}
        extensions={extensions}
        onChange={(value) => setLocalValue(value)} // update local only
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

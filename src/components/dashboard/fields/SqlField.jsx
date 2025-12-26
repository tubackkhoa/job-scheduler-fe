import { Stack, Typography, Paper } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL } from '@codemirror/lang-sql';

/**
 * JSON Schema Form custom field
 *
 * props:
 * - formData: string
 * - onChange: (value, path?) => void
 */
export function SqlField({ formData, onChange, schema, fieldPathId }) {
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
          height: '100%',
        }}
        minHeight="200px"
        height="100%"
        value={formData}
        extensions={[
          sql({
            dialect: PostgreSQL, // DuckDB-compatible
          }),
        ]}
        onChange={(value) => onChange(value, fieldPathId?.path)}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          foldGutter: false,
        }}
        theme="dark"
      />
    </Stack>
  );
}

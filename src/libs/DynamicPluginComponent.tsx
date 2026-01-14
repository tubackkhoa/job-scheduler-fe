import React from 'react';
import * as Mui from '@mui/material';
import * as Utils from '../utils';
import { FieldProps } from '@rjsf/utils';

export default function (
  { useCallback, useState }: typeof React,
  { Box, Button, TextField, Typography }: typeof Mui,
  { buildJinjaContext }: typeof Utils
) {
  return function ({ registry }: FieldProps) {
    const render = useCallback(
      buildJinjaContext(
        registry.formContext.pluginPackage,
        registry.formContext.env.filters,
        registry.formContext.formData
      ),
      [registry.formContext]
    );

    const [input, setInput] = useState(
      `{{ get_all_plugins() | tolist | tojson }}`
    );
    const [output, setOutput] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await render(input, {});
        setOutput(JSON.stringify(result, null, 2));
      } catch (err: any) {
        setError(err?.message ?? 'Execution failed');
        setOutput('');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Typography variant="subtitle1">Jinja Input</Typography>

        <TextField
          multiline
          minRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          fullWidth
        />

        <Button variant="contained" onClick={handleRun} disabled={loading}>
          {loading ? 'Running…' : 'Run'}
        </Button>

        <Typography variant="subtitle1">Output (JSON)</Typography>

        <TextField
          multiline
          minRows={6}
          value={output}
          fullWidth
          InputProps={{ readOnly: true }}
        />

        {error && <Typography color="error">{error}</Typography>}
      </Box>
    );
  };
}

// node bundle src/libs/DynamicPluginComponent.tsx ../job-scheduler/plugins/sample_plugin/field.js

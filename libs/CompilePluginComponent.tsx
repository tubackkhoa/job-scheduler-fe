import { FieldProps } from '@rjsf/utils';
import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

const { CodeMirror } = Components;

export default function ({
  onChange,
  formData,
  fieldPathId,
}: FieldProps<string>) {
  const [mode] = Utils.useAppColorScheme();
  const [input, setInput] = useState(formData);
  const handleRun = async () => {
    onChange(input, fieldPathId.path);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="subtitle1">Compiled react component</Typography>
      <CodeMirror
        theme={mode}
        maxHeight="400px"
        value={input}
        onChange={(value) => setInput(value)}
        extensions={[Utils.javascriptLang]}
      />
      <Button variant="contained" onClick={handleRun}>
        Compile
      </Button>
    </Box>
  );
}

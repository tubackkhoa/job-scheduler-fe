import { useTheme } from '@mui/material';
import { FieldProps } from '@rjsf/utils';

const { Box, Button, Typography } = Mui;
const { useState } = React;
const { CodeMirror } = Components;

export default function ({
  onChange,
  formData,
  fieldPathId,
}: FieldProps<string>) {
  const theme = useTheme();
  const [input, setInput] = useState(formData);
  const handleRun = async () => {
    onChange(input, fieldPathId.path);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="subtitle1">Compiled react component</Typography>
      <CodeMirror
        theme={theme.palette.mode}
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

import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

const { CodeMirror } = Components;

export default function ({
  onChange,
  formData,
  fieldPathId,
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<string>) {
  const [mode] = Hooks.useAppColorScheme();
  const { t } = Hooks.useTranslation(pluginPackage);
  const [input, setInput] = useState(formData);
  const handleRun = async () => {
    onChange(input, fieldPathId.path);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="subtitle1">
        {t('compiled react component')}
      </Typography>
      <CodeMirror
        theme={mode}
        maxHeight="400px"
        value={input}
        onChange={(value) => setInput(value)}
        extensions={[Utils.javascriptLang]}
      />
      <Button variant="contained" onClick={handleRun}>
        {t('compile')}
      </Button>
    </Box>
  );
}

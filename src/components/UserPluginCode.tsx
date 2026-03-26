import api from '@/api';
import { useAppColorScheme } from '@/hooks/useAppColorSchema';
import useNotifications from '@/hooks/useNotifications/useNotifications';
import { JinjaCompletionBuilder, jinjaLinter, yamlLang } from '@/utils';
import { jinja } from '@codemirror/lang-jinja';
import { Paper, Stack, Typography } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';

interface Props {
  env: EnvDoc;
  pluginPackage: string;
  formData: any;
  onRefresh: () => void;
  setError: (msg: string) => void;
}

export default function UserPluginCode({
  pluginPackage,
  formData,
  env,
  setError,
  onRefresh,
}: Props) {
  const [mode] = useAppColorScheme();
  const notifications = useNotifications();
  const [isDirty, setIsDirty] = useState(false);
  const [code, setCode] = useState<PluginUserCodeResponse>({
    form: '',
    script: '',
  });
  useEffect(() => {
    (async () => {
      const data = await api.fetchTemplatePluginCode(pluginPackage);
      setCode(data);
    })();
  }, []);

  const handleUpdatePluginCode = async () => {
    if (!isDirty) return;
    try {
      const result = await api.updateTemplatePluginCode(pluginPackage, code);
      if (result.success)
        notifications.show('Update template successuflly', {
          severity: 'success',
        });
      setIsDirty(false);
      onRefresh();
    } catch (ex) {
      setError(ex.message);
    }
  };

  return (
    <Paper elevation={0} sx={{ background: 'transparent' }}>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Json Schema Form
        </Typography>

        <CodeMirror
          theme={mode}
          minHeight="200px"
          value={code.form}
          extensions={[yamlLang]}
          onChange={(value) => {
            setIsDirty(true);
            setCode((prev) => {
              return { ...prev, form: value };
            });
          }}
          onBlur={handleUpdatePluginCode}
        />
      </Stack>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Jinja Script
        </Typography>

        <CodeMirror
          theme={mode}
          minHeight="200px"
          value={code.script}
          extensions={[
            jinja(JinjaCompletionBuilder.build(formData, env)),
            jinjaLinter(formData, env),
          ]}
          onChange={(value) => {
            setIsDirty(true);
            setCode((prev) => {
              return { ...prev, code: value };
            });
          }}
          onBlur={handleUpdatePluginCode}
        />
      </Stack>
    </Paper>
  );
}

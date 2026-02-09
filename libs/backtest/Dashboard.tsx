import { RJSFSchema } from '@rjsf/utils';
import { Stack, Button } from '@mui/material';
import { useState, useEffect } from 'react';
const { ConfigForm } = Components;

export default function ({
  formData: { pluginId },
  registry: {
    formContext: { pluginPackage },
  },
}: ConfigFieldProps<PluginPageData>) {
  const [schema, setSchema] = useState<RJSFSchema>();
  const [config, setConfig] = useState();
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const setting = await Utils.jinjaEvaluate(
        pluginPackage,
        `{ "config": {{ setting.model_dump(mode="json") | tojson }}, "schema": {{ setting.model_json_schema() | tojson }} }`,
      );
      setConfig(setting.config);
      setSchema(setting.schema);
    };
    load();
  }, []);

  const handleSaveSetting = async () => {
    setSubmitting(true);
    await Utils.jinjaEvaluate(pluginPackage, `{{ update_setting(config) }}`, {
      config,
    });
    setSubmitting(false);
  };

  if (!config) return null;

  return (
    <Stack gap={3}>
      <ConfigForm
        pluginId={pluginId}
        pluginPackage={pluginPackage}
        formData={config}
        schema={schema}
        onChange={(data) => {
          setConfig(data);
        }}
        env={undefined}
        sessionId={0}
      />

      <Button
        variant="contained"
        startIcon={<AppIcon.Save />}
        onClick={handleSaveSetting}
        disabled={isSubmitting}
        color="primary"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </Stack>
  );
}

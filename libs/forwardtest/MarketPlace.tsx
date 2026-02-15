import { FieldProps } from '@rjsf/utils';
import { useEffect, useState } from 'react';

const { LoadingSkeleton, DynamicField } = Components;
const { jinjaEvaluate } = Utils;

export default ({ formData, ...rest }: FieldProps<RoutesResponse>) => {
  const [pnlData, setPnlData] = useState<string>();
  useEffect(() => {
    const load = async () => {
      const data = await jinjaEvaluate(
        formData.package,
        `
{% set stats = fetch_stats_running_models() %}
{% set models = get_running_models() | pick ("identity", "currentConfig") %}
{% set identities = stats | map(attribute="identity") | list %}
{% set job_list = dao.get_jobs_by_model_keys(identities) | pick ("active", "description", "config.model_key") %}
{
  "models": {{ models | tojson }},
  "jobList": {{ job_list | tojson }},
  "stats": {{ stats | tojson }}
}`,
        {},
        true,
      );
      setPnlData(data);
    };
    load();
  }, [formData.package]);

  if (!pnlData) return <LoadingSkeleton size={3} />;
  return (
    <DynamicField
      formData={pnlData}
      {...(rest as FieldProps)}
      schema={{
        url: import.meta.env.DEV
          ? 'PnlPreview.tsx'
          : '{base_url}/assets/{package}/pnl_preview.js',
      }}
    />
  );
};

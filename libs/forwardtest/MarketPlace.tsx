import { FieldProps } from '@rjsf/utils';
import PnlPreview from '../PnlPreview';
import { useEffect, useState } from 'react';

const { jinjaEvaluate } = Utils;

export default ({
  formData,
  registry,
  ...rest
}: FieldProps<RoutesResponse>) => {
  const [pnlData, setPnlData] = useState<string>();
  useEffect(() => {
    const load = async () => {
      const data = await jinjaEvaluate(
        formData.package,
        `
{% set stats = fetch_stats_running_models() %}
{% set models = get_running_models() | pick ("identity","currentConfig") %}
{% set identities = stats | map(attribute="identity") | list %}
{% set job_list = dao.get_jobs_by_model_keys(identities) %}
{
  models: {{ models | tojson }},
  jobList: {{ job_list | tojson }},
  stats: {{ stats | tojson }}
}
        `,
        {},
        true,
      );
      setPnlData(data);
    };
    load();
  }, [formData.package]);
  return (
    pnlData && (
      <PnlPreview
        formData={pnlData}
        registry={{
          formContext: { pluginPackage: formData.package },
        }}
        {...(rest as FieldProps)}
      />
    )
  );
};

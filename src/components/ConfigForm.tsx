import { useEffect, useRef, useMemo, useState } from 'react';
import _ from 'lodash';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import {
  extractUiSchema,
  buildUiSchemaWithExpr,
  translateSchema,
} from '@/utils';
import fields from './fields';
import widgets from './widgets';
import { ErrorBoundary } from './ErrorBound';
import { ObjectFieldTemplate } from './templates/ObjectFieldTemplate';
import { IChangeEvent } from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import { useTranslation } from 'react-i18next';

interface Props {
  schema: RJSFSchema;
  env: EnvDoc;
  sessionId: number;
  formData: any;
  onChange: (data: any) => void;
  pluginPackage: string;
  pluginId: number;
}

export const ConfigForm = ({
  schema,
  env,
  sessionId,
  formData,
  onChange,
  pluginPackage,
  pluginId,
}: Props) => {
  const [localSchema, setLocalSchema] = useState<RJSFSchema>();
  const [extraErrors, setExtraErrors] = useState({});
  const changedFieldId = useRef(null);
  const { t } = useTranslation(pluginPackage);
  const handleChange = (
    { formData: newFormData }: IChangeEvent,
    fieldPathId?: string,
  ) => {
    if (onChange) {
      onChange(newFormData);
    }
    // strip first segment, seperator is "."
    changedFieldId.current = fieldPathId?.replace(/^[^.]+\./, '');
  };

  useEffect(() => {
    let isMounted = true;

    const updateSchema = async () => {
      const translated = await translateSchema(schema, t);
      if (!isMounted) return;
      setLocalSchema(translated);

      const [evaluatedSchema, errors] = await buildUiSchemaWithExpr(
        pluginPackage,
        formData,
        translated,
        changedFieldId.current,
      );
      if (!isMounted) return;

      setLocalSchema(evaluatedSchema);
      if (errors.length) setExtraErrors({ __errors: errors });
    };
    updateSchema();
    return () => {
      isMounted = false;
    };
  }, [schema, t, formData]);

  const uiSchema = useMemo(() => extractUiSchema(localSchema), [localSchema]);

  if (!localSchema) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Form
        extraErrors={extraErrors}
        schema={localSchema}
        uiSchema={uiSchema}
        formContext={{ formData, pluginPackage, env, sessionId }}
        idPrefix={localSchema.pluginId ?? pluginId}
        idSeparator="."
        fields={fields}
        widgets={widgets}
        formData={formData}
        validator={validator}
        onChange={handleChange}
        liveValidate={false}
        templates={{
          ObjectFieldTemplate,
        }}
      />
    </ErrorBoundary>
  );
};

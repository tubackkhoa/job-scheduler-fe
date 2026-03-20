import { useEffect, useState } from 'react';
import { IChangeEvent } from '@rjsf/core';
import { ErrorSchema, RJSFSchema } from '@rjsf/utils';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { buildUiSchemaWithExpr, translateSchema } from '@/utils';
import fields from './fields';
import widgets from './widgets';
import templates from './templates';
import { ErrorBoundary } from './ErrorBound';

interface Props {
  schema: RJSFSchema;
  env: EnvDoc;
  sessionId: number;
  formData: any;
  onChange: (data: any) => void;
  pluginPackage: string;
  pluginId: number;
}

export const defaultUiSchema: AnyObject = {
  'ui:submitButtonOptions': { norender: true },
};

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
  const [extraErrors, setExtraErrors] = useState<ErrorSchema>({});
  const { t, i18n } = useTranslation(pluginPackage);

  const updateSchema = async (
    newSchema: RJSFSchema,
    data: any,
    changedFieldId?: string,
  ) => {
    const [evaluatedSchema, errors] = await buildUiSchemaWithExpr(
      pluginPackage,
      data,
      newSchema,
      changedFieldId,
    );
    // handle errors
    if (errors.length) {
      const errorSchema: ErrorSchema = {};
      errorSchema.__errors = errors;
      setExtraErrors(errorSchema);
    } else {
      setLocalSchema(evaluatedSchema);
    }
  };

  const handleChange = (
    { formData: newFormData }: IChangeEvent,
    fieldPathId?: string,
  ) => {
    if (onChange) {
      onChange(newFormData);
    }
    // strip first segment, seperator is "."
    const changedFieldId = fieldPathId?.replace(/^[^.]+\./, '');
    updateSchema(localSchema, newFormData, changedFieldId);
  };

  // update schema when language changed
  useEffect(() => {
    translateSchema(schema, t).then((translatedScheme) =>
      updateSchema(translatedScheme, formData),
    );
  }, [schema, i18n.language]);

  if (!localSchema) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Form
        extraErrors={extraErrors}
        schema={localSchema}
        uiSchema={defaultUiSchema}
        formContext={{ formData, pluginPackage, env, sessionId }}
        idPrefix={localSchema.pluginId ?? pluginId}
        idSeparator="."
        fields={fields}
        widgets={widgets}
        formData={formData}
        validator={validator}
        onChange={handleChange}
        liveValidate={false}
        templates={templates}
      />
    </ErrorBoundary>
  );
};

import { useEffect, useRef, useMemo, useState } from 'react';
import _ from 'lodash';
import { Box } from '@mui/material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { extractUiSchema, buildUiSchemaWithExpr } from '@/utils';
import * as fields from './fields';
import widgets from './widgets';
import { ErrorBoundary } from './ErrorBound';
import { ObjectFieldTemplate } from './templates/ObjectFieldTemplate';
import { IChangeEvent } from '@rjsf/core';

export const ConfigForm = ({
  schema,
  env,
  sessionId,
  formData,
  onChange,
  pluginPackage,
  pluginId
}) => {
  const [localSchema, setLocalSchema] = useState(schema);
  const [extraErrors, setExtraErrors] = useState({});
  const changedFieldId = useRef(null);

  const handleChange = (
    { formData: newFormData }: IChangeEvent,
    fieldPathId?: string
  ) => {
    if (onChange) {
      onChange(newFormData);
    }
    // strip first segment, seperator is "."
    changedFieldId.current = fieldPathId?.replace(/^[^.]+\./, '');
  };

  useEffect(() => {
    buildUiSchemaWithExpr(
      pluginPackage,
      formData,
      localSchema, // remain state
      changedFieldId.current
    ).then(([newSchema, errors]) => {
      setLocalSchema(newSchema);
      if (errors.length) setExtraErrors({ __errors: errors });
    });
  }, [formData]);

  const uiSchema = useMemo(() => extractUiSchema(localSchema), [localSchema]);

  if (!schema) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        '& .rjsf': {
          '& .form-group': { mb: 0 },
          '& .field': { mb: 0 },
          '& .control-label': { mb: 1 }
        }
      }}
    >
      {formData && (
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
              ObjectFieldTemplate
            }}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
};

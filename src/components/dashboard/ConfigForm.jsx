import { useEffect, useRef, useMemo } from 'react';
import { Box, Paper, Stack, Typography, Grid } from '@mui/material';
import { Settings } from '@mui/icons-material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { extractUiSchema, evaluate } from '../../utils';
import fields from './fields';
import ErrorBoundary from './ErrorBound';

export const ConfigForm = function ConfigForm({
  schema,
  env,
  formData,
  onChange,
  pluginPackage
}) {
  const formRef = useRef();
  // Pass a stable formContext object with the ref
  const formContext = useMemo(
    () => ({ formRef, pluginPackage, env }),
    [pluginPackage]
  );
  const watchMap = useRef({});
  const currentFormData = useRef(formData);
  const updateExpressions = (data) => {
    currentFormData.current = data;
    for (const [cacheId, expr] of Object.entries(watchMap.current)) {
      const el = document.getElementById(cacheId);
      if (!el) continue;
      const isHidden = evaluate(expr, data, false);
      el.style.display = isHidden ? 'none' : 'block';
    }
  };
  useEffect(() => {
    updateExpressions(formData);
  }, [formData]);

  const handleChange = ({ formData: newFormData }) => {
    if (onChange) {
      updateExpressions(newFormData);
      onChange(newFormData);
    }
  };

  if (!schema) {
    return null;
  }

  // Custom ObjectFieldTemplate to create sections with Paper
  const ObjectFieldTemplate = (props) => {
    const { title, description, properties, schema } = props;
    const isRoot = !props.idSchema || props.idSchema.$id === 'root';

    // Check if this is a nested object (like strategy_config)

    if (isRoot) {
      // Root level - separate object fields from regular fields
      const objectFields = [];
      const regularFields = [];

      properties.forEach((prop) => {
        const fieldSchema = prop.content?.props?.schema;
        if (fieldSchema?.type === 'object' && fieldSchema?.properties) {
          objectFields.push(prop);
        } else {
          regularFields.push(prop);
        }
      });

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          {/* General Settings section for non-object fields */}
          {regularFields.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                bgcolor: 'rgba(99, 102, 241, 0.04)',
                border: 1,
                borderColor: 'divider',
                borderRadius: 3
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 3 }}
              >
                <Settings fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={600}>
                  General Settings
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                {regularFields.map((prop, index) => {
                  const isEditor =
                    prop.content.props.uiSchema?.['ui:field'] === 'Template';
                  return (
                    <Grid
                      item
                      size={isEditor ? 12 : 3}
                      key={index}
                      className="config-field"
                    >
                      {prop.content}
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          )}

          {/* Object fields (sections) */}
          {objectFields.map((prop) => prop.content)}
        </Box>
      );
    }

    // Nested object - render as Paper section
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          bgcolor: 'rgba(236, 72, 153, 0.04)',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title || schema?.title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          )}
        </Box>
        <Grid container spacing={2}>
          {properties.map((prop, index) => {
            return (
              <Grid item xs={12} size={3} key={index}>
                {prop.content}
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

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
            schema={schema}
            uiSchema={extractUiSchema(schema)}
            formContext={formContext}
            ref={formRef}
            fields={fields}
            formData={formData}
            validator={validator}
            onChange={handleChange}
            liveValidate={false}
            showErrorList={false}
            templates={{
              ObjectFieldTemplate,
              FieldTemplate: (props) => {
                const { help, errors, children, schema, fieldPathId } = props;
                const cacheId = `cache_${
                  fieldPathId?.path?.join('.') ?? props.id
                }`;
                let isHidden = false;
                if (schema['ui:options']) {
                  isHidden = evaluate(
                    schema['ui:options'].hidden,
                    currentFormData.current ?? formData,
                    false
                  );
                  // cache first time because schema won't change
                  watchMap.current[cacheId] = schema['ui:options'].hidden;
                }

                return (
                  <Box
                    id={cacheId}
                    sx={{ width: '100%', display: isHidden ? 'none' : 'block' }}
                  >
                    {children}
                    {errors}
                    {help}
                  </Box>
                );
              }
            }}
          >
            <div style={{ display: 'none' }} />
          </Form>
        </ErrorBoundary>
      )}
    </Box>
  );
};

import { useEffect, useRef, useMemo, useState } from 'react';

import { Box, Paper, Stack, Typography, Grid } from '@mui/material';
import { Settings } from '@mui/icons-material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { extractUiSchema, buildUiSchemaWithExpr } from '../../utils';
import fields from './fields';
import widgets from './widgets';
import api from '../../api';
import json5 from 'json5';
import ErrorBoundary from './ErrorBound';

export const ConfigForm = function ConfigForm({
  schema,
  env,
  formData,
  onChange,
  pluginPackage
}) {
  const [localSchema, setLocalSchema] = useState({});

  const formRef = useRef();
  // Pass a stable formContext object with the ref
  const formContext = useMemo(
    () => ({ formRef, pluginPackage, env }),
    [pluginPackage, env]
  );

  const handleChange = ({ formData: newFormData }) => {
    if (onChange) {
      onChange(newFormData);
    }
  };

  useEffect(() => {
    buildUiSchemaWithExpr(schema, {
      ...formData,
      JSON: json5,
      render: async (tmpl) => {
        const { result } = await api.renderTemplate(
          pluginPackage,
          tmpl,
          formData
        );
        return result;
      }
    }).then((newSchema) => {
      setLocalSchema(newSchema);
    });
  }, [formData]);

  const uiSchema = useMemo(() => extractUiSchema(localSchema), [localSchema]);

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
                {regularFields.map(({ content }) => {
                  const uiSchema = content.props.uiSchema;
                  const isEditor = uiSchema?.['ui:field'] === 'Template';
                  // fowllowing: https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/LayoutGridField/
                  const size =
                    uiSchema?.['ui:options']?.size ?? (isEditor ? 12 : 3);
                  return (
                    <Grid
                      item
                      size={size}
                      key={content.key}
                      className="config-field"
                    >
                      {content}
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          )}

          {/* Object fields (sections) */}
          {objectFields.map(({ content }) => content)}
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
          {properties.map(({ content }) => {
            const uiSchema = content.props.uiSchema;
            const isEditor = uiSchema?.['ui:field'] === 'Template';
            // fowllowing: https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/LayoutGridField/
            const size = uiSchema?.['ui:options']?.size ?? (isEditor ? 12 : 3);
            return (
              <Grid item xs={12} size={size} key={content.key}>
                {content}
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
            schema={localSchema}
            uiSchema={uiSchema}
            formContext={formContext}
            ref={formRef}
            fields={fields}
            widgets={widgets}
            formData={formData}
            validator={validator}
            onChange={handleChange}
            liveValidate={false}
            showErrorList={false}
            templates={{
              ObjectFieldTemplate
            }}
          />
        </ErrorBoundary>
      )}
    </Box>
  );
};

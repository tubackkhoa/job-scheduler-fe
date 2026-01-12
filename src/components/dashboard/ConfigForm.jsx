import { useEffect, useRef, useMemo, useState } from 'react';
import _ from 'lodash';
import { Box, Paper, Stack, Typography, Grid } from '@mui/material';
import { Settings } from '@mui/icons-material';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import {
  extractUiSchema,
  buildUiSchemaWithExpr,
  buildJinjaContext
} from '../../utils';
import fields from './fields';
import widgets from './widgets';
import ErrorBoundary from './ErrorBound';

const calculateItemSize = (uiSchema) => {
  const isEditor = uiSchema?.['ui:field'] === 'Template';
  const size = uiSchema?.['ui:options']?.size;
  const calSize = { xs: 12 };
  if (typeof size === 'object') {
    Object.assign(calSize, size);
  } else {
    calSize.md = size ?? (isEditor ? 12 : 3);
  }
  return calSize;
};

const fieldWrapperStyle = {
  p: { xs: 0, sm: 3.5 },
  bgcolor: { xs: 'transparent', sm: 'rgba(99, 102, 241, 0.04)' },
  border: { xs: 'none', sm: 1 },
  borderColor: { xs: 'transparent', sm: 'divider' },
  borderRadius: { xs: 0, sm: 3 }
};

export const ConfigForm = function ConfigForm({
  schema,
  env,
  formData,
  onChange,
  pluginPackage,
  pluginId
}) {
  const [localSchema, setLocalSchema] = useState(schema);
  const changedFieldId = useRef();

  const handleChange = ({ formData: newFormData }, fieldPathId) => {
    if (onChange) {
      onChange(newFormData);
    }
    // strip first segment, seperator is "."
    changedFieldId.current = fieldPathId?.replace(/^[^.]+\./, '');
  };

  useEffect(() => {
    const context = buildJinjaContext(pluginPackage, env.filters, formData);
    buildUiSchemaWithExpr(
      localSchema, // remain state
      context,
      changedFieldId.current
    ).then((newSchema) => {
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
    const isRoot = !props.idSchema || props.idSchema.$id === pluginId;

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
            <Paper elevation={0} sx={fieldWrapperStyle}>
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
                  const size = calculateItemSize(content.props.uiSchema);
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
      <Paper elevation={0} sx={fieldWrapperStyle}>
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
            const size = calculateItemSize(content.props.uiSchema);
            return (
              <Grid item size={size} key={content.key}>
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
            formContext={{ formData, pluginPackage, env }}
            idPrefix={pluginId}
            idSeparator="."
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

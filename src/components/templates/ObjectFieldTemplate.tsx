import {
  Breakpoint,
  Grid,
  GridSize,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type {
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import React, { type ReactNode } from 'react';

interface FieldsGridProps {
  fields: ObjectFieldTemplatePropertyType[];
}

interface FieldContentProps {
  schema: RJSFSchema;
  uiSchema?: UiSchema;
}

type ResponsiveStyleValue<T> =
  | T
  | Array<T | null>
  | { [key in Breakpoint]?: T | null };
type GridSizeObject = ResponsiveStyleValue<GridSize>;

const calculateItemSize = (schema?: RJSFSchema): GridSizeObject => {
  const isEditor = schema?.['ui:field'] === 'Template';
  const size = schema?.['ui:options']?.size;

  const calSize: GridSizeObject = { xs: 12 };

  if (typeof size === 'object' && size !== null) {
    Object.assign(calSize, size);
  } else {
    calSize.md = (size as GridSize) ?? (isEditor ? 12 : 3);
  }

  return calSize;
};

const fieldWrapperStyle = {
  p: { xs: 0, sm: 1 },
  bgcolor: 'transparent',
  border: 'none',
};

const FieldsGrid: React.FC<FieldsGridProps> = ({ fields }) => (
  <Grid container spacing={2}>
    {fields.map(({ content }) => {
      let children = content as React.ReactElement<FieldContentProps>;

      const { schema, uiSchema } = children.props;
      const size = calculateItemSize(schema);

      // build uiSchema dynamic from schema
      if (!uiSchema) {
        const newUiSchema = {};

        for (const [uiKey, uiValue] of Object.entries(schema)) {
          if (uiKey.startsWith('ui:') && !uiKey.startsWith('ui:expr')) {
            newUiSchema[uiKey] = uiValue;
          }
        }
        // update uiSchema
        children = React.cloneElement(children, {
          uiSchema: newUiSchema,
        });
      }

      return (
        <Grid size={size} key={content.key} className="config-field">
          {children}
        </Grid>
      );
    })}
  </Grid>
);

type SectionPaperProps = {
  title?: ReactNode;
  description?: ReactNode;
  isRoot: boolean;
  children: ReactNode;
};

const SectionPaper: React.FC<SectionPaperProps> = ({
  title,
  description,
  isRoot,
  children,
}) => {
  return (
    <Paper elevation={0} sx={fieldWrapperStyle}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        {isRoot && <AppIcon.Settings fontSize="small" color="primary" />}
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>

        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Stack>

      {children}
    </Paper>
  );
};

// ------------------------------------------------------
// ObjectFieldTemplate
// ------------------------------------------------------

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = (
  props,
) => {
  const { title, description, properties, schema, fieldPathId } = props;

  // ----------------------------------------------------
  // NESTED OBJECT
  // ----------------------------------------------------
  const sectionOption = schema?.['ui:options']?.section;
  if (sectionOption === false) {
    return <FieldsGrid fields={properties} />;
  }
  const isRoot = fieldPathId.path.length === 0;

  return (
    <SectionPaper title={title} description={description} isRoot={isRoot}>
      <FieldsGrid fields={properties} />
    </SectionPaper>
  );
};

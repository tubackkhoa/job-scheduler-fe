import type { ReactNode } from 'react';
import type {
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps
} from '@rjsf/utils';
import _ from 'lodash';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Breakpoint,
  GridSize
} from '@mui/material';

type UISchema = {
  'ui:field'?: string;
  'ui:options'?: {
    size?: GridSize | Record<string, GridSize>;
    section?: boolean;
  };
};

type ResponsiveStyleValue<T> =
  | T
  | Array<T | null>
  | { [key in Breakpoint]?: T | null };
type GridSizeObject = ResponsiveStyleValue<GridSize>;

const calculateItemSize = (uiSchema?: UISchema): GridSizeObject => {
  const isEditor = uiSchema?.['ui:field'] === 'Template';
  const size = uiSchema?.['ui:options']?.size;

  const calSize: GridSizeObject = { xs: 12 };

  if (typeof size === 'object' && size !== null) {
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

type FieldsGridProps = {
  fields: ObjectFieldTemplatePropertyType[];
};

const FieldsGrid: React.FC<FieldsGridProps> = ({ fields }) => (
  <Grid container spacing={2}>
    {fields.map(({ content }) => {
      // @ts-ignore
      const size = calculateItemSize(content.props?.uiSchema);

      return (
        <Grid size={size} key={content.key} className="config-field">
          {content}
        </Grid>
      );
    })}
  </Grid>
);

type SectionPaperProps = {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
};

const SectionPaper: React.FC<SectionPaperProps> = ({
  title,
  description,
  icon,
  children
}) => (
  <Paper elevation={0} sx={fieldWrapperStyle}>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Stack>

    {children}
  </Paper>
);

// ------------------------------------------------------
// ObjectFieldTemplate
// ------------------------------------------------------

export const ObjectFieldTemplate: React.FC<ObjectFieldTemplateProps> = (
  props
) => {
  const { title, description, properties, schema, uiSchema } = props;

  // ----------------------------------------------------
  // NESTED OBJECT
  // ----------------------------------------------------
  const sectionOption = uiSchema?.['ui:options']?.section;

  if (sectionOption === false) {
    return <FieldsGrid fields={properties} />;
  }

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

      <FieldsGrid fields={properties} />
    </Paper>
  );
};

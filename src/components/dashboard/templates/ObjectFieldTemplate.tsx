import { type ReactNode } from 'react';
import type {
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps
} from '@rjsf/utils';
import _ from 'lodash';
import {
  Paper,
  Typography,
  Grid,
  Breakpoint,
  GridSize,
  Stack
} from '@mui/material';
import { Settings } from '@mui/icons-material';

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
    calSize.md = (size as GridSize) ?? (isEditor ? 12 : 3);
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
  isRoot: boolean;
  children: ReactNode;
};

const SectionPaper: React.FC<SectionPaperProps> = ({
  title,
  description,
  isRoot,
  children
}) => {
  return (
    <Paper elevation={0} sx={fieldWrapperStyle}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        {isRoot && <Settings fontSize="small" color="primary" />}
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
  props
) => {
  const { title, description, properties, uiSchema, fieldPathId } = props;

  // ----------------------------------------------------
  // NESTED OBJECT
  // ----------------------------------------------------
  const sectionOption = uiSchema?.['ui:options']?.section;

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

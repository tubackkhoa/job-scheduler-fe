import {
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  InputAdornment,
  Box,
  Select,
  Typography,
} from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import { useMemo, useCallback } from 'react';

export function SelectField({
  formData,
  fieldPathId,
  schema,
  uiSchema,
  onChange,
}: FieldProps) {
  const labelId = `${fieldPathId?.$id}-label`;
  // uiSchema is updated
  const uiOptions = uiSchema['ui:options'] ?? {};
  const multiple = uiOptions.multiple === true;

  /**
   * Normalize options once
   */
  const options = useMemo(() => {
    let raw = schema?.enum || schema?.default || [];

    if (typeof raw === 'string') {
      raw = raw.split(',').map((v) => v.trim());
    }

    return (raw as any[]).map((opt) =>
      uiOptions.id
        ? { id: opt[uiOptions.id], title: opt[uiOptions.title ?? uiOptions.id] }
        : { id: opt, title: opt },
    );
  }, [schema, uiOptions]);

  /**
   * Fast lookup
   */
  const optionIds = useMemo(
    () => new Set(options.map((opt) => opt.id)),
    [options],
  );

  const optionMap = useMemo(
    () => new Map(options.map((opt) => [opt.id, opt.title])),
    [options],
  );

  /**
   * Normalize selected value(s)
   */
  const selectedValue = useMemo(() => {
    if (multiple) {
      if (!Array.isArray(formData)) return [];
      return formData.filter((v) => optionIds.has(v));
    }

    return optionIds.has(formData) ? formData : '';
  }, [formData, optionIds, multiple]);

  const selectedSet = useMemo(
    () => new Set(Array.isArray(selectedValue) ? selectedValue : []),
    [selectedValue],
  );

  const allSelected =
    multiple && options.length > 0 && selectedValue.length === options.length;

  const someSelected = multiple && selectedValue.length > 0 && !allSelected;

  /**
   * Change handler
   */
  const handleChange = useCallback(
    (event) => {
      let value = event.target.value;

      if (multiple) {
        value = typeof value === 'string' ? value.split(',') : value;

        onChange(
          value.filter((v) => optionIds.has(v)),
          fieldPathId?.path,
        );
      } else {
        onChange(optionIds.has(value) ? value : undefined, fieldPathId?.path);
      }
    },
    [multiple, onChange, optionIds, fieldPathId?.path],
  );

  /**
   * Select all handler (multi only)
   */
  const handleSelectAll = useCallback(
    (e) => {
      e.stopPropagation();
      onChange(
        allSelected ? [] : options.map((opt) => opt.id),
        fieldPathId?.path,
      );
    },
    [allSelected, options, onChange, fieldPathId?.path],
  );

  /**
   * Render selected values (multi only)
   */
  const renderValue = useCallback(
    (selected) => {
      if (!multiple) return null;

      if (selected.length > 3) {
        return (
          <Typography variant="body2">
            {selected.length} items selected
          </Typography>
        );
      }

      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {selected.map((id) => (
            <Typography
              variant="subtitle2"
              key={id}
              sx={{
                backgroundColor: 'var(--mui-palette-primary-main)',
                px: 1,
                borderRadius: 0.5,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {optionMap.get(id) ?? id}
            </Typography>
          ))}
        </Box>
      );
    },
    [multiple, optionMap],
  );

  return (
    <FormControl fullWidth>
      <InputLabel id={labelId}>{schema.title}</InputLabel>

      <Select
        labelId={labelId}
        label={schema.title}
        multiple={multiple}
        value={selectedValue}
        onChange={handleChange}
        renderValue={multiple ? renderValue : undefined}
        startAdornment={
          multiple && (
            <InputAdornment position="start">
              <Checkbox
                edge="start"
                checked={allSelected}
                indeterminate={someSelected}
                onClick={handleSelectAll}
              />
            </InputAdornment>
          )
        }
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
            },
          },
        }}
      >
        {options.map(({ id, title }) => (
          <MenuItem key={id} value={id}>
            {multiple && (
              <Checkbox
                edge="start"
                checked={selectedSet.has(id)}
                sx={{ mr: 1, py: 0 }}
              />
            )}
            {title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

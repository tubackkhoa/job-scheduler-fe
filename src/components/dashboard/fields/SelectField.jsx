import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  InputAdornment,
  Box,
  Select,
  Divider,
  Chip,
  Typography
} from '@mui/material';
import { useMemo, useCallback } from 'react';

export function SelectField({ formData, fieldPathId, schema, onChange }) {
  const labelId = `${fieldPathId?.$id}-label`;

  const uiOptions = schema['ui:options'] ?? {};
  const multiple = uiOptions.multiple === true;

  /**
   * Normalize options once
   */
  const options = useMemo(() => {
    let raw = schema?.enum || schema?.default || [];

    if (typeof raw === 'string') {
      raw = raw.split(',').map((v) => v.trim());
    }

    return raw.map((opt) =>
      uiOptions.id
        ? { id: opt[uiOptions.id], title: opt[uiOptions.title ?? uiOptions.id] }
        : { id: opt, title: opt }
    );
  }, [schema, uiOptions]);

  /**
   * Fast lookup
   */
  const optionIds = useMemo(
    () => new Set(options.map((opt) => opt.id)),
    [options]
  );

  const optionMap = useMemo(
    () => new Map(options.map((opt) => [opt.id, opt.title])),
    [options]
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
    [selectedValue]
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
          fieldPathId?.path
        );
      } else {
        onChange(optionIds.has(value) ? value : undefined, fieldPathId?.path);
      }
    },
    [multiple, onChange, optionIds, fieldPathId?.path]
  );

  /**
   * Select all handler (multi only)
   */
  const handleSelectAll = useCallback(
    (e) => {
      e.stopPropagation();
      onChange(
        allSelected ? [] : options.map((opt) => opt.id),
        fieldPathId?.path
      );
    },
    [allSelected, options, onChange, fieldPathId?.path]
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
            <Chip
              key={id}
              size="small"
              label={optionMap.get(id) ?? id}
              sx={{
                maxWidth: 120,
                '.MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            />
          ))}
        </Box>
      );
    },
    [multiple, optionMap]
  );

  return (
    <FormControl fullWidth size="small">
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
              mt: 0.5,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              boxShadow:
                '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
            }
          }
        }}
      >
        {multiple && <Divider sx={{ my: 0.5 }} />}

        {options.map(({ id, title }) => (
          <MenuItem key={id} value={id}>
            {multiple && (
              <Checkbox checked={selectedSet.has(id)} sx={{ mr: 1.5 }} />
            )}
            <ListItemText
              primary={title}
              slotProps={{
                primary: {
                  fontSize: '0.875rem',
                  fontWeight: multiple
                    ? selectedSet.has(id)
                      ? 500
                      : 400
                    : id === selectedValue
                    ? 500
                    : 400
                }
              }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

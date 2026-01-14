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

export function MultiSelectField({ formData, fieldPathId, schema, onChange }) {
  const labelId = `${fieldPathId?.$id}-label`;

  /**
   * Normalize options once
   */
  const options = useMemo(() => {
    let raw = schema?.enum || schema?.default || [];

    if (typeof raw === 'string') {
      raw = raw.split(',').map((v) => v.trim());
    }
    const uiOptions = schema['ui:options'];
    return raw.map((opt) =>
      uiOptions?.id
        ? { id: opt[uiOptions.id], title: opt[uiOptions.title ?? uiOptions.id] }
        : { id: opt, title: opt }
    );
  }, [schema]);

  /**
   * Fast lookup maps
   */
  const optionMap = useMemo(
    () => new Map(options.map((opt) => [opt.id, opt.title])),
    [options]
  );

  const optionIds = useMemo(
    () => new Set(options.map((opt) => opt.id)),
    [options]
  );

  /**
   * Normalize and validate selected values
   */
  const selectedValues = useMemo(() => {
    if (!Array.isArray(formData)) return [];
    return formData.filter((v) => optionIds.has(v));
  }, [formData, optionIds]);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const allSelected =
    options.length > 0 && selectedValues.length === options.length;

  const someSelected = selectedValues.length > 0 && !allSelected;

  /**
   * Handlers
   */
  const handleChange = useCallback(
    (event) => {
      const value =
        typeof event.target.value === 'string'
          ? event.target.value.split(',')
          : event.target.value;

      onChange(
        value.filter((v) => optionIds.has(v)),
        fieldPathId?.path
      );
    },
    [onChange, fieldPathId?.path, optionIds]
  );

  const handleSelectAll = useCallback(
    (e) => {
      e.stopPropagation();
      onChange(
        allSelected ? [] : options.map((opt) => opt.id),
        fieldPathId?.path
      );
    },
    [allSelected, onChange, options, fieldPathId?.path]
  );

  /**
   * Render selected values
   */
  const renderValue = useCallback(
    (selected) => {
      // More than 3 → compact summary
      if (selected.length > 3) {
        return (
          <Typography variant="body2">
            {selected.length} items selected
          </Typography>
        );
      }

      // Render chips
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
    [optionMap]
  );

  return (
    <FormControl fullWidth size="small">
      <InputLabel id={labelId}>{schema.title}</InputLabel>

      <Select
        labelId={labelId}
        multiple
        label={schema.title}
        value={selectedValues}
        onChange={handleChange}
        renderValue={renderValue}
        startAdornment={
          <InputAdornment position="start">
            <Checkbox
              edge="start"
              checked={allSelected}
              indeterminate={someSelected}
              onClick={handleSelectAll}
            />
          </InputAdornment>
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
        <Divider sx={{ my: 0.5 }} />

        {options.map(({ id, title }) => (
          <MenuItem
            key={id}
            value={id}
            sx={{
              py: 0.75,
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-selected': { bgcolor: 'action.selected' },
              '&.Mui-selected:hover': { bgcolor: 'action.selected' }
            }}
          >
            <Checkbox checked={selectedSet.has(id)} sx={{ mr: 1.5 }} />
            <ListItemText
              primary={title}
              slotProps={{
                primary: {
                  fontSize: '0.875rem',
                  fontWeight: selectedSet.has(id) ? 500 : 400
                }
              }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

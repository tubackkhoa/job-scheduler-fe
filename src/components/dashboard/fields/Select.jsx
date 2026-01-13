import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ListItemText
} from '@mui/material';
import { useMemo, useCallback } from 'react';

export function SelectField({ formData, fieldPathId, schema, onChange }) {
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
   * Fast lookup
   */
  const optionIds = useMemo(
    () => new Set(options.map((opt) => opt.id)),
    [options]
  );

  /**
   * Normalize selected value
   */
  const selectedValue = useMemo(() => {
    return optionIds.has(formData) ? formData : '';
  }, [formData, optionIds]);

  /**
   * Handlers
   */
  const handleChange = useCallback(
    (event) => {
      const value = event.target.value;
      onChange(optionIds.has(value) ? value : undefined, fieldPathId?.path);
    },
    [onChange, fieldPathId?.path, optionIds]
  );

  return (
    <FormControl fullWidth size="small">
      <InputLabel id={labelId}>{schema.title}</InputLabel>

      <Select
        labelId={labelId}
        label={schema.title}
        value={selectedValue}
        onChange={handleChange}
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
            <ListItemText
              primary={title}
              slotProps={{
                primary: {
                  fontSize: '0.875rem',
                  fontWeight: id === selectedValue ? 500 : 400
                }
              }}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

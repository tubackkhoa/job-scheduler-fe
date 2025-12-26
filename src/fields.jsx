import React from 'react';

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Grid,
  Typography,
  Divider,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  ListItemText,
  OutlinedInput,
  Box,
  Tooltip,
  Chip
} from '@mui/material';

export function MLThresholdsTableField(props) {
  const { schema, formData = {}, onChange, fieldPathId } = props;

  // Extract model rows from schema
  const modelSchemas = schema.properties ?? {};

  // Extract column names from ModelMLThresholds schema
  const firstModelKey = Object.keys(modelSchemas)[0];
  const thresholdSchema = modelSchemas[firstModelKey]?.properties ?? {};

  const thresholdKeys = Object.keys(thresholdSchema);

  const updateCell = (modelKey, thresholdKey, patch) => {
    onChange(
      {
        ...formData,
        [modelKey]: {
          ...formData[modelKey],
          [thresholdKey]: {
            ...formData[modelKey][thresholdKey],
            ...patch
          }
        }
      },
      fieldPathId.path
    );
  };

  return (
    <Grid>
      <Typography variant="h5">{schema.title}</Typography>
      <Divider />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'text.secondary',
          my: 1,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Configure rules per model
        </Typography>
        <Tooltip title="Rule 1: |μ| ≥ threshold, Rule 2: min < |μ/σ| < max, Rule 3: σ < threshold">
          <Chip
            label="View rules"
            size="small"
            variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
          />
        </Tooltip>
      </Box>
      <Box
        sx={{
          overflowX: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.default'
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  backgroundColor: 'background.default',
                  minWidth: 120
                }}
              >
                Model
              </TableCell>
              <TableCell
                sx={{
                  position: 'sticky',
                  left: 120,
                  zIndex: 2,
                  backgroundColor: 'background.default',
                  minWidth: 120
                }}
              >
                Model Key
              </TableCell>

              {thresholdKeys.map((key) => (
                <React.Fragment key={key}>
                  <TableCell sx={{ minWidth: 120 }}>{thresholdSchema[key].title}</TableCell>
                  <TableCell
                    sx={{
                      minWidth: 90,
                      textAlign: 'center'
                    }}
                  >
                    Disable
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(formData).map(([modelKey, row]) => (
              <TableRow key={modelKey} hover>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 1,
                    minWidth: 120,
                    fontWeight: 600
                  }}
                >
                  {modelSchemas[modelKey]?.title}
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 120,
                    backgroundColor: 'background.paper',
                    zIndex: 1,
                    minWidth: 120,
                    color: 'text.secondary'
                  }}
                >
                  {modelKey}
                </TableCell>

                {thresholdKeys.map((thKey) => {
                  const cell = row[thKey];
                  return (
                    <React.Fragment key={`${modelKey}-${thKey}`}>
                      <TableCell sx={{ minWidth: 120 }}>
                        <TextField
                          variant="standard"
                          sx={{
                            minWidth: '7ch',
                            '& input': {
                              textAlign: 'right',
                              paddingRight: 1
                            }
                          }}
                          slotProps={{
                            input: {
                              step: 'any',
                              disableUnderline: true
                            }
                          }}
                          type="number"
                          size="small"
                          value={cell.value}
                          disabled={cell.disabled}
                          onChange={(e) =>
                            updateCell(modelKey, thKey, {
                              value: Number(e.target.value)
                            })
                          }
                        />
                      </TableCell>

                      <TableCell
                        sx={{
                          minWidth: 90,
                          textAlign: 'center'
                        }}
                      >
                        <Checkbox
                          checked={cell.disabled}
                          onChange={(e) =>
                            updateCell(modelKey, thKey, {
                              disabled: e.target.checked
                            })
                          }
                        />
                      </TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Grid>
  );
}

// Props:
// - options: string[] (the enum options from JSON schema)
// - defaultValue: string[] (default selected tokens from JSON schema)
// - label: string
// - onChange: (newValue: string[]) => void
export function MultiSelectField(props) {
  const { formData, fieldPathId, schema, onChange } = props;

  const handleChange = (event) => {
    const value = event.target.value;
    if (onChange) onChange(value, fieldPathId.path);
  };
  const defaultValue = Array.isArray(formData) ? formData : [];
  const options = schema.default
    ? schema.default.split(',').map((token) => token.trim())
    : [];
  return (
    <FormControl fullWidth>
      <InputLabel>{schema.title}</InputLabel>
      <Select
        multiple
        value={defaultValue}
        onChange={handleChange}
        input={<OutlinedInput label={schema.title} />}
        renderValue={(selected) => selected.join(', ')}
      >
        {options.map((token) => (
          <MenuItem key={token} value={token}>
            <Checkbox checked={formData?.indexOf(token) > -1} />
            <ListItemText primary={token} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

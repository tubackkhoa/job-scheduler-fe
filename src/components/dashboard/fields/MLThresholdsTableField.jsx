import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Stack,
  Typography,
  Divider,
  TextField,
  Box,
  Paper,
} from '@mui/material';

export function MLThresholdsTableField({
  schema,
  formData = {},
  registry,
  onChange,
  fieldPathId,
}) {
  const modelSchemas = schema.properties ?? {};
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
            ...formData[modelKey]?.[thresholdKey],
            ...patch,
          },
        },
      },
      fieldPathId?.path
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {schema.title}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Configure rules per model
        </Typography>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Model Key</TableCell>
              {thresholdKeys.map((key) => (
                <TableCell key={key} align="center" sx={{ minWidth: 120 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, display: 'block' }}
                  >
                    {thresholdSchema[key]?.title || key}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Disable
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(formData).map(([modelKey, row]) => (
              <TableRow
                key={modelKey}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {modelSchemas[modelKey]?.title || modelKey}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: 'monospace' }}
                  >
                    {modelKey}
                  </Typography>
                </TableCell>

                {thresholdKeys.map((thKey) => {
                  const cell = row?.[thKey] || { value: 0, disabled: false };
                  return (
                    <TableCell key={thKey} align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <TextField
                          type="number"
                          size="small"
                          value={cell.value ?? 0}
                          onChange={(e) =>
                            updateCell(modelKey, thKey, {
                              value: Number(e.target.value),
                            })
                          }
                          disabled={cell.disabled}
                          sx={{
                            width: 70,
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.875rem',
                            },
                          }}
                          inputProps={{ step: 0.01 }}
                        />
                        <Checkbox
                          size="small"
                          checked={cell.disabled ?? false}
                          onChange={(e) =>
                            updateCell(modelKey, thKey, {
                              disabled: e.target.checked,
                            })
                          }
                        />
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

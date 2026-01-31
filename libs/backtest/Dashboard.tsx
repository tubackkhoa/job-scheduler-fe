import { DynamicFieldProps } from '../../src/global';

export default function ({
  formData,
  React: { useCallback, useState },
  Mui: { Box, Button, TextField, Typography },
  Utils: { buildJinjaContext, _ }
}: DynamicFieldProps) {
  _.filter([]);
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="subtitle1">Dashboard page</Typography>
      {JSON.stringify(formData, null, 2)}
    </Box>
  );
}

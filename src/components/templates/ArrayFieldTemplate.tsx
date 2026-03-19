import { Box, Button, Stack } from '@mui/material';
import type { ArrayFieldTemplateProps } from '@rjsf/utils';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const ArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = (
  props,
) => {
  const { items, canAdd, onAddClick } = props;
  const { t } = useTranslation();
  return (
    <>
      <Stack spacing={2}>{items.map((element) => element)}</Stack>

      {canAdd && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AppIcon.Add />}
            onClick={onAddClick}
          >
            {t('add item')}
          </Button>
        </Box>
      )}
    </>
  );
};

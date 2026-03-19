import { Divider, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import type { ArrayFieldItemTemplateProps } from '@rjsf/utils';
import React from 'react';

export const ArrayFieldItemTemplate: React.FC<ArrayFieldItemTemplateProps> = (
  props,
) => {
  const {
    children,
    disabled,
    readonly,
    buttonsProps: {
      hasRemove,
      hasMoveUp,
      hasMoveDown,
      onRemoveItem,
      onMoveUpItem,
      onMoveDownItem,
    },
  } = props;

  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Grid>{children}</Grid>
      <Stack direction="row" spacing={1}>
        {hasMoveUp && (
          <Tooltip title="Move Up">
            <IconButton
              size="small"
              onClick={onMoveUpItem}
              disabled={disabled || readonly}
            >
              <AppIcon.ArrowUpward fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {hasMoveDown && (
          <Tooltip title="Move Down">
            <IconButton
              size="small"
              onClick={onMoveDownItem}
              disabled={disabled || readonly}
            >
              <AppIcon.ArrowDownward fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {hasRemove && (
          <Tooltip title="Remove">
            <IconButton
              size="small"
              color="error"
              onClick={onRemoveItem}
              disabled={disabled || readonly}
            >
              <AppIcon.Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      <Divider />
    </Stack>
  );
};

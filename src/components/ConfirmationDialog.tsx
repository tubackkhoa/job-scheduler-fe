import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack
} from '@mui/material';
import { Warning, Info, Error } from '@mui/icons-material';

const SEVERITY_CONFIG = {
  warning: {
    icon: Warning,
    color: 'warning.main',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    confirmColor: 'warning'
  },
  info: {
    icon: Info,
    color: 'info.main',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    confirmColor: 'primary'
  },
  error: {
    icon: Error,
    color: 'error.main',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    confirmColor: 'error'
  }
};

export type ConfirmationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  details?: React.ReactNode;
  severity?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  details,
  severity = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}: ConfirmationDialogProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.warning;
  const IconComponent = config.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2
          }
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: config.bgColor
            }}
          >
            <IconComponent sx={{ color: config.color, fontSize: 24 }} />
          </Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {message && (
            <Typography
              variant="body1"
              color="text.primary"
              sx={{
                p: 2,
                bgcolor: config.bgColor,
                borderRadius: 1,
                border: '1px solid',
                color: 'text.secondary',
                whiteSpace: 'pre-line',
                borderColor: config.color
              }}
            >
              {message}
            </Typography>
          )}

          {details && <Box>{details}</Box>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClose}
          disabled={isLoading}
          sx={{ minWidth: 80 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={config.confirmColor}
          disabled={isLoading}
          sx={{ minWidth: 100 }}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

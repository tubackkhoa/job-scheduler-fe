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
}) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.warning;
  const IconComponent = config.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2
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
          <Typography variant="body1" color="text.primary">
            {message}
          </Typography>
          {details && (
            <Box
              sx={{
                p: 2,
                bgcolor: config.bgColor,
                borderRadius: 1,
                border: '1px solid',
                borderColor: config.color
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {details}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={onClose} disabled={isLoading} sx={{ minWidth: 80 }}>
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

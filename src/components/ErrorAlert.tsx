import { Alert, AlertTitle, IconButton } from '@mui/material';

interface Props {
  message: string;
  onClose?: () => void;
}
export function ErrorAlert({ message, onClose }: Props) {
  return (
    <Alert
      severity="error"
      variant="outlined"
      action={
        onClose && (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <AppIcon.Close fontSize="small" />
          </IconButton>
        )
      }
      sx={{
        borderRadius: 2,
        bgcolor: 'rgba(239, 68, 68, 0.08)',
      }}
    >
      <AlertTitle>Error</AlertTitle>
      {message}
    </Alert>
  );
}

import { Alert, AlertTitle, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

export function ErrorAlert({ message, onClose }) {
  return (
    <Alert
      severity="error"
      variant="outlined"
      action={
        <IconButton
          aria-label="close"
          color="inherit"
          size="small"
          onClick={onClose}
        >
          <Close fontSize="small" />
        </IconButton>
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


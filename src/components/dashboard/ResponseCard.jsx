import { Card, CardHeader, CardContent, IconButton, Box } from '@mui/material';
import { CheckCircle, Cancel, Close } from '@mui/icons-material';

export function ResponseCard({ result, onClose }) {
  const isSuccess = result?.success !== false;

  return (
    <Card
      sx={{
        mt: 3,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: isSuccess ? 'success.main' : 'error.main',
      }}
    >
      <CardHeader
        avatar={
          isSuccess ? <CheckCircle color="success" /> : <Cancel color="error" />
        }
        title="Server Response"
        action={
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        }
        slotProps={{
          title: {
            variant: 'subtitle1',
            fontWeight: 600,
          },
        }}
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 2,
            maxHeight: 200,
            overflow: 'auto',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.85rem',
            color: isSuccess ? 'success.light' : 'error.light',
          }}
        >
          {JSON.stringify(result, null, 2)}
        </Box>
      </CardContent>
    </Card>
  );
}

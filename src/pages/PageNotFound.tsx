import { Container, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom'; // Assuming you use React Router
import ErrorIcon from '@mui/icons-material/Error';

export default function PageNotFound() {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <ErrorIcon color="error" sx={{ fontSize: 100, mb: 2 }} />
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Sorry, the page you are looking for does not exist.
        </Typography>
        <Typography variant="body1" paragraph>
          It might have been moved or deleted. Don't worry, we'll help you get
          back on track.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/"
          sx={{ mt: 3 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
}

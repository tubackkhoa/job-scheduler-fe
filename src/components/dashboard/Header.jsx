import { Box, Typography } from '@mui/material';

export function Header({ isLoading }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 3,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Job Scheduler Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage plugins, jobs, configurations, and live logs in one view.
        </Typography>
      </Box>
    </Box>
  );
}

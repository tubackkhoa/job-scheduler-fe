import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  LinearProgress,
} from '@mui/material';

export function LoadingBar({ isLoading }) {
  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }}
    >
      <LinearProgress
        sx={{
          height: 3,
          '& .MuiLinearProgress-bar': {
            background:
              'linear-gradient(90deg, #6366f1 0%, #ec4899 50%, #6366f1 100%)',
            backgroundSize: '200% 100%',
            animation: 'gradient 1.5s ease infinite',
          },
          '@keyframes gradient': {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
        }}
      />
    </Box>
  );
}

export function LoadingSkeleton() {
  return (
    <Card sx={{ my: 4 }}>
      <CardHeader
        avatar={<Skeleton variant="circular" width={40} height={40} />}
        title={<Skeleton width="40%" />}
        subheader={<Skeleton width="25%" />}
      />
      <CardContent>
        <Skeleton />
        <Skeleton width="90%" />
        <Skeleton width="60%" />
      </CardContent>
    </Card>
  );
}

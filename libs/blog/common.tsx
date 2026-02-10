import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const Header = ({
  link,
  title = 'Blog Plugin',
}: {
  link: string;
  title?: string;
}) => {
  return (
    <Box
      sx={{ mb: 2, justifyContent: 'center', width: '100%', display: 'flex' }}
    >
      <Typography
        component={Link}
        to={link}
        variant="h5"
        fontWeight={600}
        sx={{
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

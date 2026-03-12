import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const Header = ({ link, title }: { link: string; title: string }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography component={Link} to={link} variant="h5">
        {title}
      </Typography>
    </Box>
  );
};

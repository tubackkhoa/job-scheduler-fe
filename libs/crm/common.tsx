import { Box, Typography } from '@mui/material';

export const Header = ({ link, title }: { link: string; title: string }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography component={Components.RouterLink} to={link} variant="h5">
        {title}
      </Typography>
    </Box>
  );
};

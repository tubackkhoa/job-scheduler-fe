import { Box, IconButton, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export const Header = ({
  link,
  pluginPackage,
}: {
  link: string;
  pluginPackage: string;
}) => {
  const { t } = Hooks.useTranslation(pluginPackage);
  const [mode, setMode] = Hooks.useAppColorScheme();
  return (
    <Box
      sx={{
        mb: 2,
        justifyContent: 'center',
        width: '100%',
        display: 'flex',
      }}
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
        {t('blog plugin')}
      </Typography>
      <IconButton
        size="small"
        onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
        color="inherit"
        disableRipple
      >
        {mode === 'dark' ? <AppIcon.LightMode /> : <AppIcon.DarkMode />}
      </IconButton>
    </Box>
  );
};

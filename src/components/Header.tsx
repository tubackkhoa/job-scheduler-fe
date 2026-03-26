import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  Icon,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { scrollToTop } from '@/utils';
import { useScroll } from '@/hooks/useScroll';
import { useAppColorScheme } from '@/hooks/useAppColorSchema';
import { LANGUAGES } from '@/constants';
import { useTranslation } from 'react-i18next';
import storage from '@/storage';

export function Header({
  height,
  onLogout,
}: {
  height: number;
  onLogout: () => void;
}) {
  // 🌗 theme mode
  const offset = useScroll(height);
  const [mode, setMode] = useAppColorScheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleChangeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    storage.saveLanguage(lng);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        py: 3,
        height,
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: 1000,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        px: { xs: 2, md: 4 },
        transform: `translate3d(0, -${offset}px, 0)`,
        transition: 'transform 0.2s ease-out',
        willChange: 'transform',
      }}
    >
      {/* Left: Title */}
      <Box
        onClick={scrollToTop}
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background:
              mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)'
                : 'linear-gradient(135deg, #0a0a0f 0%, #312e81 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {t('job scheduler dashboard')}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            display: { xs: 'none', md: 'block' },
          }}
        >
          {t(
            'manage plugins, jobs, configurations, and live logs in one view.',
          )}
        </Typography>
      </Box>

      {/* Right: Menu */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { md: 'row', xs: 'column' },
        }}
      >
        <IconButton
          onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          color="inherit"
          disableRipple
        >
          {mode === 'dark' ? <AppIcon.LightMode /> : <AppIcon.DarkMode />}
        </IconButton>
        <IconButton
          color="inherit"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
          }}
          size="large"
        >
          <AppIcon.Menu />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleNavigate('/')}>
            <ListItemIcon>
              <AppIcon.Dashboard fontSize="small" />
            </ListItemIcon>
            {t('dashboard')}
          </MenuItem>

          <MenuItem onClick={() => handleNavigate('/plugins')}>
            <ListItemIcon>
              <AppIcon.Extension fontSize="small" />
            </ListItemIcon>
            {t('plugin manager')}
          </MenuItem>

          {import.meta.env.VITE_CHATBOT_ENABLED && (
            <MenuItem onClick={() => handleNavigate('/chatbot')}>
              <ListItemIcon>
                <AppIcon.ChatBubbleOutline fontSize="small" />
              </ListItemIcon>
              chatbot
            </MenuItem>
          )}

          <Divider />
          {LANGUAGES.map((lang) => (
            <MenuItem
              key={lang.code}
              selected={i18n.language === lang.code}
              onClick={() => handleChangeLanguage(lang.code)}
            >
              <ListItemIcon>
                <Icon fontSize="small">{lang.flag}</Icon>
              </ListItemIcon>
              {lang.label}
            </MenuItem>
          ))}
          <Divider />

          <MenuItem onClick={onLogout}>
            <ListItemIcon>
              <AppIcon.Logout fontSize="small" />
            </ListItemIcon>
            {t('logout')}
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

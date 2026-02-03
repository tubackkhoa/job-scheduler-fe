import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';

import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExtensionIcon from '@mui/icons-material/Extension';
import LogoutIcon from '@mui/icons-material/Logout';
import ChatbotIcon from '@mui/icons-material/ChatBubbleOutline';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { scrollToTop, useAppColorScheme } from '@/utils';
import { useScroll } from '@/hooks/useScroll';

export function Header({ height }: { height: number }) {
  // 🌗 theme mode
  const offset = useScroll(height);
  const [mode, setMode] = useAppColorScheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    setAnchorEl(null);
  }, [isAuthenticated]);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  if (!isAuthenticated) return null;

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
        willChange: 'transform',
        transform: `translateY(-${offset}px)`,
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
          Job Scheduler Dashboard
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, display: { xs: 'none', md: 'block' } }}
        >
          Manage plugins, jobs, configurations, and live logs in one view.
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
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        <IconButton
          color="inherit"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
          }}
          size="large"
        >
          <MenuIcon />
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
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            Dashboard
          </MenuItem>

          <MenuItem onClick={() => handleNavigate('/plugins')}>
            <ListItemIcon>
              <ExtensionIcon fontSize="small" />
            </ListItemIcon>
            Plugin Manager
          </MenuItem>

          {import.meta.env.VITE_CHATBOT_ENABLED && (
            <MenuItem onClick={() => handleNavigate('/chatbot')}>
              <ListItemIcon>
                <ChatbotIcon fontSize="small" />
              </ListItemIcon>
              Chatbot
            </MenuItem>
          )}

          <MenuItem onClick={() => logout()}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

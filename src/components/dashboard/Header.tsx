import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExtensionIcon from '@mui/icons-material/Extension';
import LogoutIcon from '@mui/icons-material/Logout';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

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
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'self-start',
        justifyContent: 'space-between',
        py: 3,
        backgroundColor: theme.palette.background.default,
        borderBottom: 1,
        zIndex: 1000,
        borderColor: 'divider',
        position: { xs: 'static', md: 'sticky' },
        top: 0
      })}
    >
      {/* Left: Title */}
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Job Scheduler Dashboard
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage plugins, jobs, configurations, and live logs in one view.
        </Typography>
      </Box>

      {/* Right: Menu */}
      <Box>
        <IconButton
          color="inherit"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
          }}
          size="large"
        >
          <MenuIcon />
        </IconButton>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
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

import { createTheme, PaletteMode } from '@mui/material/styles';
import { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { getSystemTheme } from './utils';

export const THEME_KEY = 'theme';
export const saveThemeMode = (mode: PaletteMode) =>
  localStorage.setItem(THEME_KEY, mode);
export const getThemeMode = (): PaletteMode =>
  (localStorage.getItem(THEME_KEY) as PaletteMode) ?? getSystemTheme();

export const darkPalette = {
  primary: {
    main: '#4f46e5',
  },
  secondary: {
    main: '#db2777',
  },
  success: {
    main: '#16a34a',
  },
  warning: {
    main: '#d97706',
  },
  error: {
    main: '#dc2626',
  },
  background: {
    default: '#0a0a0f',
    paper: '#111119',
  },
  divider: 'rgba(255, 255, 255, 0.08)',
};

export const lightPalette = {
  primary: {
    main: '#818cf8',
  },
  secondary: {
    main: '#f472b6',
  },
  success: {
    main: '#4ade80',
  },
  warning: {
    main: '#fbbf24',
  },
  error: {
    main: '#f87171',
  },
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  divider: 'rgba(0, 0, 0, 0.08)',
};

export const getTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? lightPalette : darkPalette),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
      MuiSelect: {
        defaultProps: {
          size: 'small',
        },
      },
    },
  });

export const getCodeMirrorStyle = (
  mode: PaletteMode,
  fullscreen: boolean,
): ReactCodeMirrorProps => {
  return {
    style: {
      resize: fullscreen ? 'none' : 'vertical',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      minHeight: fullscreen ? '100%' : 200,
      maxHeight: fullscreen ? '100%' : 600,
      height: '100%',
    },
    minHeight: fullscreen ? '100%' : '200px',
    height: '100%',
    theme: mode,
    basicSetup: {
      lineNumbers: true,
      highlightActiveLine: true,
      foldGutter: false,
    },
  };
};

export const getContainerStyle = (fullscreen: boolean) => {
  return fullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--mui-palette-background-default, #121212)',
        zIndex: 1300,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }
    : {};
};

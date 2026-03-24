import { createTheme, PaletteMode, PaletteOptions } from '@mui/material';
import { ReactCodeMirrorProps } from '@uiw/react-codemirror';

export const darkPalette: PaletteOptions = {
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
  chart: {
    background: '#0B0E11',
    textColor: '#B7BDC6',
    grid: '#1E2329',
    crosshair: '#2B3139',
    border: '#2B3139',
  },
};

export const lightPalette: PaletteOptions = {
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
  chart: {
    background: '#ffffff',
    textColor: '#333',
    grid: '#e1e8ed',
    crosshair: '#758696',
    border: '#d1d4dc',
  },
};

export const theme = createTheme({
  colorSchemes: {
    light: {
      palette: lightPalette,
    },
    dark: {
      palette: darkPalette,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCardHeader: {
      styleOverrides: {
        subheader: {
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: 1.43,
        },
        title: {
          lineHeight: 1.6,
          fontSize: '1.25rem',
          fontWeight: 600,
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

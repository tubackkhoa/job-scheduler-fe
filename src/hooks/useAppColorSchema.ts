import { getSystemTheme } from '../utils';
import { PaletteMode, useColorScheme } from '@mui/material';

export const useAppColorScheme = (): [
  PaletteMode,
  (mode: PaletteMode) => void,
] => {
  const { mode, setMode } = useColorScheme();
  const paletteMode = !mode || mode === 'system' ? getSystemTheme() : mode;
  return [paletteMode, setMode];
};

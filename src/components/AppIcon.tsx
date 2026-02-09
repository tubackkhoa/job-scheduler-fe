import { Icon } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
import React from 'react';

type IconProps = React.ComponentProps<typeof Icon>;
type AppIconName = keyof typeof MuiIcons;

// Build a typed proxy object
type AppIconType = {
  [K in AppIconName]: React.FC<IconProps>;
};

const LIGATURE_EXCEPTIONS: Partial<Record<AppIconName, string>> = {
  ThreeDRotation: '3d_rotation',
  ThreeSixty: '360',
  FourK: '4k',
  FiveG: '5g',
  OneKk: '10k',
};

export default new Proxy({} as AppIconType, {
  get(target, key: AppIconName) {
    return (target[key] ??= (props: IconProps) => (
      <Icon {...props}>
        {LIGATURE_EXCEPTIONS[key] ??
          key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}
      </Icon>
    ));
  },
});

import { Icon } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
import React from 'react';
import _ from 'lodash';

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
      <Icon {...props}>{LIGATURE_EXCEPTIONS[key] ?? _.snakeCase(key)}</Icon>
    ));
  },
});

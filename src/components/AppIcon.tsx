import { Icon } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
import React from 'react';

type MuiIconName = keyof typeof MuiIcons;

function toLigature(name: string) {
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

type IconProps = React.ComponentProps<typeof Icon>;

// Base renderer
function RenderIcon({ name, ...props }: { name: MuiIconName } & IconProps) {
  return <Icon {...props}>{toLigature(name)}</Icon>;
}

// Build a typed proxy object
type AppIconType = {
  [K in MuiIconName]: React.FC<IconProps>;
};

export default new Proxy({} as AppIconType, {
  get(_, key: string) {
    return (props: IconProps) => (
      <RenderIcon name={key as MuiIconName} {...props} />
    );
  },
});

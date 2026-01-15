import React, { Suspense, useMemo, useState } from 'react';
import { Alert } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import * as Mui from '@mui/material';
import * as Utils from '../../../utils';
import _ from 'lodash';
import * as MuiIcon from '@mui/icons-material';
import { ConfirmationDialog } from '../ConfirmationDialog';

/* ---------------- blob cache ---------------- */

const blobCache = new Map<string, string>();

function createUrlFromString(code: string) {
  const hash = Utils.getCodeHash(code);

  let url = blobCache.get(hash);
  if (!url) {
    const blob = new Blob([code], { type: 'application/javascript' });
    url = URL.createObjectURL(blob);
    blobCache.set(hash, url);
  }

  return url;
}

// extends and declare React, Mui, Utils scope
export type DynamicFieldProps = FieldProps & {
  React: typeof React;
  MuiIcon: typeof MuiIcon;
  Mui: typeof Mui & {
    ConfirmationDialog: typeof ConfirmationDialog;
  };
  Utils: typeof Utils & {
    _: typeof _;
  };
};

const ExtendedMui = { ...Mui, ConfirmationDialog };
const ExtendedUtils = { ...Utils, _ };

// known at build time
// Define the shape of your expected module
const libModules = import.meta.env.DEV
  ? import.meta.glob('../../../../libs/*.{ts,js,tsx,jsx}')
  : {};

export default function DynamicField(props: FieldProps) {
  const { code, url } = props.schema;

  const modUrl = code ? createUrlFromString(code) : url;
  const [error, setError] = useState<Error | null>(null);

  const LazyComponent = useMemo(() => {
    if (!modUrl) return null;

    const libModule = libModules[`../../../../libs/${modUrl}`];
    const loader = libModule ? libModule() : import(/* @vite-ignore */ modUrl);

    if (!loader) return null;

    return React.lazy(async () => {
      try {
        const mod = await loader;

        // Return an object that looks like { default: Component }
        // but injects your custom dependencies
        return {
          default: (componentProps) =>
            React.createElement(mod.default, {
              ...componentProps,
              React,
              MuiIcon,
              Mui: ExtendedMui,
              Utils: ExtendedUtils
            })
        };
      } catch (ex) {
        setError(ex);
      }
    });
  }, [modUrl]);

  if (error) {
    return (
      <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
        {error.message}
      </Alert>
    );
  }

  if (!LazyComponent) return null;

  return (
    <Suspense
      fallback={<Mui.Typography color="primary">Loading...</Mui.Typography>}
    >
      <LazyComponent {...props} />
    </Suspense>
  );
}

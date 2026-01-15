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
const gzipPrefix = 'data:application/gzip;base64,';

async function createUrlFromString(code: string) {
  const hash = Utils.getCodeHash(code);

  let url = blobCache.get(hash);
  if (url) return url;

  let jsSource: string;

  // Handle data:application/gzip;base64,...
  if (code.startsWith(gzipPrefix)) {
    const base64 = code.slice(gzipPrefix.length);

    // base64 → bytes
    const compressed = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // gunzip
    const stream = new Blob([compressed]).stream();
    const decompressedStream = stream.pipeThrough(
      new DecompressionStream('gzip')
    );

    jsSource = await new Response(decompressedStream).text();
  } else {
    jsSource = code;
  }

  const blob = new Blob([jsSource], {
    type: 'application/javascript'
  });

  url = URL.createObjectURL(blob);
  blobCache.set(hash, url);

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
  const { url, code } = props.schema;

  const [error, setError] = useState<Error | null>(null);

  const LazyComponent = useMemo(() => {
    return React.lazy(async () => {
      let loader: any;
      if (code || url.startsWith(gzipPrefix)) {
        const modUrl = await createUrlFromString(code || url);
        loader = import(/* @vite-ignore */ modUrl);
      } else {
        const libModule = libModules[`../../../../libs/${url}`];
        if (libModule) {
          loader = libModule();
        } else {
          loader = import(/* @vite-ignore */ url);
        }
      }

      if (!loader) return null;

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
  }, [url, code]);

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

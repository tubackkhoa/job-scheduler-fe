import React, { Suspense, useMemo, useState } from 'react';
import { Alert } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import * as Mui from '@mui/material';
import * as Utils from '@/utils';
import _ from 'lodash';
import * as MuiIcon from '@mui/icons-material';
import { ConfirmationDialog } from '../ConfirmationDialog';
import { ErrorBoundary } from '../ErrorBound';

window.React = React;

/* ---------------- blob cache ---------------- */

const blobCache = new Map<string, string>();
const gzipPrefix = 'data:application/gzip;base64,';

async function decodeGzip(base64: string) {
  // base64 → bytes
  const compressed = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // gunzip
  const stream = new Blob([compressed]).stream();
  const decompressedStream = stream.pipeThrough(
    new DecompressionStream('gzip')
  );

  return await new Response(decompressedStream).text();
}

function createUrlFromString(code: string) {
  const hash = Utils.getCodeHash(code);

  let url = blobCache.get(hash);
  if (url) return url;

  const blob = new Blob([code], {
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

const loadModule = (modUrl: string) => import(/* @vite-ignore */ modUrl);

export default function DynamicField(props: FieldProps) {
  const { url, code } = props.schema;

  const [error, setError] = useState<Error | null>(null);

  const LazyComponent = useMemo(() => {
    if (!code && !url) return null;

    return React.lazy(() =>
      (async () => {
        let loader: Promise<any>;

        if (code) {
          loader = loadModule(createUrlFromString(await Utils.transpile(code)));
        } else if (url.startsWith(gzipPrefix)) {
          loader = loadModule(
            createUrlFromString(await decodeGzip(url.slice(gzipPrefix.length)))
          );
        } else {
          loader = libModules[`../../../../libs/${url}`]?.() ?? loadModule(url);
        }

        if (!loader) {
          throw new Error('Module loader is undefined');
        }

        const mod = await loader;

        return {
          default: (componentProps: any) =>
            React.createElement(mod.default, {
              ...componentProps,
              React,
              MuiIcon,
              Mui: ExtendedMui,
              Utils: ExtendedUtils
            })
        };
      })()
    );
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
    <ErrorBoundary resetKey={`${url}:${code}`} onError={setError}>
      <Suspense
        fallback={<Mui.Typography color="primary">Loading...</Mui.Typography>}
      >
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

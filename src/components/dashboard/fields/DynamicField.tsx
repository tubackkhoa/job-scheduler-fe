import React, { ComponentType, useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import * as Mui from '@mui/material';
import * as Utils from '../../../utils';

/* ---------------- blob cache ---------------- */

const blobCache = new Map<string, string>();

async function hashCode(code: string) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(code)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function importModuleFromString(code: string) {
  const hash = await hashCode(code);

  let url = blobCache.get(hash);
  if (!url) {
    const blob = new Blob([code], { type: 'application/javascript' });
    url = URL.createObjectURL(blob);
    console.log(url);
    blobCache.set(hash, url);
  }

  return import(/* @vite-ignore */ url);
}

/* ---------------- component ---------------- */
export default function DynamicField(props: FieldProps) {
  const code = props.uiSchema?.['ui:options']?.code;

  const [Component, setComponent] = useState<ComponentType<FieldProps> | null>(
    null
  );

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    importModuleFromString(code)
      .then((mod) => {
        if (!cancelled) {
          setComponent(() => mod.default(React, Mui, Utils));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
        {error.message}
      </Alert>
    );
  }

  if (!Component) return null;

  return <Component {...props} />;
}

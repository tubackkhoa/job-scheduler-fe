import React, { ComponentType, useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import * as Mui from '@mui/material';
import * as Utils from '../../../utils';

const importModuleFromString = async (code: string) => {
  const blob = new Blob([code], {
    type: 'application/javascript'
  });

  const url = URL.createObjectURL(blob);

  try {
    return await import(/* @vite-ignore */ url);
  } finally {
    URL.revokeObjectURL(url);
  }
};

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
        if (!cancelled) {
          setError(err);
        }
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

  if (!Component) {
    return null; // or loading indicator
  }

  return <Component {...props} />;
}

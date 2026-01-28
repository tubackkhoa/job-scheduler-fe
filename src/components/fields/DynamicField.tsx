import React, { Suspense, useMemo, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import { getModule } from '@/module';
import _ from 'lodash';
import { ErrorBoundary } from '../ErrorBound';

export default function DynamicField(props: FieldProps) {
  const { url, code } = props.schema;

  const [error, setError] = useState<Error | null>(null);

  const LazyComponent = useMemo(() => {
    if (!code && !url) return null;

    return React.lazy(() =>
      (async () => {
        const mod = await getModule({ url, code });

        return {
          default: (componentProps: any) =>
            React.createElement(mod.default, {
              ...componentProps,
              ...window.globalProps
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
      <Suspense fallback={<Typography color="primary">Loading...</Typography>}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

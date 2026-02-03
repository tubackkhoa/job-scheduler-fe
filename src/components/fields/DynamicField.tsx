import { useState } from 'react';
import { Alert } from '@mui/material';
import { FieldProps } from '@rjsf/utils';
import { getLazyModule } from '@/module';
import _ from 'lodash';
import { ErrorBoundary } from '../ErrorBound';

export default function DynamicField(props: FieldProps) {
  const { url, code } = props.schema;
  const [error, setError] = useState<string | null>(null);
  const { key, Component } = getLazyModule(url, code);

  if (!Component) return null;

  if (error) {
    return (
      <Alert variant="outlined" severity="error" sx={{ mb: 4 }}>
        {error}
      </Alert>
    );
  }

  return (
    <ErrorBoundary resetKey={key} onError={setError}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

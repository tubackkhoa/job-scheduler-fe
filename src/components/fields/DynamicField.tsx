import { getLazyModule } from '@/module';
import _ from 'lodash';
import { ErrorBoundary } from '../ErrorBound';
import { Suspense } from 'react';
import { API_BASE_URL } from '@/api';

export default function DynamicField(props: ConfigFieldProps) {
  const { url, code } = props.schema;
  const { key, Component } = getLazyModule(
    // support absolute url from package module assets
    url
      ?.replace('{package}', props.registry.formContext.pluginPackage)
      .replace('{base_url}', API_BASE_URL),
    code,
  );

  if (!Component) return null;

  return (
    <ErrorBoundary resetKey={key}>
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

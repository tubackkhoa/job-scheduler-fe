import { getLazyModule } from '@/module';
import _ from 'lodash';
import { ErrorBoundary } from '../ErrorBound';
import { Suspense } from 'react';

export default function DynamicField(props: ConfigFieldProps) {
  const { url, code } = props.schema;
  const { key, Component } = getLazyModule(
    // support absolute url from package module assets
    url?.replace('{package}', props.registry.formContext.pluginPackage),
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

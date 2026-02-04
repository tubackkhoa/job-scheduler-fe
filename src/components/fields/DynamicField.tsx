import { FieldProps } from '@rjsf/utils';
import { getLazyModule } from '@/module';
import _ from 'lodash';
import { ErrorBoundary } from '../ErrorBound';

export default function DynamicField(props: FieldProps) {
  const { url, code } = props.schema;
  const { key, Component } = getLazyModule(url, code);

  if (!Component) return null;

  return (
    <ErrorBoundary resetKey={key}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

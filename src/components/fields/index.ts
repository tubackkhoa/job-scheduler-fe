import { FieldProps } from '@rjsf/utils';
import DynamicField from './DynamicField';
import { MLThresholdsTableField } from './MLThresholdsTableField';
import { SelectField } from './SelectField';
import { TemplateField } from './TemplateField';
import { VersionField } from './VersionField';
import { FC } from 'react';

export default {
  MLThresholdsTable: MLThresholdsTableField,
  Select: SelectField,
  Template: TemplateField,
  Version: VersionField,
  Dynamic: DynamicField
};

/* ----------------------------------
 * Simplified props for normal React
 * ---------------------------------- */
export type FieldComponentProps = Pick<
  FieldProps,
  'schema' | 'uiSchema' | 'formData' | 'onChange'
>;

/* ----------------------------------
 * Adapter: RJSF field -> normal component
 * ---------------------------------- */
export function adaptField<T extends FC<FieldProps>>(Field: T) {
  return (props: FieldComponentProps) =>
    Field({
      ...props,
      onBlur: undefined,
      onFocus: undefined,
      fieldPathId: undefined,
      name: '',
      registry: undefined
    } as FieldProps);
}

/* ----------------------------------
 * Normal React exports (adapted)
 * ---------------------------------- */
export const Select = adaptField(SelectField);
export const Template = adaptField(TemplateField);
export const Version = adaptField(VersionField);
export const MLThresholdsTable = adaptField(MLThresholdsTableField);
export const Dynamic = adaptField(DynamicField);

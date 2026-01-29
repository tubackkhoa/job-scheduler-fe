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
export type FieldComponentProps = Omit<
  FieldProps,
  'onBlur' | 'onFocus' | 'fieldPathId' | 'registry' | 'name'
>;

/* ----------------------------------
 * Normal React exports (adapted)
 * ---------------------------------- */
export const Select: FC<FieldComponentProps> = SelectField;
export const Template: FC<FieldComponentProps> = TemplateField;
export const Version: FC<FieldComponentProps> = VersionField;
export const MLThresholdsTable: FC<FieldComponentProps> =
  MLThresholdsTableField;
export const Dynamic: FC<FieldComponentProps> = DynamicField;

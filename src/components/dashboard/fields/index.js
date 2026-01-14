import { CrudField } from './CrudField';
import DynamicField from './DynamicField';
import { MLThresholdsTableField } from './MLThresholdsTableField';
import { SelectField } from './SelectField';
import { TemplateField } from './TemplateField';
import { VersionField } from './VersionField';

export default {
  Crud: CrudField,
  MLThresholdsTable: MLThresholdsTableField,
  Select: SelectField,
  Template: TemplateField,
  Version: VersionField,
  Dynamic: DynamicField
};

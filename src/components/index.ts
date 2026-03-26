import { ConfirmationDialog } from './ConfirmationDialog';
import SignalsLogsViewer from './SignalsLogsViewer';
import CodeMirror from '@uiw/react-codemirror';
import { LoadingSkeleton } from './Loading';
import { ConfigForm } from './ConfigForm';
import { MarkdownPreview } from './fields/MarkdownPreview';
import DynamicField from './fields/DynamicField';
import { Link as RouterLink } from 'react-router-dom';

// prevent export * to reduce size
export default {
  ConfigForm,
  ConfirmationDialog,
  SignalsLogsViewer,
  MarkdownPreview, // export markdown preview instead of ReactMarkdown
  LoadingSkeleton,
  DynamicField,
  CodeMirror,
  RouterLink,
};

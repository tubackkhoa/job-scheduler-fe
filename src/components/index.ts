import { ConfirmationDialog } from './ConfirmationDialog';
import SignalsLogsViewer from './SignalsLogsViewer';
import CodeMirror from '@uiw/react-codemirror';
import { LoadingSkeleton } from './Loading';
import { ConfigForm } from './ConfigForm';
import { MarkdownPreview } from './fields/MarkdownPreview';

// prevent export * to reduce size
export default {
  ConfigForm,
  ConfirmationDialog,
  SignalsLogsViewer,
  CodeMirror,
  MarkdownPreview, // export markdown preview instead of ReactMarkdown
  LoadingSkeleton,
};

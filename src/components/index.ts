import { ConfirmationDialog } from './ConfirmationDialog';
import SignalsLogsViewer from './SignalsLogsViewer';
import CodeMirror from '@uiw/react-codemirror';
import ReactMarkdown from 'react-markdown';
import { LoadingSkeleton } from './Loading';
import { ConfigForm } from './ConfigForm';

// prevent export * to reduce size
export default {
  ConfigForm,
  ConfirmationDialog,
  SignalsLogsViewer,
  CodeMirror,
  ReactMarkdown,
  LoadingSkeleton,
};

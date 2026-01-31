import { ConfirmationDialog } from './ConfirmationDialog';
import SignalsLogsViewer from './SignalsLogsViewer';

export interface Components {
  ConfirmationDialog: typeof ConfirmationDialog;
  SignalsLogsViewer: typeof SignalsLogsViewer;
}

export default {
  ConfirmationDialog,
  SignalsLogsViewer,
};

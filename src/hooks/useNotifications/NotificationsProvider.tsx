import * as React from 'react';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import type { SnackbarCloseReason } from '@mui/material/Snackbar';
import type { CloseReason } from '@mui/material/SpeedDial';
import NotificationsContext from './NotificationsContext';

import type {
  CloseNotification,
  ShowNotification,
  ShowNotificationOptions,
} from './useNotifications';
import { useAppColorScheme } from '@/utils';

const RootPropsContext = React.createContext<NotificationsProviderProps | null>(
  null,
);

interface NotificationProps {
  notificationKey: string;
  badge: string | null;
  open: boolean;
  message: React.ReactNode;
  options: ShowNotificationOptions;
}

function Notification({
  notificationKey,
  open,
  message,
  options,
  badge,
}: NotificationProps) {
  const [mode] = useAppColorScheme();
  const notificationsContext = React.useContext(NotificationsContext);
  if (!notificationsContext) {
    throw new Error('Notifications context was used without a provider.');
  }

  const { close } = notificationsContext;
  const { severity, actionText, onAction, autoHideDuration } = options;

  const handleClose = React.useCallback(
    (event: unknown, reason?: CloseReason | SnackbarCloseReason) => {
      if (reason === 'clickaway') return;
      close(notificationKey);
    },
    [notificationKey, close],
  );

  const action = (
    <>
      {onAction && (
        <Button color="inherit" size="small" onClick={onAction}>
          {actionText ?? 'Action'}
        </Button>
      )}
      <IconButton size="small" color="inherit" onClick={handleClose}>
        <AppIcon.Close fontSize="small" />
      </IconButton>
    </>
  );

  const { anchorOrigin = { vertical: 'top', horizontal: 'right' } } = options;

  return (
    <Snackbar
      key={notificationKey}
      open={open}
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
      onClose={handleClose}
    >
      <Badge badgeContent={badge} color="primary" sx={{ width: '100%' }}>
        {severity ? (
          <Alert
            severity={severity}
            action={action}
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 6,
              '& .MuiAlert-icon': {
                color: `${severity}.main`,
              },
            }}
          >
            {message}
          </Alert>
        ) : (
          <SnackbarContent
            message={message}
            action={action}
            sx={{
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 6,
            }}
          />
        )}
      </Badge>
    </Snackbar>
  );
}

interface NotificationQueueEntry {
  notificationKey: string;
  options: ShowNotificationOptions;
  open: boolean;
  message: React.ReactNode;
}

interface NotificationsState {
  queue: NotificationQueueEntry[];
}

interface NotificationsProps {
  state: NotificationsState;
}

function Notifications({ state }: NotificationsProps) {
  const currentNotification = state.queue[0] ?? null;

  return currentNotification ? (
    <Notification
      {...currentNotification}
      badge={state.queue.length > 1 ? String(state.queue.length) : null}
    />
  ) : null;
}

export interface NotificationsProviderProps {
  children?: React.ReactNode;
}

let nextId = 0;
const generateId = () => {
  const id = nextId;
  nextId += 1;
  return id;
};

/**
 * Provider for Notifications. The subtree of this component can use the `useNotifications` hook to
 * access the notifications API. The notifications are shown in the same order they are requested.
 */
export default function NotificationsProvider(
  props: NotificationsProviderProps,
) {
  const { children } = props;
  const [state, setState] = React.useState<NotificationsState>({ queue: [] });

  const show = React.useCallback<ShowNotification>((message, options = {}) => {
    const notificationKey =
      options.key ?? `::toolpad-internal::notification::${generateId()}`;
    setState((prev) => {
      if (prev.queue.some((n) => n.notificationKey === notificationKey)) {
        // deduplicate by key
        return prev;
      }
      return {
        ...prev,
        queue: [
          ...prev.queue,
          { message, options, notificationKey, open: true },
        ],
      };
    });
    return notificationKey;
  }, []);

  const close = React.useCallback<CloseNotification>((key) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((n) => n.notificationKey !== key),
    }));
  }, []);

  const contextValue = React.useMemo(() => ({ show, close }), [show, close]);

  return (
    <RootPropsContext.Provider value={props}>
      <NotificationsContext.Provider value={contextValue}>
        {children}
        <Notifications state={state} />
      </NotificationsContext.Provider>
    </RootPropsContext.Provider>
  );
}

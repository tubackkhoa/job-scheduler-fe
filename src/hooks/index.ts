import useNotifications from './useNotifications/useNotifications';
import { useDialogs } from './useDialogs/useDialogs';
import { useAuth } from './useAuth/index';
import { useSortableTable } from './useSortableTable';

// prevent export * to reduce size
export default {
  useNotifications,
  useSortableTable,
  useDialogs,
  useAuth,
};

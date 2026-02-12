import useNotifications from './useNotifications/useNotifications';
import { useDialogs } from './useDialogs/useDialogs';
import { useAuth } from './useAuth/index';
import { useSortableTable } from './useSortableTable';
import { useAppColorScheme } from './useAppColorSchema';

// prevent export * to reduce size
export default {
  useNotifications,
  useSortableTable,
  useAppColorScheme,
  useDialogs,
  useAuth,
};

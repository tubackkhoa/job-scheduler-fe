import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  ListItemText,
  Typography,
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import { Card, CardHeader, CardContent } from '@mui/material';
import React, { useMemo, useEffect, useState } from 'react';
import DynamicField from './fields/DynamicField';
import { useTranslation } from 'react-i18next';
import storage from '@/storage';

function WidgetSettingsButton({ onRemove }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e?: React.SyntheticEvent) => {
    setAnchorEl(null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    handleClose();
    onRemove?.();
  };

  return (
    <>
      <Tooltip title="Widget settings">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ color: 'text.secondary' }}
        >
          <AppIcon.Settings fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleRemove}>
          <ListItemIcon>
            <AppIcon.Clear fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function SortableWidget({
  id,
  children,
  title,
  onRemove,
}: {
  id: number;
  title: string;
  children: React.ReactNode;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <Card
      ref={setNodeRef}
      sx={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        willChange: 'transform',
        breakInside: 'avoid',
        transition,
      }}
      {...attributes}
    >
      <CardHeader
        title={title}
        sx={{
          backgroundColor: 'action.hover',
        }}
        slotProps={{
          title: {
            ...listeners,
            noWrap: true,
            sx: {
              cursor: 'move',
              fontSize: '1rem',
              touchAction: 'none',
            },
          },
          content: {
            sx: {
              minWidth: 0,
            },
          },
        }}
        action={<WidgetSettingsButton onRemove={() => onRemove(id)} />}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface PortalWidget {
  id: number;
  title: string;
  props: ConfigFieldProps;
}

interface Props {
  plugins: PluginData[];
  routeState: RouteState;
}
export function PortalPage({ plugins, routeState }: Props) {
  const { t } = useTranslation();
  const initialWidgets = useMemo<PortalWidget[]>(() => {
    return Object.entries(routeState)
      .filter((item) => item[1].portal)
      .map(([key, routeState]) => {
        const pluginId = Number(key);
        const plugin = plugins.find((item) => item.id === pluginId);
        return {
          id: pluginId,
          title: plugin.package,
          props: {
            formData: plugin,
            registry: { formContext: { pluginPackage: plugin.package } },
            schema: routeState.portal,
          } as ConfigFieldProps,
        };
      });
  }, [plugins, routeState]);

  const [widgets, setWidgets] = React.useState<PortalWidget[]>();

  const handleResetLayout = () => {
    storage.resetStoredLayout();
    setWidgets(initialWidgets);
  };

  const handleRemoveWidget = (id: number) => {
    setWidgets((prev) => {
      const next = prev.filter((w) => w.id !== id);

      const current = storage.loadLayout();

      storage.saveLayout({
        order: next.map((w) => w.id),
        hidden: [...new Set([...current.hidden, id])],
      });

      return next;
    });
  };

  useEffect(() => {
    try {
      const layout = storage.loadLayout();
      const map = new Map(initialWidgets.map((w) => [w.id, w]));

      const visibleSet = new Set(layout.order);
      const hiddenSet = new Set(layout.hidden);

      const ordered = layout.order.map((id) => map.get(id)).filter(Boolean);

      const newWidgets = initialWidgets.filter(
        (w) => !visibleSet.has(w.id) && !hiddenSet.has(w.id),
      );
      setWidgets([...ordered, ...newWidgets]);
    } catch (e) {
      console.log(e);
      // fallback initialize
      handleResetLayout();
    }
  }, [initialWidgets]);

  if (!initialWidgets.length) return null;

  return (
    <Box sx={{ my: 3, mx: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
          alignItems: 'flex-start',
        }}
      >
        <Typography
          variant="h5"
          sx={{ textTransform: 'capitalize' }}
          fontWeight={600}
          gutterBottom
        >
          {t('portal')}
        </Typography>

        <Button
          variant="outlined"
          size="small"
          sx={{ textTransform: 'capitalize' }}
          startIcon={<AppIcon.RestartAlt />}
          onClick={handleResetLayout}
        >
          {t('reset layout')}
        </Button>
      </Box>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;

          setWidgets((items) => {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return items;

            const newItems = arrayMove(items, oldIndex, newIndex);

            const current = storage.loadLayout();

            storage.saveLayout({
              order: newItems.map((w) => w.id),
              hidden: current.hidden,
            });

            return newItems;
          });
        }}
      >
        {widgets && (
          <SortableContext items={widgets.map((w) => w.id)}>
            <Masonry
              columns={{ xs: 1, sm: 2, md: 3 }}
              spacing={2}
              sx={{ overflow: 'hidden', m: 0, width: '100%' }}
            >
              {widgets.map(({ id, title, props }) => (
                <SortableWidget
                  key={id}
                  id={id}
                  title={title}
                  onRemove={handleRemoveWidget}
                >
                  <DynamicField {...props} />
                </SortableWidget>
              ))}
            </Masonry>
          </SortableContext>
        )}
      </DndContext>
    </Box>
  );
}

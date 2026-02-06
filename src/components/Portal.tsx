import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  ListItemText,
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import { Card, CardHeader, CardContent } from '@mui/material';
import React, { useMemo, useEffect, useState } from 'react';

import { Clear, Settings } from '@mui/icons-material';
import DynamicField from './fields/DynamicField';
import { FieldProps } from '@rjsf/utils';
import { LoadingSkeleton } from './Loading';

const LAYOUT_KEY = 'portal-layout';

type LayoutState = {
  order: number[];
  hidden: number[];
};

function saveLayout(state: LayoutState) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(state));
}

function loadLayout(): LayoutState {
  const defaultLayout = { order: [], hidden: [] };
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return JSON.parse(raw) ?? defaultLayout;
  } catch {
    return defaultLayout;
  }
}

function resetStoredLayout() {
  localStorage.removeItem(LAYOUT_KEY);
}

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
          <Settings fontSize="small" />
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
            <Clear fontSize="small" />
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    transition,
  } = useSortable({ id, animateLayoutChanges: defaultAnimateLayoutChanges });

  return (
    <Card
      ref={setNodeRef}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
    >
      <CardHeader
        title={
          <Box
            {...listeners}
            sx={{
              cursor: 'move',
              fontSize: '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Box>
        }
        sx={{
          backgroundColor: 'action.hover',
        }}
        slotProps={{
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
  props: FieldProps;
}

interface Props {
  plugins: PluginData[];
  routeState: RouteState;
}
export function PortalPage({ plugins, routeState }: Props) {
  const initialWidgets = useMemo<PortalWidget[]>(() => {
    return Object.entries(routeState)
      .filter((item) => item[1].portal)
      .map(([key, routeState]) => {
        const pluginId = Number(key);
        return {
          id: pluginId,
          title: plugins.find((item) => item.id === pluginId).package,
          props: {
            formData: pluginId % 2 ? 'line' : 'area',
            schema: routeState.portal,
          } as FieldProps,
        };
      });
  }, [plugins, routeState]);

  const [widgets, setWidgets] = React.useState<PortalWidget[]>();

  const handleResetLayout = () => {
    resetStoredLayout();
    setWidgets(initialWidgets);
  };

  const handleRemoveWidget = (id: number) => {
    setWidgets((prev) => {
      const next = prev.filter((w) => w.id !== id);

      const current = loadLayout() ?? { order: [], hidden: [] };

      saveLayout({
        order: next.map((w) => w.id),
        hidden: [...new Set([...current.hidden, id])],
      });

      return next;
    });
  };

  useEffect(() => {
    try {
      const layout = loadLayout();
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

  return (
    <Box
      sx={{
        position: 'relative',
        px: 2,
        mt: 4,
      }}
    >
      <Button
        variant="outlined"
        size="small"
        sx={{ position: 'absolute', right: 20, mt: -7 }}
        startIcon={<RestartAltIcon />}
        onClick={handleResetLayout}
      >
        Reset layout
      </Button>

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

            const current = loadLayout() ?? { order: [], hidden: [] };

            saveLayout({
              order: newItems.map((w) => w.id),
              hidden: current.hidden,
            });

            return newItems;
          });
        }}
      >
        {widgets ? (
          <SortableContext items={widgets.map((w) => w.id)}>
            <Box
              sx={{
                pl: 1,
                mx: -1, // counteracts Masonry internal spacing
              }}
            >
              <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
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
            </Box>
          </SortableContext>
        ) : (
          <LoadingSkeleton />
        )}
      </DndContext>
    </Box>
  );
}

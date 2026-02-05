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
  Typography,
  ListItemText,
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import { Card, CardHeader, CardContent } from '@mui/material';
import React, { useMemo, useEffect, useState } from 'react';

import { DeleteOutline, Settings } from '@mui/icons-material';
import DynamicField from './fields/DynamicField';
import { FieldProps } from '@rjsf/utils';

const LAYOUT_KEY = 'portal-layout';

function saveLayout(widgetIds: number[]) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(widgetIds));
}

function loadLayout(): number[] | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function resetStoredLayout() {
  localStorage.removeItem(LAYOUT_KEY);
}

export function WidgetSettingsButton({ onRemove }) {
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
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function SortableWidget({
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
    useSortable({ id, animateLayoutChanges: defaultAnimateLayoutChanges });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes}>
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

export interface PortalWidget {
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
    return Object.entries(routeState).map(([key, routeState]) => {
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

  const [widgets, setWidgets] = React.useState<PortalWidget[]>([]);

  const handleResetLayout = () => {
    resetStoredLayout();
    setWidgets(initialWidgets);
  };

  const handleRemoveWidget = (id: number) => {
    setWidgets((prev) => {
      const next = prev.filter((w) => w.id !== id);
      saveLayout(next.map((w) => w.id));
      return next;
    });
  };

  useEffect(() => {
    const savedOrder = loadLayout();
    if (!savedOrder) {
      setWidgets(initialWidgets);
      return;
    }

    const map = new Map(initialWidgets.map((w) => [w.id, w]));

    setWidgets([
      // widgets that exist in saved layout
      ...savedOrder.map((id) => map.get(id)).filter(Boolean),
      // new widgets added later (important!)
      ...initialWidgets.filter((w) => !savedOrder.includes(w.id)),
    ]);
  }, [initialWidgets]);

  return (
    <>
      {/* Header / Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 1,
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Portal
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={handleResetLayout}
        >
          Reset layout
        </Button>
      </Box>

      {/* Dashboard */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;

          setWidgets((items) => {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);

            saveLayout(newItems.map((w) => w.id));

            return newItems;
          });
        }}
      >
        <SortableContext items={widgets.map((w) => w.id)}>
          <Box
            sx={{
              pl: 1,
              mx: -1, // counteracts Masonry internal spacing
            }}
          >
            <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
              {widgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  id={widget.id}
                  title={widget.title}
                  onRemove={handleRemoveWidget}
                >
                  {widget.props?.schema && <DynamicField {...widget.props} />}
                </SortableWidget>
              ))}
            </Masonry>
          </Box>
        </SortableContext>
      </DndContext>
    </>
  );
}

import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, Typography } from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import { Card, CardHeader, CardContent } from '@mui/material';
import React, { useMemo } from 'react';

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

export function SortableWidget({
  id,
  children,
  title,
}: {
  id: number;
  title: string;
  children: React.ReactNode;
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
        title={title}
        sx={{
          cursor: 'move',
          backgroundColor: 'action.hover',
        }}
        slotProps={{
          content: {
            sx: {
              minWidth: 0,
            },
          },
          title: {
            sx: {
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          },
        }}
        {...listeners}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export interface PortalWidget {
  id: number;
  title: string;
  Component: React.FC;
}

export function PortalPage({ plugins }: { plugins: PluginData[] }) {
  const initialWidgets = useMemo<PortalWidget[]>(() => {
    return plugins.map((plugin) => ({
      id: plugin.id, // 🔑 SAME ID as nav
      title: plugin.package,
      Component: () => (
        <Typography variant="body2" color="text.secondary">
          Overview for plugin <strong>{plugin.description}</strong>
        </Typography>
      ),
    }));
  }, [plugins]);

  const [widgets, setWidgets] = React.useState<PortalWidget[]>(() => {
    const savedOrder = loadLayout();
    if (!savedOrder) return initialWidgets;

    const map = new Map(initialWidgets.map((w) => [w.id, w]));

    return [
      // widgets that exist in saved layout
      ...savedOrder.map((id) => map.get(id)).filter(Boolean),
      // new widgets added later (important!)
      ...initialWidgets.filter((w) => !savedOrder.includes(w.id)),
    ];
  });

  const handleResetLayout = () => {
    resetStoredLayout();
    setWidgets(initialWidgets);
  };

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
          <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                id={widget.id}
                title={widget.title}
              >
                <widget.Component />
              </SortableWidget>
            ))}
          </Masonry>
        </SortableContext>
      </DndContext>
    </>
  );
}

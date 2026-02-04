import { defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import { Card, CardHeader, CardContent } from '@mui/material';
import React, { useMemo, useRef, useEffect } from 'react';
import {
  createChart,
  ColorType,
  LineSeries,
  LineData,
  UTCTimestamp,
  AreaSeries,
} from 'lightweight-charts';
import { Settings } from '@mui/icons-material';

const TOKENS = [
  { symbol: 'BTC', color: '#f7931a' },
  { symbol: 'ETH', color: '#627eea' },
  { symbol: 'SOL', color: '#14f195' },
  { symbol: 'BNB', color: '#f3ba2f' },
  { symbol: 'ARB', color: '#28a0f0' },
  { symbol: 'AVAX', color: '#e84142' },
  { symbol: 'MATIC', color: '#8247e5' },
  { symbol: 'OP', color: '#ff0420' },
  { symbol: 'DOT', color: '#e6007a' },
];
let ind = 0;
function RandomPnlChart({ variant }: { variant: 'line' | 'area' }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const token = TOKENS[ind];
  ind++;
  if (ind === TOKENS.length) {
    ind = 0;
  }

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      height: 160,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280', // MUI text.secondary-ish
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    });

    const series =
      variant === 'area'
        ? chart.addSeries(AreaSeries, {
            lineColor: token.color,
            topColor: `${token.color}55`,
            bottomColor: 'transparent',
            lineWidth: 2,
          })
        : chart.addSeries(LineSeries, {
            color: token.color,
            lineWidth: 2,
          });

    // Generate random PnL data
    let pnl = 0;
    const data: LineData<UTCTimestamp>[] = Array.from({ length: 40 }).map(
      (_, i) => {
        pnl += (Math.random() - 0.45) * 10;
        return {
          time: i as UTCTimestamp,
          value: Number(pnl.toFixed(2)),
        };
      },
    );

    series.setData(data);

    const finalPnl = data[data.length - 1].value;
    series.applyOptions({
      color: finalPnl >= 0 ? '#2e7d32' : '#d32f2f',
    });

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, []);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
      }}
    />
  );
}

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
        action={
          <Tooltip title="Widget settings">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // 🔑 prevent drag start
                // open settings menu / dialog
              }}
              sx={{
                color: 'text.secondary',
              }}
            >
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>
        }
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
        <>
          <Typography variant="body2" color="text.secondary">
            {plugin.description}
          </Typography>

          <RandomPnlChart variant={plugin.id % 2 === 0 ? 'area' : 'line'} />
        </>
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
                >
                  <widget.Component />
                </SortableWidget>
              ))}
            </Masonry>
          </Box>
        </SortableContext>
      </DndContext>
    </>
  );
}

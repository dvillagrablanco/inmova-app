"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Lock, Unlock, RotateCcw } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// @ts-ignore - Dynamic import to avoid SSR issues
const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout').then(mod => mod.Responsive as any),
  { ssr: false }
);

type Layouts = { [key: string]: Layout[] };

export interface DashboardWidget {
  id: string;
  title: string;
  component: React.ReactNode;
  defaultLayout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
}

interface CustomizableDashboardProps {
  widgets: DashboardWidget[];
  storageKey?: string;
}

const STORAGE_KEY_PREFIX = 'inmova_dashboard_layout_';

export function CustomizableDashboard({
  widgets,
  storageKey = 'default',
}: CustomizableDashboardProps) {
  const [layouts, setLayouts] = useState<Layouts>({});
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fullStorageKey = STORAGE_KEY_PREFIX + storageKey;

  // Load saved layouts from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(fullStorageKey);
      if (saved) {
        setLayouts(JSON.parse(saved));
      } else {
        // Use default layouts
        const defaultLayouts = generateDefaultLayouts();
        setLayouts(defaultLayouts as unknown as Layouts);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      const defaultLayouts = generateDefaultLayouts();
      setLayouts(defaultLayouts as unknown as Layouts);
    }
  }, [fullStorageKey]);

  const generateDefaultLayouts = () => {
    const lg = widgets.map((widget) => ({
      i: widget.id,
      ...widget.defaultLayout,
    }));

    // Responsive breakpoints
    return {
      lg,
      md: lg.map((item) => ({ ...item, w: Math.min(item.w, 8) })),
      sm: lg.map((item) => ({ ...item, w: Math.min(item.w, 6), x: 0 })),
      xs: lg.map((item) => ({ ...item, w: 4, x: 0 })),
    };
  };

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
    try {
      localStorage.setItem(fullStorageKey, JSON.stringify(allLayouts));
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  const resetLayout = () => {
    const defaultLayouts = generateDefaultLayouts();
    setLayouts(defaultLayouts as unknown as Layouts);
    try {
      localStorage.setItem(fullStorageKey, JSON.stringify(defaultLayouts));
    } catch (error) {
      console.error('Error resetting dashboard layout:', error);
    }
  };

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  // Don't render until mounted to avoid SSR mismatch
  if (!mounted) {
    return (
      <div className="space-y-4">
        {widgets.map((widget) => (
          <div key={widget.id} className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4">{widget.title}</h3>
            {widget.component}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex items-center justify-between bg-card rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {isEditing ? 'Modo Edición Activado' : 'Dashboard Personalizado'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={toggleEditing}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Lock className="h-4 w-4" />
                Guardar
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                Editar
              </>
            )}
          </Button>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={resetLayout} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Restablecer
            </Button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      {/* @ts-expect-error - ResponsiveGridLayout is dynamically imported and types are not fully compatible */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`bg-card rounded-lg border shadow-sm ${
              isEditing ? 'ring-2 ring-primary/50' : ''
            }`}
          >
            <div
              className={`flex items-center justify-between p-3 border-b ${
                isEditing ? 'drag-handle cursor-move bg-muted/50' : ''
              }`}
            >
              <h3 className="font-semibold text-sm">{widget.title}</h3>
              {isEditing && (
                <span className="text-xs text-muted-foreground">
                  Arrastra para mover
                </span>
              )}
            </div>
            <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 53px)' }}>
              {widget.component}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      {isEditing && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-sm">
          <p className="text-yellow-800 dark:text-yellow-200">
            💡 <strong>Tip:</strong> Arrastra los widgets desde la barra superior para reorganizarlos.
            Arrastra desde las esquinas para redimensionar.
          </p>
        </div>
      )}
    </div>
  );
}

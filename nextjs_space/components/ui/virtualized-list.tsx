"use client";

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height?: string | number;
  itemHeight?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  containerClassName?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * Lista virtualizada que renderiza solo los elementos visibles
 * Perfecto para listas con miles de elementos
 * 
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={buildings}
 *   itemHeight={100}
 *   renderItem={(building) => <BuildingCard building={building} />}
 * />
 * ```
 */
export function VirtualizedList<T>({
  items,
  height = '100vh',
  itemHeight = 80,
  overscan = 5,
  renderItem,
  className,
  containerClassName,
  onEndReached,
  endReachedThreshold = 0.8,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Detectar cuando el usuario ha scrolleado cerca del final
  const lastItem = virtualItems[virtualItems.length - 1];
  if (
    onEndReached &&
    lastItem &&
    lastItem.index >= items.length * endReachedThreshold
  ) {
    onEndReached();
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
        className={className}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Grid virtualizado para mostrar elementos en cuadrícula
 */
interface VirtualizedGridProps<T> {
  items: T[];
  height?: string | number;
  columns?: number;
  rowHeight?: number;
  gap?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  containerClassName?: string;
}

export function VirtualizedGrid<T>({
  items,
  height = '100vh',
  columns = 3,
  rowHeight = 200,
  gap = 16,
  overscan = 2,
  renderItem,
  className,
  containerClassName,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calcular cuántas filas hay
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', containerClassName)}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const rowStartIndex = virtualRow.index * columns;
          const rowItems = items.slice(rowStartIndex, rowStartIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className={cn(
                  'grid h-full',
                  className
                )}
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gap: `${gap}px`,
                }}
              >
                {rowItems.map((item, colIndex) => (
                  <div key={rowStartIndex + colIndex}>
                    {renderItem(item, rowStartIndex + colIndex)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tabla virtualizada para grandes conjuntos de datos
 */
interface VirtualizedTableProps<T> {
  items: T[];
  height?: string | number;
  rowHeight?: number;
  overscan?: number;
  columns: Array<{
    key: string;
    header: string;
    width?: string;
    render: (item: T) => ReactNode;
  }>;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function VirtualizedTable<T>({
  items,
  height = '600px',
  rowHeight = 52,
  overscan = 10,
  columns,
  className,
  onRowClick,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="grid bg-gray-50 border-b font-medium text-sm">
        {columns.map((col) => (
          <div
            key={col.key}
            className="px-4 py-3 text-left"
            style={{ width: col.width }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Body con virtualización */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = items[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                className={cn(
                  'absolute top-0 left-0 w-full grid border-b hover:bg-gray-50 cursor-pointer transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(item, virtualRow.index)}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="px-4 py-3 flex items-center text-sm"
                    style={{ width: col.width }}
                  >
                    {col.render(item)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

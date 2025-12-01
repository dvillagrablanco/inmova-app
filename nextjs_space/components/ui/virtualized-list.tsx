/**
 * Virtualized List Component
 * High-performance list rendering for large datasets
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
  height?: string | number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 100,
  overscan = 5,
  className,
  itemClassName,
  height = '100vh',
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className={itemClassName}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
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
 * VirtualizedGrid - Virtualized grid layout
 */
interface VirtualizedGridProps<T> extends Omit<VirtualizedListProps<T>, 'itemClassName'> {
  columns?: number;
  gap?: number;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  gap = 16,
  ...props
}: VirtualizedGridProps<T>) {
  // Calculate items per row and row count
  const itemsPerRow = columns;
  const rowCount = Math.ceil(items.length / itemsPerRow);

  // Create rows from items
  const rows = Array.from({ length: rowCount }, (_, i) =>
    items.slice(i * itemsPerRow, (i + 1) * itemsPerRow)
  );

  return (
    <VirtualizedList
      items={rows}
      renderItem={(row, rowIndex) => (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`,
            marginBottom: `${gap}px`,
          }}
        >
          {row.map((item, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`}>
              {renderItem(item, rowIndex * itemsPerRow + colIndex)}
            </div>
          ))}
        </div>
      )}
      {...props}
    />
  );
}

/**
 * VirtualizedTable - Virtualized table with fixed header
 */
interface VirtualizedTableProps<T> {
  items: T[];
  columns: {
    header: string;
    accessor: (item: T) => ReactNode;
    width?: string;
  }[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
  height?: string | number;
}

export function VirtualizedTable<T>({
  items,
  columns,
  estimateSize = 60,
  overscan = 5,
  className,
  height = '600px',
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Fixed Header */}
      <div className="bg-muted border-b sticky top-0 z-10">
        <div className="flex">
          {columns.map((column, index) => (
            <div
              key={index}
              className="px-4 py-3 font-medium text-sm"
              style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="border-b hover:bg-muted/50 transition-colors"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="flex">
                  {columns.map((column, colIndex) => (
                    <div
                      key={colIndex}
                      className="px-4 py-3 text-sm"
                      style={{ width: column.width || 'auto', flex: column.width ? undefined : 1 }}
                    >
                      {column.accessor(item)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

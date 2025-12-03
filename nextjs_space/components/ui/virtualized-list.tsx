"use client";

import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
}

/**
 * Virtualized list component for rendering large lists efficiently
 * Only renders visible items + overscan buffer
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 50,
  overscan = 5,
  className,
}: VirtualizedListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

interface VirtualizedTableProps<T> {
  items: T[];
  columns: {
    header: string;
    accessor: (item: T) => React.ReactNode;
    width?: string;
  }[];
  estimateSize?: number;
  overscan?: number;
  className?: string;
}

/**
 * Virtualized table component for large datasets
 */
export function VirtualizedTable<T>({
  items,
  columns,
  estimateSize = 48,
  overscan = 10,
  className,
}: VirtualizedTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div className={className}>
      {/* Table Header */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4 p-4 bg-muted font-medium border-b">
        {columns.map((column, index) => (
          <div key={index} style={{ width: column.width }}>
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        style={{
          height: '600px',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.index}
              className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4 p-4 border-b hover:bg-muted/50"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {columns.map((column, colIndex) => (
                <div key={colIndex} style={{ width: column.width }}>
                  {column.accessor(items[virtualRow.index])}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
  estimateSize?: number;
  overscan?: number;
  className?: string;
}

/**
 * Virtualized grid component for rendering items in a grid layout
 */
export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  gap = 16,
  estimateSize = 200,
  overscan = 5,
  className,
}: VirtualizedGridProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Calculate rows
  const rows = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
                padding: `0 ${gap}px`,
              }}
            >
              {rowItems.map((item, index) =>
                renderItem(item, startIndex + index)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

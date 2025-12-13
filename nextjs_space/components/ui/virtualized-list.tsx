'use client';

import { memo, CSSProperties } from 'react';
// @ts-ignore - tipos de react-window pueden no estar disponibles
import { FixedSizeList as List } from 'react-window';
// @ts-ignore - tipos de react-virtualized-auto-sizer pueden no estar disponibles
import AutoSizer from 'react-virtualized-auto-sizer';
import { cn } from '@/lib/utils';

// Tipo para las props de cada fila en la lista virtualizada
interface RowProps {
  index: number;
  style: CSSProperties;
}

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
  onItemClick?: (item: T, index: number) => void;
}

/**
 * Componente de lista virtualizada para mejorar el rendimiento con listas largas
 * Solo renderiza los items visibles en el viewport
 * 
 * Beneficios:
 * - Renderiza solo items visibles (~10-20 items en lugar de 1000+)
 * - Scroll suave incluso con miles de items
 * - Reduce significativamente el uso de memoria
 * - Mejora el tiempo de carga inicial
 */
function VirtualizedListInner<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  emptyMessage = 'No hay elementos para mostrar',
  onItemClick,
}: VirtualizedListProps<T>) {
  // Si no hay items, mostrar mensaje vacío
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-gray-500', className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Componente Row para cada item
  const Row = ({ index, style }: RowProps) => {
    const item = items[index];
    
    return (
      <div
        style={style}
        className={cn(
          'border-b border-gray-100 last:border-0',
          onItemClick && 'cursor-pointer hover:bg-gray-50 transition-colors'
        )}
        onClick={() => onItemClick?.(item, index)}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <div className={cn('h-full w-full', className)}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <List
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            width={width}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

// Memoizado para evitar re-renders innecesarios
export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

/**
 * Hook para usar con VirtualizedList
 * Proporciona métodos útiles para manejar listas largas
 */
export function useVirtualizedList<T>(items: T[]) {
  return {
    items,
    count: items.length,
    isEmpty: items.length === 0,
    // Calcular altura total estimada
    estimatedHeight: (itemHeight: number) => items.length * itemHeight,
  };
}

/**
 * Variante con altura variable (más compleja pero más flexible)
 * Usar cuando los items tienen alturas diferentes
 */
export interface VariableHeightItem {
  height: number;
  data: any;
}

interface VariableVirtualizedListProps {
  items: VariableHeightItem[];
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
  onItemClick?: (item: any, index: number) => void;
}

export function VariableVirtualizedList({
  items,
  renderItem,
  className = '',
  emptyMessage = 'No hay elementos para mostrar',
  onItemClick,
}: VariableVirtualizedListProps) {
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-gray-500', className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const getItemSize = (index: number) => items[index]?.height || 50;

  const Row = ({ index, style }: RowProps) => {
    const item = items[index]?.data;
    
    return (
      <div
        style={style}
        className={cn(
          'border-b border-gray-100 last:border-0',
          onItemClick && 'cursor-pointer hover:bg-gray-50 transition-colors'
        )}
        onClick={() => onItemClick?.(item, index)}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <div className={cn('h-full w-full', className)}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <List
            height={height}
            itemCount={items.length}
            itemSize={getItemSize}
            width={width}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

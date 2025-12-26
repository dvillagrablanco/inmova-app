'use client';

import { memo, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Componente de Card memoizado para items de listas
 * Evita re-renders innecesarios cuando las props no cambian
 */
export const MemoizedListCard = memo<{
  id: string;
  title: string;
  description?: string;
  badges?: Array<{ label: string; variant?: string; className?: string }>;
  actions?: ReactNode;
  content?: ReactNode;
  className?: string;
  onClick?: () => void;
}>(function MemoizedListCard({
  id,
  title,
  description,
  badges,
  actions,
  content,
  className,
  onClick,
}) {
  return (
    <Card
      key={id}
      className={cn(
        'hover:shadow-lg transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription className="text-sm">{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {badges?.map((badge, idx) => (
              <Badge
                key={`${id}-badge-${idx}`}
                variant={badge.variant as any}
                className={badge.className}
              >
                {badge.label}
              </Badge>
            ))}
            {actions}
          </div>
        </div>
      </CardHeader>
      {content && <CardContent>{content}</CardContent>}
    </Card>
  );
});

/**
 * Row de tabla memoizado
 * Optimizado para listas grandes con muchos items
 */
export const MemoizedTableRow = memo<{
  id: string;
  cells: ReactNode[];
  onClick?: () => void;
  className?: string;
}>(function MemoizedTableRow({ id, cells, onClick, className }) {
  return (
    <tr
      key={id}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer hover:bg-muted/50 transition-colors', className)}
    >
      {cells.map((cell, idx) => (
        <td key={`${id}-cell-${idx}`} className="px-4 py-3">
          {cell}
        </td>
      ))}
    </tr>
  );
});

/**
 * Item de lista memoizado genérico
 * Útil para listas simples sin estructura de Card
 */
export const MemoizedListItem = memo<{
  id: string;
  content: ReactNode;
  className?: string;
  onClick?: () => void;
}>(function MemoizedListItem({ id, content, className, onClick }) {
  return (
    <div
      key={id}
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className
      )}
    >
      {content}
    </div>
  );
});

/**
 * Contenedor de lista optimizado con virtualización básica
 * Para listas extremadamente grandes (>100 items)
 */
export const OptimizedList = memo<{
  items: Array<{ id: string; [key: string]: any }>;
  renderItem: (item: any, index: number) => ReactNode;
  keyExtractor?: (item: any) => string;
  className?: string;
  itemClassName?: string;
}>(function OptimizedList({
  items,
  renderItem,
  keyExtractor = (item) => item.id,
  className,
  itemClassName,
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
});

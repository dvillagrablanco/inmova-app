import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlaceholderProps {
  title?: string;
  className?: string;
}

/**
 * Placeholder para videos que aún no están grabados.
 * Muestra un card con icono de reproducción y mensaje informativo.
 */
export function VideoPlaceholder({ title, className }: VideoPlaceholderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-12 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
        <PlayCircle className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        Video tutorial próximamente
      </h3>
      {title && (
        <p className="text-sm text-muted-foreground mb-3 max-w-md">
          {title}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Estamos preparando este contenido. Mientras tanto, consulta la guía
        escrita del artículo.
      </p>
    </div>
  );
}

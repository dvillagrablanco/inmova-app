import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ChangelogEntry } from '@/lib/help-center/types';
import { cn } from '@/lib/utils';

const typeConfig: Record<
  ChangelogEntry['type'],
  { label: string; className: string }
> = {
  feature: { label: 'Nueva función', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  improvement: { label: 'Mejora', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  fix: { label: 'Corrección', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

interface ChangelogEntryCardProps {
  entry: ChangelogEntry;
}

export function ChangelogEntryCard({ entry }: ChangelogEntryCardProps) {
  const config = typeConfig[entry.type];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <time
            dateTime={entry.date}
            className="text-sm text-muted-foreground"
          >
            {formatDate(entry.date)}
          </time>
          <Badge
            variant="secondary"
            className={cn('text-xs font-medium', config.className)}
          >
            {config.label}
          </Badge>
        </div>
        <h3 className="font-semibold leading-tight">{entry.title}</h3>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {entry.description && (
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        )}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

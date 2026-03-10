import Link from 'next/link';
import {
  Rocket,
  Settings,
  Wrench,
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Calculator,
  MessageSquare,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HelpCollection } from '@/lib/help-center/types';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Rocket,
  Settings,
  Wrench,
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Calculator,
  MessageSquare,
};

interface CollectionCardProps {
  collection: HelpCollection;
  articleCount: number;
}

export function CollectionCard({ collection, articleCount }: CollectionCardProps) {
  const Icon = iconMap[collection.icon] ?? FileText;

  return (
    <Link href={`/ayuda/${collection.slug}`}>
      <Card
        className={cn(
          'transition-shadow hover:shadow-md',
          'h-full'
        )}
      >
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
              collection.color,
              'text-white'
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight">
              {collection.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
            <Badge variant="secondary" className="w-fit">
              {articleCount} {articleCount === 1 ? 'artículo' : 'artículos'}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

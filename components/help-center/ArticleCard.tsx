import Link from 'next/link';
import { Clock, ArrowRight, Video } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { HelpArticle } from '@/lib/help-center/types';
import { cn } from '@/lib/utils';

const difficultyLabels: Record<HelpArticle['difficulty'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

interface ArticleCardProps {
  article: HelpArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const href = `/ayuda/${article.collection}/${article.slug}`;

  return (
    <Link href={href}>
      <Card className="group transition-shadow hover:shadow-md h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary">
              {article.title}
            </h3>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {difficultyLabels[article.difficulty]}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {article.estimatedReadTime} min
            </span>
            {article.videoUrl && (
              <Badge variant="secondary" className="gap-1">
                <Video className="h-3 w-3" />
                Video
              </Badge>
            )}
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

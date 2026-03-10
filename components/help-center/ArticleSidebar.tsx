'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { HelpArticle } from '@/lib/help-center/types';
import { cn } from '@/lib/utils';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseHeadings(content: string): Array<{ level: 2 | 3; text: string; id: string }> {
  const headings: Array<{ level: 2 | 3; text: string; id: string }> = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      const text = h2Match[1].trim();
      headings.push({ level: 2, text, id: slugify(text) });
    } else if (h3Match) {
      const text = h3Match[1].trim();
      headings.push({ level: 3, text, id: slugify(text) });
    }
  }

  return headings;
}

interface ArticleSidebarProps {
  content: string;
  relatedArticles: HelpArticle[];
}

export function ArticleSidebar({ content, relatedArticles }: ArticleSidebarProps) {
  const headings = useMemo(() => parseHeadings(content), [content]);

  return (
    <aside className="hidden lg:block w-56 shrink-0">
      <nav className="sticky top-24 space-y-6">
        {headings.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold">En este artículo</h4>
            <ul className="space-y-2 text-sm">
              {headings.map(({ level, text, id }) => (
                <li
                  key={id}
                  className={cn(
                    level === 3 && 'pl-3 border-l border-muted'
                  )}
                >
                  <a
                    href={`#${id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {relatedArticles.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold">Artículos relacionados</h4>
            <ul className="space-y-2 text-sm">
              {relatedArticles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/ayuda/${article.collection}/${article.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors line-clamp-2"
                    >
                      {article.title}
                    </Link>
                  </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
}

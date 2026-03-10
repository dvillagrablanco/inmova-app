import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  searchArticles,
  getCollectionBySlug,
  getAllArticles,
  getArticleById,
} from '@/lib/help-center';
import { trackSearch } from '@/lib/help-center/metrics';
import type { HelpArticle } from '@/lib/help-center/types';
import { BreadcrumbNav } from '@/components/help-center/BreadcrumbNav';
import { HelpSearch } from '@/components/help-center/HelpSearch';
import { ArticleCard } from '@/components/help-center/ArticleCard';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Búsqueda | Centro de Ayuda',
  description:
    'Busca en el centro de ayuda de Inmova. Encuentra artículos, guías y tutoriales sobre gestión inmobiliaria.',
};

interface BuscarPageProps {
  searchParams: { q?: string };
}

/** Búsqueda semántica con Claude — server-side */
async function aiSearch(query: string): Promise<{ articles: HelpArticle[]; source: 'ai' | 'text' }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { articles: [], source: 'text' };

  try {
    const allArticles = getAllArticles();
    const catalog = allArticles.map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      tags: a.tags.join(', '),
    }));

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Eres el buscador del Centro de Ayuda de Inmova (PropTech). El usuario busca: "${query}"

Catálogo: ${JSON.stringify(catalog)}

Selecciona los 10 artículos más relevantes. Responde SOLO JSON: [{"id":"..."}]`,
        },
      ],
    });

    const text = message.content[0];
    if (text.type !== 'text') return { articles: [], source: 'text' };

    const jsonMatch = text.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { articles: [], source: 'text' };

    const picks: Array<{ id: string }> = JSON.parse(jsonMatch[0]);
    const results = picks
      .map((p) => getArticleById(p.id))
      .filter((a): a is HelpArticle => !!a);

    return { articles: results, source: 'ai' };
  } catch {
    return { articles: [], source: 'text' };
  }
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const { q } = searchParams;
  const query = typeof q === 'string' ? q.trim() : '';

  let articles: HelpArticle[] = [];
  let source: 'ai' | 'text' | 'none' = 'none';

  if (query) {
    trackSearch(query);

    // Try AI search
    const ai = await aiSearch(query);
    if (ai.articles.length > 0) {
      articles = ai.articles;
      source = 'ai';
    } else {
      // Fallback to text search
      const textResults = searchArticles(query, 20);
      articles = textResults.map((r) => r.article);
      source = 'text';
    }
  }

  // Group by collection
  const byCollection = new Map<string, HelpArticle[]>();
  for (const article of articles) {
    const slug = article.collection;
    if (!byCollection.has(slug)) {
      byCollection.set(slug, []);
    }
    byCollection.get(slug)!.push(article);
  }

  return (
    <div className="container px-4 py-8">
      <BreadcrumbNav
        items={[
          { label: 'Centro de Ayuda', href: '/ayuda' },
          { label: 'Búsqueda' },
        ]}
      />

      <div className="mt-6 mb-10">
        <HelpSearch defaultValue={query} placeholder="Buscar en la ayuda..." />
      </div>

      {query && (
        <>
          {articles.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">
                No se encontraron resultados
              </h2>
              <p className="text-muted-foreground mb-6">
                No hay artículos que coincidan con &quot;{query}&quot;. Prueba
                con otros términos o contacta con soporte.
              </p>
              <Link
                href="/ayuda/contacto"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Contactar soporte
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {articles.length}{' '}
                  {articles.length === 1 ? 'resultado' : 'resultados'} para
                  &quot;{query}&quot;
                </p>
                {source === 'ai' && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Búsqueda IA
                  </Badge>
                )}
              </div>

              {Array.from(byCollection.entries()).map(
                ([collectionSlug, items]) => {
                  const collection = getCollectionBySlug(collectionSlug);
                  return (
                    <section key={collectionSlug}>
                      <h2 className="text-lg font-semibold mb-4">
                        {collection?.title ?? collectionSlug}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({items.length}{' '}
                          {items.length === 1 ? 'artículo' : 'artículos'})
                        </span>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((article) => (
                          <ArticleCard key={article.id} article={article} />
                        ))}
                      </div>
                    </section>
                  );
                }
              )}
            </div>
          )}
        </>
      )}

      {!query && (
        <p className="text-muted-foreground">
          Introduce un término de búsqueda para encontrar artículos.
        </p>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { searchArticles, getCollectionBySlug } from '@/lib/help-center';
import { BreadcrumbNav } from '@/components/help-center/BreadcrumbNav';
import { HelpSearch } from '@/components/help-center/HelpSearch';
import { ArticleCard } from '@/components/help-center/ArticleCard';

export const metadata: Metadata = {
  title: 'Búsqueda | Centro de Ayuda',
  description:
    'Busca en el centro de ayuda de Inmova. Encuentra artículos, guías y tutoriales sobre gestión inmobiliaria.',
};

interface BuscarPageProps {
  searchParams: { q?: string };
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const { q } = searchParams;
  const query = typeof q === 'string' ? q.trim() : '';

  const results = query ? searchArticles(query, 20) : [];

  // Group by collection
  const byCollection = new Map<string, typeof results>();
  for (const result of results) {
    const slug = result.article.collection;
    if (!byCollection.has(slug)) {
      byCollection.set(slug, []);
    }
    byCollection.get(slug)!.push(result);
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
          {results.length === 0 ? (
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
              <p className="text-sm text-muted-foreground">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'} para
                &quot;{query}&quot;
              </p>

              {Array.from(byCollection.entries()).map(([collectionSlug, items]) => {
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
                      {items.map(({ article }) => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  </section>
                );
              })}
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

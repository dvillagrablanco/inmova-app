import type { Metadata } from 'next';
import Link from 'next/link';
import {
  collections,
  getPopularArticles,
  getArticleCountByCollection,
  changelogEntries,
} from '@/lib/help-center';
import { HelpSearch } from '@/components/help-center/HelpSearch';
import { CollectionCard } from '@/components/help-center/CollectionCard';
import { ArticleCard } from '@/components/help-center/ArticleCard';
import { ChangelogEntryCard } from '@/components/help-center/ChangelogEntryCard';

export const metadata: Metadata = {
  title: 'Centro de Ayuda',
  description:
    'Encuentra respuestas, guías y tutoriales para sacar el máximo partido a Inmova. Gestión inmobiliaria, contratos, pagos, incidencias y más.',
};

export default function AyudaHomePage() {
  const popularArticles = getPopularArticles(6);
  const latestChangelog = [...changelogEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="container px-4 py-12">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-16 text-white mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-center md:text-4xl">
          ¿Cómo podemos ayudarte?
        </h1>
        <div className="max-w-2xl mx-auto">
          <HelpSearch
            size="lg"
            placeholder="Buscar artículos, guías, tutoriales..."
          />
        </div>
      </section>

      {/* Collections */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Explorar por tema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              articleCount={getArticleCountByCollection(collection.slug)}
            />
          ))}
        </div>
      </section>

      {/* Popular articles */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Artículos populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Latest changelog */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Últimas novedades</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {latestChangelog.map((entry) => (
            <ChangelogEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/ayuda/changelog"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todas las novedades →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-xl border bg-muted/50 p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">
          ¿No encuentras lo que buscas?
        </h2>
        <p className="text-muted-foreground mb-4">
          Nuestro equipo está aquí para ayudarte. Contáctanos y te responderemos
          lo antes posible.
        </p>
        <Link
          href="/ayuda/contacto"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Contactar soporte
        </Link>
      </section>
    </div>
  );
}

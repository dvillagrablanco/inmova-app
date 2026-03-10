import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getCollectionBySlug,
  getArticlesByCollection,
  getArticlesBySubcollection,
  getArticleCountByCollection,
  getArticleCountBySubcollection,
} from '@/lib/help-center';
import { BreadcrumbNav } from '@/components/help-center/BreadcrumbNav';
import { ArticleCard } from '@/components/help-center/ArticleCard';
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

interface CollectionPageProps {
  params: { collection: string };
  searchParams: { sub?: string };
}

export async function generateMetadata({
  params,
}: {
  params: { collection: string };
}): Promise<Metadata> {
  const { collection: slug } = params;
  const collection = getCollectionBySlug(slug);
  if (!collection) return { title: 'Colección no encontrada' };
  return {
    title: `${collection.title} | Centro de Ayuda`,
    description: collection.description,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { collection: slug } = params;
  const { sub: subSlug } = searchParams;

  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();

  const Icon = iconMap[collection.icon] ?? FileText;

  const articles = subSlug
    ? getArticlesBySubcollection(slug, subSlug)
    : getArticlesByCollection(slug);

  const subcollections = collection.subcollections ?? [];

  return (
    <div className="container px-4 py-8">
      <BreadcrumbNav
        items={[
          { label: 'Centro de Ayuda', href: '/ayuda' },
          { label: collection.title },
        ]}
      />

      <header className="mt-6 mb-10">
        <div
          className={cn(
            'inline-flex h-14 w-14 items-center justify-center rounded-xl mb-4',
            collection.color,
            'text-white'
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{collection.title}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          {collection.description}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {subSlug
            ? `${articles.length} ${articles.length === 1 ? 'artículo' : 'artículos'}`
            : `${getArticleCountByCollection(slug)} ${getArticleCountByCollection(slug) === 1 ? 'artículo' : 'artículos'} en total`}
        </p>
      </header>

      {/* Subcollections grid (if any) */}
      {subcollections.length > 0 && !subSlug && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Subcategorías</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcollections.map((sub) => {
              const count = getArticleCountBySubcollection(slug, sub.slug);
              const SubIcon = iconMap[sub.icon] ?? FileText;
              return (
                <Link
                  key={sub.id}
                  href={`/ayuda/${slug}?sub=${sub.slug}`}
                  className="block"
                >
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          collection.color,
                          'text-white'
                        )}
                      >
                        <SubIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold leading-none tracking-tight">
                          {sub.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {sub.description}
                        </p>
                        <span className="inline-block text-xs text-muted-foreground">
                          {count} {count === 1 ? 'artículo' : 'artículos'}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Back link when subcollection is selected */}
      {subSlug && subcollections.length > 0 && (
        <div className="mb-6">
          <Link
            href={`/ayuda/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver a {collection.title}
          </Link>
        </div>
      )}

      {/* Articles list */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          {subSlug
            ? subcollections.find((s) => s.slug === subSlug)?.title ?? 'Artículos'
            : 'Artículos'}
        </h2>
        {articles.length === 0 ? (
          <p className="text-muted-foreground">
            No hay artículos en esta categoría.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

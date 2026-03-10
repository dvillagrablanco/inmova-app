import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllArticles,
  getCollectionBySlug,
  getRelatedArticles,
} from '@/lib/help-center';
import { BreadcrumbNav } from '@/components/help-center/BreadcrumbNav';
import { ArticleContent } from '@/components/help-center/ArticleContent';
import { ArticleSidebar } from '@/components/help-center/ArticleSidebar';
import { ArticleFeedback } from '@/components/help-center/ArticleFeedback';
import { ArticleCard } from '@/components/help-center/ArticleCard';
import { VideoPlaceholder } from '@/components/help-center/VideoPlaceholder';
import { ArticleViewTracker } from '@/components/help-center/ArticleViewTracker';

interface ArticlePageProps {
  params: { collection: string; slug: string };
}

function getArticle(collectionSlug: string, articleSlug: string) {
  return getAllArticles().find(
    (a) => a.collection === collectionSlug && a.slug === articleSlug
  );
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { collection: collectionSlug, slug: articleSlug } = params;
  const article = getArticle(collectionSlug, articleSlug);
  if (!article) return { title: 'Artículo no encontrado' };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { collection: collectionSlug, slug: articleSlug } = params;

  const article = getArticle(collectionSlug, articleSlug);
  if (!article) notFound();

  const collection = getCollectionBySlug(article.collection);
  const relatedArticles = getRelatedArticles(article.id, 4);

  if (!collection) notFound();

  return (
    <div className="container px-4 py-8">
      <ArticleViewTracker articleId={article.id} />
      <BreadcrumbNav
        items={[
          { label: 'Centro de Ayuda', href: '/ayuda' },
          { label: collection.title, href: `/ayuda/${collection.slug}` },
          { label: article.title },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <article>
          <h1 className="text-3xl font-bold tracking-tight mb-6">
            {article.title}
          </h1>
          <ArticleContent content={article.content} />
        </article>

        <ArticleSidebar
          content={article.content}
          relatedArticles={relatedArticles}
        />
      </div>

      {article.videoUrl && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Vídeo relacionado</h2>
          {article.videoUrl.includes('dQw4w9WgXcQ') ? (
            <VideoPlaceholder title={article.title} className="aspect-video" />
          ) : (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <iframe
                src={article.videoUrl}
                title={article.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <ArticleFeedback articleId={article.id} />
      </div>

      {relatedArticles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Artículos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedArticles.map((related) => (
              <ArticleCard key={related.id} article={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

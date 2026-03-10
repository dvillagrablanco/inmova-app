/**
 * Centro de Ayuda — Barrel export
 */

export * from './types';
export * from './collections';
export { searchArticles, getPopularArticles } from './search';

import type { HelpArticle } from './types';
import { collections } from './collections';
import { comoEmpezarArticles } from './data/como-empezar';
import { gestionarCuentaArticles } from './data/gestionar-cuenta';
import { incidenciasArticles } from './data/incidencias';
import { portalesArticles } from './data/portales';
import { academyArticles } from './data/academy';
import { changelogEntries } from './data/changelog';

// All articles aggregated
const _allArticles: HelpArticle[] = [
  ...comoEmpezarArticles,
  ...gestionarCuentaArticles,
  ...incidenciasArticles,
  ...portalesArticles,
  ...academyArticles,
];

export function getAllArticles(): HelpArticle[] {
  return _allArticles;
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return _allArticles.find((a) => a.slug === slug);
}

export function getArticleById(id: string): HelpArticle | undefined {
  return _allArticles.find((a) => a.id === id);
}

export function getArticlesByCollection(collectionSlug: string): HelpArticle[] {
  return _allArticles.filter((a) => a.collection === collectionSlug);
}

export function getArticlesBySubcollection(
  collectionSlug: string,
  subcollectionSlug: string
): HelpArticle[] {
  return _allArticles.filter(
    (a) => a.collection === collectionSlug && a.subcollection === subcollectionSlug
  );
}

export function getArticleCountByCollection(collectionSlug: string): number {
  return _allArticles.filter((a) => a.collection === collectionSlug).length;
}

export function getArticleCountBySubcollection(
  collectionSlug: string,
  subcollectionSlug: string
): number {
  return _allArticles.filter(
    (a) => a.collection === collectionSlug && a.subcollection === subcollectionSlug
  ).length;
}

export function getRelatedArticles(articleId: string, limit: number = 4): HelpArticle[] {
  const article = getArticleById(articleId);
  if (!article?.relatedArticles) return [];

  return article.relatedArticles
    .map((id) => getArticleById(id))
    .filter((a): a is HelpArticle => a !== undefined)
    .slice(0, limit);
}

export { changelogEntries };

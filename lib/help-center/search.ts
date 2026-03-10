import type { HelpArticle, SearchResult } from './types';
import { getAllArticles } from './index';

/**
 * Búsqueda de artículos por texto libre.
 * Busca en título, excerpt, contenido y tags con pesos diferentes.
 */
export function searchArticles(query: string, limit: number = 20): SearchResult[] {
  if (!query || query.trim().length < 2) return [];

  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/).filter((w) => w.length >= 2);
  const articles = getAllArticles();

  const results: SearchResult[] = [];

  for (const article of articles) {
    let score = 0;
    let matchField: SearchResult['matchField'] = 'content';

    const titleLower = article.title.toLowerCase();
    const excerptLower = article.excerpt.toLowerCase();
    const contentLower = article.content.toLowerCase();

    // Coincidencia exacta en título: mayor peso
    if (titleLower.includes(lowerQuery)) {
      score += 100;
      matchField = 'title';
    }

    // Coincidencia exacta en excerpt
    if (excerptLower.includes(lowerQuery)) {
      score += 50;
      if (matchField !== 'title') matchField = 'excerpt';
    }

    // Coincidencia por palabras individuales
    for (const word of words) {
      if (titleLower.includes(word)) score += 20;
      if (excerptLower.includes(word)) score += 10;
      if (contentLower.includes(word)) score += 3;

      // Tags
      for (const tag of article.tags) {
        if (tag.toLowerCase().includes(word)) {
          score += 15;
          if (matchField === 'content') matchField = 'tags';
        }
      }
    }

    if (score > 0) {
      results.push({ article, score, matchField });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Obtener artículos populares (los primeros de cada colección como proxy).
 */
export function getPopularArticles(limit: number = 6): HelpArticle[] {
  const articles = getAllArticles();
  const seen = new Set<string>();
  const popular: HelpArticle[] = [];

  for (const article of articles) {
    if (!seen.has(article.collection)) {
      popular.push(article);
      seen.add(article.collection);
    }
    if (popular.length >= limit) break;
  }

  // Fill remaining with first articles
  if (popular.length < limit) {
    for (const article of articles) {
      if (!popular.find((a) => a.id === article.id)) {
        popular.push(article);
      }
      if (popular.length >= limit) break;
    }
  }

  return popular;
}

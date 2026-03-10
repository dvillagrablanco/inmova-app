/**
 * Métricas del Centro de Ayuda — almacenamiento en memoria con flush a /tmp
 *
 * En servidor propio (PM2): persiste entre reloads via /tmp
 * En Vercel: efímero por invocación (solo útil para agregación en caliente)
 */

import fs from 'fs';
import path from 'path';

const METRICS_FILE = path.join('/tmp', 'help-center-metrics.json');

interface ArticleMetrics {
  views: number;
  helpfulYes: number;
  helpfulNo: number;
  lastViewed?: string;
}

interface MetricsStore {
  articles: Record<string, ArticleMetrics>;
  searches: Record<string, number>;
}

let _store: MetricsStore | null = null;

function getStore(): MetricsStore {
  if (_store) return _store;

  try {
    if (fs.existsSync(METRICS_FILE)) {
      const data = fs.readFileSync(METRICS_FILE, 'utf-8');
      _store = JSON.parse(data);
      return _store!;
    }
  } catch {
    // Ignore read errors
  }

  _store = { articles: {}, searches: {} };
  return _store;
}

function persist(): void {
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(_store), 'utf-8');
  } catch {
    // Ignore write errors (readonly filesystem)
  }
}

export function trackView(articleId: string): void {
  const store = getStore();
  if (!store.articles[articleId]) {
    store.articles[articleId] = { views: 0, helpfulYes: 0, helpfulNo: 0 };
  }
  store.articles[articleId].views += 1;
  store.articles[articleId].lastViewed = new Date().toISOString();
  persist();
}

export function trackFeedback(articleId: string, helpful: boolean): void {
  const store = getStore();
  if (!store.articles[articleId]) {
    store.articles[articleId] = { views: 0, helpfulYes: 0, helpfulNo: 0 };
  }
  if (helpful) {
    store.articles[articleId].helpfulYes += 1;
  } else {
    store.articles[articleId].helpfulNo += 1;
  }
  persist();
}

export function trackSearch(query: string): void {
  const store = getStore();
  const normalized = query.toLowerCase().trim();
  store.searches[normalized] = (store.searches[normalized] || 0) + 1;
  persist();
}

export function getArticleMetrics(articleId: string): ArticleMetrics {
  const store = getStore();
  return store.articles[articleId] || { views: 0, helpfulYes: 0, helpfulNo: 0 };
}

export function getTopArticles(limit: number = 10): Array<{ id: string } & ArticleMetrics> {
  const store = getStore();
  return Object.entries(store.articles)
    .map(([id, metrics]) => ({ id, ...metrics }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function getTopSearches(limit: number = 10): Array<{ query: string; count: number }> {
  const store = getStore();
  return Object.entries(store.searches)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getAllMetrics(): MetricsStore {
  return getStore();
}

/**
 * Tipos para el Centro de Ayuda de Inmova
 * Emula la estructura de help.homming.com con colecciones jerárquicas
 */

export interface HelpCollection {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  subcollections?: HelpSubCollection[];
}

export interface HelpSubCollection {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  order: number;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  collection: string;
  subcollection?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  videoUrl?: string;
  relatedArticles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix';
  tags: string[];
}

export interface SearchResult {
  article: HelpArticle;
  score: number;
  matchField: 'title' | 'content' | 'tags' | 'excerpt';
}

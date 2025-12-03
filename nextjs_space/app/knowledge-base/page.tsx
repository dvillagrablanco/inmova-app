'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  Play,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  TrendingUp,
  Star,
  Clock,
  Sparkles,
  ArrowLeft,
  Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface KnowledgeArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  videoUrl?: string;
  relatedArticles?: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: BookOpen },
  { id: 'getting_started', label: 'Primeros pasos', icon: Star },
  { id: 'contracts', label: 'Contratos', icon: BookOpen },
  { id: 'billing', label: 'Facturación', icon: TrendingUp },
  { id: 'advanced', label: 'Avanzado', icon: Sparkles },
  { id: 'integrations', label: 'Integraciones', icon: ExternalLink },
  { id: 'maintenance', label: 'Mantenimiento', icon: Clock },
  { id: 'migration', label: 'Migración', icon: ExternalLink },
  { id: 'troubleshooting', label: 'Solución de problemas', icon: ThumbsUp }
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchArticles();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

  const searchArticles = async (query?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: query || ''
        })
      });

      if (res.ok) {
        const { results } = await res.json();
        setArticles(results);
        setFilteredArticles(results);
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      toast.error('Error al buscar artículos');
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(lower) ||
        a.excerpt.toLowerCase().includes(lower) ||
        a.tags.some(t => t.toLowerCase().includes(lower))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleArticleClick = async (article: KnowledgeArticle) => {
    try {
      const res = await fetch('/api/support/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_article',
          articleId: article.id
        })
      });

      if (res.ok) {
        const { article: fullArticle } = await res.json();
        setSelectedArticle(fullArticle);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Error al cargar artículo');
    }
  };

  const handleFeedback = (articleId: string, helpful: boolean) => {
    toast.success(helpful ? '¡Gracias por tu feedback positivo!' : 'Gracias por tu feedback. Mejoraremos este artículo.');
  };

  if (selectedArticle) {
    return (
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedArticle(null)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Base de Conocimientos
                </Button>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        <Home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink onClick={() => setSelectedArticle(null)}>
                        Base de Conocimientos
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{selectedArticle.title.substring(0, 30)}...</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{selectedArticle.title}</CardTitle>
                <CardDescription className="text-base">{selectedArticle.excerpt}</CardDescription>
              </div>
              {selectedArticle.videoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedArticle.videoUrl, '_blank')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Ver video
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {selectedArticle.views} vistas
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                {selectedArticle.helpful} útil
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: selectedArticle.content
                  .replace(/\n/g, '<br/>')
                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }}
            />

            <div className="mt-8 pt-8 border-t">
              <p className="text-sm font-medium mb-3">¿Te ha resultado útil este artículo?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(selectedArticle.id, true)}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Sí, me ayudó
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(selectedArticle.id, false)}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" />
                  No, necesito más ayuda
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Base de Conocimientos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Base de Conocimientos</h1>
        <p className="text-muted-foreground text-lg">
          Encuentra respuestas a todas tus preguntas sobre INMOVA
        </p>
      </div>

      {/* Barra de búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artículos, tutoriales, guías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => searchArticles(searchQuery)}>
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categorías */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <Icon className="h-4 w-4" />
                {category.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Lista de artículos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron artículos</h3>
            <p className="text-muted-foreground">
              Intenta con otros términos de búsqueda o explora otras categorías
            </p>
          </div>
        ) : (
          filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="h-full hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleArticleClick(article)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                    {article.videoUrl && (
                      <Play className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {article.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {article.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {article.helpful}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
          </div>
        </main>
      </div>
    </div>
  );
}

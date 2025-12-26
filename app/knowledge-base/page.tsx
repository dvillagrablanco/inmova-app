'use client';

import { useState, useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Search,
  PlayCircle,
  Clock,
  Tag,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Home,
  Star,
  Filter,
  X,
  FileText,
  Video,
  MessageSquare,
} from 'lucide-react';
import {
  knowledgeBase,
  faqs,
  searchKnowledgeBase,
  searchFAQs,
  getAllCategories,
  type KnowledgeArticle,
  type FAQ,
} from '@/lib/knowledge-base';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('articles');

  const categories = getAllCategories();

  // Filtros avanzados
  const filteredArticles = useMemo(() => {
    let results = searchQuery ? searchKnowledgeBase(searchQuery, 50) : knowledgeBase;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      results = results.filter((article) => article.category === selectedCategory);
    }

    // Filtrar por dificultad
    if (selectedDifficulty !== 'all') {
      results = results.filter((article) => article.difficulty === selectedDifficulty);
    }

    return results;
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const filteredFAQs = useMemo(() => {
    let results = searchQuery ? searchFAQs(searchQuery, 50) : faqs;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      results = results.filter((faq) => faq.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const toggleFavorite = (articleId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(articleId)) {
        newFavorites.delete(articleId);
      } else {
        newFavorites.add(articleId);
      }
      return newFavorites;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all';

  // Componente de Artículo
  const ArticleCard = ({ article }: { article: KnowledgeArticle }) => {
    const isFavorite = favorites.has(article.id);

    return (
      <Card className="hover:shadow-lg transition-all cursor-pointer group">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="flex-shrink-0">
                  {article.category}
                </Badge>
                <Badge
                  variant={
                    article.difficulty === 'beginner'
                      ? 'default'
                      : article.difficulty === 'intermediate'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-xs flex-shrink-0"
                >
                  {article.difficulty === 'beginner'
                    ? 'Principiante'
                    : article.difficulty === 'intermediate'
                      ? 'Intermedio'
                      : 'Avanzado'}
                </Badge>
              </div>
              <CardTitle
                className="text-base group-hover:text-primary transition-colors"
                onClick={() => setSelectedArticle(article)}
              >
                {article.title}
              </CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{article.excerpt}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(article.id);
              }}
              className="flex-shrink-0"
            >
              <Star className={cn('h-4 w-4', isFavorite && 'fill-yellow-400 text-yellow-400')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent onClick={() => setSelectedArticle(article)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.estimatedReadTime} min
              </div>
              {article.videoUrl && (
                <div className="flex items-center gap-1 text-primary">
                  <Video className="h-4 w-4" />
                  Video
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Componente de FAQ
  const FAQCard = ({ faq }: { faq: FAQ }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base mb-2">{faq.question}</CardTitle>
            <CardDescription className="whitespace-pre-wrap">{faq.answer}</CardDescription>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                {faq.category}
              </Badge>
              {faq.relatedArticles && faq.relatedArticles.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {faq.relatedArticles.length} artículos relacionados
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
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

        {/* Header */}
        <div className="space-y-4">
          <BackButton href="/dashboard" label="Volver al Dashboard" />
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight gradient-text">
                Base de Conocimientos
              </h1>
              <p className="text-muted-foreground mt-1">
                Encuentra guías, tutoriales y respuestas a tus preguntas
              </p>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar artículos, preguntas frecuentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>Filtros:</span>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las dificultades</SelectItem>
                    <SelectItem value="beginner">Principiante</SelectItem>
                    <SelectItem value="intermediate">Intermedio</SelectItem>
                    <SelectItem value="advanced">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Limpiar filtros
                  </Button>
                )}
              </div>

              {/* Indicador de resultados */}
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredArticles.length} artículos y {filteredFAQs.length} FAQs
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contenido con Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Artículos ({filteredArticles.length})
            </TabsTrigger>
            <TabsTrigger value="faqs" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQs ({filteredFAQs.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Star className="h-4 w-4" />
              Favoritos ({favorites.size})
            </TabsTrigger>
          </TabsList>

          {/* Artículos */}
          <TabsContent value="articles" className="space-y-4">
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron artículos</h3>
                  <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* FAQs */}
          <TabsContent value="faqs" className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron FAQs</h3>
                  <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredFAQs.map((faq) => (
                  <FAQCard key={faq.id} faq={faq} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favoritos */}
          <TabsContent value="favorites" className="space-y-4">
            {favorites.size === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tienes favoritos</h3>
                  <p className="text-muted-foreground">
                    Marca artículos como favoritos para acceder rápidamente a ellos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {knowledgeBase
                  .filter((article) => favorites.has(article.id))
                  .map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Artículo */}
        {selectedArticle && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            <div className="fixed inset-4 z-50 overflow-auto" onClick={(e) => e.stopPropagation()}>
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">{selectedArticle.category}</Badge>
                        <Badge
                          variant={
                            selectedArticle.difficulty === 'beginner'
                              ? 'default'
                              : selectedArticle.difficulty === 'intermediate'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {selectedArticle.difficulty === 'beginner'
                            ? 'Principiante'
                            : selectedArticle.difficulty === 'intermediate'
                              ? 'Intermedio'
                              : 'Avanzado'}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                      <CardDescription className="mt-2 text-base">
                        {selectedArticle.excerpt}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">{selectedArticle.content}</div>
                  </div>
                  {selectedArticle.videoUrl && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Video Tutorial
                      </h3>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <iframe
                          src={selectedArticle.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                  {selectedArticle.relatedArticles &&
                    selectedArticle.relatedArticles.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-3">Artículos Relacionados</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedArticle.relatedArticles.map((relatedId) => {
                            const related = knowledgeBase.find((a) => a.id === relatedId);
                            return related ? (
                              <Button
                                key={related.id}
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedArticle(related)}
                              >
                                {related.title}
                              </Button>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

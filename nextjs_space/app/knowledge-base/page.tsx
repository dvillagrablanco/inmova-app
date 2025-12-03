'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, Search, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { knowledgeBase, searchArticles, getArticlesByCategory } from '@/lib/knowledge-base-data';
import { AIAssistant } from '@/components/automation/AIAssistant';

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(knowledgeBase);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { value: 'primeros_pasos', label: 'Primeros Pasos', icon: '🚀' },
    { value: 'contratos', label: 'Contratos', icon: '📝' },
    { value: 'pagos', label: 'Pagos', icon: '💰' },
    { value: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
    { value: 'screening', label: 'Screening', icon: '🔍' },
    { value: 'predicciones', label: 'Predicciones IA', icon: '🤖' },
    { value: 'str', label: 'Short-Term Rental', icon: '🏖️' },
    { value: 'habitaciones', label: 'Alquiler Habitaciones', icon: '🚪' },
    { value: 'integraciones', label: 'Integraciones', icon: '🔌' },
  ];

  useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedCategory]);

  const handleSearch = () => {
    if (!searchQuery && !selectedCategory) {
      setSearchResults(knowledgeBase);
      return;
    }

    let results = knowledgeBase;

    if (selectedCategory) {
      results = getArticlesByCategory(selectedCategory);
    }

    if (searchQuery) {
      results = searchArticles(searchQuery);
    }

    setSearchResults(results);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Base de Conocimientos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Base de Conocimientos</h1>
              <p className="text-muted-foreground">
                Encuentra respuestas a tus preguntas sobre cómo usar INMOVA
              </p>
            </div>

            {/* Search Bar */}
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar artículos, tutoriales, guías..."
                    className="pl-10 py-6 text-lg"
                  />
                  <Badge className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-violet-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Búsqueda IA
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Categorías</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? 'gradient-primary' : ''}
                >
                  Todas
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.value)}
                    className={selectedCategory === category.value ? 'gradient-primary' : ''}
                  >
                    {category.icon} {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {searchQuery ? 'Resultados de búsqueda' : 'Todos los artículos'}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {searchResults.length} artículos encontrados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(article => (
                  <Card
                    key={article.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => router.push(`/knowledge-base/${article.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <BookOpen className="h-6 w-6 text-indigo-600" />
                        <Badge variant="secondary">
                          {categories.find(c => c.value === article.category)?.label ||
                            article.category}
                        </Badge>
                      </div>
                      <CardTitle className="group-hover:text-indigo-600 transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription>{article.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {article.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="ghost" className="w-full justify-between group-hover:bg-indigo-50">
                        Leer artículo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {searchResults.length === 0 && (
                <Card className="p-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No se encontraron artículos
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta con otros términos de búsqueda o explora las categorías
                  </p>
                  <Button onClick={() => router.push('/soporte')} className="gradient-primary">
                    Contactar Soporte
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}

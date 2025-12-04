'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  PlayCircle, 
  Clock,
  Tag,
  ArrowRight,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { knowledgeBase, faqs, searchKnowledgeBase, searchFAQs, getAllCategories, type KnowledgeArticle, type FAQ } from '@/lib/knowledge-base';
import Link from 'next/link';

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  
  const categories = getAllCategories();
  const articleResults = searchQuery ? searchKnowledgeBase(searchQuery, 20) : knowledgeBase;
  const faqResults = searchQuery ? searchFAQs(searchQuery, 10) : faqs;

  const ArticleCard = ({ article }: { article: KnowledgeArticle }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedArticle(article)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{article.category}</Badge>
              <Badge 
                variant={article.difficulty === 'beginner' ? 'default' : article.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {article.difficulty === 'beginner' ? 'Principiante' : article.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </Badge>
            </div>
            <CardTitle className="text-base">{article.title}</CardTitle>
            <CardDescription className="mt-2">
              {article.excerpt}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.estimatedReadTime} min
            </div>
            {article.videoUrl && (
              <div className="flex items-center gap-1 text-primary">
                <PlayCircle className="h-4 w-4" />
                Video incluido
              </div>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const FAQCard = ({ faq }: { faq: FAQ }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <CardTitle className="text-base">{faq.question}</CardTitle>
            <CardDescription className="mt-2 whitespace-pre-wrap">
              {faq.answer}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {faq.relatedArticles.length > 0 && (
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">Artículos relacionados:</p>
          <div className="flex flex-wrap gap-2">
            {faq.relatedArticles.slice(0, 3).map((articleId) => {
              const article = knowledgeBase.find(a => a.id === articleId);
              return article ? (
                <Link key={articleId} href={`/knowledge-base?article=${articleId}`}>
                  <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                    {article.title}
                  </Badge>
                </Link>
              ) : null;
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          Base de Conocimiento
        </h1>
        <p className="text-muted-foreground">
          Encuentra respuestas, guías y tutoriales para aprovechar al máximo INMOVA.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Busca artículos, guías, preguntas frecuentes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-base"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{knowledgeBase.length}</p>
              <p className="text-sm text-muted-foreground">Artículos y Guías</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{faqs.length}</p>
              <p className="text-sm text-muted-foreground">Preguntas Frecuentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categorías</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="articles">
            <BookOpen className="mr-2 h-4 w-4" />
            Artículos ({articleResults.length})
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <HelpCircle className="mr-2 h-4 w-4" />
            Preguntas Frecuentes ({faqResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          {articleResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articleResults.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No se encontraron artículos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          {faqResults.length > 0 ? (
            <div className="space-y-3">
              {faqResults.map((faq) => (
                <FAQCard key={faq.id} faq={faq} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No se encontraron preguntas frecuentes</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿No encuentras lo que buscas?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nuestro chatbot IA está disponible 24/7 para ayudarte con cualquier duda.
                También puedes crear un ticket de soporte si necesitas asistencia personalizada.
              </p>
              <div className="flex gap-2">
                <Button size="sm">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Abrir Chatbot IA
                </Button>
                <Button size="sm" variant="outline">
                  Crear Ticket
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

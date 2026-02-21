'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, BookOpen, CreditCard, Building2, Users, FileText,
  Settings, Shield, HelpCircle, ChevronRight, ArrowLeft, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { knowledgeBase, searchArticles, getArticlesByCategory } from '@/lib/knowledge-base-data';

const categories = [
  { id: 'primeros_pasos', label: 'Primeros Pasos', icon: BookOpen, color: 'bg-blue-500' },
  { id: 'gestion', label: 'Gestión Diaria', icon: Building2, color: 'bg-emerald-500' },
  { id: 'cuenta', label: 'Tu Cuenta', icon: Settings, color: 'bg-purple-500' },
];

export default function AyudaPage() {
  const [query, setQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const searchResults = query.length > 2 ? searchArticles(query) : [];
  const article = selectedArticle ? knowledgeBase.find(a => a.id === selectedArticle) : null;
  const categoryArticles = selectedCategory ? getArticlesByCategory(selectedCategory) : [];

  if (article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button variant="ghost" className="mb-4" onClick={() => setSelectedArticle(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Card>
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2">{article.category.replace('_', ' ')}</Badge>
              <CardTitle className="text-2xl">{article.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{
                __html: article.content
                  .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3 class="text-md font-medium mt-4 mb-1">$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
                  .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4"><strong>$1.</strong> $2</li>')
                  .replace(/\n\n/g, '<br/><br/>')
              }} />
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                ¿No encontraste lo que buscabas? Escríbenos a{' '}
                <a href="mailto:soporte@inmova.app" className="text-primary font-medium">soporte@inmova.app</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Centro de Ayuda INMOVA</h1>
          <p className="text-indigo-100 mb-8">Encuentra respuestas a todas tus preguntas</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10 bg-white text-gray-900 h-12 text-base"
              placeholder="Buscar: crear edificio, cobrar renta, importar datos..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedCategory(null); }}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 bg-white rounded-lg shadow-lg text-left max-w-xl mx-auto">
              {searchResults.map(r => (
                <button key={r.id} className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b last:border-0 text-left flex items-center justify-between"
                  onClick={() => { setSelectedArticle(r.id); setQuery(''); }}>
                  <span>{r.title}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick start */}
        <Card className="mb-8 border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-600 rounded-lg"><HelpCircle className="h-5 w-5 text-white" /></div>
              <div>
                <h2 className="font-semibold text-lg">¿Primera vez en INMOVA?</h2>
                <p className="text-sm text-muted-foreground">Lee nuestra guía de 5 minutos para empezar</p>
              </div>
            </div>
            <Button variant="outline" className="mt-2" onClick={() => setSelectedArticle('kb-021')}>
              Guía de inicio rápido <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Categories */}
        {!selectedCategory && (
          <>
            <h2 className="text-xl font-semibold mb-4">Explorar por categoría</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {categories.map(cat => (
                <Card key={cat.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory(cat.id)}>
                  <CardContent className="pt-6 flex items-center gap-3">
                    <div className={`p-2 ${cat.color} rounded-lg`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">{getArticlesByCategory(cat.id).length} artículos</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-4">Artículos populares</h2>
            <div className="space-y-2">
              {knowledgeBase.slice(0, 8).map(a => (
                <button key={a.id} className="w-full text-left p-4 bg-white rounded-lg border hover:border-indigo-300 hover:shadow-sm transition-all flex items-center justify-between"
                  onClick={() => setSelectedArticle(a.id)}>
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.excerpt}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Category view */}
        {selectedCategory && (
          <>
            <Button variant="ghost" className="mb-4" onClick={() => setSelectedCategory(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Todas las categorías
            </Button>
            <h2 className="text-xl font-semibold mb-4">
              {categories.find(c => c.id === selectedCategory)?.label}
            </h2>
            <div className="space-y-2">
              {categoryArticles.map(a => (
                <button key={a.id} className="w-full text-left p-4 bg-white rounded-lg border hover:border-indigo-300 hover:shadow-sm transition-all flex items-center justify-between"
                  onClick={() => setSelectedArticle(a.id)}>
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{a.excerpt}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Contact */}
        <Card className="mt-12">
          <CardContent className="pt-6 text-center">
            <Mail className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">¿Necesitas más ayuda?</h3>
            <p className="text-sm text-muted-foreground mb-4">Nuestro equipo responde en menos de 24 horas</p>
            <a href="mailto:soporte@inmova.app">
              <Button>Contactar soporte</Button>
            </a>
            <p className="text-xs text-muted-foreground mt-3">Lunes a Viernes, 9:00 - 18:00 (hora Madrid)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, User } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      slug: 'tendencias-proptech-2026',
      title: '7 Tendencias PropTech que Transformarán el Sector en 2026',
      excerpt:
        'Descubre las tecnologías emergentes que están revolucionando la gestión inmobiliaria.',
      author: 'Equipo INMOVA',
      date: '15 Enero 2026',
      category: 'Tendencias',
    },
    {
      slug: 'ia-gestion-propiedades',
      title: 'Cómo la IA Está Cambiando la Gestión de Propiedades',
      excerpt:
        'La inteligencia artificial permite optimizar operaciones y aumentar el ROI hasta un 25%.',
      author: 'María González',
      date: '10 Enero 2026',
      category: 'Tecnología',
    },
    {
      slug: 'guia-coliving-espana-2026',
      title: 'Guía Completa de Coliving en España 2026',
      excerpt: 'Todo lo que necesitas saber para gestionar espacios de coliving de forma profesional.',
      author: 'Carlos Ruiz',
      date: '5 Enero 2026',
      category: 'Guía Práctica',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <Link href="/landing">
              <Button>Volver a Inicio</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4">Blog</Badge>
            <h1 className="text-5xl font-bold mb-4">Últimas Noticias y Actualizaciones</h1>
            <p className="text-xl text-gray-600">
              Mantente al día con las últimas tendencias en PropTech
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <Card key={i} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <Badge className="w-fit mb-2">{post.category}</Badge>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </div>
                  </div>
                  <Link href={`/landing/blog/${post.slug}`}>
                    <Button className="w-full mt-4" variant="outline">
                      Leer artículo
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">¿Quieres recibir nuestras publicaciones?</p>
            <Link href="/register">
              <Button>Suscríbete Gratis</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
            © 2026 INMOVA. Powered by Enxames Investments SL. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

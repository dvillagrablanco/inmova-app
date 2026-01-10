'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  FileText,
  Video,
  Mail,
  Search,
  ExternalLink,
  Book,
  HelpCircle,
  Phone,
  Clock,
  ChevronRight,
} from 'lucide-react';

const faqItems = [
  {
    category: 'general',
    question: '¿Cómo puedo añadir una nueva propiedad?',
    answer:
      'Ve al menú "Propiedades" > "Nueva Propiedad" y completa el formulario con los datos del inmueble.',
  },
  {
    category: 'general',
    question: '¿Cómo gestiono los contratos de alquiler?',
    answer:
      'En la sección "Contratos" puedes crear, editar y gestionar todos los contratos. También puedes generar documentos con IA.',
  },
  {
    category: 'pagos',
    question: '¿Cómo configuro los pagos automáticos?',
    answer:
      'Ve a "Configuración" > "Pagos" y conecta tu cuenta Stripe o GoCardless para automatizar los cobros.',
  },
  {
    category: 'pagos',
    question: '¿Cómo envío recordatorios de pago?',
    answer:
      'En la sección "Pagos" > "Pendientes", selecciona los pagos y usa el botón "Enviar Recordatorio".',
  },
  {
    category: 'integraciones',
    question: '¿Cómo conecto mi sistema de contabilidad?',
    answer:
      'Ve a "Integraciones" y busca tu software de contabilidad (Holded, Contasimple, etc.) para configurar la conexión.',
  },
  {
    category: 'integraciones',
    question: '¿Puedo usar firma digital para contratos?',
    answer:
      'Sí, en "Integraciones" puedes conectar DocuSign o Signaturit para firmas digitales legalmente válidas.',
  },
];

const tutorialVideos = [
  {
    id: 1,
    title: 'Primeros pasos con Inmova',
    duration: '5:32',
    thumbnail: '/tutorials/getting-started.jpg',
  },
  {
    id: 2,
    title: 'Gestión de propiedades',
    duration: '8:15',
    thumbnail: '/tutorials/properties.jpg',
  },
  {
    id: 3,
    title: 'Configuración de pagos',
    duration: '6:45',
    thumbnail: '/tutorials/payments.jpg',
  },
  {
    id: 4,
    title: 'Generación de contratos con IA',
    duration: '4:20',
    thumbnail: '/tutorials/ai-contracts.jpg',
  },
];

const documentationSections = [
  { title: 'Guía de inicio rápido', icon: Book, url: '/docs/quickstart' },
  { title: 'Manual de usuario', icon: FileText, url: '/docs/user-manual' },
  { title: 'API Reference', icon: ExternalLink, url: '/api-docs' },
  { title: 'Preguntas frecuentes', icon: HelpCircle, url: '/docs/faq' },
];

export default function SoportePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const openCrispChat = () => {
    // Abrir el chat de Crisp
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    } else {
      // Fallback si Crisp no está cargado
      window.open('https://go.crisp.chat/chat/embed/?website_id=YOUR_CRISP_ID', '_blank');
    }
  };

  const filteredFaq = faqItems.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">🆘 Centro de Soporte</h1>
          <p className="text-muted-foreground mt-2">
            Obtén ayuda con el uso de la plataforma Inmova
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={openCrispChat}
          >
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chat en Vivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Habla con nuestro equipo en tiempo real
              </p>
              <Badge className="bg-green-500">Online</Badge>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <a href="mailto:inmovaapp@gmail.com">
              <CardContent className="pt-6 text-center">
                <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Respuesta en menos de 24h
                </p>
                <span className="text-sm text-blue-600">inmovaapp@gmail.com</span>
              </CardContent>
            </a>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/knowledge-base')}
          >
            <CardContent className="pt-6 text-center">
              <Book className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Base de Conocimientos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Artículos y guías detalladas
              </p>
              <Badge variant="outline">50+ artículos</Badge>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <a href="tel:+34900000000">
              <CardContent className="pt-6 text-center">
                <Phone className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Teléfono</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Lun-Vie 9:00 - 18:00
                </p>
                <span className="text-sm text-blue-600">+34 900 000 000</span>
              </CardContent>
            </a>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Buscar en la ayuda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-lg py-6"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="h-4 w-4 mr-2" />
              Documentación
            </TabsTrigger>
            <TabsTrigger value="tutorials">
              <Video className="h-4 w-4 mr-2" />
              Tutoriales
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preguntas Frecuentes</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Todas
                    </Button>
                    <Button
                      variant={selectedCategory === 'general' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('general')}
                    >
                      General
                    </Button>
                    <Button
                      variant={selectedCategory === 'pagos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('pagos')}
                    >
                      Pagos
                    </Button>
                    <Button
                      variant={selectedCategory === 'integraciones' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('integraciones')}
                    >
                      Integraciones
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFaq.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No se encontraron resultados para tu búsqueda
                    </p>
                  ) : (
                    filteredFaq.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{item.question}</h4>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentationSections.map((section, index) => {
                const Icon = section.icon;
                return (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(section.url)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{section.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Ver documentación
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutorialVideos.map((video) => (
                <Card key={video.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Video className="h-16 w-16 text-purple-300" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{video.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4" />
                          {video.duration}
                        </div>
                      </div>
                      <Button size="sm">Ver</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Still need help */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">¿Aún necesitas ayuda?</h3>
              <p className="text-muted-foreground mb-4">
                Nuestro equipo de soporte está disponible para ayudarte
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={openCrispChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Iniciar Chat
                </Button>
                <Button variant="outline" onClick={() => router.push('/sugerencias')}>
                  Enviar Sugerencia
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

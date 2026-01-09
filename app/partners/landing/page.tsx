'use client';

/**
 * Página de Gestión del Contenido de la Landing del Partner
 *
 * Permite al partner configurar:
 * - Hero section (título, subtítulo, CTA, imagen/video)
 * - Beneficios
 * - Testimonios
 * - FAQ
 * - SEO metadata
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Layout,
  Type,
  MessageSquare,
  HelpCircle,
  Search,
  Save,
  Plus,
  Trash2,
  Eye,
  GripVertical,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Sparkles,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Benefit {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface Testimonial {
  nombre: string;
  cargo: string;
  empresa: string;
  texto: string;
  foto: string;
}

interface FAQItem {
  pregunta: string;
  respuesta: string;
}

interface LandingContent {
  // Hero
  heroTitulo: string;
  heroSubtitulo: string;
  heroCTA: string;
  heroImagenUrl: string;
  heroVideoUrl: string;
  // Propuesta de valor
  propuestaValor: string;
  // Beneficios
  beneficios: Benefit[];
  // Testimonios
  testimonios: Testimonial[];
  // FAQ
  faqItems: FAQItem[];
  // CTAs
  ctaPrincipal: string;
  ctaSecundario: string;
  // SEO
  metaTitulo: string;
  metaDescripcion: string;
  metaKeywords: string;
  ogImagen: string;
  // Config
  mostrarTestimonios: boolean;
  mostrarFAQ: boolean;
  mostrarServicios: boolean;
}

const defaultContent: LandingContent = {
  heroTitulo: 'Gestiona tus propiedades de forma inteligente',
  heroSubtitulo: 'La plataforma todo-en-uno para la gestión inmobiliaria',
  heroCTA: 'Empezar gratis',
  heroImagenUrl: '',
  heroVideoUrl: '',
  propuestaValor: '',
  beneficios: [
    { icono: 'shield', titulo: 'Seguridad', descripcion: 'Tus datos siempre protegidos' },
    { icono: 'trending-up', titulo: 'Eficiencia', descripcion: 'Ahorra tiempo y recursos' },
    { icono: 'users', titulo: 'Soporte', descripcion: 'Equipo dedicado a tu éxito' },
  ],
  testimonios: [],
  faqItems: [],
  ctaPrincipal: 'Empieza ahora',
  ctaSecundario: 'Ver demo',
  metaTitulo: '',
  metaDescripcion: '',
  metaKeywords: '',
  ogImagen: '',
  mostrarTestimonios: true,
  mostrarFAQ: true,
  mostrarServicios: true,
};

export default function PartnerLandingContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ slug: string | null; nombre: string } | null>(
    null
  );
  const [content, setContent] = useState<LandingContent>(defaultContent);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners/landing-content');
      if (response.ok) {
        const data = await response.json();
        setPartnerInfo({ slug: data.slug, nombre: data.partnerNombre });
        if (data.content) {
          setContent({ ...defaultContent, ...data.content });
        }
      }
    } catch (error) {
      toast.error('Error al cargar contenido');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/partners/landing-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        toast.success('Contenido guardado correctamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar contenido');
    } finally {
      setSaving(false);
    }
  };

  const previewLanding = () => {
    if (partnerInfo?.slug) {
      window.open(`/p/${partnerInfo.slug}`, '_blank');
    }
  };

  // Handlers para beneficios
  const addBenefit = () => {
    setContent({
      ...content,
      beneficios: [...content.beneficios, { icono: 'star', titulo: '', descripcion: '' }],
    });
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    const newBenefits = [...content.beneficios];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setContent({ ...content, beneficios: newBenefits });
  };

  const removeBenefit = (index: number) => {
    setContent({
      ...content,
      beneficios: content.beneficios.filter((_, i) => i !== index),
    });
  };

  // Handlers para testimonios
  const addTestimonial = () => {
    setContent({
      ...content,
      testimonios: [
        ...content.testimonios,
        { nombre: '', cargo: '', empresa: '', texto: '', foto: '' },
      ],
    });
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string) => {
    const newTestimonials = [...content.testimonios];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setContent({ ...content, testimonios: newTestimonials });
  };

  const removeTestimonial = (index: number) => {
    setContent({
      ...content,
      testimonios: content.testimonios.filter((_, i) => i !== index),
    });
  };

  // Handlers para FAQ
  const addFAQ = () => {
    setContent({
      ...content,
      faqItems: [...content.faqItems, { pregunta: '', respuesta: '' }],
    });
  };

  const updateFAQ = (index: number, field: keyof FAQItem, value: string) => {
    const newFAQ = [...content.faqItems];
    newFAQ[index] = { ...newFAQ[index], [field]: value };
    setContent({ ...content, faqItems: newFAQ });
  };

  const removeFAQ = (index: number) => {
    setContent({
      ...content,
      faqItems: content.faqItems.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando contenido...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contenido de Landing</h1>
            <p className="text-gray-600">Personaliza el contenido de tu página de partner</p>
          </div>
          <div className="flex items-center gap-3">
            {partnerInfo?.slug && (
              <Button variant="outline" onClick={previewLanding}>
                <Eye className="h-4 w-4 mr-2" />
                Vista previa
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
            <TabsTrigger value="testimonios">Testimonios</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          {/* Tab: Hero Section */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Sección Hero
                </CardTitle>
                <CardDescription>
                  La primera impresión de tu landing - título, subtítulo y CTA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heroTitulo">Título Principal *</Label>
                    <Input
                      id="heroTitulo"
                      value={content.heroTitulo}
                      onChange={(e) => setContent({ ...content, heroTitulo: e.target.value })}
                      placeholder="Gestiona tus propiedades de forma inteligente"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.heroTitulo.length}/100 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitulo">Subtítulo</Label>
                    <Textarea
                      id="heroSubtitulo"
                      value={content.heroSubtitulo}
                      onChange={(e) => setContent({ ...content, heroSubtitulo: e.target.value })}
                      placeholder="La plataforma todo-en-uno para la gestión inmobiliaria"
                      rows={2}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.heroSubtitulo.length}/200 caracteres
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroCTA">Texto del Botón Principal</Label>
                      <Input
                        id="heroCTA"
                        value={content.heroCTA}
                        onChange={(e) => setContent({ ...content, heroCTA: e.target.value })}
                        placeholder="Empezar gratis"
                        maxLength={30}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ctaSecundario">Texto del Botón Secundario</Label>
                      <Input
                        id="ctaSecundario"
                        value={content.ctaSecundario}
                        onChange={(e) => setContent({ ...content, ctaSecundario: e.target.value })}
                        placeholder="Ver demo"
                        maxLength={30}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Multimedia
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroImagenUrl">URL de Imagen Hero</Label>
                      <Input
                        id="heroImagenUrl"
                        value={content.heroImagenUrl}
                        onChange={(e) => setContent({ ...content, heroImagenUrl: e.target.value })}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Recomendado: 1200x800px, formato JPG o PNG
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heroVideoUrl">URL de Video (opcional)</Label>
                      <Input
                        id="heroVideoUrl"
                        value={content.heroVideoUrl}
                        onChange={(e) => setContent({ ...content, heroVideoUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                      />
                      <p className="text-xs text-muted-foreground">
                        YouTube o Vimeo. Reemplazará la imagen si se proporciona.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="propuestaValor">Propuesta de Valor</Label>
                    <Textarea
                      id="propuestaValor"
                      value={content.propuestaValor}
                      onChange={(e) => setContent({ ...content, propuestaValor: e.target.value })}
                      placeholder="Una frase que resuma el valor que ofreces a tus clientes..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Aparecerá debajo del hero. {content.propuestaValor.length}/500 caracteres
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Beneficios */}
          <TabsContent value="beneficios">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Beneficios
                    </CardTitle>
                    <CardDescription>
                      Destaca las principales ventajas de tu servicio
                    </CardDescription>
                  </div>
                  <Button onClick={addBenefit} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {content.beneficios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay beneficios configurados</p>
                    <Button onClick={addBenefit} variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir primer beneficio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.beneficios.map((benefit, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                value={benefit.titulo}
                                onChange={(e) => updateBenefit(index, 'titulo', e.target.value)}
                                placeholder="Título del beneficio"
                              />
                              <Input
                                value={benefit.icono}
                                onChange={(e) => updateBenefit(index, 'icono', e.target.value)}
                                placeholder="Icono (shield, star, etc.)"
                              />
                            </div>
                            <Textarea
                              value={benefit.descripcion}
                              onChange={(e) => updateBenefit(index, 'descripcion', e.target.value)}
                              placeholder="Descripción del beneficio..."
                              rows={2}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBenefit(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Testimonios */}
          <TabsContent value="testimonios">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Testimonios
                    </CardTitle>
                    <CardDescription>Opiniones de clientes satisfechos</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mostrarTestimonios" className="text-sm">
                        Mostrar sección
                      </Label>
                      <Switch
                        id="mostrarTestimonios"
                        checked={content.mostrarTestimonios}
                        onCheckedChange={(checked) =>
                          setContent({ ...content, mostrarTestimonios: checked })
                        }
                      />
                    </div>
                    <Button onClick={addTestimonial} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {content.testimonios.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay testimonios configurados</p>
                    <Button onClick={addTestimonial} variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir primer testimonio
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.testimonios.map((testimonial, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input
                                value={testimonial.nombre}
                                onChange={(e) => updateTestimonial(index, 'nombre', e.target.value)}
                                placeholder="Nombre"
                              />
                              <Input
                                value={testimonial.cargo}
                                onChange={(e) => updateTestimonial(index, 'cargo', e.target.value)}
                                placeholder="Cargo"
                              />
                              <Input
                                value={testimonial.empresa}
                                onChange={(e) =>
                                  updateTestimonial(index, 'empresa', e.target.value)
                                }
                                placeholder="Empresa"
                              />
                            </div>
                            <Textarea
                              value={testimonial.texto}
                              onChange={(e) => updateTestimonial(index, 'texto', e.target.value)}
                              placeholder="Testimonio del cliente..."
                              rows={2}
                            />
                            <Input
                              value={testimonial.foto}
                              onChange={(e) => updateTestimonial(index, 'foto', e.target.value)}
                              placeholder="URL de foto (opcional)"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTestimonial(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: FAQ */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Preguntas Frecuentes
                    </CardTitle>
                    <CardDescription>Resuelve las dudas más comunes</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mostrarFAQ" className="text-sm">
                        Mostrar sección
                      </Label>
                      <Switch
                        id="mostrarFAQ"
                        checked={content.mostrarFAQ}
                        onCheckedChange={(checked) =>
                          setContent({ ...content, mostrarFAQ: checked })
                        }
                      />
                    </div>
                    <Button onClick={addFAQ} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {content.faqItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay preguntas frecuentes configuradas</p>
                    <Button onClick={addFAQ} variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir primera pregunta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.faqItems.map((faq, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-3">
                            <Input
                              value={faq.pregunta}
                              onChange={(e) => updateFAQ(index, 'pregunta', e.target.value)}
                              placeholder="¿Cuál es la pregunta?"
                            />
                            <Textarea
                              value={faq.respuesta}
                              onChange={(e) => updateFAQ(index, 'respuesta', e.target.value)}
                              placeholder="Respuesta..."
                              rows={3}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFAQ(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: SEO */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO y Metadatos
                </CardTitle>
                <CardDescription>
                  Optimiza tu landing para buscadores y redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitulo">Meta Título</Label>
                    <Input
                      id="metaTitulo"
                      value={content.metaTitulo}
                      onChange={(e) => setContent({ ...content, metaTitulo: e.target.value })}
                      placeholder="Título para SEO (60-70 caracteres)"
                      maxLength={70}
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.metaTitulo.length}/70 caracteres. Aparecerá en Google.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescripcion">Meta Descripción</Label>
                    <Textarea
                      id="metaDescripcion"
                      value={content.metaDescripcion}
                      onChange={(e) => setContent({ ...content, metaDescripcion: e.target.value })}
                      placeholder="Descripción para SEO (150-160 caracteres)"
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {content.metaDescripcion.length}/160 caracteres. Aparecerá en Google.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaKeywords">Palabras Clave</Label>
                    <Input
                      id="metaKeywords"
                      value={content.metaKeywords}
                      onChange={(e) => setContent({ ...content, metaKeywords: e.target.value })}
                      placeholder="gestión inmobiliaria, alquiler, propiedades..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Separadas por comas. Máximo 10 palabras.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogImagen">Imagen para Redes Sociales</Label>
                    <Input
                      id="ogImagen"
                      value={content.ogImagen}
                      onChange={(e) => setContent({ ...content, ogImagen: e.target.value })}
                      placeholder="https://... (1200x630px recomendado)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Aparecerá al compartir en Facebook, Twitter, LinkedIn.
                    </p>
                  </div>
                </div>

                {/* Preview SEO */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Vista previa en Google</h4>
                  <div className="bg-white border rounded-lg p-4 max-w-xl">
                    <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                      {content.metaTitulo || content.heroTitulo || 'Título de tu página'}
                    </p>
                    <p className="text-green-700 text-sm">
                      {partnerInfo?.slug
                        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${partnerInfo.slug}`
                        : 'inmovaapp.com/p/tu-slug'}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {content.metaDescripcion ||
                        content.heroSubtitulo ||
                        'Descripción de tu página...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Configuración de secciones */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Secciones</CardTitle>
            <CardDescription>Activa o desactiva secciones de la landing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Servicios Complementarios</p>
                  <p className="text-sm text-muted-foreground">Mostrar tus servicios adicionales</p>
                </div>
                <Switch
                  checked={content.mostrarServicios}
                  onCheckedChange={(checked) =>
                    setContent({ ...content, mostrarServicios: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Testimonios</p>
                  <p className="text-sm text-muted-foreground">Opiniones de clientes</p>
                </div>
                <Switch
                  checked={content.mostrarTestimonios}
                  onCheckedChange={(checked) =>
                    setContent({ ...content, mostrarTestimonios: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Preguntas Frecuentes</p>
                  <p className="text-sm text-muted-foreground">Sección FAQ</p>
                </div>
                <Switch
                  checked={content.mostrarFAQ}
                  onCheckedChange={(checked) => setContent({ ...content, mostrarFAQ: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

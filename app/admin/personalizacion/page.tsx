'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Palette,
  Type,
  Layout,
  Info,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  Settings,
  Check,
  Sparkles,
  Building2,
  HelpCircle,
  Wand2,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  CircleDot,
  Upload,
  Link as LinkIcon,
  Mail,
  Phone,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useBranding } from '@/lib/hooks/useBranding';
import logger from '@/lib/logger';

interface BrandingFormData {
  appName: string;
  appDescription: string;
  tagline: string;
  logoUrl: string;
  logoSmallUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  fontFamily: string;
  headingFont: string;
  borderRadius: string;
  sidebarPosition: string;
  theme: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  metaTitle: string;
  metaDescription: string;
}

// Presets de colores predefinidos
const COLOR_PRESETS = [
  {
    name: 'Profesional',
    description: 'Azul corporativo, elegante y confiable',
    colors: {
      primaryColor: '#1e40af',
      secondaryColor: '#f8fafc',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
    },
    icon: Building2,
  },
  {
    name: 'Moderno',
    description: 'Negro y púrpura, sofisticado y actual',
    colors: {
      primaryColor: '#18181b',
      secondaryColor: '#fafafa',
      accentColor: '#8b5cf6',
      backgroundColor: '#ffffff',
      textColor: '#09090b',
    },
    icon: Sparkles,
  },
  {
    name: 'Natural',
    description: 'Verde y tierra, sostenible y fresco',
    colors: {
      primaryColor: '#166534',
      secondaryColor: '#f0fdf4',
      accentColor: '#22c55e',
      backgroundColor: '#ffffff',
      textColor: '#14532d',
    },
    icon: Sun,
  },
  {
    name: 'Cálido',
    description: 'Naranja y crema, acogedor y amigable',
    colors: {
      primaryColor: '#c2410c',
      secondaryColor: '#fff7ed',
      accentColor: '#f97316',
      backgroundColor: '#fffbeb',
      textColor: '#431407',
    },
    icon: CircleDot,
  },
  {
    name: 'Minimalista',
    description: 'Escala de grises, limpio y simple',
    colors: {
      primaryColor: '#171717',
      secondaryColor: '#fafafa',
      accentColor: '#525252',
      backgroundColor: '#ffffff',
      textColor: '#0a0a0a',
    },
    icon: Monitor,
  },
  {
    name: 'Premium',
    description: 'Dorado y negro, lujo y exclusividad',
    colors: {
      primaryColor: '#1c1917',
      secondaryColor: '#fef3c7',
      accentColor: '#d97706',
      backgroundColor: '#fffbeb',
      textColor: '#1c1917',
    },
    icon: Moon,
  },
];

export default function PersonalizacionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { fullConfig, refresh, isLoaded } = useBranding();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identidad');
  const [showPreview, setShowPreview] = useState(true);

  const [formData, setFormData] = useState<BrandingFormData>({
    appName: 'INMOVA',
    appDescription: '',
    tagline: '',
    logoUrl: '',
    logoSmallUrl: '',
    faviconUrl: '',
    ogImageUrl: '',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    accentColor: '#6366f1',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    fontFamily: 'Inter, sans-serif',
    headingFont: '',
    borderRadius: '0.5rem',
    sidebarPosition: 'left',
    theme: 'light',
    footerText: '',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    metaTitle: '',
    metaDescription: '',
  });

  // Calcular progreso de completado
  const calculateProgress = () => {
    const fields = [
      formData.appName,
      formData.logoUrl,
      formData.primaryColor,
      formData.contactEmail,
      formData.metaTitle,
    ];
    const completed = fields.filter((f) => f && f.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (fullConfig && isLoaded) {
      setFormData({
        appName: fullConfig.appName || 'INMOVA',
        appDescription: fullConfig.appDescription || '',
        tagline: fullConfig.tagline || '',
        logoUrl: fullConfig.logoUrl || '',
        logoSmallUrl: fullConfig.logoSmallUrl || '',
        faviconUrl: fullConfig.faviconUrl || '',
        ogImageUrl: fullConfig.ogImageUrl || '',
        primaryColor: fullConfig.primaryColor || '#000000',
        secondaryColor: fullConfig.secondaryColor || '#FFFFFF',
        accentColor: fullConfig.accentColor || '#6366f1',
        backgroundColor: fullConfig.backgroundColor || '#FFFFFF',
        textColor: fullConfig.textColor || '#000000',
        successColor: fullConfig.successColor || '#22c55e',
        warningColor: fullConfig.warningColor || '#f59e0b',
        errorColor: fullConfig.errorColor || '#ef4444',
        fontFamily: fullConfig.fontFamily || 'Inter, sans-serif',
        headingFont: fullConfig.headingFont || '',
        borderRadius: fullConfig.borderRadius || '0.5rem',
        sidebarPosition: fullConfig.sidebarPosition || 'left',
        theme: fullConfig.theme || 'light',
        footerText: fullConfig.footerText || '',
        contactEmail: fullConfig.contactEmail || '',
        contactPhone: fullConfig.contactPhone || '',
        websiteUrl: fullConfig.websiteUrl || '',
        metaTitle: fullConfig.metaTitle || '',
        metaDescription: fullConfig.metaDescription || '',
      });
    }
  }, [fullConfig, isLoaded]);

  const handleInputChange = (field: keyof BrandingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const applyColorPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.colors,
    }));
    toast.success(`Preset "${preset.name}" aplicado`, {
      description: 'Puedes ajustar los colores individualmente si lo deseas.',
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      toast.success('¡Personalización guardada!', {
        description: 'Los cambios se aplicarán inmediatamente.',
      });

      await refresh();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      logger.error('Error saving branding:', error);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (fullConfig) {
      setFormData({
        appName: fullConfig.appName || 'INMOVA',
        appDescription: fullConfig.appDescription || '',
        tagline: fullConfig.tagline || '',
        logoUrl: fullConfig.logoUrl || '',
        logoSmallUrl: fullConfig.logoSmallUrl || '',
        faviconUrl: fullConfig.faviconUrl || '',
        ogImageUrl: fullConfig.ogImageUrl || '',
        primaryColor: fullConfig.primaryColor || '#000000',
        secondaryColor: fullConfig.secondaryColor || '#FFFFFF',
        accentColor: fullConfig.accentColor || '#6366f1',
        backgroundColor: fullConfig.backgroundColor || '#FFFFFF',
        textColor: fullConfig.textColor || '#000000',
        successColor: fullConfig.successColor || '#22c55e',
        warningColor: fullConfig.warningColor || '#f59e0b',
        errorColor: fullConfig.errorColor || '#ef4444',
        fontFamily: fullConfig.fontFamily || 'Inter, sans-serif',
        headingFont: fullConfig.headingFont || '',
        borderRadius: fullConfig.borderRadius || '0.5rem',
        sidebarPosition: fullConfig.sidebarPosition || 'left',
        theme: fullConfig.theme || 'light',
        footerText: fullConfig.footerText || '',
        contactEmail: fullConfig.contactEmail || '',
        contactPhone: fullConfig.contactPhone || '',
        websiteUrl: fullConfig.websiteUrl || '',
        metaTitle: fullConfig.metaTitle || '',
        metaDescription: fullConfig.metaDescription || '',
      });
      toast.info('Cambios descartados');
    }
  };

  if (status === 'loading' || !session) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const progress = calculateProgress();

  return (
    <AuthenticatedLayout>
      <TooltipProvider>
        <div className="max-w-7xl mx-auto">
          {/* Header mejorado */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/configuracion')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Configuración
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <Palette className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Personalización de Marca</h1>
                    <p className="text-muted-foreground text-sm">
                      Configura la identidad visual de tu empresa
                    </p>
                  </div>
                </div>

                {/* Indicador de progreso */}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso de configuración</span>
                    <span className="text-sm text-muted-foreground">{progress}% completado</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {formData.appName ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                      Nombre
                    </span>
                    <span className="flex items-center gap-1">
                      {formData.logoUrl ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                      Logo
                    </span>
                    <span className="flex items-center gap-1">
                      {formData.primaryColor !== '#000000' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                      Colores
                    </span>
                    <span className="flex items-center gap-1">
                      {formData.contactEmail ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                      Contacto
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Descartar
                </Button>
                <ButtonWithLoading
                  onClick={handleSave}
                  isLoading={saving}
                  loadingText="Guardando..."
                  icon={Save}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Guardar Cambios
                </ButtonWithLoading>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel principal de configuración */}
            <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="identidad" className="gap-2">
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">Identidad</span>
                  </TabsTrigger>
                  <TabsTrigger value="colores" className="gap-2">
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Colores</span>
                  </TabsTrigger>
                  <TabsTrigger value="interfaz" className="gap-2">
                    <Layout className="h-4 w-4" />
                    <span className="hidden sm:inline">Interfaz</span>
                  </TabsTrigger>
                  <TabsTrigger value="contacto" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">SEO</span>
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Identidad */}
                <TabsContent value="identidad" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Información de la Marca
                      </CardTitle>
                      <CardDescription>
                        Define el nombre y descripción que verán tus usuarios
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Nombre de la Aplicación *
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Aparece en el sidebar, título del navegador y emails</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            value={formData.appName}
                            onChange={(e) => handleInputChange('appName', e.target.value)}
                            placeholder="Mi Empresa"
                            className="text-lg font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tagline / Eslogan</Label>
                          <Input
                            value={formData.tagline}
                            onChange={(e) => handleInputChange('tagline', e.target.value)}
                            placeholder="Innovación Inmobiliaria"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={formData.appDescription}
                          onChange={(e) => handleInputChange('appDescription', e.target.value)}
                          placeholder="Breve descripción de tu empresa o servicio..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Logos e Imágenes
                      </CardTitle>
                      <CardDescription>
                        Sube o enlaza las imágenes de tu marca
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Principal */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Logo Principal
                          </Label>
                          <Input
                            value={formData.logoUrl}
                            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                            placeholder="https://..."
                          />
                          <div className="flex items-center gap-3">
                            {formData.logoUrl && (
                              <div className="h-12 w-32 bg-muted rounded flex items-center justify-center p-2">
                                <img
                                  src={formData.logoUrl}
                                  alt="Logo"
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">200x60px recomendado</span>
                          </div>
                        </div>

                        {/* Logo Pequeño */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Logo Pequeño / Icono
                          </Label>
                          <Input
                            value={formData.logoSmallUrl}
                            onChange={(e) => handleInputChange('logoSmallUrl', e.target.value)}
                            placeholder="https://..."
                          />
                          <div className="flex items-center gap-3">
                            {formData.logoSmallUrl && (
                              <div className="h-10 w-10 bg-muted rounded flex items-center justify-center p-1">
                                <img
                                  src={formData.logoSmallUrl}
                                  alt="Icono"
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">40x40px recomendado</span>
                          </div>
                        </div>

                        {/* Favicon */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Favicon
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>El pequeño icono en la pestaña del navegador</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            value={formData.faviconUrl}
                            onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                            placeholder="https://..."
                          />
                          <span className="text-xs text-muted-foreground">32x32px recomendado</span>
                        </div>

                        {/* OG Image */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Imagen para Redes Sociales
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Aparece al compartir enlaces en redes sociales</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            value={formData.ogImageUrl}
                            onChange={(e) => handleInputChange('ogImageUrl', e.target.value)}
                            placeholder="https://..."
                          />
                          <span className="text-xs text-muted-foreground">1200x630px recomendado</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: Colores */}
                <TabsContent value="colores" className="space-y-6">
                  {/* Presets de colores */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Presets de Colores
                      </CardTitle>
                      <CardDescription>
                        Selecciona un preset para empezar rápidamente o personaliza manualmente
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {COLOR_PRESETS.map((preset) => {
                          const Icon = preset.icon;
                          return (
                            <button
                              key={preset.name}
                              onClick={() => applyColorPreset(preset)}
                              className="group p-4 rounded-xl border-2 border-muted hover:border-primary transition-all text-left"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                <span className="font-medium">{preset.name}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{preset.description}</p>
                              <div className="flex gap-1">
                                {Object.values(preset.colors)
                                  .slice(0, 4)
                                  .map((color, i) => (
                                    <div
                                      key={i}
                                      className="h-6 w-6 rounded-full border"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Colores personalizados */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Colores Personalizados</CardTitle>
                      <CardDescription>Ajusta cada color individualmente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                          { key: 'primaryColor', label: 'Primario', desc: 'Botones y enlaces principales' },
                          { key: 'secondaryColor', label: 'Secundario', desc: 'Fondos alternativos' },
                          { key: 'accentColor', label: 'Acento', desc: 'Destacados y badges' },
                          { key: 'backgroundColor', label: 'Fondo', desc: 'Color de fondo general' },
                          { key: 'textColor', label: 'Texto', desc: 'Color del texto principal' },
                          { key: 'successColor', label: 'Éxito', desc: 'Mensajes positivos' },
                          { key: 'warningColor', label: 'Advertencia', desc: 'Alertas y avisos' },
                          { key: 'errorColor', label: 'Error', desc: 'Mensajes de error' },
                        ].map((item) => (
                          <div key={item.key} className="space-y-2">
                            <Label className="text-sm">{item.label}</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={formData[item.key as keyof BrandingFormData] as string}
                                onChange={(e) =>
                                  handleInputChange(item.key as keyof BrandingFormData, e.target.value)
                                }
                                className="h-10 w-12 p-1 cursor-pointer"
                              />
                              <Input
                                value={formData[item.key as keyof BrandingFormData] as string}
                                onChange={(e) =>
                                  handleInputChange(item.key as keyof BrandingFormData, e.target.value)
                                }
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: Interfaz */}
                <TabsContent value="interfaz" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Tipografía
                      </CardTitle>
                      <CardDescription>Selecciona las fuentes para tu aplicación</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Fuente Principal</Label>
                          <Select
                            value={formData.fontFamily}
                            onValueChange={(value) => handleInputChange('fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter, sans-serif">Inter (Moderno)</SelectItem>
                              <SelectItem value="'Roboto', sans-serif">Roboto (Neutral)</SelectItem>
                              <SelectItem value="'Poppins', sans-serif">Poppins (Geométrico)</SelectItem>
                              <SelectItem value="'Montserrat', sans-serif">Montserrat (Elegante)</SelectItem>
                              <SelectItem value="'Open Sans', sans-serif">Open Sans (Legible)</SelectItem>
                              <SelectItem value="system-ui, sans-serif">Sistema (Nativo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Fuente de Títulos (opcional)</Label>
                          <Input
                            value={formData.headingFont}
                            onChange={(e) => handleInputChange('headingFont', e.target.value)}
                            placeholder="Dejar vacío = usar fuente principal"
                          />
                        </div>
                      </div>

                      {/* Preview de tipografía */}
                      <div
                        className="p-4 bg-muted/30 rounded-lg"
                        style={{ fontFamily: formData.fontFamily }}
                      >
                        <h3
                          className="text-xl font-bold mb-2"
                          style={{ fontFamily: formData.headingFont || formData.fontFamily }}
                        >
                          Título de ejemplo
                        </h3>
                        <p>Este es un párrafo de ejemplo con la fuente seleccionada.</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        Aspecto Visual
                      </CardTitle>
                      <CardDescription>Configura el estilo de los componentes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>Radio de Bordes</Label>
                          <Select
                            value={formData.borderRadius}
                            onValueChange={(value) => handleInputChange('borderRadius', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Sin redondeo</SelectItem>
                              <SelectItem value="0.25rem">Pequeño</SelectItem>
                              <SelectItem value="0.5rem">Medio</SelectItem>
                              <SelectItem value="0.75rem">Grande</SelectItem>
                              <SelectItem value="1rem">Muy grande</SelectItem>
                              <SelectItem value="9999px">Completo (pill)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tema</Label>
                          <Select
                            value={formData.theme}
                            onValueChange={(value) => handleInputChange('theme', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Sun className="h-4 w-4" /> Claro
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon className="h-4 w-4" /> Oscuro
                                </div>
                              </SelectItem>
                              <SelectItem value="auto">
                                <div className="flex items-center gap-2">
                                  <Monitor className="h-4 w-4" /> Automático
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Posición del Sidebar</Label>
                          <Select
                            value={formData.sidebarPosition}
                            onValueChange={(value) => handleInputChange('sidebarPosition', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Izquierda</SelectItem>
                              <SelectItem value="right">Derecha</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Preview de componentes */}
                      <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                        <p className="text-sm font-medium">Vista previa de componentes</p>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            style={{
                              borderRadius: formData.borderRadius,
                              backgroundColor: formData.primaryColor,
                            }}
                            onClick={() => toast.info('Vista previa del botón principal')}
                          >
                            Botón Principal
                          </Button>
                          <Button
                            variant="outline"
                            style={{
                              borderRadius: formData.borderRadius,
                              borderColor: formData.primaryColor,
                              color: formData.primaryColor,
                            }}
                            onClick={() => toast.info('Vista previa del botón secundario')}
                          >
                            Botón Secundario
                          </Button>
                          <Badge style={{ borderRadius: formData.borderRadius }}>Badge</Badge>
                        </div>
                        <div
                          className="p-3 border"
                          style={{ borderRadius: formData.borderRadius }}
                        >
                          <p className="text-sm">Card con el radio de bordes seleccionado</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: Contacto y SEO */}
                <TabsContent value="contacto" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Información de Contacto
                      </CardTitle>
                      <CardDescription>
                        Estos datos aparecerán en el footer y páginas de contacto
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email de Contacto
                          </Label>
                          <Input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                            placeholder="contacto@empresa.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Teléfono
                          </Label>
                          <Input
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            placeholder="+34 XXX XXX XXX"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Sitio Web
                          </Label>
                          <Input
                            type="url"
                            value={formData.websiteUrl}
                            onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                            placeholder="https://www.empresa.com"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Texto del Footer</Label>
                          <Textarea
                            value={formData.footerText}
                            onChange={(e) => handleInputChange('footerText', e.target.value)}
                            placeholder="© 2024 Tu Empresa. Todos los derechos reservados."
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        SEO y Metadatos
                      </CardTitle>
                      <CardDescription>
                        Optimiza cómo aparece tu app en buscadores y redes sociales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Título (Meta Title)</Label>
                        <Input
                          value={formData.metaTitle}
                          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                          placeholder="Mi Empresa - Gestión Inmobiliaria"
                          maxLength={60}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Aparece en la pestaña del navegador y resultados de Google</span>
                          <span
                            className={formData.metaTitle.length > 60 ? 'text-red-500' : ''}
                          >
                            {formData.metaTitle.length}/60
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción (Meta Description)</Label>
                        <Textarea
                          value={formData.metaDescription}
                          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                          placeholder="Sistema integral de gestión inmobiliaria..."
                          rows={2}
                          maxLength={160}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Aparece en los resultados de búsqueda de Google</span>
                          <span
                            className={formData.metaDescription.length > 160 ? 'text-red-500' : ''}
                          >
                            {formData.metaDescription.length}/160
                          </span>
                        </div>
                      </div>

                      {/* Preview de Google */}
                      <div className="p-4 bg-white border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          Vista previa en Google:
                        </p>
                        <div className="space-y-1">
                          <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                            {formData.metaTitle || 'Título de tu página'}
                          </p>
                          <p className="text-green-700 text-sm">
                            {formData.websiteUrl || 'https://tuempresa.com'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {formData.metaDescription || 'Descripción de tu página...'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Panel de vista previa */}
            {showPreview && (
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Vista Previa en Vivo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Mock del sidebar */}
                      <div
                        className="border-t overflow-hidden"
                        style={{ backgroundColor: formData.backgroundColor }}
                      >
                        <div
                          className="p-3 flex items-center gap-2 border-b"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          {formData.logoSmallUrl ? (
                            <img
                              src={formData.logoSmallUrl}
                              alt="Logo"
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-6 w-6 rounded bg-white/20" />
                          )}
                          <span
                            className="font-semibold text-sm"
                            style={{
                              color: formData.secondaryColor,
                              fontFamily: formData.fontFamily,
                            }}
                          >
                            {formData.appName}
                          </span>
                        </div>

                        <div className="p-3 space-y-2" style={{ color: formData.textColor }}>
                          {['Dashboard', 'Propiedades', 'Inquilinos', 'Pagos'].map((item, i) => (
                            <div
                              key={item}
                              className={`p-2 rounded text-sm flex items-center gap-2 ${
                                i === 0 ? 'font-medium' : ''
                              }`}
                              style={{
                                backgroundColor: i === 0 ? formData.accentColor + '20' : 'transparent',
                                color: i === 0 ? formData.accentColor : formData.textColor,
                                borderRadius: formData.borderRadius,
                                fontFamily: formData.fontFamily,
                              }}
                            >
                              <div
                                className="h-4 w-4 rounded"
                                style={{
                                  backgroundColor: i === 0 ? formData.accentColor : formData.textColor + '30',
                                  borderRadius: formData.borderRadius,
                                }}
                              />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mock de contenido */}
                      <div className="p-3 border-t" style={{ backgroundColor: formData.backgroundColor }}>
                        <div
                          className="text-sm font-semibold mb-2"
                          style={{
                            color: formData.textColor,
                            fontFamily: formData.headingFont || formData.fontFamily,
                          }}
                        >
                          Contenido de ejemplo
                        </div>
                        <div className="space-y-2">
                          <div
                            className="p-2 border text-xs"
                            style={{
                              borderRadius: formData.borderRadius,
                              color: formData.textColor,
                              fontFamily: formData.fontFamily,
                            }}
                          >
                            Card con tu estilo
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1 text-xs text-white"
                              style={{
                                backgroundColor: formData.primaryColor,
                                borderRadius: formData.borderRadius,
                              }}
                            >
                              Primario
                            </button>
                            <button
                              className="px-3 py-1 text-xs border"
                              style={{
                                borderColor: formData.accentColor,
                                color: formData.accentColor,
                                borderRadius: formData.borderRadius,
                              }}
                            >
                              Secundario
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paleta de colores actual */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Paleta Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { color: formData.primaryColor, label: 'Pri' },
                          { color: formData.secondaryColor, label: 'Sec' },
                          { color: formData.accentColor, label: 'Acc' },
                          { color: formData.backgroundColor, label: 'Bg' },
                          { color: formData.textColor, label: 'Txt' },
                          { color: formData.successColor, label: 'Ok' },
                          { color: formData.warningColor, label: 'Warn' },
                          { color: formData.errorColor, label: 'Err' },
                        ].map((item) => (
                          <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                              <div className="text-center">
                                <div
                                  className="h-8 w-full rounded border cursor-pointer"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.color}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </AuthenticatedLayout>
  );
}

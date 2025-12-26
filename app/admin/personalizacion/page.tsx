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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Home,
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
} from 'lucide-react';
import { useBranding } from '@/lib/hooks/useBranding';
import logger, { logError } from '@/lib/logger';

interface BrandingFormData {
  // Identidad
  appName: string;
  appDescription: string;
  tagline: string;

  // Logos
  logoUrl: string;
  logoSmallUrl: string;
  faviconUrl: string;
  ogImageUrl: string;

  // Colores
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;

  // Tipografía
  fontFamily: string;
  headingFont: string;

  // UI
  borderRadius: string;
  sidebarPosition: string;
  theme: string;

  // Contacto
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;

  // SEO
  metaTitle: string;
  metaDescription: string;
}

export default function PersonalizacionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { fullConfig, refresh, isLoaded } = useBranding();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('identidad');

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

      const data = await response.json();

      toast.success('¡Personalización guardada!', {
        description: 'Los cambios se aplicarán inmediatamente en toda la aplicación.',
      });

      // Refrescar branding
      await refresh();

      // Recargar la página para aplicar cambios visuales
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      logger.error('Error saving branding:', error);
      toast.error('Error al guardar', {
        description: 'No se pudo guardar la configuración de personalización.',
      });
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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      {/* Breadcrumbs y Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/configuracion">Administración</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Personalización</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Palette className="h-8 w-8" />
                Personalización White Label
              </h1>
              <p className="text-muted-foreground mt-2">
                Configura la identidad visual de tu empresa. Los cambios se aplicarán
                inmediatamente.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Descartar
              </Button>

              <ButtonWithLoading
                onClick={handleSave}
                isLoading={saving}
                loadingText="Guardando..."
                icon={Save}
              >
                Guardar Cambios
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de Configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identidad" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Identidad
          </TabsTrigger>
          <TabsTrigger value="colores" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colores
          </TabsTrigger>
          <TabsTrigger value="tipografia" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Tipografía
          </TabsTrigger>
          <TabsTrigger value="ui" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Interfaz
          </TabsTrigger>
          <TabsTrigger value="contacto" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Info y SEO
          </TabsTrigger>
        </TabsList>

        {/* TAB: Identidad de Marca */}
        <TabsContent value="identidad" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identidad de Marca</CardTitle>
              <CardDescription>
                Configura el nombre, descripción y logos de tu aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nombre de la Aplicación *</Label>
                  <Input
                    id="appName"
                    value={formData.appName}
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                    placeholder="INMOVA"
                  />
                  <p className="text-sm text-muted-foreground">
                    Aparecerá en el sidebar y en el título de la pestaña
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    placeholder="Innovación Inmobiliaria"
                  />
                  <p className="text-sm text-muted-foreground">Frase corta que describe tu marca</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appDescription">Descripción</Label>
                <Textarea
                  id="appDescription"
                  value={formData.appDescription}
                  onChange={(e) => handleInputChange('appDescription', e.target.value)}
                  placeholder="Sistema integral de gestión inmobiliaria..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logos y Assets
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo Principal (URL)</Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      placeholder="https://lh7-us.googleusercontent.com/K28QUNXjQe3-tdMOeI352MC9N-QHmfrLN_En20-lD-Qkboi91y5I9RTKi1U1UpA9vU5Zk3LwtM1iabfor04kiv7s2URspkQMhP_IjfsmcCjnUxbSLbNkx3Nxoq1SZ6qHP_BYs_zCrYGcCRACQ7hDURU"
                    />
                    <p className="text-sm text-muted-foreground">Tamaño recomendado: 200x60px</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoSmallUrl">Logo Pequeño (URL)</Label>
                    <Input
                      id="logoSmallUrl"
                      value={formData.logoSmallUrl}
                      onChange={(e) => handleInputChange('logoSmallUrl', e.target.value)}
                      placeholder="https://www.shutterstock.com/shutterstock/photos/1321585844/display_1500/stock-vector-pixel-perfect-food-icons-with-x-px-export-ready-1321585844.jpg"
                    />
                    <p className="text-sm text-muted-foreground">Tamaño recomendado: 40x40px</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">Favicon (URL)</Label>
                    <Input
                      id="faviconUrl"
                      value={formData.faviconUrl}
                      onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
                      placeholder="https://upload.wikimedia.org/wikipedia/commons/2/22/Wikipedia_favicon_in_Firefox_on_KDE_%282023%29.png"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tamaño recomendado: 32x32px o 16x16px
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogImageUrl">Imagen Open Graph (URL)</Label>
                    <Input
                      id="ogImageUrl"
                      value={formData.ogImageUrl}
                      onChange={(e) => handleInputChange('ogImageUrl', e.target.value)}
                      placeholder="https://img-a.ryte.com/f/117064/c659b64f07/og-image-size-guide.png"
                    />
                    <p className="text-sm text-muted-foreground">Tamaño recomendado: 1200x630px</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Colores */}
        <TabsContent value="colores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paleta de Colores</CardTitle>
              <CardDescription>
                Personaliza los colores de tu aplicación. Los cambios se aplicarán en toda la
                interfaz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Colores Principales */}
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Color de Acento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      placeholder="#FFFFFF"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Colores de Estado */}
                <div className="space-y-2">
                  <Label htmlFor="successColor">Exitoso</Label>
                  <div className="flex gap-2">
                    <Input
                      id="successColor"
                      type="color"
                      value={formData.successColor}
                      onChange={(e) => handleInputChange('successColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.successColor}
                      onChange={(e) => handleInputChange('successColor', e.target.value)}
                      placeholder="#22c55e"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warningColor">Advertencia</Label>
                  <div className="flex gap-2">
                    <Input
                      id="warningColor"
                      type="color"
                      value={formData.warningColor}
                      onChange={(e) => handleInputChange('warningColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.warningColor}
                      onChange={(e) => handleInputChange('warningColor', e.target.value)}
                      placeholder="#f59e0b"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="errorColor">Error</Label>
                  <div className="flex gap-2">
                    <Input
                      id="errorColor"
                      type="color"
                      value={formData.errorColor}
                      onChange={(e) => handleInputChange('errorColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.errorColor}
                      onChange={(e) => handleInputChange('errorColor', e.target.value)}
                      placeholder="#ef4444"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      className="h-10 w-16 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview de Colores */}
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-3">Vista Previa</p>
                <div className="flex flex-wrap gap-3">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 mb-2"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <span className="text-xs">Primario</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 mb-2"
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <span className="text-xs">Secundario</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 mb-2"
                      style={{ backgroundColor: formData.accentColor }}
                    />
                    <span className="text-xs">Acento</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 mb-2"
                      style={{ backgroundColor: formData.successColor }}
                    />
                    <span className="text-xs">Exitoso</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 mb-2"
                      style={{ backgroundColor: formData.warningColor }}
                    />
                    <span className="text-xs">Advertencia</span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg border-2 mb-2"
                      style={{ backgroundColor: formData.errorColor }}
                    />
                    <span className="text-xs">Error</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tipografía */}
        <TabsContent value="tipografia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
              <CardDescription>Configura las fuentes utilizadas en la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Fuente Principal</Label>
                <Select
                  value={formData.fontFamily}
                  onValueChange={(value) => handleInputChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter (Por defecto)</SelectItem>
                    <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Poppins', sans-serif">Poppins</SelectItem>
                    <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                    <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                    <SelectItem value="system-ui, sans-serif">System UI</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Fuente usada en texto general</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headingFont">Fuente de Títulos (opcional)</Label>
                <Input
                  id="headingFont"
                  value={formData.headingFont}
                  onChange={(e) => handleInputChange('headingFont', e.target.value)}
                  placeholder="Dejar vacío para usar la fuente principal"
                />
                <p className="text-sm text-muted-foreground">
                  Fuente usada en encabezados y títulos. Ejemplo: 'Playfair Display', serif
                </p>
              </div>

              {/* Preview de Tipografía */}
              <div
                className="mt-6 p-6 border rounded-lg bg-muted/30"
                style={{ fontFamily: formData.fontFamily }}
              >
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: formData.headingFont || formData.fontFamily }}
                >
                  Título de Ejemplo
                </h3>
                <p className="text-base">
                  Este es un párrafo de ejemplo que muestra cómo se verá el texto con la fuente
                  seleccionada. La tipografía es fundamental para la identidad de tu marca.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Texto secundario y descripciones.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: UI */}
        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Interfaz</CardTitle>
              <CardDescription>Ajusta el aspecto visual de los componentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Radio de Bordes</Label>
                  <Select
                    value={formData.borderRadius}
                    onValueChange={(value) => handleInputChange('borderRadius', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin Redondeo (0)</SelectItem>
                      <SelectItem value="0.25rem">Pequeño (0.25rem)</SelectItem>
                      <SelectItem value="0.5rem">Medio (0.5rem)</SelectItem>
                      <SelectItem value="0.75rem">Grande (0.75rem)</SelectItem>
                      <SelectItem value="1rem">Muy Grande (1rem)</SelectItem>
                      <SelectItem value="9999px">Completo (pill)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) => handleInputChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sidebarPosition">Posición del Sidebar</Label>
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

              {/* Preview de Componentes */}
              <div className="mt-6 p-6 border rounded-lg bg-muted/30 space-y-4">
                <p className="text-sm font-medium mb-3">Vista Previa de Componentes</p>

                <div className="flex flex-wrap gap-3">
                  <Button style={{ borderRadius: formData.borderRadius }}>Botón Primario</Button>
                  <Button variant="outline" style={{ borderRadius: formData.borderRadius }}>
                    Botón Secundario
                  </Button>
                  <Badge style={{ borderRadius: formData.borderRadius }}>Badge</Badge>
                </div>

                <div className="p-4 border" style={{ borderRadius: formData.borderRadius }}>
                  <p className="text-sm">Card de ejemplo con el radio de bordes seleccionado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Contacto y SEO */}
        <TabsContent value="contacto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Datos de contacto que aparecerán en el footer y otras secciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+34 XXX XXX XXX"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="websiteUrl">Sitio Web</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    placeholder="https://www.empresa.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="footerText">Texto del Footer</Label>
                  <Textarea
                    id="footerText"
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
              <CardTitle>SEO y Metadatos</CardTitle>
              <CardDescription>
                Configura cómo aparecerá tu aplicación en buscadores y redes sociales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Título (Meta Title)</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="INMOVA - Gestión Inmobiliaria"
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.metaTitle.length}/60 caracteres (recomendado)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Descripción (Meta Description)</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Sistema integral de gestión inmobiliaria con funciones avanzadas..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.metaDescription.length}/160 caracteres (recomendado)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
}

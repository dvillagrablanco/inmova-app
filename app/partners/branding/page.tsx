'use client';

/**
 * Página de Configuración de Branding del Partner
 *
 * Permite al partner personalizar su identidad visual:
 * - Logo y colores
 * - Tipografía
 * - Redes sociales
 * - Contacto
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Palette,
  Image as ImageIcon,
  Type,
  Globe,
  Phone,
  Mail,
  Save,
  Eye,
  RefreshCw,
  Link2,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface BrandingConfig {
  logoUrl: string | null;
  logoUrlDark: string | null;
  faviconUrl: string | null;
  bannerUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  colorAccento: string;
  colorFondo: string;
  colorTexto: string;
  fuentePrincipal: string;
  fuenteSecundaria: string;
  botonEstilo: 'rounded' | 'square' | 'pill';
  botonAnimacion: boolean;
  urlLinkedin: string | null;
  urlTwitter: string | null;
  urlInstagram: string | null;
  urlFacebook: string | null;
  urlWebsite: string | null;
  emailContacto: string | null;
  telefonoContacto: string | null;
  direccion: string | null;
  textoFooter: string | null;
  cssPersonalizado: string | null;
}

const FUENTES = [
  { value: 'Inter', label: 'Inter (Moderna)' },
  { value: 'Roboto', label: 'Roboto (Profesional)' },
  { value: 'Open Sans', label: 'Open Sans (Legible)' },
  { value: 'Lato', label: 'Lato (Elegante)' },
  { value: 'Montserrat', label: 'Montserrat (Impactante)' },
  { value: 'Poppins', label: 'Poppins (Moderna)' },
  { value: 'Playfair Display', label: 'Playfair Display (Clásica)' },
];

const BUTTON_STYLES = [
  { value: 'rounded', label: 'Redondeado (Moderno)' },
  { value: 'square', label: 'Cuadrado (Profesional)' },
  { value: 'pill', label: 'Píldora (Amigable)' },
];

const defaultBranding: BrandingConfig = {
  logoUrl: null,
  logoUrlDark: null,
  faviconUrl: null,
  bannerUrl: null,
  colorPrimario: '#2563eb',
  colorSecundario: '#7c3aed',
  colorAccento: '#f59e0b',
  colorFondo: '#ffffff',
  colorTexto: '#1f2937',
  fuentePrincipal: 'Inter',
  fuenteSecundaria: 'Inter',
  botonEstilo: 'rounded',
  botonAnimacion: true,
  urlLinkedin: null,
  urlTwitter: null,
  urlInstagram: null,
  urlFacebook: null,
  urlWebsite: null,
  emailContacto: null,
  telefonoContacto: null,
  direccion: null,
  textoFooter: null,
  cssPersonalizado: null,
};

export default function PartnerBrandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ slug: string | null; nombre: string } | null>(
    null
  );
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/partners/branding');
      if (response.ok) {
        const data = await response.json();
        setPartnerInfo({ slug: data.slug, nombre: data.partnerNombre });
        if (data.branding) {
          setBranding({ ...defaultBranding, ...data.branding });
        }
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/partners/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });

      if (response.ok) {
        toast.success('Branding guardado correctamente');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const copyLandingUrl = () => {
    if (partnerInfo?.slug) {
      const url = `${window.location.origin}/p/${partnerInfo.slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('URL copiada al portapapeles');
    }
  };

  const previewLanding = () => {
    if (partnerInfo?.slug) {
      window.open(`/p/${partnerInfo.slug}`, '_blank');
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Personalización de Marca</h1>
            <p className="text-gray-600">
              Configura la identidad visual de tu landing y materiales
            </p>
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

        {/* Landing URL */}
        {partnerInfo?.slug && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Tu Landing Personalizada</p>
                    <p className="text-sm text-muted-foreground">
                      {window.location.origin}/p/{partnerInfo.slug}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyLandingUrl}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copiado' : 'Copiar URL'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={previewLanding}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!partnerInfo?.slug && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">
                <strong>Nota:</strong> Tu landing personalizada estará disponible una vez que el
                equipo de Inmova configure tu slug único. Contacta a soporte para más información.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs de configuración */}
        <Tabs defaultValue="identidad" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="identidad">Identidad</TabsTrigger>
            <TabsTrigger value="colores">Colores</TabsTrigger>
            <TabsTrigger value="redes">Redes</TabsTrigger>
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
          </TabsList>

          {/* Tab: Identidad Visual */}
          <TabsContent value="identidad">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Identidad Visual
                </CardTitle>
                <CardDescription>Logo, imágenes y tipografía de tu marca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL del Logo (claro)</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://ejemplo.com/logo.png"
                      value={branding.logoUrl || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, logoUrl: e.target.value || null })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato recomendado: PNG o SVG, fondo transparente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrlDark">URL del Logo (oscuro)</Label>
                    <Input
                      id="logoUrlDark"
                      placeholder="https://ejemplo.com/logo-dark.png"
                      value={branding.logoUrlDark || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, logoUrlDark: e.target.value || null })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Para usar en fondos oscuros (footer)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl">URL del Favicon</Label>
                    <Input
                      id="faviconUrl"
                      placeholder="https://ejemplo.com/favicon.ico"
                      value={branding.faviconUrl || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, faviconUrl: e.target.value || null })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bannerUrl">URL del Banner Hero</Label>
                    <Input
                      id="bannerUrl"
                      placeholder="https://ejemplo.com/banner.jpg"
                      value={branding.bannerUrl || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, bannerUrl: e.target.value || null })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Imagen de fondo para la sección hero (1920x1080 recomendado)
                    </p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Tipografía
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Fuente Principal</Label>
                      <Select
                        value={branding.fuentePrincipal}
                        onValueChange={(value) =>
                          setBranding({ ...branding, fuentePrincipal: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FUENTES.map((fuente) => (
                            <SelectItem key={fuente.value} value={fuente.value}>
                              {fuente.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Fuente Secundaria</Label>
                      <Select
                        value={branding.fuenteSecundaria}
                        onValueChange={(value) =>
                          setBranding({ ...branding, fuenteSecundaria: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FUENTES.map((fuente) => (
                            <SelectItem key={fuente.value} value={fuente.value}>
                              {fuente.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-4">Estilo de Botones</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Forma de botones</Label>
                      <Select
                        value={branding.botonEstilo}
                        onValueChange={(value: 'rounded' | 'square' | 'pill') =>
                          setBranding({ ...branding, botonEstilo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUTTON_STYLES.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Animación en hover</Label>
                        <p className="text-xs text-muted-foreground">
                          Efecto visual al pasar el ratón
                        </p>
                      </div>
                      <Switch
                        checked={branding.botonAnimacion}
                        onCheckedChange={(checked) =>
                          setBranding({ ...branding, botonAnimacion: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Preview de botones */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-3">Vista previa:</p>
                    <div className="flex gap-4">
                      <Button
                        style={{
                          backgroundColor: branding.colorPrimario,
                          borderRadius:
                            branding.botonEstilo === 'pill'
                              ? '9999px'
                              : branding.botonEstilo === 'square'
                                ? '4px'
                                : '8px',
                        }}
                        className={
                          branding.botonAnimacion ? 'transition-transform hover:scale-105' : ''
                        }
                      >
                        Botón Primario
                      </Button>
                      <Button
                        variant="outline"
                        style={{
                          borderColor: branding.colorPrimario,
                          color: branding.colorPrimario,
                          borderRadius:
                            branding.botonEstilo === 'pill'
                              ? '9999px'
                              : branding.botonEstilo === 'square'
                                ? '4px'
                                : '8px',
                        }}
                        className={
                          branding.botonAnimacion ? 'transition-transform hover:scale-105' : ''
                        }
                      >
                        Botón Secundario
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Colores */}
          <TabsContent value="colores">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Paleta de Colores
                </CardTitle>
                <CardDescription>Personaliza los colores de tu marca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="colorPrimario">Color Primario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="colorPrimario"
                        type="color"
                        value={branding.colorPrimario}
                        onChange={(e) =>
                          setBranding({ ...branding, colorPrimario: e.target.value })
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.colorPrimario}
                        onChange={(e) =>
                          setBranding({ ...branding, colorPrimario: e.target.value })
                        }
                        className="flex-1 font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Botones, enlaces, acentos</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorSecundario">Color Secundario</Label>
                    <div className="flex gap-2">
                      <Input
                        id="colorSecundario"
                        type="color"
                        value={branding.colorSecundario}
                        onChange={(e) =>
                          setBranding({ ...branding, colorSecundario: e.target.value })
                        }
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.colorSecundario}
                        onChange={(e) =>
                          setBranding({ ...branding, colorSecundario: e.target.value })
                        }
                        className="flex-1 font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Gradientes, destacados</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorAccento">Color de Acento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="colorAccento"
                        type="color"
                        value={branding.colorAccento}
                        onChange={(e) => setBranding({ ...branding, colorAccento: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.colorAccento}
                        onChange={(e) => setBranding({ ...branding, colorAccento: e.target.value })}
                        className="flex-1 font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Badges, alertas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorFondo">Color de Fondo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="colorFondo"
                        type="color"
                        value={branding.colorFondo}
                        onChange={(e) => setBranding({ ...branding, colorFondo: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.colorFondo}
                        onChange={(e) => setBranding({ ...branding, colorFondo: e.target.value })}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorTexto">Color de Texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="colorTexto"
                        type="color"
                        value={branding.colorTexto}
                        onChange={(e) => setBranding({ ...branding, colorTexto: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={branding.colorTexto}
                        onChange={(e) => setBranding({ ...branding, colorTexto: e.target.value })}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview de colores */}
                <div className="border-t pt-6">
                  <p className="text-sm text-muted-foreground mb-3">Vista previa de la paleta:</p>
                  <div className="flex gap-2">
                    {[
                      { color: branding.colorPrimario, label: 'Primario' },
                      { color: branding.colorSecundario, label: 'Secundario' },
                      { color: branding.colorAccento, label: 'Acento' },
                      { color: branding.colorFondo, label: 'Fondo' },
                      { color: branding.colorTexto, label: 'Texto' },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <p className="text-xs mt-1">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Redes Sociales */}
          <TabsContent value="redes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Redes Sociales
                </CardTitle>
                <CardDescription>Enlaces a tus perfiles en redes sociales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="urlWebsite">Sitio Web</Label>
                    <Input
                      id="urlWebsite"
                      placeholder="https://www.tuempresa.com"
                      value={branding.urlWebsite || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, urlWebsite: e.target.value || null })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urlLinkedin">LinkedIn</Label>
                    <Input
                      id="urlLinkedin"
                      placeholder="https://linkedin.com/company/..."
                      value={branding.urlLinkedin || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, urlLinkedin: e.target.value || null })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urlTwitter">Twitter / X</Label>
                    <Input
                      id="urlTwitter"
                      placeholder="https://twitter.com/..."
                      value={branding.urlTwitter || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, urlTwitter: e.target.value || null })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urlInstagram">Instagram</Label>
                    <Input
                      id="urlInstagram"
                      placeholder="https://instagram.com/..."
                      value={branding.urlInstagram || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, urlInstagram: e.target.value || null })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urlFacebook">Facebook</Label>
                    <Input
                      id="urlFacebook"
                      placeholder="https://facebook.com/..."
                      value={branding.urlFacebook || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, urlFacebook: e.target.value || null })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Contacto */}
          <TabsContent value="contacto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription>Datos de contacto que aparecerán en tu landing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailContacto">Email de Contacto</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="emailContacto"
                        type="email"
                        placeholder="contacto@tuempresa.com"
                        value={branding.emailContacto || ''}
                        onChange={(e) =>
                          setBranding({ ...branding, emailContacto: e.target.value || null })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefonoContacto">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="telefonoContacto"
                        type="tel"
                        placeholder="+34 900 123 456"
                        value={branding.telefonoContacto || ''}
                        onChange={(e) =>
                          setBranding({ ...branding, telefonoContacto: e.target.value || null })
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      placeholder="Calle Ejemplo 123, 28001 Madrid"
                      value={branding.direccion || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, direccion: e.target.value || null })
                      }
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="textoFooter">Texto del Footer</Label>
                    <Textarea
                      id="textoFooter"
                      placeholder="Breve descripción de tu empresa para el footer..."
                      value={branding.textoFooter || ''}
                      onChange={(e) =>
                        setBranding({ ...branding, textoFooter: e.target.value || null })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CSS Personalizado (Avanzado) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Personalización Avanzada
              <Badge variant="secondary">Opcional</Badge>
            </CardTitle>
            <CardDescription>CSS personalizado para ajustes específicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="cssPersonalizado">CSS Personalizado</Label>
              <Textarea
                id="cssPersonalizado"
                placeholder={`.partner-hero {\n  /* Tus estilos personalizados */\n}`}
                value={branding.cssPersonalizado || ''}
                onChange={(e) =>
                  setBranding({ ...branding, cssPersonalizado: e.target.value || null })
                }
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Solo para usuarios avanzados. Usa con precaución.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

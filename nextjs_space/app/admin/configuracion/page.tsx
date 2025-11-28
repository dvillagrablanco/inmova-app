'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Building2 } from 'lucide-react';

interface CompanyConfig {
  id: string;
  nombre: string;
  cif: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logoUrl: string | null;
  codigoPostal: string | null;
  ciudad: string | null;
  pais: string;
  iban: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
  pieDocumento: string | null;
}

export default function ConfiguracionPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<CompanyConfig>({
    id: '',
    nombre: 'INMOVA',
    cif: '',
    direccion: '',
    telefono: '',
    email: '',
    logoUrl: '',
    codigoPostal: '',
    ciudad: '',
    pais: 'España',
    iban: '',
    colorPrimario: '#000000',
    colorSecundario: '#FFFFFF',
    pieDocumento: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchConfig();
    }
  }, [status, router]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanyConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Configuración de Empresa
          </h1>
          <p className="text-muted-foreground mt-2">
            Personaliza la información de tu empresa para documentos y recibos
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos generales de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Empresa *</Label>
              <Input
                id="nombre"
                value={config.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="INMOVA"
              />
            </div>
            <div>
              <Label htmlFor="cif">CIF/NIF</Label>
              <Input
                id="cif"
                value={config.cif || ''}
                onChange={(e) => handleChange('cif', e.target.value)}
                placeholder="B12345678"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={config.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="info@inmova.com"
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={config.telefono || ''}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="+34 900 123 456"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dirección */}
        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
            <CardDescription>Ubicación de la empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="direccion">Dirección Completa</Label>
              <Input
                id="direccion"
                value={config.direccion || ''}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Calle Mayor 123"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  value={config.codigoPostal || ''}
                  onChange={(e) => handleChange('codigoPostal', e.target.value)}
                  placeholder="28001"
                />
              </div>
              <div>
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={config.ciudad || ''}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  placeholder="Madrid"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={config.pais}
                onChange={(e) => handleChange('pais', e.target.value)}
                placeholder="España"
              />
            </div>
          </CardContent>
        </Card>

        {/* Información Bancaria */}
        <Card>
          <CardHeader>
            <CardTitle>Información Bancaria</CardTitle>
            <CardDescription>Datos para recibos y pagos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={config.iban || ''}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Personalización */}
        <Card>
          <CardHeader>
            <CardTitle>Personalización Visual</CardTitle>
            <CardDescription>Colores de marca para documentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="colorPrimario">Color Primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorPrimario"
                    type="color"
                    value={config.colorPrimario || '#000000'}
                    onChange={(e) => handleChange('colorPrimario', e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={config.colorPrimario || '#000000'}
                    onChange={(e) => handleChange('colorPrimario', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="colorSecundario">Color Secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="colorSecundario"
                    type="color"
                    value={config.colorSecundario || '#FFFFFF'}
                    onChange={(e) => handleChange('colorSecundario', e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={config.colorSecundario || '#FFFFFF'}
                    onChange={(e) => handleChange('colorSecundario', e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie de Documento */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pie de Documentos</CardTitle>
            <CardDescription>
              Texto que aparecerá al final de recibos y contratos (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.pieDocumento || ''}
              onChange={(e) => handleChange('pieDocumento', e.target.value)}
              placeholder="Ejemplo: Este documento es generado automáticamente por el sistema de gestión INMOVA. Para cualquier consulta, contacte con nosotros."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
}

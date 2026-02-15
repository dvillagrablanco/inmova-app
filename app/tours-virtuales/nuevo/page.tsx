'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { ArrowLeft, Camera, Video, Sparkles, Maximize, Upload, Link as LinkIcon } from 'lucide-react';

const tourTypes = [
  { value: '360', label: 'Tour 360°', icon: Camera, description: 'Fotos panorámicas interactivas' },
  { value: 'video', label: 'Video Tour', icon: Video, description: 'Recorrido en video' },
  { value: 'ar', label: 'Realidad Aumentada', icon: Sparkles, description: 'Experiencia AR' },
  { value: 'vr', label: 'VR Inmersivo', icon: Maximize, description: 'Realidad virtual completa' },
];

export default function NuevoTourPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: '360',
    unitId: '',
    buildingId: '',
    urlPrincipal: '',
    urlThumbnail: '',
    plataforma: 'matterport',
    publico: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Cargar edificios
      const buildingsRes = await fetch('/api/buildings');
      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(data);
      }

      // Cargar unidades
      const unitsRes = await fetch('/api/units');
      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.titulo || !form.urlPrincipal) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/virtual-tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Tour virtual creado exitosamente');
        router.push('/tours-virtuales');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el tour');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el tour virtual');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Camera className="h-8 w-8 text-purple-600" />
              Crear Tour Virtual
            </h1>
            <p className="text-muted-foreground mt-1">
              Añade un tour virtual a una de tus propiedades
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Tour */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Tour</CardTitle>
              <CardDescription>Selecciona el tipo de experiencia virtual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tourTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, tipo: type.value })}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        form.tipo === type.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm font-medium">{type.label}</span>
                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Información del Tour */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Tour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del Tour *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="ej: Tour Virtual Apartamento Centro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describe las características destacadas del tour..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingId">Edificio</Label>
                  <Select
                    value={form.buildingId}
                    onValueChange={(v) => setForm({ ...form, buildingId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitId">Unidad/Propiedad</Label>
                  <Select
                    value={form.unitId}
                    onValueChange={(v) => setForm({ ...form, unitId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguna</SelectItem>
                      {properties.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.numero} - {unit.tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URLs del Tour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Enlaces del Tour
              </CardTitle>
              <CardDescription>
                Introduce la URL del tour creado en tu plataforma (Matterport, Kuula, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urlPrincipal">URL del Tour *</Label>
                <Input
                  id="urlPrincipal"
                  type="url"
                  value={form.urlPrincipal}
                  onChange={(e) => setForm({ ...form, urlPrincipal: e.target.value })}
                  placeholder="https://my.matterport.com/show/?m=..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlThumbnail">URL de Imagen de Portada</Label>
                <Input
                  id="urlThumbnail"
                  type="url"
                  value={form.urlThumbnail}
                  onChange={(e) => setForm({ ...form, urlThumbnail: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plataforma">Plataforma</Label>
                <Select
                  value={form.plataforma}
                  onValueChange={(v) => setForm({ ...form, plataforma: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matterport">Matterport</SelectItem>
                    <SelectItem value="kuula">Kuula</SelectItem>
                    <SelectItem value="youtube">YouTube 360</SelectItem>
                    <SelectItem value="cloudpano">CloudPano</SelectItem>
                    <SelectItem value="ricoh">Ricoh Tours</SelectItem>
                    <SelectItem value="other">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Crear Tour
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}

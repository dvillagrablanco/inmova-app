'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Plus,
  Eye,
  Upload,
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Unit {
  id: string;
  numero: string;
  building: { nombre: string };
}

interface GalleryItem {
  id: string;
  tipo: string;
  habitacion: string;
  url: string;
  titulo?: string;
  orden: number;
}

interface Gallery {
  id: string;
  unitId: string;
  portada?: string;
  urlTourVirtual?: string;
  embedCode?: string;
  visitas: number;
  unit: {
    numero: string;
    building: { nombre: string };
  };
  items: GalleryItem[];
}

export default function GaleriasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate } = usePermissions();

  const [galerias, setGalerias] = useState<Gallery[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    unitId: '',
    urlTourVirtual: '',
    embedCode: '',
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
      const [galeriasRes, unitsRes] = await Promise.all([
        fetch('/api/galerias'),
        fetch('/api/units'),
      ]);

      const [galeriasData, unitsData] = await Promise.all([
        galeriasRes.json(),
        unitsRes.json(),
      ]);

      setGalerias(Array.isArray(galeriasData) ? galeriasData : []);
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
      setGalerias([]);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/galerias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al crear galería');

      toast.success('Galería creada exitosamente');
      setOpenDialog(false);
      fetchData();
      setFormData({
        unitId: '',
        urlTourVirtual: '',
        embedCode: '',
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear galería');
    }
  };

  // KPIs
  const totalGalerias = galerias.length;
  const totalFotos = galerias.reduce((sum, g) => sum + g.items.filter(i => i.tipo === 'foto').length, 0);
  const totalVideos = galerias.reduce((sum, g) => sum + g.items.filter(i => i.tipo === 'video').length, 0);
  const totalVisitas = galerias.reduce((sum, g) => sum + g.visitas, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="w-4 h-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Galerías Multimedia</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Galerías Multimedia</h1>
              <p className="text-gray-600">Fotos, videos y tours virtuales de propiedades</p>
            </div>
            {canCreate && (
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary hover:opacity-90 shadow-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Galería
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva Galería</DialogTitle>
                    <DialogDescription>
                      Crea una galería multimedia para una unidad
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Unidad *</Label>
                      <Select
                        value={formData.unitId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, unitId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.building.nombre} - Unidad {u.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>URL Tour Virtual</Label>
                      <Input
                        value={formData.urlTourVirtual}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, urlTourVirtual: e.target.value }))
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Código Embed (Tour 360°)</Label>
                      <Textarea
                        value={formData.embedCode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, embedCode: e.target.value }))
                        }
                        rows={3}
                        placeholder='<iframe src="..." ...></iframe>'
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!formData.unitId}
                      className="gradient-primary hover:opacity-90 shadow-primary"
                    >
                      Crear Galería
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Galerías</CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGalerias}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fotos</CardTitle>
                <ImageIcon className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFotos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                <Video className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVideos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas</CardTitle>
                <Eye className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVisitas}</div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Galerías */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galerias.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No hay galerías creadas</p>
                  {canCreate && (
                    <Button onClick={() => setOpenDialog(true)} className="gradient-primary hover:opacity-90 shadow-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Galería
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              galerias.map((galeria) => (
                <Card key={galeria.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {galeria.unit.building.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">Unidad {galeria.unit.numero}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fotos:</span>
                        <Badge variant="outline">
                          {galeria.items.filter((i) => i.tipo === 'foto').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Videos:</span>
                        <Badge variant="outline">
                          {galeria.items.filter((i) => i.tipo === 'video').length}
                        </Badge>
                      </div>
                      {galeria.urlTourVirtual && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Tour Virtual:</span>
                          <Badge variant="secondary">Sí</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Visitas:</span>
                        <Badge>{galeria.visitas}</Badge>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Agregar Contenido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
           </div>
        </main>
      </div>
    </div>
  );
}

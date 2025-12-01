'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, ArrowLeft, Eye, MessageSquare, Star, TrendingUp, Share2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function PublicacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAnunciosDialog, setOpenAnunciosDialog] = useState(false);
  const [anunciosGenerados, setAnunciosGenerados] = useState<any[]>([]);
  const [generando, setGenerando] = useState(false);
  const [formData, setFormData] = useState({
    unitId: '',
    precioAlquiler: '',
    destacada: false,
    urgente: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [pubRes, unitsRes] = await Promise.all([
        fetch('/api/publicaciones'),
        fetch('/api/units')
      ]);
      const pubData = await pubRes.json();
      const unitsData = await unitsRes.json();
      setPublicaciones(pubData);
      setUnits(unitsData.filter((u: any) => u.estado === 'disponible'));
      setLoading(false);
    } catch (error) {
      toast.error('Error al cargar datos');
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    if (!formData.unitId) {
      toast.error('Selecciona una unidad');
      return;
    }

    setGenerando(true);
    try {
      const response = await fetch('/api/publicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al generar publicación');

      const data = await response.json();
      setAnunciosGenerados(data.anuncios);
      setOpenAnunciosDialog(true);
      toast.success('Anuncios generados exitosamente');
      setOpenDialog(false);
      fetchData();
      setFormData({ unitId: '', precioAlquiler: '', destacada: false, urgente: false });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGenerando(false);
    }
  };

  const handleActivar = async (id: string) => {
    try {
      await fetch('/api/publicaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: 'activa', simularStats: true })
      });
      toast.success('Publicación activada');
      fetchData();
    } catch (error) {
      toast.error('Error al activar publicación');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Publicaciones</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Gestor de Publicaciones</h1>
                  <p className="text-muted-foreground">Anuncios multi-plataforma optimizados</p>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button><Share2 className="h-4 w-4 mr-2" />Nueva Publicación</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generar Anuncios</DialogTitle>
                      <DialogDescription>Crea anuncios optimizados para múltiples portales</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Unidad</Label>
                        <Select value={formData.unitId} onValueChange={(value) => {
                          setFormData({ ...formData, unitId: value });
                          const unit = units.find((u: any) => u.id === value);
                          if (unit) setFormData(prev => ({ ...prev, precioAlquiler: unit.rentaMensual?.toString() || '' }));
                        }}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            {units.map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.building?.nombre} - {u.numero}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Precio Alquiler (€/mes)</Label>
                        <Input type="number" value={formData.precioAlquiler} onChange={(e) => setFormData({ ...formData, precioAlquiler: e.target.value })} />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.destacada} onChange={(e) => setFormData({ ...formData, destacada: e.target.checked })} />
                          Destacada
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.urgente} onChange={(e) => setFormData({ ...formData, urgente: e.target.checked })} />
                          Urgente
                        </label>
                      </div>
                      <Button onClick={handleGenerar} disabled={generando} className="w-full">
                        {generando ? 'Generando...' : 'Generar Anuncios'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: 'Total', value: publicaciones.length, icon: FileText },
                { title: 'Activas', value: publicaciones.filter(p => p.estado === 'activa').length, icon: TrendingUp },
                { title: 'Vistas Totales', value: publicaciones.reduce((sum, p) => sum + (p.vistas || 0), 0), icon: Eye },
                { title: 'Contactos', value: publicaciones.reduce((sum, p) => sum + (p.contactos || 0), 0), icon: MessageSquare }
              ].map((kpi, idx) => (
                <Card key={idx}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Publicaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publicaciones.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay publicaciones</p>
                  ) : (
                    publicaciones.map((pub) => (
                      <Card key={pub.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{pub.titulo}</h3>
                              <Badge variant={pub.estado === 'activa' ? 'default' : 'secondary'}>{pub.estado}</Badge>
                              {pub.destacada && <Badge variant="outline">Destacada</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{pub.descripcionCorta}</p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span><Eye className="inline h-3 w-3 mr-1" />{pub.vistas}</span>
                              <span><MessageSquare className="inline h-3 w-3 mr-1" />{pub.contactos}</span>
                              <span><Star className="inline h-3 w-3 mr-1" />{pub.favoritos}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="text-right">
                              <p className="font-bold">{pub.precioAlquiler ? `${pub.precioAlquiler}€/mes` : 'N/A'}</p>
                            </div>
                            {pub.estado === 'borrador' && (
                              <Button size="sm" onClick={() => handleActivar(pub.id)}>Activar</Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={openAnunciosDialog} onOpenChange={setOpenAnunciosDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anuncios Generados</DialogTitle>
            <DialogDescription>Copia el contenido y pégalo en cada portal</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {anunciosGenerados.map((anuncio, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="capitalize">{anuncio.portal}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <p className="text-sm p-2 bg-muted rounded">{anuncio.titulo}</p>
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <p className="text-sm p-2 bg-muted rounded whitespace-pre-wrap">{anuncio.descripcion}</p>
                  </div>
                  <div>
                    <Label>Características</Label>
                    <div className="flex flex-wrap gap-1">
                      {anuncio.caracteristicas.map((c: string, i: number) => (
                        <Badge key={i} variant="secondary">{c}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(`${anuncio.titulo}\n\n${anuncio.descripcion}`);
                    toast.success('Copiado al portapapeles');
                  }}>
                    <Download className="h-4 w-4 mr-2" />Copiar Texto
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

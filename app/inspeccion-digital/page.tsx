'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, ClipboardCheck, Camera, Calendar, User, Building2, CheckCircle2, XCircle, Clock, Plus, Eye, Download, AlertTriangle, Search, Image } from 'lucide-react';
import { toast } from 'sonner';

interface Inspeccion {
  id: string;
  propiedad: string;
  unidad: string;
  tipo: 'entrada' | 'salida' | 'periodica';
  fecha: string;
  inspector: string;
  estado: 'programada' | 'en_proceso' | 'completada';
  puntuacion?: number;
  fotos?: number;
  incidencias?: number;
}

export default function InspeccionDigitalPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([
    { id: 'i1', propiedad: 'Edificio Centro', unidad: '3A', tipo: 'salida', fecha: '2025-01-20', inspector: 'Carlos García', estado: 'completada', puntuacion: 85, fotos: 24, incidencias: 3 },
    { id: 'i2', propiedad: 'Residencial Playa', unidad: '2B', tipo: 'entrada', fecha: '2025-01-25', inspector: 'María López', estado: 'programada' },
    { id: 'i3', propiedad: 'Apartamentos Norte', unidad: '1C', tipo: 'periodica', fecha: '2025-01-22', inspector: 'Juan Martínez', estado: 'en_proceso', fotos: 12 },
    { id: 'i4', propiedad: 'Piso Centro', unidad: '4D', tipo: 'salida', fecha: '2025-01-18', inspector: 'Ana Ruiz', estado: 'completada', puntuacion: 92, fotos: 18, incidencias: 1 },
  ]);

  useEffect(() => {
    if (status === 'authenticated') setLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const filteredInspecciones = inspecciones.filter(i => {
    const matchesSearch = i.propiedad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'all' || i.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const stats = {
    total: inspecciones.length,
    programadas: inspecciones.filter(i => i.estado === 'programada').length,
    completadas: inspecciones.filter(i => i.estado === 'completada').length,
    puntuacionMedia: Math.round(inspecciones.filter(i => i.puntuacion).reduce((sum, i) => sum + (i.puntuacion || 0), 0) / (inspecciones.filter(i => i.puntuacion).length || 1)),
  };

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, { className: string; label: string }> = {
      entrada: { className: 'bg-green-500', label: 'Entrada' },
      salida: { className: 'bg-orange-500', label: 'Salida' },
      periodica: { className: 'bg-blue-500', label: 'Periódica' },
    };
    const { className, label } = config[tipo] || config.periodica;
    return <Badge className={className}>{label}</Badge>;
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { className: string; label: string; icon: any }> = {
      programada: { className: 'bg-gray-100 text-gray-800', label: 'Programada', icon: Calendar },
      en_proceso: { className: 'bg-blue-100 text-blue-800', label: 'En Proceso', icon: Clock },
      completada: { className: 'bg-green-100 text-green-800', label: 'Completada', icon: CheckCircle2 },
    };
    const { className, label, icon: Icon } = config[estado] || config.programada;
    return <Badge variant="outline" className={className}><Icon className="h-3 w-3 mr-1" />{label}</Badge>;
  };

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Inspección Digital</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl"><ClipboardCheck className="h-8 w-8 text-emerald-600" /></div>
            <div><h1 className="text-2xl sm:text-3xl font-bold">Inspección Digital</h1><p className="text-muted-foreground">Inspecciones con fotos y checklist</p></div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}><Plus className="h-4 w-4 mr-2" />Nueva Inspección</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Programadas</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-600">{stats.programadas}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{stats.completadas}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Puntuación Media</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.puntuacionMedia}/100</div></CardContent></Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10" placeholder="Buscar propiedad..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="salida">Salida</SelectItem><SelectItem value="periodica">Periódica</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-4">
          {filteredInspecciones.map((insp) => (
            <Card key={insp.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">{insp.propiedad} - {insp.unidad}{getTipoBadge(insp.tipo)}{getEstadoBadge(insp.estado)}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1"><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(insp.fecha).toLocaleDateString('es-ES')}</span><span className="flex items-center gap-1"><User className="h-3 w-3" />{insp.inspector}</span></CardDescription>
                  </div>
                  {insp.puntuacion && (
                    <div className="text-center"><div className={`text-3xl font-bold ${insp.puntuacion >= 80 ? 'text-green-600' : insp.puntuacion >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{insp.puntuacion}</div><p className="text-xs text-muted-foreground">Puntuación</p></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {insp.fotos && <span className="flex items-center gap-1"><Image className="h-4 w-4" />{insp.fotos} fotos</span>}
                    {insp.incidencias !== undefined && <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-orange-500" />{insp.incidencias} incidencias</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />Ver</Button>
                    {insp.estado === 'completada' && <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />PDF</Button>}
                    {insp.estado === 'programada' && <Button size="sm"><Camera className="h-4 w-4 mr-1" />Iniciar</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Inspección</DialogTitle><DialogDescription>Programa una inspección digital</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><label className="text-sm font-medium">Propiedad *</label><Select><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent><SelectItem value="p1">Edificio Centro</SelectItem><SelectItem value="p2">Residencial Playa</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium">Tipo *</label><Select><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="salida">Salida</SelectItem><SelectItem value="periodica">Periódica</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><label className="text-sm font-medium">Fecha *</label><input type="date" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button><Button onClick={() => { toast.success('Inspección programada'); setShowNewDialog(false); }}>Programar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

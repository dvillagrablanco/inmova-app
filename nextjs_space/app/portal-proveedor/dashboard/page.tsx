'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Briefcase, Clock, CheckCircle, TrendingUp, Euro, Star, LogOut, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
  proveedor: { id: string; nombre: string; tipo: string; email: string; telefono: string; rating: number; };
  kpis: { totalOrdenes: number; ordenesPendientes: number; ordenesEnProgreso: number; ordenesCompletadas: number; ingresosTotales: number; ingresosMes: number; ratingPromedio: number; };
  ordenesRecientes: any[];
}

export default function ProveedorDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [proveedor, setProveedor] = useState<any>(null);

  useEffect(() => {
    const proveedorData = localStorage.getItem('proveedor');
    if (!proveedorData) { router.push('/portal-proveedor/login'); return; }
    const p = JSON.parse(proveedorData);
    setProveedor(p);
    loadDashboard(p.id);
  }, [router]);

  const loadDashboard = async (providerId: string) => {
    try {
      const res = await fetch(`/api/portal-proveedor/dashboard?providerId=${providerId}`);
      if (res.ok) setData(await res.json());
      else toast.error('Error al cargar dashboard');
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('proveedor'); router.push('/portal-proveedor/login'); };

  const getEstadoBadge = (estado: string) => {
    const variants: { [key: string]: any } = { asignada: 'outline', aceptada: 'default', en_progreso: 'default', completada: 'secondary', cancelada: 'destructive' };
    const labels: { [key: string]: string } = { asignada: 'Asignada', aceptada: 'Aceptada', en_progreso: 'En Progreso', completada: 'Completada', cancelada: 'Cancelada' };
    return <Badge variant={variants[estado] || 'outline'}>{labels[estado] || estado}</Badge>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-muted/30"><p>Cargando dashboard...</p></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-muted/30"><Card><CardContent className="pt-6"><p className="text-muted-foreground">No se pudo cargar el dashboard</p><Button onClick={() => router.push('/portal-proveedor/login')} className="mt-4">Volver al Login</Button></CardContent></Card></div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-bold">Portal del Proveedor</h1><p className="text-muted-foreground mt-1">Bienvenido, {data.proveedor.nombre}</p></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/portal-proveedor/ordenes')}><ClipboardList className="h-4 w-4 mr-2" />Ver Órdenes</Button>
            <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Cerrar Sesión</Button>
          </div>
        </div>

        <Card className="mb-6"><CardContent className="pt-6"><div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div><p className="text-sm text-muted-foreground">Tipo</p><p className="font-medium">{data.proveedor.tipo}</p></div>
          <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{data.proveedor.email}</p></div>
          <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{data.proveedor.telefono}</p></div>
          <div><p className="text-sm text-muted-foreground">Rating</p><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-medium">{data.proveedor.rating.toFixed(1)}</span></div></div>
          <div><p className="text-sm text-muted-foreground">Rating Promedio</p><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-medium">{data.kpis.ratingPromedio.toFixed(1)}</span></div></div>
        </div></CardContent></Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Órdenes</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.totalOrdenes}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pendientes</CardTitle><Clock className="h-4 w-4 text-amber-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.ordenesPendientes}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">En Progreso</CardTitle><TrendingUp className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.ordenesEnProgreso}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completadas</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.kpis.ordenesCompletadas}</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle><Euro className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">€{data.kpis.ingresosTotales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle><Euro className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">€{data.kpis.ingresosMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div></CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle>Órdenes Recientes</CardTitle></CardHeader><CardContent>
          {data.ordenesRecientes.length === 0 ? <p className="text-muted-foreground text-center py-8">No hay órdenes de trabajo asignadas</p> : (
            <div className="space-y-4">{data.ordenesRecientes.map((orden) => (
              <div key={orden.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2"><div className="flex-1"><h3 className="font-medium">{orden.titulo}</h3><p className="text-sm text-muted-foreground mt-1">{orden.descripcion}</p></div>{getEstadoBadge(orden.estado)}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-3">
                  <div><span className="text-muted-foreground">Edificio:</span><p className="font-medium">{orden.building?.nombre || 'N/A'}</p></div>
                  {orden.unit && <div><span className="text-muted-foreground">Unidad:</span><p className="font-medium">{orden.unit.numero}</p></div>}
                  <div><span className="text-muted-foreground">Fecha:</span><p className="font-medium">{format(new Date(orden.createdAt), 'dd/MM/yyyy', { locale: es })}</p></div>
                  {orden.costoTotal && <div><span className="text-muted-foreground">Costo:</span><p className="font-medium">€{orden.costoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p></div>}
                </div>
              </div>
            ))}</div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, FileText, Calendar, AlertTriangle, CheckCircle2, Clock, Send, User, Building2, Euro, RefreshCw, Search, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Contrato {
  id: string;
  inquilino: string;
  propiedad: string;
  unidad: string;
  fechaFin: string;
  rentaActual: number;
  diasRestantes: number;
  estado: 'activo' | 'por_vencer' | 'vencido' | 'renovado';
  propuestaEnviada?: boolean;
  nuevaRenta?: number;
}

export default function RenovacionesContratosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showRenovarDialog, setShowRenovarDialog] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [nuevaRenta, setNuevaRenta] = useState('');
  const [duracion, setDuracion] = useState('12');

  const [contratos, setContratos] = useState<Contrato[]>([
    { id: 'c1', inquilino: 'María García', propiedad: 'Edificio Centro', unidad: '3A', fechaFin: '2025-02-15', rentaActual: 950, diasRestantes: 23, estado: 'por_vencer' },
    { id: 'c2', inquilino: 'Juan Martínez', propiedad: 'Residencial Playa', unidad: '2B', fechaFin: '2025-02-28', rentaActual: 1100, diasRestantes: 36, estado: 'por_vencer', propuestaEnviada: true, nuevaRenta: 1150 },
    { id: 'c3', inquilino: 'Ana López', propiedad: 'Apartamentos Norte', unidad: '1C', fechaFin: '2025-03-10', rentaActual: 850, diasRestantes: 46, estado: 'activo' },
    { id: 'c4', inquilino: 'Carlos Ruiz', propiedad: 'Edificio Centro', unidad: '5D', fechaFin: '2025-01-15', rentaActual: 1000, diasRestantes: -8, estado: 'vencido' },
    { id: 'c5', inquilino: 'Laura Sánchez', propiedad: 'Piso Centro', unidad: '2A', fechaFin: '2026-01-01', rentaActual: 1200, diasRestantes: 343, estado: 'renovado' },
  ]);

  useEffect(() => {
    if (status === 'authenticated') setLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const filteredContratos = contratos.filter(c => {
    const matchesSearch = c.inquilino.toLowerCase().includes(searchTerm.toLowerCase()) || c.propiedad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || c.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const stats = {
    total: contratos.length,
    porVencer: contratos.filter(c => c.estado === 'por_vencer').length,
    vencidos: contratos.filter(c => c.estado === 'vencido').length,
    renovados: contratos.filter(c => c.estado === 'renovado').length,
  };

  const getEstadoBadge = (estado: string, propuestaEnviada?: boolean) => {
    if (propuestaEnviada) return <Badge className="bg-blue-500">Propuesta Enviada</Badge>;
    const config: Record<string, { className: string; label: string }> = {
      activo: { className: 'bg-green-500', label: 'Activo' },
      por_vencer: { className: 'bg-orange-500', label: 'Por Vencer' },
      vencido: { className: 'bg-red-500', label: 'Vencido' },
      renovado: { className: 'bg-purple-500', label: 'Renovado' },
    };
    const { className, label } = config[estado] || config.activo;
    return <Badge className={className}>{label}</Badge>;
  };

  const handleRenovar = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setNuevaRenta(String(Math.round(contrato.rentaActual * 1.03)));
    setShowRenovarDialog(true);
  };

  const handleEnviarPropuesta = () => {
    if (!selectedContrato) return;
    setContratos(prev => prev.map(c => c.id === selectedContrato.id ? { ...c, propuestaEnviada: true, nuevaRenta: Number(nuevaRenta) } : c));
    toast.success('Propuesta de renovación enviada');
    setShowRenovarDialog(false);
  };

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Renovaciones de Contratos</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 rounded-xl"><RefreshCw className="h-8 w-8 text-teal-600" /></div>
            <div><h1 className="text-2xl sm:text-3xl font-bold">Renovaciones de Contratos</h1><p className="text-muted-foreground">Gestiona las renovaciones próximas</p></div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Contratos</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent></Card>
          <Card className="border-orange-300"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Por Vencer</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{stats.porVencer}</div></CardContent></Card>
          <Card className="border-red-300"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vencidos</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{stats.vencidos}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Renovados</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-purple-600">{stats.renovados}</div></CardContent></Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por inquilino o propiedad..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="por_vencer">Por Vencer</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="renovado">Renovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-4">
          {filteredContratos.map((contrato) => (
            <Card key={contrato.id} className={`hover:shadow-lg transition-shadow ${contrato.estado === 'vencido' ? 'border-red-300' : contrato.estado === 'por_vencer' ? 'border-orange-300' : ''}`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><User className="h-6 w-6 text-muted-foreground" /></div>
                    <div>
                      <CardTitle className="flex items-center gap-2">{contrato.inquilino}{getEstadoBadge(contrato.estado, contrato.propuestaEnviada)}</CardTitle>
                      <CardDescription className="flex items-center gap-2"><Building2 className="h-3 w-3" />{contrato.propiedad} - {contrato.unidad}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">€{contrato.rentaActual}/mes</p>
                    {contrato.propuestaEnviada && contrato.nuevaRenta && (
                      <p className="text-sm text-green-600 flex items-center justify-end gap-1"><TrendingUp className="h-3 w-3" />Propuesta: €{contrato.nuevaRenta}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Vence: {new Date(contrato.fechaFin).toLocaleDateString('es-ES')}</span>
                    <span className={`flex items-center gap-1 font-medium ${contrato.diasRestantes < 0 ? 'text-red-600' : contrato.diasRestantes < 30 ? 'text-orange-600' : ''}`}>
                      <Clock className="h-4 w-4" />{contrato.diasRestantes < 0 ? `Venció hace ${Math.abs(contrato.diasRestantes)} días` : `${contrato.diasRestantes} días restantes`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!contrato.propuestaEnviada && contrato.estado !== 'renovado' && (
                      <Button onClick={() => handleRenovar(contrato)}><RefreshCw className="h-4 w-4 mr-2" />Renovar</Button>
                    )}
                    {contrato.propuestaEnviada && <Button variant="outline"><Send className="h-4 w-4 mr-2" />Reenviar</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog Renovar */}
        <Dialog open={showRenovarDialog} onOpenChange={setShowRenovarDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Propuesta de Renovación</DialogTitle><DialogDescription>Configura las condiciones de la renovación</DialogDescription></DialogHeader>
            {selectedContrato && (
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedContrato.inquilino}</p>
                  <p className="text-sm text-muted-foreground">{selectedContrato.propiedad} - {selectedContrato.unidad}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Renta Actual</Label>
                    <Input value={`€${selectedContrato.rentaActual}`} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Nueva Renta *</Label>
                    <Input type="number" value={nuevaRenta} onChange={(e) => setNuevaRenta(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Incremento: {((Number(nuevaRenta) / selectedContrato.rentaActual - 1) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duración</Label>
                  <Select value={duracion} onValueChange={setDuracion}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                      <SelectItem value="36">36 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenovarDialog(false)}>Cancelar</Button>
              <Button onClick={handleEnviarPropuesta}><Send className="h-4 w-4 mr-2" />Enviar Propuesta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

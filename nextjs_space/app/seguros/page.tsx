'use client';

import { useEffect, useState } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { Home, ArrowLeft, Shield, AlertTriangle, CheckCircle, Plus, Search, Phone, Mail, Euro, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SegurosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [seguros, setSeguros] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newSeguro, setNewSeguro] = useState({
    numeroPoliza: '',
    tipo: 'incendio',
    aseguradora: '',
    nombreAsegurado: '',
    telefonoAseguradora: '',
    emailAseguradora: '',
    cobertura: '',
    sumaAsegurada: '',
    franquicia: '',
    fechaInicio: '',
    fechaVencimiento: '',
    primaMensual: '',
    primaAnual: '',
    buildingId: '',
    unitId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [segurosRes, buildingsRes, unitsRes] = await Promise.all([
        fetch('/api/seguros'),
        fetch('/api/buildings'),
        fetch('/api/units'),
      ]);
      if (segurosRes.ok) setSeguros(await segurosRes.json());
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/seguros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSeguro,
          sumaAsegurada: newSeguro.sumaAsegurada ? parseFloat(newSeguro.sumaAsegurada) : null,
          franquicia: newSeguro.franquicia ? parseFloat(newSeguro.franquicia) : null,
          primaMensual: newSeguro.primaMensual ? parseFloat(newSeguro.primaMensual) : null,
          primaAnual: newSeguro.primaAnual ? parseFloat(newSeguro.primaAnual) : null,
          fechaInicio: new Date(newSeguro.fechaInicio),
          fechaVencimiento: new Date(newSeguro.fechaVencimiento),
          buildingId: newSeguro.buildingId || null,
          unitId: newSeguro.unitId || null,
        }),
      });
      if (response.ok) {
        toast.success('Seguro creado exitosamente');
        setOpenNew(false);
        fetchData();
      } else {
        toast.error('Error al crear seguro');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear seguro');
    }
  };

  const totalSeguros = seguros.length;
  const activos = seguros.filter((s) => s.estado === 'activa').length;
  const porVencer = seguros.filter((s) => {
    if (s.estado !== 'activa') return false;
    const vencimiento = new Date(s.fechaVencimiento);
    const hoy = new Date();
    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 30 && diasRestantes >= 0;
  }).length;

  const filteredSeguros = seguros.filter((s) =>
    s.numeroPoliza?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.aseguradora?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>Seguros</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />Volver
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Seguros</h1>
              <p className="text-muted-foreground">Controla pólizas y coberturas</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSeguros}</div>
                  <p className="text-xs text-muted-foreground">Pólizas registradas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{porVencer}</div>
                  <p className="text-xs text-muted-foreground">Próximos 30 días</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Suma Asegurada</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{(seguros.reduce((acc, s) => acc + (s.sumaAsegurada || 0), 0) / 1000).toFixed(0)}K
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Button onClick={() => setOpenNew(true)}>
                <Plus className="h-4 w-4 mr-2" />Nuevo Seguro
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {filteredSeguros.map((seguro) => (
                <Card key={seguro.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{seguro.aseguradora}</CardTitle>
                        <CardDescription>Póliza: {seguro.numeroPoliza}</CardDescription>
                      </div>
                      <Badge variant={seguro.estado === 'activa' ? 'default' : 'secondary'}>
                        {seguro.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <p className="text-sm font-medium">{seguro.tipo.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vencimiento</p>
                        <p className="text-sm font-medium">
                          {format(new Date(seguro.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      {seguro.sumaAsegurada && (
                        <div>
                          <p className="text-xs text-muted-foreground">Suma Asegurada</p>
                          <p className="text-sm font-medium">€{seguro.sumaAsegurada.toLocaleString()}</p>
                        </div>
                      )}
                      {seguro.primaAnual && (
                        <div>
                          <p className="text-xs text-muted-foreground">Prima Anual</p>
                          <p className="text-sm font-medium">€{seguro.primaAnual.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {(seguro.building || seguro.unit) && (
                      <div className="mt-3 p-2 bg-muted rounded-md text-sm">
                        {seguro.building && <span>{seguro.building.nombre}</span>}
                        {seguro.unit && <span> - Unidad {seguro.unit.numero}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Seguro</DialogTitle>
            <DialogDescription>Registra una nueva póliza de seguro</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Número Póliza *</Label><Input value={newSeguro.numeroPoliza} onChange={(e) => setNewSeguro({ ...newSeguro, numeroPoliza: e.target.value })} /></div>
              <div>
                <Label>Tipo *</Label>
                <Select value={newSeguro.tipo} onValueChange={(v) => setNewSeguro({ ...newSeguro, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incendio">Incendio</SelectItem>
                    <SelectItem value="robo">Robo</SelectItem>
                    <SelectItem value="responsabilidad_civil">Responsabilidad Civil</SelectItem>
                    <SelectItem value="vida">Vida</SelectItem>
                    <SelectItem value="hogar">Hogar</SelectItem>
                    <SelectItem value="comunidad">Comunidad</SelectItem>
                    <SelectItem value="impago_alquiler">Impago Alquiler</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Aseguradora *</Label><Input value={newSeguro.aseguradora} onChange={(e) => setNewSeguro({ ...newSeguro, aseguradora: e.target.value })} /></div>
            <div><Label>Nombre Asegurado *</Label><Input value={newSeguro.nombreAsegurado} onChange={(e) => setNewSeguro({ ...newSeguro, nombreAsegurado: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fecha Inicio *</Label><Input type="date" value={newSeguro.fechaInicio} onChange={(e) => setNewSeguro({ ...newSeguro, fechaInicio: e.target.value })} /></div>
              <div><Label>Fecha Vencimiento *</Label><Input type="date" value={newSeguro.fechaVencimiento} onChange={(e) => setNewSeguro({ ...newSeguro, fechaVencimiento: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prima Anual (€)</Label><Input type="number" step="0.01" value={newSeguro.primaAnual} onChange={(e) => setNewSeguro({ ...newSeguro, primaAnual: e.target.value })} /></div>
              <div><Label>Suma Asegurada (€)</Label><Input type="number" step="0.01" value={newSeguro.sumaAsegurada} onChange={(e) => setNewSeguro({ ...newSeguro, sumaAsegurada: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newSeguro.numeroPoliza || !newSeguro.aseguradora || !newSeguro.nombreAsegurado || !newSeguro.fechaInicio || !newSeguro.fechaVencimiento}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

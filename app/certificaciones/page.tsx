'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/lazy-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Leaf,
  Plus,
  Search,
  Calendar,
  TrendingUp,
  AlertCircle,
  Euro,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

export default function CertificacionesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [certificados, setCertificados] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const [newCert, setNewCert] = useState({
    unitId: '',
    numeroCertificado: '',
    calificacion: 'C',
    consumoEnergetico: '',
    emisionesCO2: '',
    nombreTecnico: '',
    numeroColegiadoTecnico: '',
    empresaCertificadora: '',
    fechaEmision: '',
    fechaVencimiento: '',
    recomendaciones: '',
    ahorroEstimado: '',
  });

  const [editCert, setEditCert] = useState({
    numeroCertificado: '',
    calificacion: 'C',
    consumoEnergetico: '',
    emisionesCO2: '',
    nombreTecnico: '',
    numeroColegiadoTecnico: '',
    empresaCertificadora: '',
    fechaEmision: '',
    fechaVencimiento: '',
    recomendaciones: '',
    ahorroEstimado: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certsRes, unitsRes] = await Promise.all([
        fetch('/api/certificaciones'),
        fetch('/api/units'),
      ]);
      if (certsRes.ok) setCertificados(await certsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/certificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCert,
          consumoEnergetico: newCert.consumoEnergetico
            ? parseFloat(newCert.consumoEnergetico)
            : null,
          emisionesCO2: newCert.emisionesCO2 ? parseFloat(newCert.emisionesCO2) : null,
          ahorroEstimado: newCert.ahorroEstimado ? parseFloat(newCert.ahorroEstimado) : null,
          fechaEmision: new Date(newCert.fechaEmision),
          fechaVencimiento: new Date(newCert.fechaVencimiento),
        }),
      });
      if (response.ok) {
        toast.success('Certificado creado exitosamente');
        setOpenNew(false);
        fetchData();
      } else {
        toast.error('Error al crear certificado');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear certificado');
    }
  };

  const handleOpenEdit = (cert: any) => {
    setSelectedCert(cert);
    setEditCert({
      numeroCertificado: cert.numeroCertificado || '',
      calificacion: cert.calificacion || 'C',
      consumoEnergetico: cert.consumoEnergetico?.toString() || '',
      emisionesCO2: cert.emisionesCO2?.toString() || '',
      nombreTecnico: cert.nombreTecnico || '',
      numeroColegiadoTecnico: cert.numeroColegiadoTecnico || '',
      empresaCertificadora: cert.empresaCertificadora || '',
      fechaEmision: cert.fechaEmision ? format(new Date(cert.fechaEmision), 'yyyy-MM-dd') : '',
      fechaVencimiento: cert.fechaVencimiento
        ? format(new Date(cert.fechaVencimiento), 'yyyy-MM-dd')
        : '',
      recomendaciones: cert.recomendaciones || '',
      ahorroEstimado: cert.ahorroEstimado?.toString() || '',
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedCert) return;
    try {
      const response = await fetch(`/api/certificaciones/${selectedCert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editCert,
          consumoEnergetico: editCert.consumoEnergetico
            ? parseFloat(editCert.consumoEnergetico)
            : null,
          emisionesCO2: editCert.emisionesCO2 ? parseFloat(editCert.emisionesCO2) : null,
          ahorroEstimado: editCert.ahorroEstimado ? parseFloat(editCert.ahorroEstimado) : null,
          fechaEmision: editCert.fechaEmision ? new Date(editCert.fechaEmision) : undefined,
          fechaVencimiento: editCert.fechaVencimiento
            ? new Date(editCert.fechaVencimiento)
            : undefined,
        }),
      });
      if (response.ok) {
        toast.success('Certificado actualizado exitosamente');
        setOpenEdit(false);
        fetchData();
      } else {
        toast.error('Error al actualizar certificado');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar certificado');
    }
  };

  const totalCertificados = certificados.length;
  const vigentes = certificados.filter((c) => c.vigente).length;
  const porVencer = certificados.filter((c) => {
    if (!c.vigente) return false;
    const vencimiento = new Date(c.fechaVencimiento);
    const hoy = new Date();
    const diasRestantes = Math.ceil(
      (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diasRestantes <= 365 && diasRestantes >= 0;
  }).length;

  const calificacionesCount = certificados.reduce((acc, cert) => {
    acc[cert.calificacion] = (acc[cert.calificacion] || 0) + 1;
    return acc;
  }, {});

  const filteredCerts = certificados.filter(
    (c) =>
      c.unit?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nombreTecnico?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getCalificacionColor = (cal: string) => {
    if (['A'].includes(cal)) return 'bg-green-500 text-white';
    if (['B', 'C'].includes(cal)) return 'bg-yellow-500 text-white';
    if (['D', 'E'].includes(cal)) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <>
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Certificaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Certificaciones Energéticas</h1>
            <p className="text-muted-foreground">Control de eficiencia energética</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCertificados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vigentes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vigentes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{porVencer}</div>
                <p className="text-xs text-muted-foreground">Próximo año</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distribución</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-1">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((cal) => (
                    <div key={cal} className="text-center">
                      <div
                        className={`text-xs font-bold px-1 rounded ${getCalificacionColor(cal)}`}
                      >
                        {cal}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {calificacionesCount[cal] || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Certificado
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredCerts.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Unidad {cert.unit?.numero} - {cert.unit?.building?.nombre}
                      </CardTitle>
                      <CardDescription>Técnico: {cert.nombreTecnico}</CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(cert)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Badge className={getCalificacionColor(cert.calificacion)}>
                        {cert.calificacion}
                      </Badge>
                      <Badge variant={cert.vigente ? 'default' : 'secondary'}>
                        {cert.vigente ? 'Vigente' : 'Vencido'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Consumo</p>
                      <p className="text-sm font-medium">{cert.consumoEnergetico} kWh/m²/año</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Emisiones CO₂</p>
                      <p className="text-sm font-medium">{cert.emisionesCO2} kg/m²/año</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Emisión</p>
                      <p className="text-sm font-medium">
                        {format(new Date(cert.fechaEmision), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vencimiento</p>
                      <p className="text-sm font-medium">
                        {format(new Date(cert.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                  {cert.ahorroEstimado && (
                    <div className="mt-3 p-2 bg-green-50 rounded-md text-sm flex items-center gap-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">
                        Ahorro estimado: €{cert.ahorroEstimado.toLocaleString()}/año
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Certificado</DialogTitle>
            <DialogDescription>Registra un certificado energético</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Unidad *</Label>
              <Select
                value={newCert.unitId}
                onValueChange={(v) => setNewCert({ ...newCert, unitId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      Unidad {u.numero} - {u.building?.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número Certificado</Label>
                <Input
                  value={newCert.numeroCertificado}
                  onChange={(e) => setNewCert({ ...newCert, numeroCertificado: e.target.value })}
                />
              </div>
              <div>
                <Label>Calificación *</Label>
                <Select
                  value={newCert.calificacion}
                  onValueChange={(v) => setNewCert({ ...newCert, calificacion: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Consumo (kWh/m²/año)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCert.consumoEnergetico}
                  onChange={(e) => setNewCert({ ...newCert, consumoEnergetico: e.target.value })}
                />
              </div>
              <div>
                <Label>Emisiones CO₂ (kg/m²/año)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newCert.emisionesCO2}
                  onChange={(e) => setNewCert({ ...newCert, emisionesCO2: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Nombre Técnico *</Label>
              <Input
                value={newCert.nombreTecnico}
                onChange={(e) => setNewCert({ ...newCert, nombreTecnico: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Emisión *</Label>
                <Input
                  type="date"
                  value={newCert.fechaEmision}
                  onChange={(e) => setNewCert({ ...newCert, fechaEmision: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha Vencimiento *</Label>
                <Input
                  type="date"
                  value={newCert.fechaVencimiento}
                  onChange={(e) => setNewCert({ ...newCert, fechaVencimiento: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Recomendaciones</Label>
              <Textarea
                value={newCert.recomendaciones}
                onChange={(e) => setNewCert({ ...newCert, recomendaciones: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Ahorro Estimado (€/año)</Label>
              <Input
                type="number"
                step="0.01"
                value={newCert.ahorroEstimado}
                onChange={(e) => setNewCert({ ...newCert, ahorroEstimado: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !newCert.unitId ||
                !newCert.nombreTecnico ||
                !newCert.fechaEmision ||
                !newCert.fechaVencimiento
              }
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Certificado</DialogTitle>
            <DialogDescription>Actualiza los datos del certificado energético</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número Certificado</Label>
                <Input
                  value={editCert.numeroCertificado}
                  onChange={(e) => setEditCert({ ...editCert, numeroCertificado: e.target.value })}
                />
              </div>
              <div>
                <Label>Calificación *</Label>
                <Select
                  value={editCert.calificacion}
                  onValueChange={(v) => setEditCert({ ...editCert, calificacion: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Consumo (kWh/m²/año)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editCert.consumoEnergetico}
                  onChange={(e) => setEditCert({ ...editCert, consumoEnergetico: e.target.value })}
                />
              </div>
              <div>
                <Label>Emisiones CO₂ (kg/m²/año)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editCert.emisionesCO2}
                  onChange={(e) => setEditCert({ ...editCert, emisionesCO2: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Nombre Técnico *</Label>
              <Input
                value={editCert.nombreTecnico}
                onChange={(e) => setEditCert({ ...editCert, nombreTecnico: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número Colegiado</Label>
                <Input
                  value={editCert.numeroColegiadoTecnico}
                  onChange={(e) =>
                    setEditCert({ ...editCert, numeroColegiadoTecnico: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Empresa Certificadora</Label>
                <Input
                  value={editCert.empresaCertificadora}
                  onChange={(e) =>
                    setEditCert({ ...editCert, empresaCertificadora: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Emisión *</Label>
                <Input
                  type="date"
                  value={editCert.fechaEmision}
                  onChange={(e) => setEditCert({ ...editCert, fechaEmision: e.target.value })}
                />
              </div>
              <div>
                <Label>Fecha Vencimiento *</Label>
                <Input
                  type="date"
                  value={editCert.fechaVencimiento}
                  onChange={(e) => setEditCert({ ...editCert, fechaVencimiento: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Recomendaciones</Label>
              <Textarea
                value={editCert.recomendaciones}
                onChange={(e) => setEditCert({ ...editCert, recomendaciones: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Ahorro Estimado (€/año)</Label>
              <Input
                type="number"
                step="0.01"
                value={editCert.ahorroEstimado}
                onChange={(e) => setEditCert({ ...editCert, ahorroEstimado: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !editCert.nombreTecnico || !editCert.fechaEmision || !editCert.fechaVencimiento
              }
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

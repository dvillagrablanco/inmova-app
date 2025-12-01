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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Home, ArrowLeft, TrendingUp, Calculator, Building2, DollarSign, Award, BarChart3, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function ValoracionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [valoraciones, setValoraciones] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [generando, setGenerando] = useState(false);

  const [formData, setFormData] = useState({
    unitId: '',
    metrosCuadrados: '',
    habitaciones: '',
    banos: '',
    garajes: '0',
    ascensor: false,
    terraza: false,
    piscina: false,
    estadoConservacion: 'bueno',
    finalidad: 'venta'
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
      const [valRes, unitsRes] = await Promise.all([
        fetch('/api/valoraciones'),
        fetch('/api/units')
      ]);
      const valData = await valRes.json();
      const unitsData = await unitsRes.json();
      setValoraciones(valData);
      setUnits(unitsData);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    if (!formData.unitId || !formData.metrosCuadrados) {
      toast.error('Selecciona una unidad y especifica los metros cuadrados');
      return;
    }

    setGenerando(true);
    try {
      const selectedUnit = units.find(u => u.id === formData.unitId);
      
      const response = await fetch('/api/valoraciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          direccion: selectedUnit?.building?.direccion || '',
          municipio: 'Madrid',
          provincia: 'Madrid'
        })
      });

      if (!response.ok) throw new Error('Error al generar valoración');

      const data = await response.json();
      toast.success('Valoración generada exitosamente');
      setOpenDialog(false);
      fetchData();
      setFormData({
        unitId: '',
        metrosCuadrados: '',
        habitaciones: '',
        banos: '',
        garajes: '0',
        ascensor: false,
        terraza: false,
        piscina: false,
        estadoConservacion: 'bueno',
        finalidad: 'venta'
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGenerando(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </div>

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Valoraciones</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Valoración de Propiedades</h1>
                  <p className="text-muted-foreground mt-1">Sistema inteligente de valoración basado en comparables</p>
                </div>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Calculator className="h-4 w-4 mr-2" />
                      Nueva Valoración
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Generar Valoración</DialogTitle>
                      <DialogDescription>
                        Completa los datos de la propiedad para obtener una valoración automática
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Unidad</Label>
                        <Select value={formData.unitId} onValueChange={(value) => {
                          setFormData({ ...formData, unitId: value });
                          const unit = units.find(u => u.id === value);
                          if (unit) {
                            setFormData(prev => ({
                              ...prev,
                              metrosCuadrados: unit.superficie?.toString() || '',
                              habitaciones: unit.habitaciones?.toString() || '',
                              banos: unit.banos?.toString() || ''
                            }));
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(unit => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.building?.nombre} - Unidad {unit.numero}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>M² Construidos *</Label>
                          <Input
                            type="number"
                            value={formData.metrosCuadrados}
                            onChange={(e) => setFormData({ ...formData, metrosCuadrados: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Habitaciones</Label>
                          <Input
                            type="number"
                            value={formData.habitaciones}
                            onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Baños</Label>
                          <Input
                            type="number"
                            value={formData.banos}
                            onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Estado Conservación</Label>
                          <Select value={formData.estadoConservacion} onValueChange={(value) => setFormData({ ...formData, estadoConservacion: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excelente">Excelente</SelectItem>
                              <SelectItem value="bueno">Bueno</SelectItem>
                              <SelectItem value="aceptable">Aceptable</SelectItem>
                              <SelectItem value="reformar">A reformar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Finalidad</Label>
                          <Select value={formData.finalidad} onValueChange={(value) => setFormData({ ...formData, finalidad: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="venta">Venta</SelectItem>
                              <SelectItem value="alquiler">Alquiler</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Características</Label>
                        <div className="flex flex-wrap gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.ascensor}
                              onChange={(e) => setFormData({ ...formData, ascensor: e.target.checked })}
                            />
                            Ascensor
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.terraza}
                              onChange={(e) => setFormData({ ...formData, terraza: e.target.checked })}
                            />
                            Terraza
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.piscina}
                              onChange={(e) => setFormData({ ...formData, piscina: e.target.checked })}
                            />
                            Piscina
                          </label>
                        </div>
                      </div>

                      <Button onClick={handleGenerar} disabled={generando} className="w-full">
                        {generando ? 'Generando...' : 'Generar Valoración'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Valoraciones</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{valoraciones.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {valoraciones.length > 0 ? formatCurrency(
                      valoraciones.reduce((sum, v) => sum + v.valorEstimado, 0) / valoraciones.length
                    ) : '€0'}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confianza Media</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {valoraciones.length > 0 ? Math.round(
                      valoraciones.reduce((sum, v) => sum + v.confianzaValoracion, 0) / valoraciones.length
                    ) : 0}%
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {valoraciones.filter(v => {
                      const fecha = new Date(v.createdAt);
                      const ahora = new Date();
                      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
                    }).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Valoraciones */}
            <Card>
              <CardHeader>
                <CardTitle>Valoraciones Recientes</CardTitle>
                <CardDescription>Histórico de valoraciones generadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {valoraciones.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay valoraciones generadas</p>
                  ) : (
                    valoraciones.map((val) => (
                      <Card key={val.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold">{val.direccion}</h3>
                              <Badge>{val.finalidad}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {val.metrosCuadrados}m² • {val.habitaciones || 0} hab • {val.banos || 0} baños
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {val.municipio}, {val.provincia} • {new Date(val.fechaValoracion).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{formatCurrency(val.valorEstimado)}</p>
                              <p className="text-xs text-muted-foreground">
                                Rango: {formatCurrency(val.valorMinimo)} - {formatCurrency(val.valorMaximo)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(val.precioM2)}/m² • Confianza: {val.confianzaValoracion}%
                              </p>
                            </div>
                            <Badge variant={val.confianzaValoracion >= 80 ? 'default' : val.confianzaValoracion >= 60 ? 'secondary' : 'outline'}>
                              {val.numComparables} comparables
                            </Badge>
                          </div>
                        </div>
                        {val.factoresPositivos?.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-1">Factores positivos:</p>
                            <div className="flex flex-wrap gap-1">
                              {val.factoresPositivos.slice(0, 3).map((factor: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {factor.split('(')[0].trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

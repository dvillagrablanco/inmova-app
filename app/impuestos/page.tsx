'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Receipt,
  Calculator,
  FileText,
  Download,
  Calendar,
  Euro,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface Impuesto {
  id: string;
  tipo: string;
  periodo: string;
  baseImponible: number;
  cuota: number;
  estado: 'pendiente' | 'presentado' | 'pagado';
  fechaLimite: string;
}

export default function ImpuestosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchImpuestos();
    }
  }, [status, router]);

  const fetchImpuestos = async () => {
    try {
      setLoading(true);
      // Datos de ejemplo para impuestos
      const impuestosDemo: Impuesto[] = [
        {
          id: '1',
          tipo: 'IVA Trimestral',
          periodo: 'Q1 2026',
          baseImponible: 15000,
          cuota: 3150,
          estado: 'pagado',
          fechaLimite: '2026-04-20',
        },
        {
          id: '2',
          tipo: 'IRPF Retenciones',
          periodo: 'Q1 2026',
          baseImponible: 5000,
          cuota: 950,
          estado: 'presentado',
          fechaLimite: '2026-04-20',
        },
        {
          id: '3',
          tipo: 'IVA Trimestral',
          periodo: 'Q4 2025',
          baseImponible: 12000,
          cuota: 2520,
          estado: 'pagado',
          fechaLimite: '2026-01-20',
        },
        {
          id: '4',
          tipo: 'Impuesto Bienes Inmuebles',
          periodo: '2026',
          baseImponible: 180000,
          cuota: 900,
          estado: 'pendiente',
          fechaLimite: '2026-06-30',
        },
      ];
      setImpuestos(impuestosDemo);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar impuestos');
    } finally {
      setLoading(false);
    }
  };

  const estadisticas = {
    totalPendiente: impuestos
      .filter(i => i.estado === 'pendiente')
      .reduce((sum, i) => sum + i.cuota, 0),
    totalPagado: impuestos
      .filter(i => i.estado === 'pagado')
      .reduce((sum, i) => sum + i.cuota, 0),
    proximosVencer: impuestos.filter(i => {
      const dias = Math.ceil((new Date(i.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return i.estado === 'pendiente' && dias <= 30 && dias > 0;
    }).length,
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'presentado': return 'bg-blue-100 text-blue-800';
      case 'pagado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Impuestos</h1>
            <p className="text-muted-foreground">Control fiscal y declaraciones</p>
          </div>
          <Button>
            <Calculator className="mr-2 h-4 w-4" />
            Calcular Impuestos
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(estadisticas.totalPendiente)}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(estadisticas.totalPagado)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pagado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.proximosVencer}</p>
                  <p className="text-sm text-muted-foreground">Próximos a Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{impuestos.length}</p>
                  <p className="text-sm text-muted-foreground">Declaraciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle>Obligaciones Fiscales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Base Imponible</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {impuestos.map((impuesto) => (
                  <TableRow key={impuesto.id}>
                    <TableCell className="font-medium">{impuesto.tipo}</TableCell>
                    <TableCell>{impuesto.periodo}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(impuesto.baseImponible)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(impuesto.cuota)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(impuesto.estado)}>
                        {impuesto.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(impuesto.fechaLimite).toLocaleDateString('es-ES')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-3 w-3" />
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  HardHat,
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  Euro,
} from 'lucide-react';
import Link from 'next/link';

interface Contrato {
  id: string;
  obraId: string;
  obra: {
    titulo: string;
    ubicacion: string;
  };
  constructor: {
    nombreEmpresa: string;
  };
  subcontratista: {
    nombreEmpresa: string;
  };
  estado: string;
  presupuestoTotal: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  progreso: number;
}

const estadoColors: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  PENDIENTE_FIRMA: 'bg-yellow-100 text-yellow-800',
  ACTIVO: 'bg-blue-100 text-blue-800',
  EN_EJECUCION: 'bg-indigo-100 text-indigo-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  EN_DISPUTA: 'bg-orange-100 text-orange-800',
};

export default function EwoorkerContratosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContratos = async () => {
      try {
        const response = await fetch('/api/ewoorker/contratos');
        if (response.ok) {
          const data = await response.json();
          setContratos(data.contratos || []);
        }
      } catch (error) {
        console.error('Error fetching contratos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchContratos();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  const contratosFiltrados = contratos.filter(c => {
    const matchSearch = c.obra.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.constructor.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.subcontratista.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HardHat className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Contratos</h1>
                <p className="text-orange-100">Gestiona tus contratos de subcontratación</p>
              </div>
            </div>
            <Button variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100" asChild>
              <Link href="/ewoorker/dashboard">Volver al Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por obra, empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filtroEstado} onValueChange={setFiltroEstado} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ACTIVO">Activos</TabsTrigger>
              <TabsTrigger value="EN_EJECUCION">En Ejecución</TabsTrigger>
              <TabsTrigger value="COMPLETADO">Completados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de contratos */}
        {contratosFiltrados.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos</h3>
              <p className="text-gray-500 mb-6">
                Aún no tienes contratos. Publica una obra o envía ofertas para comenzar.
              </p>
              <div className="flex justify-center gap-4">
                <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                  <Link href="/ewoorker/obras">
                    <Plus className="w-4 h-4 mr-2" />
                    Ver Obras
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contratosFiltrados.map((contrato) => (
              <Card key={contrato.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{contrato.obra.titulo}</h3>
                          <p className="text-sm text-gray-500">{contrato.obra.ubicacion}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              {contrato.constructor.nombreEmpresa}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                            <span>{contrato.subcontratista.nombreEmpresa}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Presupuesto</p>
                        <p className="font-semibold text-lg flex items-center">
                          <Euro className="w-4 h-4 mr-1" />
                          {contrato.presupuestoTotal.toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Progreso</p>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-600 rounded-full"
                              style={{ width: `${contrato.progreso}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{contrato.progreso}%</span>
                        </div>
                      </div>
                      <Badge className={estadoColors[contrato.estado] || 'bg-gray-100'}>
                        {contrato.estado.replace(/_/g, ' ')}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`Detalle del contrato ${contrato.id}`)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

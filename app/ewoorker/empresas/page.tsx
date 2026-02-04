'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  HardHat,
  Search,
  Building2,
  MapPin,
  Star,
  CheckCircle2,
  Users,
  Briefcase,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Empresa {
  id: string;
  nombreEmpresa: string;
  tipoEmpresa: string;
  especialidades: string[];
  zonasOperacion: string[];
  valoracionMedia: number;
  totalReviews: number;
  verificado: boolean;
  disponible: boolean;
  numeroTrabajadores: number;
  experienciaAnios: number;
}

export default function EwoorkerEmpresasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('todas');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const response = await fetch('/api/ewoorker/empresas');
        if (response.ok) {
          const data = await response.json();
          setEmpresas(data.empresas || []);
        }
      } catch (error) {
        console.error('Error fetching empresas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchEmpresas();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  const empresasFiltradas = empresas.filter(e => {
    const matchSearch = e.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       e.especialidades.some(esp => esp.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filtroTipo === 'todos' || e.tipoEmpresa === filtroTipo;
    const matchEspecialidad = filtroEspecialidad === 'todas' || e.especialidades.includes(filtroEspecialidad);
    return matchSearch && matchTipo && matchEspecialidad;
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
                <h1 className="text-2xl font-bold">Directorio de Empresas</h1>
                <p className="text-orange-100">Encuentra subcontratistas verificados</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por nombre o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="CONSTRUCTORA">Constructora</SelectItem>
              <SelectItem value="SUBCONTRATISTA">Subcontratista</SelectItem>
              <SelectItem value="PROMOTORA">Promotora</SelectItem>
              <SelectItem value="AUTONOMO">Autónomo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroEspecialidad} onValueChange={setFiltroEspecialidad}>
            <SelectTrigger>
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las especialidades</SelectItem>
              <SelectItem value="Estructura">Estructura</SelectItem>
              <SelectItem value="Electricidad">Electricidad</SelectItem>
              <SelectItem value="Fontanería">Fontanería</SelectItem>
              <SelectItem value="Climatización">Climatización</SelectItem>
              <SelectItem value="Pintura">Pintura</SelectItem>
              <SelectItem value="Carpintería">Carpintería</SelectItem>
              <SelectItem value="Albañilería">Albañilería</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de empresas */}
        {empresasFiltradas.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron empresas</h3>
              <p className="text-gray-500">
                Intenta ajustar los filtros de búsqueda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresasFiltradas.map((empresa) => (
              <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{empresa.nombreEmpresa}</h3>
                        <p className="text-sm text-gray-500">{empresa.tipoEmpresa}</p>
                      </div>
                    </div>
                    {empresa.verificado && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="font-medium">{empresa.valoracionMedia.toFixed(1)}</span>
                      <span className="text-gray-400 ml-1">({empresa.totalReviews} reviews)</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {empresa.zonasOperacion.slice(0, 2).join(', ')}
                      {empresa.zonasOperacion.length > 2 && ` +${empresa.zonasOperacion.length - 2}`}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {empresa.numeroTrabajadores} trabajadores
                      <span className="mx-2">•</span>
                      <Briefcase className="w-4 h-4 mr-1" />
                      {empresa.experienciaAnios} años exp.
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {empresa.especialidades.slice(0, 3).map((esp, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {esp}
                        </Badge>
                      ))}
                      {empresa.especialidades.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{empresa.especialidades.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toast.info(`Perfil de ${empresa.nombreEmpresa}`)}
                    >
                      Ver Perfil
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={() => toast.success(`Solicitud enviada a ${empresa.nombreEmpresa}`)}
                    >
                      Contactar
                    </Button>
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

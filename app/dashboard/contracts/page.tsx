'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Home,
  User
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Contract {
  id: string;
  unitId: string;
  tenantId: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  estado: string;
  tipo?: string;
  diaPago?: number;
  renovacionAutomatica?: boolean;
  diasHastaVencimiento?: number;
  unit?: {
    id: string;
    numero: string;
    building?: {
      id: string;
      nombre: string;
      direccion: string;
    };
  };
  tenant?: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
  };
  createdAt: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.tenant?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.unit?.building?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.unit?.numero?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'all' || contract.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const activeContracts = contracts.filter(c => c.estado === 'activo').length;
  const expiringContracts = contracts.filter(c => 
    c.diasHastaVencimiento !== undefined && 
    c.diasHastaVencimiento > 0 && 
    c.diasHastaVencimiento <= 30
  ).length;
  const totalMonthlyIncome = contracts
    .filter(c => c.estado === 'activo')
    .reduce((sum, c) => sum + (c.rentaMensual || 0), 0);

  const estadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'finalizado': return 'bg-gray-100 text-gray-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiration = (contract: Contract) => {
    if (contract.diasHastaVencimiento !== undefined) {
      return contract.diasHastaVencimiento;
    }
    const endDate = new Date(contract.fechaFin);
    const today = new Date();
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los contratos de alquiler
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchContracts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href="/contratos/nuevo">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-bold">{activeContracts}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Por Vencer</p>
                <p className="text-2xl font-bold text-yellow-600">{expiringContracts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ingresos/mes</p>
                <p className="text-2xl font-bold">€{totalMonthlyIncome.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por inquilino, edificio o unidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay contratos</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterEstado !== 'all' 
                ? 'No se encontraron contratos con ese criterio' 
                : 'Comienza creando tu primer contrato'}
            </p>
            <Link href="/contratos/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Contrato
              </Button>
            </Link>
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const daysUntilExpiration = getDaysUntilExpiration(contract);
            const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30;
            const isExpired = daysUntilExpiration <= 0;
            
            return (
              <Card key={contract.id} className={`hover:shadow-lg transition-shadow ${isExpiringSoon ? 'border-yellow-300' : ''} ${isExpired ? 'border-red-300' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Contract Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={estadoBadgeVariant(contract.estado)}>
                          {contract.estado}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            <Clock className="h-3 w-3 mr-1" />
                            Vence en {daysUntilExpiration} días
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="outline" className="border-red-500 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Vencido
                          </Badge>
                        )}
                        {contract.renovacionAutomatica && (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            Renovación auto.
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tenant */}
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium">{contract.tenant?.nombreCompleto || 'Sin inquilino'}</p>
                            {contract.tenant?.email && (
                              <p className="text-sm text-gray-500">{contract.tenant.email}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Property */}
                        <div className="flex items-start gap-2">
                          <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium">
                              {contract.unit?.building?.nombre || 'Edificio'} - {contract.unit?.numero || 'Unidad'}
                            </p>
                            {contract.unit?.building?.direccion && (
                              <p className="text-sm text-gray-500">{contract.unit.building.direccion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Center: Dates */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center px-4 py-2 bg-gray-50 rounded">
                        <p className="text-gray-500">Inicio</p>
                        <p className="font-medium">{new Date(contract.fechaInicio).toLocaleDateString()}</p>
                      </div>
                      <div className="text-center px-4 py-2 bg-gray-50 rounded">
                        <p className="text-gray-500">Fin</p>
                        <p className="font-medium">{new Date(contract.fechaFin).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Right: Price and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Renta mensual</p>
                        <p className="text-xl font-bold text-green-600">
                          €{contract.rentaMensual?.toLocaleString() || 0}
                        </p>
                        {contract.deposito > 0 && (
                          <p className="text-xs text-gray-500">
                            Depósito: €{contract.deposito.toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contratos/${contract.id}`}>Ver detalles</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/contratos/${contract.id}/editar`}>Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/contratos/${contract.id}/renovar`}>Renovar</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

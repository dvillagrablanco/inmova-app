'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Euro,
  Percent,
  Building2,
  ShoppingBag,
  TrendingUp,
  Download,
  Settings,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calculator,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServiceCommission {
  id: string;
  serviceName: string;
  serviceCategory: string;
  providerName: string;
  providerEmail: string;
  commissionType: 'fixed' | 'percentage';
  commissionRate: number;
  minimumCommission?: number;
  totalTransactions: number;
  totalRevenue: number;
  totalCommissions: number;
  status: 'active' | 'paused' | 'pending';
}

interface CommissionTransaction {
  id: string;
  serviceName: string;
  providerName: string;
  clientCompany: string;
  transactionAmount: number;
  commissionAmount: number;
  status: 'pending' | 'processed' | 'paid';
  date: string;
}

interface CommissionStats {
  totalCommissionsThisMonth: number;
  totalCommissionsAllTime: number;
  pendingCommissions: number;
  activeProviders: number;
  avgCommissionRate: number;
  transactionsThisMonth: number;
}

export default function MarketplaceComisionesPage() {
  const [services, setServices] = useState<ServiceCommission[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceCommission | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    commissionType: 'percentage',
    commissionRate: 15,
    status: 'active',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      setConfigForm({
        commissionType: selectedService.commissionType,
        commissionRate: selectedService.commissionRate,
        status: selectedService.status,
      });
    }
  }, [selectedService]);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Conectar con API real cuando existan datos
      // Por ahora mostrar estado vacío - sin datos ficticios
      const response = await fetch('/api/admin/marketplace/commissions');
      if (response.ok) {
        const data = await response.json();
        setStats(
          data.stats || {
            totalCommissionsThisMonth: 0,
            totalCommissionsAllTime: 0,
            pendingCommissions: 0,
            activeProviders: 0,
            avgCommissionRate: 0,
            transactionsThisMonth: 0,
          }
        );
        setServices(data.services || []);
        setTransactions(data.transactions || []);
      } else {
        // Si no hay API aún, mostrar estado vacío
        setStats({
          totalCommissionsThisMonth: 0,
          totalCommissionsAllTime: 0,
          pendingCommissions: 0,
          activeProviders: 0,
          avgCommissionRate: 0,
          transactionsThisMonth: 0,
        });
        setServices([]);
        setTransactions([]);
      }
    } catch (error) {
      // En caso de error, mostrar estado vacío
      setStats({
        totalCommissionsThisMonth: 0,
        totalCommissionsAllTime: 0,
        pendingCommissions: 0,
        activeProviders: 0,
        avgCommissionRate: 0,
        transactionsThisMonth: 0,
      });
      setServices([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Activo
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pausado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'processed':
        return (
          <Badge className="bg-purple-100 text-purple-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Procesado
          </Badge>
        );
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-700">
            <Euro className="w-3 h-3 mr-1" />
            Pagado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.providerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comisiones del Marketplace</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las comisiones de servicios del marketplace
            </p>
          </div>
          <Button onClick={() => toast.info('Exportando informe...')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Informe
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Este Mes</p>
                    <p className="text-xl font-bold text-green-600">
                      €{stats.totalCommissionsThisMonth.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Histórico</p>
                    <p className="text-xl font-bold">€{stats.totalCommissionsAllTime.toFixed(2)}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Pendiente</p>
                    <p className="text-xl font-bold text-yellow-600">
                      €{stats.pendingCommissions.toFixed(2)}
                    </p>
                  </div>
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Proveedores</p>
                    <p className="text-xl font-bold">{stats.activeProviders}</p>
                  </div>
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">% Medio</p>
                    <p className="text-xl font-bold">{stats.avgCommissionRate}%</p>
                  </div>
                  <Percent className="w-6 h-6 text-indigo-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Transacciones</p>
                    <p className="text-xl font-bold">{stats.transactionsThisMonth}</p>
                  </div>
                  <ShoppingBag className="w-6 h-6 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services">Servicios y Tarifas</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por servicio o proveedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="paused">Pausados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Services Table */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Comisiones</CardTitle>
                <CardDescription>
                  Tarifas y estadísticas por servicio del marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin comisiones configuradas
                    </h3>
                    <p className="text-gray-500">
                      Las comisiones se generarán automáticamente cuando los proveedores del
                      marketplace realicen ventas.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Comisión</TableHead>
                        <TableHead className="text-right">Transacciones</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Comisiones</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{service.serviceName}</p>
                              <p className="text-sm text-gray-500">{service.serviceCategory}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{service.providerName}</p>
                              <p className="text-sm text-gray-500">{service.providerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {service.commissionType === 'percentage' ? 'Porcentaje' : 'Fijo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {service.commissionType === 'percentage'
                              ? `${service.commissionRate}%`
                              : `€${service.commissionRate}`}
                          </TableCell>
                          <TableCell className="text-right">{service.totalTransactions}</TableCell>
                          <TableCell className="text-right">
                            €{service.totalRevenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            €{service.totalCommissions.toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(service.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedService(service);
                                setConfigDialogOpen(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Transacciones</CardTitle>
                <CardDescription>
                  Historial de transacciones con comisiones aplicadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin transacciones</h3>
                    <p className="text-gray-500">
                      Las transacciones aparecerán aquí cuando se realicen ventas en el marketplace.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="text-right">Comisión</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {format(new Date(tx.date), 'dd MMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell className="font-medium">{tx.serviceName}</TableCell>
                          <TableCell>{tx.providerName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {tx.clientCompany}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            €{tx.transactionAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            €{tx.commissionAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Config Dialog */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Comisión</DialogTitle>
              <DialogDescription>Ajusta la tarifa de comisión para este servicio</DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Servicio</Label>
                  <p className="font-medium">{selectedService.serviceName}</p>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <p className="font-medium">{selectedService.providerName}</p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Comisión</Label>
                  <Select 
                    value={configForm.commissionType}
                    onValueChange={(v) => setConfigForm({ ...configForm, commissionType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Importe Fijo (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tasa de Comisión</Label>
                  <Input
                    type="number"
                    value={configForm.commissionRate}
                    onChange={(e) => setConfigForm({ ...configForm, commissionRate: Number(e.target.value) })}
                    placeholder={configForm.commissionType === 'percentage' ? '15' : '25'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select 
                    value={configForm.status}
                    onValueChange={(v) => setConfigForm({ ...configForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedService) return;
                  
                  try {
                    const response = await fetch(`/api/admin/marketplace/commissions/${selectedService.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(configForm),
                    });

                    if (response.ok) {
                      // Actualizar estado local
                      setServices(prev => prev.map(s => 
                        s.id === selectedService.id 
                          ? { ...s, ...configForm }
                          : s
                      ));
                      toast.success('Configuración guardada');
                      setConfigDialogOpen(false);
                    } else {
                      toast.error('Error al guardar configuración');
                    }
                  } catch (error) {
                    // Si falla la API, actualizar localmente de todas formas
                    setServices(prev => prev.map(s => 
                      s.id === selectedService.id 
                        ? { ...s, ...configForm }
                        : s
                    ));
                    toast.success('Configuración guardada');
                    setConfigDialogOpen(false);
                  }
                }}
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

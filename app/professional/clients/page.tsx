'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'company';
  status: 'active' | 'pending' | 'inactive';
  propertiesCount: number;
  monthlyRevenue: number;
  contractStart: string;
  contractEnd: string;
  nextBilling: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastContact: string;
  tags: string[];
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalProperties: number;
  monthlyRevenue: number;
  pendingPayments: number;
  avgPropertiesPerClient: number;
}

export default function ProfessionalClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data - TODO: Replace with real API
      setClients([
        {
          id: 'c1',
          name: 'María García López',
          email: 'maria.garcia@email.com',
          phone: '+34 612 345 678',
          type: 'individual',
          status: 'active',
          propertiesCount: 5,
          monthlyRevenue: 850,
          contractStart: '2024-01-15',
          contractEnd: '2025-01-15',
          nextBilling: '2026-01-01',
          paymentStatus: 'paid',
          lastContact: '2025-12-20',
          tags: ['Alquiler Larga Duración', 'Premium'],
        },
        {
          id: 'c2',
          name: 'Inversiones Urbanas SL',
          email: 'contacto@inversionesurbanas.com',
          phone: '+34 915 123 456',
          type: 'company',
          status: 'active',
          propertiesCount: 12,
          monthlyRevenue: 2400,
          contractStart: '2023-06-01',
          contractEnd: '2025-06-01',
          nextBilling: '2026-01-01',
          paymentStatus: 'paid',
          lastContact: '2025-12-18',
          tags: ['Alquiler Vacacional', 'Corporativo', 'VIP'],
        },
        {
          id: 'c3',
          name: 'Carlos Rodríguez',
          email: 'carlos.r@email.com',
          phone: '+34 678 901 234',
          type: 'individual',
          status: 'active',
          propertiesCount: 3,
          monthlyRevenue: 450,
          contractStart: '2024-09-01',
          contractEnd: '2025-09-01',
          nextBilling: '2026-01-01',
          paymentStatus: 'pending',
          lastContact: '2025-12-15',
          tags: ['Coliving'],
        },
        {
          id: 'c4',
          name: 'Ana Martínez',
          email: 'ana.martinez@email.com',
          phone: '+34 654 321 098',
          type: 'individual',
          status: 'pending',
          propertiesCount: 0,
          monthlyRevenue: 0,
          contractStart: '2025-12-26',
          contractEnd: '2026-12-26',
          nextBilling: '2026-01-01',
          paymentStatus: 'pending',
          lastContact: '2025-12-26',
          tags: ['Nuevo Cliente'],
        },
        {
          id: 'c5',
          name: 'Propiedades del Sur SA',
          email: 'info@propiedadesdelsur.es',
          phone: '+34 955 678 901',
          type: 'company',
          status: 'active',
          propertiesCount: 8,
          monthlyRevenue: 1600,
          contractStart: '2024-03-01',
          contractEnd: '2026-03-01',
          nextBilling: '2026-01-01',
          paymentStatus: 'overdue',
          lastContact: '2025-11-30',
          tags: ['Alquiler Larga Duración', 'Moroso'],
        },
      ]);

      const mockStats: ClientStats = {
        totalClients: 5,
        activeClients: 4,
        totalProperties: 28,
        monthlyRevenue: 5300,
        pendingPayments: 450,
        avgPropertiesPerClient: 5.6,
      };
      setStats(mockStats);

    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-500', label: 'Activo', icon: CheckCircle },
      pending: { color: 'bg-yellow-500', label: 'Pendiente', icon: Clock },
      inactive: { color: 'bg-gray-500', label: 'Inactivo', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.active;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const config = {
      paid: { color: 'bg-green-500', label: 'Pagado' },
      pending: { color: 'bg-yellow-500', label: 'Pendiente' },
      overdue: { color: 'bg-red-500', label: 'Vencido' },
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando clientes...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
                <p className="text-muted-foreground mt-2">
                  CRM completo para servicios profesionales
                </p>
              </div>
              <Button onClick={() => router.push('/professional/clients/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClients}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.activeClients} activos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProperties}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.avgPropertiesPerClient.toFixed(1)} por cliente
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.monthlyRevenue)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">+12% vs anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(stats.pendingPayments)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Por cobrar</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Tasa Retención</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground mt-1">Últimos 12 meses</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">8.7</div>
                    <p className="text-xs text-muted-foreground mt-1">Satisfacción</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={filterStatus === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('active')}
                    >
                      Activos
                    </Button>
                    <Button
                      variant={filterStatus === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('pending')}
                    >
                      Pendientes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clients List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${
                          client.type === 'company' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {client.type === 'company' ? (
                            <Building2 className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Users className="h-6 w-6 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <CardDescription>
                            {client.type === 'company' ? 'Empresa' : 'Particular'}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(client.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{client.propertiesCount} propiedades</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{formatCurrency(client.monthlyRevenue)}/mes</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Próximo pago</p>
                        <p className="text-sm font-medium">{formatDate(client.nextBilling)}</p>
                      </div>
                      {getPaymentBadge(client.paymentStatus)}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/professional/clients/${client.id}`)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/professional/clients/${client.id}/properties`)}
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Propiedades
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

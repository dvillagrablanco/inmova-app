'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  DollarSign,
  Calendar,
  Home,
  Search,
  Plus,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomId: string;
  roomNumber: string;
  propertyName: string;
  moveInDate: string;
  moveOutDate?: string;
  rent: number;
  deposit: number;
  paymentStatus: 'paid' | 'pending' | 'late';
  lastPayment: string;
  contractStatus: 'active' | 'ending_soon' | 'expired';
  issuesReported: number;
  satisfactionScore: number;
  avatar?: string;
}

export default function RoomRentalTenantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      loadTenants();
    }
  }, [status]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      // Mock data
      setTenants([
        {
          id: 't1',
          name: 'Laura Martínez',
          email: 'laura.m@email.com',
          phone: '+34 612 345 678',
          roomId: 'r1',
          roomNumber: '101',
          propertyName: 'Coliving Centro - Edificio A',
          moveInDate: '2024-09-01',
          rent: 650,
          deposit: 1300,
          paymentStatus: 'paid',
          lastPayment: '2025-12-01',
          contractStatus: 'active',
          issuesReported: 2,
          satisfactionScore: 4.5,
        },
        {
          id: 't2',
          name: 'David González',
          email: 'david.g@email.com',
          phone: '+34 623 456 789',
          roomId: 'r2',
          roomNumber: '102',
          propertyName: 'Coliving Centro - Edificio A',
          moveInDate: '2024-06-15',
          rent: 680,
          deposit: 1360,
          paymentStatus: 'paid',
          lastPayment: '2025-12-01',
          contractStatus: 'active',
          issuesReported: 0,
          satisfactionScore: 5.0,
        },
        {
          id: 't3',
          name: 'Ana Rodríguez',
          email: 'ana.r@email.com',
          phone: '+34 634 567 890',
          roomId: 'r3',
          roomNumber: '201',
          propertyName: 'Coliving Centro - Edificio A',
          moveInDate: '2025-11-01',
          rent: 700,
          deposit: 1400,
          paymentStatus: 'pending',
          lastPayment: '2025-11-01',
          contractStatus: 'active',
          issuesReported: 1,
          satisfactionScore: 4.0,
        },
        {
          id: 't4',
          name: 'Carlos López',
          email: 'carlos.l@email.com',
          phone: '+34 645 678 901',
          roomId: 'r4',
          roomNumber: '202',
          propertyName: 'Coliving Centro - Edificio A',
          moveInDate: '2024-03-01',
          moveOutDate: '2026-03-01',
          rent: 720,
          deposit: 1440,
          paymentStatus: 'late',
          lastPayment: '2025-11-01',
          contractStatus: 'ending_soon',
          issuesReported: 5,
          satisfactionScore: 3.2,
        },
      ]);

    } catch (error) {
      toast.error('Error al cargar inquilinos');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      paid: { color: 'bg-green-500', label: 'Al día', icon: CheckCircle },
      pending: { color: 'bg-yellow-500', label: 'Pendiente', icon: Clock },
      late: { color: 'bg-red-500', label: 'Moroso', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getContractStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-500', label: 'Activo' },
      ending_soon: { color: 'bg-yellow-500', label: 'Próximo a Vencer' },
      expired: { color: 'bg-red-500', label: 'Vencido' },
    };
    const { color, label } = config[status as keyof typeof config] || config.active;
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

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.roomNumber.includes(searchTerm)
  );

  const totalRent = tenants.reduce((sum, t) => sum + t.rent, 0);
  const paidCount = tenants.filter(t => t.paymentStatus === 'paid').length;
  const activeCount = tenants.filter(t => t.contractStatus === 'active').length;

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando inquilinos...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Inquilinos</h1>
                <p className="text-muted-foreground mt-2">
                  Control completo de inquilinos por habitación
                </p>
              </div>
              <Button onClick={() => router.push('/room-rental/tenants/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Inquilino
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Inquilinos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tenants.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCount} con contrato activo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRent)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Alquileres</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pagos al Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {paidCount} / {tenants.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((paidCount / tenants.length) * 100)}% cobranza
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Satisfacción Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(tenants.reduce((sum, t) => sum + t.satisfactionScore, 0) / tenants.length).toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">sobre 5.0</p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o número de habitación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tenants List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {tenant.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tenant.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Home className="h-3 w-3" />
                            Habitación {tenant.roomNumber}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {getPaymentStatusBadge(tenant.paymentStatus)}
                        {getContractStatusBadge(tenant.contractStatus)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Alquiler Mensual</p>
                        <p className="font-bold text-lg">{formatCurrency(tenant.rent)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Fianza</p>
                        <p className="font-medium">{formatCurrency(tenant.deposit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Entrada</p>
                        <p className="font-medium">{formatDate(tenant.moveInDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Último Pago</p>
                        <p className="font-medium">{formatDate(tenant.lastPayment)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Incidencias:</span>{' '}
                          <span className={`font-medium ${tenant.issuesReported > 3 ? 'text-red-600' : ''}`}>
                            {tenant.issuesReported}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Satisfacción:</span>{' '}
                          <span className="font-medium">
                            {tenant.satisfactionScore}/5.0 ⭐
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/room-rental/tenants/${tenant.id}`)}
                      >
                        Ver Perfil
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => toast.info('Enviando mensaje...')}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Contactar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTenants.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron inquilinos</h3>
                  <p className="text-muted-foreground mb-4">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </AuthenticatedLayout>
  );
}

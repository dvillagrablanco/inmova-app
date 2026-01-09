'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Rocket,
  Search,
  RefreshCw,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Users,
  Building2,
  FileText,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  Eye,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  icon: any;
}

interface CompanyOnboarding {
  id: string;
  nombre: string;
  email: string;
  phone?: string;
  plan: string;
  createdAt: string;
  status: 'in_progress' | 'completed' | 'stuck' | 'abandoned';
  progress: number;
  assignedTo?: string;
  lastActivity?: string;
  steps: OnboardingStep[];
  metrics: {
    usersCreated: number;
    buildingsAdded: number;
    tenantsAdded: number;
    firstPaymentReceived: boolean;
  };
}

interface OnboardingStats {
  total: number;
  inProgress: number;
  completed: number;
  stuck: number;
  abandoned: number;
  avgCompletionDays: number;
  conversionRate: number;
  thisWeekSignups: number;
}

const ONBOARDING_STEPS = [
  { id: 'account', name: 'Cuenta Creada', description: 'Registro completado', icon: UserPlus },
  { id: 'profile', name: 'Perfil Completo', description: 'Datos de empresa', icon: Building2 },
  { id: 'firstUser', name: 'Primer Usuario', description: 'Usuario adicional creado', icon: Users },
  {
    id: 'firstBuilding',
    name: 'Primera Propiedad',
    description: 'Edificio/propiedad creada',
    icon: Building2,
  },
  { id: 'firstTenant', name: 'Primer Inquilino', description: 'Inquilino registrado', icon: Users },
  { id: 'firstContract', name: 'Primer Contrato', description: 'Contrato creado', icon: FileText },
  {
    id: 'payment',
    name: 'Pago Configurado',
    description: 'Método de pago añadido',
    icon: CreditCard,
  },
  { id: 'activation', name: 'Cuenta Activada', description: 'Plan activo', icon: CheckCircle2 },
];

// Datos de ejemplo
const MOCK_COMPANIES: CompanyOnboarding[] = [
  {
    id: '1',
    nombre: 'Inmobiliaria García',
    email: 'info@inmobiliaria-garcia.com',
    phone: '+34 612 345 678',
    plan: 'Professional',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    progress: 62,
    assignedTo: 'María López',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    steps: [
      {
        ...ONBOARDING_STEPS[0],
        completed: true,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        ...ONBOARDING_STEPS[1],
        completed: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        ...ONBOARDING_STEPS[2],
        completed: true,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        ...ONBOARDING_STEPS[3],
        completed: true,
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        ...ONBOARDING_STEPS[4],
        completed: true,
        completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      { ...ONBOARDING_STEPS[5], completed: false },
      { ...ONBOARDING_STEPS[6], completed: false },
      { ...ONBOARDING_STEPS[7], completed: false },
    ],
    metrics: {
      usersCreated: 3,
      buildingsAdded: 2,
      tenantsAdded: 5,
      firstPaymentReceived: false,
    },
  },
  {
    id: '2',
    nombre: 'Gestiones Martínez SL',
    email: 'contacto@gestiones-martinez.es',
    plan: 'Starter',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'stuck',
    progress: 25,
    lastActivity: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    steps: [
      {
        ...ONBOARDING_STEPS[0],
        completed: true,
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        ...ONBOARDING_STEPS[1],
        completed: true,
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { ...ONBOARDING_STEPS[2], completed: false },
      { ...ONBOARDING_STEPS[3], completed: false },
      { ...ONBOARDING_STEPS[4], completed: false },
      { ...ONBOARDING_STEPS[5], completed: false },
      { ...ONBOARDING_STEPS[6], completed: false },
      { ...ONBOARDING_STEPS[7], completed: false },
    ],
    metrics: {
      usersCreated: 1,
      buildingsAdded: 0,
      tenantsAdded: 0,
      firstPaymentReceived: false,
    },
  },
  {
    id: '3',
    nombre: 'Alquileres Premium',
    email: 'admin@alquileres-premium.com',
    phone: '+34 698 765 432',
    plan: 'Enterprise',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    progress: 100,
    assignedTo: 'Carlos Ruiz',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    steps: ONBOARDING_STEPS.map((step, i) => ({
      ...step,
      completed: true,
      completedAt: new Date(Date.now() - (14 - i * 2) * 24 * 60 * 60 * 1000).toISOString(),
    })),
    metrics: {
      usersCreated: 8,
      buildingsAdded: 12,
      tenantsAdded: 45,
      firstPaymentReceived: true,
    },
  },
  {
    id: '4',
    nombre: 'Pisos Centro Madrid',
    email: 'info@pisoscentromadrid.es',
    plan: 'Professional',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
    progress: 12,
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    steps: [
      {
        ...ONBOARDING_STEPS[0],
        completed: true,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { ...ONBOARDING_STEPS[1], completed: false },
      { ...ONBOARDING_STEPS[2], completed: false },
      { ...ONBOARDING_STEPS[3], completed: false },
      { ...ONBOARDING_STEPS[4], completed: false },
      { ...ONBOARDING_STEPS[5], completed: false },
      { ...ONBOARDING_STEPS[6], completed: false },
      { ...ONBOARDING_STEPS[7], completed: false },
    ],
    metrics: {
      usersCreated: 1,
      buildingsAdded: 0,
      tenantsAdded: 0,
      firstPaymentReceived: false,
    },
  },
];

const MOCK_STATS: OnboardingStats = {
  total: 45,
  inProgress: 12,
  completed: 28,
  stuck: 3,
  abandoned: 2,
  avgCompletionDays: 8.5,
  conversionRate: 62,
  thisWeekSignups: 7,
};

const STATUS_CONFIG = {
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  stuck: { label: 'Atascado', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  abandoned: { label: 'Abandonado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function OnboardingTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyOnboarding[]>([]);
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOnboarding | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
        toast.error('Solo Super Admin puede acceder a esta página');
        return;
      }
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      // En producción, esto se conectaría a una API real
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filtered = [...MOCK_COMPANIES];

      if (statusFilter !== 'all') {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
      if (planFilter !== 'all') {
        filtered = filtered.filter((c) => c.plan.toLowerCase() === planFilter.toLowerCase());
      }
      if (searchTerm) {
        filtered = filtered.filter(
          (c) =>
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setCompanies(filtered);
      setStats(MOCK_STATS);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'super_admin') {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, planFilter, searchTerm]);

  const handleSendReminder = async (companyId: string) => {
    toast.success('Recordatorio enviado correctamente');
  };

  const handleAssignAgent = async (companyId: string) => {
    toast.info('Funcionalidad de asignación próximamente');
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Rocket className="h-8 w-8 text-indigo-600" />
              Onboarding Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Seguimiento del proceso de activación de nuevos clientes
            </p>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En Progreso</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Atascados</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.stuck}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversión</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.conversionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio completar onboarding</p>
                    <p className="text-xl font-bold">{stats.avgCompletionDays} días</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registros esta semana</p>
                    <p className="text-xl font-bold">{stats.thisWeekSignups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total clientes</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="stuck">Atascado</SelectItem>
                  <SelectItem value="abandoned">Abandonado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes en Onboarding</CardTitle>
            <CardDescription>{companies.length} clientes encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => {
                    const StatusIcon = STATUS_CONFIG[company.status].icon;
                    const daysSinceActivity = company.lastActivity
                      ? differenceInDays(new Date(), new Date(company.lastActivity))
                      : 0;

                    return (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{company.nombre}</p>
                            <p className="text-sm text-muted-foreground">{company.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{company.progress}%</span>
                            </div>
                            <Progress value={company.progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_CONFIG[company.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[company.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {company.lastActivity ? (
                              <>
                                {format(new Date(company.lastActivity), 'dd/MM/yyyy HH:mm', {
                                  locale: es,
                                })}
                                {daysSinceActivity > 2 && (
                                  <p className="text-xs text-yellow-600">
                                    Hace {daysSinceActivity} días
                                  </p>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedCompany(company)}
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {company.status === 'stuck' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendReminder(company.id)}
                                title="Enviar recordatorio"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Company Detail Dialog */}
        <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalle de Onboarding</DialogTitle>
              <DialogDescription>{selectedCompany?.nombre}</DialogDescription>
            </DialogHeader>
            {selectedCompany && (
              <div className="space-y-6">
                {/* Company Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">{selectedCompany.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plan</label>
                    <p className="mt-1">{selectedCompany.plan}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registro</label>
                    <p className="mt-1">
                      {format(new Date(selectedCompany.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
                    <p className="mt-1">{selectedCompany.assignedTo || 'Sin asignar'}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progreso del Onboarding</span>
                    <span className="text-sm font-medium">{selectedCompany.progress}%</span>
                  </div>
                  <Progress value={selectedCompany.progress} className="h-3" />
                </div>

                {/* Steps */}
                <div>
                  <h4 className="font-semibold mb-4">Pasos del Onboarding</h4>
                  <div className="space-y-3">
                    {selectedCompany.steps.map((step, index) => {
                      const StepIcon = step.icon;
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-4 p-3 rounded-lg ${
                            step.completed ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-full ${
                              step.completed ? 'bg-green-100' : 'bg-gray-200'
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${step.completed ? 'text-green-700' : ''}`}>
                              {step.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                          {step.completedAt && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(step.completedAt), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="font-semibold mb-4">Métricas de Uso</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{selectedCompany.metrics.usersCreated}</p>
                      <p className="text-xs text-muted-foreground">Usuarios</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{selectedCompany.metrics.buildingsAdded}</p>
                      <p className="text-xs text-muted-foreground">Propiedades</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{selectedCompany.metrics.tenantsAdded}</p>
                      <p className="text-xs text-muted-foreground">Inquilinos</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Badge
                        className={
                          selectedCompany.metrics.firstPaymentReceived
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {selectedCompany.metrics.firstPaymentReceived ? 'Pago OK' : 'Pendiente'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Primer Pago</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => handleSendReminder(selectedCompany.id)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Recordatorio
                  </Button>
                  <Button variant="outline" onClick={() => handleAssignAgent(selectedCompany.id)}>
                    <Users className="mr-2 h-4 w-4" />
                    Asignar Agente
                  </Button>
                  <Button onClick={() => router.push(`/admin/clientes/${selectedCompany.id}`)}>
                    Ver Cliente Completo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

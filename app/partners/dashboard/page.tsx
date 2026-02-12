'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  TrendingUp,
  Users,
  Euro,
  Award,
  Target,
  Share2,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  Trophy,
  Star,
  Gift,
  BarChart3,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PartnerStats {
  level: string;
  activeClients: number;
  monthlyRevenue: number;
  totalEarned: number;
  pendingPayment: number;
  conversionRate: number;
  referralLink: string;
  nextLevelClients: number;
}

interface Client {
  id: string;
  name: string;
  plan: string;
  status: string;
  monthlyValue: number;
  signupDate: string;
  commission: number;
}

interface Commission {
  id: string;
  periodo: string;
  montoComision: number;
  estado: string;
  createdAt: string;
}

const levels = [
  { name: 'Bronze', clients: 10, commission: 20, color: 'text-amber-700' },
  { name: 'Silver', clients: 25, commission: 25, color: 'text-gray-500' },
  { name: 'Gold', clients: 50, commission: 30, color: 'text-yellow-500' },
  { name: 'Platinum', clients: 100, commission: 35, color: 'text-blue-600' },
  { name: 'Diamond', clients: 999, commission: 40, color: 'text-purple-600' },
];

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PartnerStats>({
    level: 'Bronze',
    activeClients: 0,
    monthlyRevenue: 0,
    totalEarned: 0,
    pendingPayment: 0,
    conversionRate: 0,
    referralLink: '',
    nextLevelClients: 0,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener token de localStorage si existe (para partners)
        const partnerToken = localStorage.getItem('partnerToken');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (partnerToken) {
          headers['Authorization'] = `Bearer ${partnerToken}`;
        }

        const response = await fetch('/api/partners/dashboard', {
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          
          // Mapear datos de la API al formato del componente
          const metrics = data.metrics || {};
          const partner = data.partner || {};
          
          // Determinar nivel basado en cantidad de clientes
          const clientCount = metrics.totalClientes || 0;
          let partnerLevel = 'Bronze';
          for (const level of levels) {
            if (clientCount >= level.clients) {
              partnerLevel = level.name;
            }
          }
          
          // Calcular clientes faltantes para el siguiente nivel
          const currentLevelIndex = levels.findIndex(l => l.name === partnerLevel);
          const nextLevel = levels[currentLevelIndex + 1];
          const nextLevelClients = nextLevel ? nextLevel.clients - clientCount : 0;

          setStats({
            level: partnerLevel,
            activeClients: clientCount,
            monthlyRevenue: parseFloat(metrics.totalComisionMes || '0'),
            totalEarned: parseFloat(metrics.totalComisionHistorica || '0'),
            pendingPayment: parseFloat(metrics.totalPendientePago || '0'),
            conversionRate: parseFloat(metrics.tasaConversion || '0'),
            referralLink: `https://inmovaapp.com/partners/register?ref=${partner.id || ''}`,
            nextLevelClients,
          });

          // Mapear clientes
          if (data.clientes && Array.isArray(data.clientes)) {
            setClients(data.clientes.map((c: any) => ({
              id: c.id,
              name: c.company?.nombre || 'Sin nombre',
              plan: c.planContratado || 'Professional',
              status: c.estado || 'active',
              monthlyValue: c.valorMensual || 149,
              signupDate: c.fechaAlta || c.createdAt,
              commission: (c.valorMensual || 149) * ((partner.comisionPorcentaje || 30) / 100),
            })));
          }

          // Mapear comisiones
          if (data.comisiones && Array.isArray(data.comisiones)) {
            setCommissions(data.comisiones);
          }
        } else {
          // Si no hay datos del servidor, mostrar página vacía
        }
      } catch (error) {
        console.error('Error cargando dashboard:', error);
        toast.error('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const currentLevel = levels.find((l) => l.name === stats.level) || levels[0];
  const nextLevel = levels[levels.findIndex((l) => l.name === stats.level) + 1];
  const progressToNext = nextLevel ? (stats.activeClients / nextLevel.clients) * 100 : 100;

  const copyReferralLink = () => {
    if (stats.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      toast.success('Link copiado al portapapeles!');
    }
  };

  const monthlyGrowth = 12.5; // Estimado
  const yearProjection = stats.monthlyRevenue * 12 * 1.1;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Skeleton className="h-32 w-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Partner</h1>
            <p className="text-muted-foreground">Bienvenido de nuevo! Aquí está tu rendimiento</p>
          </div>

          <Badge className="text-lg px-4 py-2" variant="outline">
            <Trophy className={`mr-2 h-5 w-5 ${currentLevel.color}`} />
            Nivel {stats.level}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />+{monthlyGrowth}% vs mes anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeClients}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.nextLevelClients > 0 
                  ? `${stats.nextLevelClients} para ${nextLevel?.name}`
                  : 'Nivel máximo alcanzado'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalEarned.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Desde el inicio</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pago Pendiente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.pendingPayment.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Próximo pago el día 5</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Level */}
        {nextLevel && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Progreso a {nextLevel.name}</CardTitle>
                <Badge>
                  {stats.activeClients}/{nextLevel.clients} clientes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressToNext} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Te faltan {stats.nextLevelClients} clientes
                </span>
                <span className="font-medium">
                  +{nextLevel.commission - currentLevel.commission}% comisión
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Link */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Tu Link de Referido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={stats.referralLink}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-white"
              />
              <Button onClick={copyReferralLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Materiales de Marketing
              </Button>
              <Button variant="outline" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Stats de Clicks
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Mis Clientes</TabsTrigger>
            <TabsTrigger value="earnings">Historial de Pagos</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Activos ({stats.activeClients})</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Fecha Alta</TableHead>
                        <TableHead>Valor Mensual</TableHead>
                        <TableHead>Tu Comisión</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{client.plan}</Badge>
                          </TableCell>
                          <TableCell>
                            {client.signupDate ? format(new Date(client.signupDate), 'dd MMM yyyy', {
                              locale: es,
                            }) : '-'}
                          </TableCell>
                          <TableCell>€{client.monthlyValue}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            €{client.commission.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.status === 'active' || client.status === 'activo' ? 'default' : 'secondary'}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {client.status === 'active' || client.status === 'activo' ? 'Activo' : client.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aún no tienes clientes referidos</p>
                    <p className="text-sm">Comparte tu link de referido para empezar a ganar comisiones</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Importe</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell>{commission.periodo}</TableCell>
                          <TableCell>Comisiones {commission.periodo}</TableCell>
                          <TableCell className="font-medium">€{commission.montoComision.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={commission.estado === 'PAID' ? 'default' : 'secondary'}>
                              {commission.estado === 'PAID' ? 'Pagado' : 
                               commission.estado === 'APPROVED' ? 'Aprobado' : 
                               commission.estado === 'PENDING' ? 'Pendiente' : commission.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aún no tienes comisiones registradas</p>
                    <p className="text-sm">Las comisiones aparecerán aquí cuando tus clientes estén activos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tasa de Conversión</span>
                      <span className="font-bold">{stats.conversionRate}%</span>
                    </div>
                    <Progress value={stats.conversionRate} />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Clientes Activos</span>
                      <span className="font-bold">{stats.activeClients}</span>
                    </div>
                    <Progress value={Math.min(stats.activeClients, 100)} />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nivel de Comisión</span>
                      <span className="font-bold">{currentLevel.commission}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proyección Anual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Ingresos estimados (año 1)</div>
                    <div className="text-3xl font-bold">€{yearProjection.toLocaleString()}</div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Comisiones recurrentes</span>
                      <span>€{(stats.monthlyRevenue * 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimación crecimiento (10%)</span>
                      <span>€{(stats.monthlyRevenue * 12 * 0.1).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>TOTAL PROYECTADO</span>
                      <span className="text-green-600">
                        €{yearProjection.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-green-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button className="w-full" variant="outline" onClick={copyReferralLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir Link
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar Materiales
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push('/partners/support')}
              >
                <Gift className="mr-2 h-4 w-4" />
                Obtener Ayuda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {nextLevel && (
          <Card>
            <CardHeader>
              <CardTitle>Próximos Hitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Alcanzar nivel {nextLevel.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Consigue {stats.nextLevelClients} clientes más para {nextLevel.commission}% de
                    comisión
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Bono Trimestral</div>
                  <div className="text-sm text-muted-foreground">
                    Cumple tus objetivos para bonus adicionales
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Referir un Partner</div>
                  <div className="text-sm text-muted-foreground">
                    Gana 10% de sus comisiones (multinivel)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

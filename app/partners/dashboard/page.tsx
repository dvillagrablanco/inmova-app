'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Euro,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Download,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  ChevronRight,
  Building2,
  Shield,
  Landmark,
  GraduationCap,
  Briefcase,
  Wrench,
  Scale,
  ArrowUpRight,
  Settings,
  HelpCircle,
  FileText,
  BarChart3,
  Calculator,
  Send,
  Link2,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

// Partner tools by type
const PARTNER_TOOLS: Record<string, any[]> = {
  BANCO: [
    { id: 'mortgage-simulator', name: 'Simulador de Hipotecas', icon: Calculator, description: 'Widget integrable en tus canales', href: '/partners/tools/mortgage-simulator' },
    { id: 'property-valuation', name: 'Valoración de Inmuebles', icon: Building2, description: 'API de valoración automática', href: '/partners/tools/valuation-api' },
    { id: 'lead-capture', name: 'Captura de Leads', icon: Users, description: 'Formularios personalizados', href: '/partners/tools/lead-capture' },
  ],
  MULTIFAMILY_OFFICE: [
    { id: 'portfolio-report', name: 'Reporting de Portfolio', icon: BarChart3, description: 'Informes financieros avanzados', href: '/partners/tools/portfolio-report' },
    { id: 'white-label', name: 'White Label', icon: Building2, description: 'Tu marca, nuestra tecnología', href: '/partners/tools/white-label' },
    { id: 'api-access', name: 'Acceso API', icon: Link2, description: 'Integración con tus sistemas', href: '/partners/tools/api-docs' },
  ],
  ESCUELA_NEGOCIO: [
    { id: 'sandbox', name: 'Sandbox Educativo', icon: GraduationCap, description: 'Entorno de pruebas para alumnos', href: '/partners/tools/sandbox' },
    { id: 'case-studies', name: 'Casos de Estudio', icon: FileText, description: 'Datos reales anonimizados', href: '/partners/tools/case-studies' },
    { id: 'certifications', name: 'Certificaciones', icon: CheckCircle2, description: 'Programa de certificación', href: '/partners/tools/certifications' },
  ],
  ASEGURADORA: [
    { id: 'insurance-quote', name: 'Cotizador de Seguros', icon: Shield, description: 'Widget de cotización integrado', href: '/partners/tools/insurance-quote' },
    { id: 'risk-api', name: 'API de Riesgo', icon: BarChart3, description: 'Scoring de inquilinos', href: '/partners/tools/risk-api' },
    { id: 'claims-portal', name: 'Portal de Siniestros', icon: AlertCircle, description: 'Gestión de reclamaciones', href: '/partners/tools/claims' },
  ],
  SERVICIOS: [
    { id: 'marketplace', name: 'Marketplace', icon: Wrench, description: 'Perfil en el marketplace', href: '/partners/tools/marketplace-profile' },
    { id: 'job-management', name: 'Gestión de Trabajos', icon: Briefcase, description: 'Asignación y seguimiento', href: '/partners/tools/jobs' },
    { id: 'invoicing', name: 'Facturación', icon: FileText, description: 'Facturación integrada', href: '/partners/tools/invoicing' },
  ],
  LEGAL: [
    { id: 'legal-templates', name: 'Plantillas Legales', icon: FileText, description: 'Documentos personalizables', href: '/partners/tools/templates' },
    { id: 'consultations', name: 'Consultas', icon: HelpCircle, description: 'Sistema de consultas', href: '/partners/tools/consultations' },
    { id: 'mediation', name: 'Mediación', icon: Scale, description: 'Plataforma de mediación', href: '/partners/tools/mediation' },
  ],
};

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PAID: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-purple-100 text-purple-800',
};

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('partner_token');
      
      if (!token) {
        router.push('/partners/login');
        return;
      }

      const response = await fetch('/api/partners/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('partner_token');
        router.push('/partners/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('partner_token');
      const response = await fetch('/api/partners/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });

      if (response.ok) {
        toast.success('Invitación enviada correctamente');
        setInviteDialogOpen(false);
        setInviteForm({ name: '', email: '', phone: '', company: '', notes: '' });
        fetchDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error enviando invitación');
      }
    } catch (error) {
      toast.error('Error enviando invitación');
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${dashboardData?.partner?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Enlace copiado al portapapeles');
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!dashboardData) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">No se pudieron cargar los datos</h2>
          <Button onClick={fetchDashboardData}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  const { partner, metrics, clientes, comisiones, invitacionesRecientes } = dashboardData;
  const partnerTools = PARTNER_TOOLS[partner.tipo] || [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenido, {partner.nombre}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={STATUS_COLORS[partner.estado]}>
                {partner.estado}
              </Badge>
              <Badge variant="outline">
                {partner.tipo.replace('_', ' ')}
              </Badge>
              <span className="text-muted-foreground">
                Comisión: {partner.comisionPorcentaje}%
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyReferralLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar enlace
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva invitación
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalClientes}</div>
              <p className="text-xs text-muted-foreground">
                +{metrics.invitacionesAceptadas} este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comisión del Mes</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{metrics.totalComisionMes}</div>
              <p className="text-xs text-muted-foreground">
                Recurrente mensual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Pago</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{metrics.totalPendientePago}</div>
              <p className="text-xs text-muted-foreground">
                Próximo pago: día 1
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.tasaConversion}%</div>
              <Progress 
                value={parseFloat(metrics.tasaConversion)} 
                className="h-2 mt-2" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="clients">Clientes ({metrics.totalClientes})</TabsTrigger>
            <TabsTrigger value="invitations">Invitaciones ({metrics.invitacionesPendientes})</TabsTrigger>
            <TabsTrigger value="commissions">Comisiones</TabsTrigger>
            <TabsTrigger value="tools">Herramientas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar invitación personalizada
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={copyReferralLink}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Copiar enlace de referido
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/partners/materials')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar materiales de marketing
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/partners/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar branding
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento Mensual</CardTitle>
                  <CardDescription>Comisiones de los últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {comisiones.slice(0, 6).map((comision: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4">
                        <span className="w-20 text-sm text-muted-foreground">
                          {comision.periodo}
                        </span>
                        <Progress 
                          value={Math.min(100, (comision.montoComision / 1000) * 100)} 
                          className="flex-1"
                        />
                        <span className="w-20 text-right font-medium">
                          €{comision.montoComision.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Partner Tools */}
            {partnerTools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Herramientas para {partner.tipo.replace('_', ' ')}</CardTitle>
                  <CardDescription>
                    Herramientas especializadas para tu tipo de partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {partnerTools.map((tool) => (
                      <Card 
                        key={tool.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(tool.href)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <tool.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{tool.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {tool.description}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitacionesRecientes.slice(0, 5).map((inv: any) => (
                    <div 
                      key={inv.id} 
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{inv.nombre || inv.email}</p>
                          <p className="text-sm text-muted-foreground">{inv.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[inv.estado]}>
                          {inv.estado}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push('/partners/invitations')}
                >
                  Ver todas las invitaciones
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Mis Clientes</CardTitle>
                <CardDescription>
                  Empresas que se han registrado a través de tu enlace
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Sin clientes todavía</h3>
                    <p className="text-muted-foreground mb-4">
                      Envía tu primera invitación para comenzar a generar comisiones
                    </p>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Enviar invitación
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Fecha de alta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map((cliente: any) => (
                        <TableRow key={cliente.id}>
                          <TableCell className="font-medium">
                            {cliente.company?.nombre || 'Sin nombre'}
                          </TableCell>
                          <TableCell>{cliente.company?.email}</TableCell>
                          <TableCell>
                            {new Date(cliente.company?.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[cliente.estado.toUpperCase()]}>
                              {cliente.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
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

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Invitaciones</CardTitle>
                  <CardDescription>
                    {metrics.invitacionesPendientes} pendientes, {metrics.invitacionesAceptadas} aceptadas
                  </CardDescription>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Expira</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitacionesRecientes.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {inv.nombre || '-'}
                        </TableCell>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>{inv.empresa || '-'}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[inv.estado]}>
                            {inv.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {inv.fechaExpiracion 
                            ? new Date(inv.fechaExpiracion).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <Card className="bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    €{metrics.totalComisionHistorica}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pendiente de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    €{metrics.totalPendientePago}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Este Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    €{metrics.totalComisionMes}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Comisiones</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Clientes</TableHead>
                      <TableHead>Monto Base</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comisiones.map((com: any) => (
                      <TableRow key={com.id}>
                        <TableCell className="font-medium">
                          {com.periodo}
                        </TableCell>
                        <TableCell>{com.clientesActivos || '-'}</TableCell>
                        <TableCell>€{com.montoBase?.toFixed(2) || '-'}</TableCell>
                        <TableCell className="font-bold">
                          €{com.montoComision.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[com.estado]}>
                            {com.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {com.fechaPago 
                            ? new Date(com.fechaPago).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partnerTools.map((tool) => (
                <Card 
                  key={tool.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => router.push(tool.href)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <tool.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{tool.name}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Acceder
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {/* Additional Tools for All Partners */}
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Download className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Materiales de Marketing</CardTitle>
                      <CardDescription>Logos, presentaciones, plantillas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/partners/materials')}
                  >
                    Descargar
                    <Download className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Settings className="h-8 w-8 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Configuración de Branding</CardTitle>
                      <CardDescription>Personaliza tu landing page</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/partners/branding')}
                  >
                    Configurar
                    <Settings className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Link2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Documentación API</CardTitle>
                      <CardDescription>Integra Inmova en tus sistemas</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/api-docs')}
                  >
                    Ver docs
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Invite Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Invitación</DialogTitle>
              <DialogDescription>
                Envía una invitación personalizada a un potencial cliente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="Juan García"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="juan@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={inviteForm.company}
                  onChange={(e) => setInviteForm({ ...inviteForm, company: e.target.value })}
                  placeholder="Mi Empresa SL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas internas</Label>
                <Textarea
                  id="notes"
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                  placeholder="Notas sobre este contacto..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setInviteDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar invitación
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

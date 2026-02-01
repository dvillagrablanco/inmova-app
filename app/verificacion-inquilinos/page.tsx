'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  UserCheck,
  Shield,
  CreditCard,
  Briefcase,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Home,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Star,
  TrendingUp,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface VerificationRequest {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyName: string;
  requestDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  score?: number;
  checks: {
    identity: 'pending' | 'verified' | 'failed';
    credit: 'pending' | 'verified' | 'warning' | 'failed';
    employment: 'pending' | 'verified' | 'failed';
    references: 'pending' | 'verified' | 'failed';
    background: 'pending' | 'clear' | 'issues';
  };
  documents: string[];
  notes?: string;
}

export default function VerificacionInquilinosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos desde la API
      const response = await fetch('/api/verificacion-inquilinos');
      
      if (!response.ok) {
        throw new Error('Error al obtener verificaciones');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setRequests(result.data);
      } else {
        // Si no hay datos, mostrar lista vacía
        setRequests([]);
      }
    } catch (error) {
      console.error('Error al cargar verificaciones:', error);
      toast.error('Error al cargar verificaciones');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tenantEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string; icon: any }> = {
      pending: { className: 'bg-gray-500', label: 'Pendiente', icon: Clock },
      in_progress: { className: 'bg-blue-500', label: 'En Proceso', icon: RefreshCw },
      completed: { className: 'bg-green-500', label: 'Completada', icon: CheckCircle2 },
      rejected: { className: 'bg-red-500', label: 'Rechazada', icon: XCircle },
    };
    const { className, label, icon: Icon } = config[status] || config.pending;
    return <Badge className={className}><Icon className="h-3 w-3 mr-1" />{label}</Badge>;
  };

  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'clear':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
      case 'issues':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    avgScore: Math.round(requests.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) / 
      (requests.filter(r => r.score).length || 1)),
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Verificación de Inquilinos</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <UserCheck className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Verificación de Inquilinos</h1>
              <p className="text-muted-foreground">Screening y validación de candidatos</p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />Nueva Verificación
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-gray-600">{stats.pending}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{stats.completed}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Score Promedio</CardTitle></CardHeader>
            <CardContent><div className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}</div></CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o email..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">{req.tenantName}{getStatusBadge(req.status)}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{req.tenantEmail}</span>
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{req.propertyName}</span>
                      </CardDescription>
                    </div>
                  </div>
                  {req.score && (
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(req.score)}`}>{req.score}</div>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    {getCheckIcon(req.checks.identity)}
                    <p className="text-xs mt-1">Identidad</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    {getCheckIcon(req.checks.credit)}
                    <p className="text-xs mt-1">Crédito</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    {getCheckIcon(req.checks.employment)}
                    <p className="text-xs mt-1">Empleo</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    {getCheckIcon(req.checks.references)}
                    <p className="text-xs mt-1">Referencias</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    {getCheckIcon(req.checks.background)}
                    <p className="text-xs mt-1">Antecedentes</p>
                  </div>
                </div>
                {req.notes && (
                  <p className="text-sm text-muted-foreground mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertTriangle className="h-4 w-4 inline mr-1 text-yellow-600" />{req.notes}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedRequest(req)}>
                    <Eye className="h-4 w-4 mr-1" />Ver Detalles
                  </Button>
                  {req.status === 'pending' && <Button size="sm">Iniciar Verificación</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog Nueva Verificación */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Verificación</DialogTitle>
              <DialogDescription>Solicita una verificación de inquilino</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Candidato *</Label>
                <Input placeholder="Nombre completo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="email@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="+34 600 000 000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Seleccionar propiedad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">Piso C/ Mayor 45</SelectItem>
                    <SelectItem value="p2">Apartamento Playa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
              <Button onClick={() => { toast.success('Verificación solicitada'); setShowNewDialog(false); }}>Solicitar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AIDocumentAssistant context="inquilinos" variant="floating" position="bottom-right" />
    </AuthenticatedLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Shield,
  User,
  FileCheck,
  CreditCard,
  History,
  Brain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ==========================================
// TIPOS
// ==========================================

interface ScoringFactor {
  name: string;
  score: number;
  maxScore: number;
  status: 'positive' | 'neutral' | 'negative';
  details: string;
}

interface TenantScore {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  purpose: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  documentationScore: number;
  solvencyScore: number;
  historyScore: number;
  profileScore: number;
  factors: ScoringFactor[];
  aiAnalysis?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  avgScore: number;
}

// ==========================================
// COMPONENTES
// ==========================================

function ScoreGauge({ score, size = 'large' }: { score: number; size?: 'small' | 'large' }) {
  const getColor = () => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = () => {
    if (score >= 75) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (size === 'small') {
    return (
      <div className={`w-10 h-10 rounded-full ${getBgColor()} flex items-center justify-center`}>
        <span className={`font-bold ${getColor()}`}>{score}</span>
      </div>
    );
  }

  return (
    <div className={`w-24 h-24 rounded-full ${getBgColor()} flex flex-col items-center justify-center`}>
      <span className={`text-3xl font-bold ${getColor()}`}>{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: 'Bajo', variant: 'default' as const, icon: CheckCircle },
    medium: { label: 'Medio', variant: 'secondary' as const, icon: AlertTriangle },
    high: { label: 'Alto', variant: 'destructive' as const, icon: XCircle },
  };

  const { label, variant, icon: Icon } = config[level];

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      Riesgo {label}
    </Badge>
  );
}

function TenantCard({ tenant, onView }: { tenant: TenantScore; onView: () => void }) {
  const getStatusColor = () => {
    switch (tenant.status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = () => {
    switch (tenant.status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ScoreGauge score={tenant.totalScore} size="small" />
            <div>
              <p className="font-medium">{tenant.name}</p>
              <p className="text-sm text-muted-foreground">{tenant.purpose} - {tenant.nationality}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge level={tenant.riskLevel} />
            <Badge className={getStatusColor()}>{getStatusLabel()}</Badge>
            <Button variant="ghost" size="icon" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBreakdown({ tenant }: { tenant: TenantScore }) {
  const categories = [
    { name: 'Documentacion', score: tenant.documentationScore, icon: FileCheck },
    { name: 'Solvencia', score: tenant.solvencyScore, icon: CreditCard },
    { name: 'Historial', score: tenant.historyScore, icon: History },
    { name: 'Perfil', score: tenant.profileScore, icon: User },
  ];

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <cat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{cat.name}</span>
            </div>
            <span className="text-sm font-bold">{cat.score}%</span>
          </div>
          <Progress value={cat.score} />
        </div>
      ))}
    </div>
  );
}

function FactorsList({ factors }: { factors: ScoringFactor[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {factors.map((factor, i) => (
        <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
          {getStatusIcon(factor.status)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{factor.name}</p>
              <span className="text-sm text-muted-foreground">
                {factor.score}/{factor.maxScore} pts
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{factor.details}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TenantDetail({ 
  tenant, 
  onClose, 
  onAction 
}: { 
  tenant: TenantScore; 
  onClose: () => void;
  onAction: (action: 'approve' | 'reject') => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    setActionLoading(action);
    try {
      await onAction(action);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>← Volver</Button>
        <div className="flex gap-2">
          {tenant.status === 'pending' && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleAction('reject')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'reject' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Rechazar
              </Button>
              <Button 
                onClick={() => handleAction('approve')}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'approve' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion del Solicitante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              <ScoreGauge score={tenant.totalScore} />
              <RiskBadge level={tenant.riskLevel} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre</span>
                <span className="font-medium">{tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{tenant.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefono</span>
                <span className="font-medium">{tenant.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nacionalidad</span>
                <span className="font-medium">{tenant.nationality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Motivo</span>
                <span className="font-medium">{tenant.purpose}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desglose de puntuacion */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Puntuacion</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown tenant={tenant} />
          </CardContent>
        </Card>

        {/* Analisis IA */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <CardTitle>Analisis IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tenant.aiAnalysis || 'Sin analisis disponible'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Factores detallados */}
      <Card>
        <CardHeader>
          <CardTitle>Factores de Evaluacion</CardTitle>
        </CardHeader>
        <CardContent>
          <FactorsList factors={tenant.factors} />
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PAGINA PRINCIPAL
// ==========================================

export default function ScoringPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantScore[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, pending: 0, rejected: 0, avgScore: 0 });
  const [selectedTenant, setSelectedTenant] = useState<TenantScore | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/media-estancia/scoring?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
        setStats(data.stats || { total: 0, approved: 0, pending: 0, rejected: 0, avgScore: 0 });
      } else {
        console.error('Error fetching scoring data');
        toast.error('Error al cargar datos de scoring');
      }
    } catch (error) {
      console.error('Error fetching scoring data:', error);
      toast.error('Error al cargar datos de scoring');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleSearch = () => {
    setLoading(true);
    fetchData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleNewEvaluation = () => {
    router.push('/inquilinos/nuevo');
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedTenant) return;

    try {
      const response = await fetch('/api/media-estancia/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          action,
          nivelRiesgo: action === 'approve' ? 'bajo' : 'alto',
        }),
      });

      if (response.ok) {
        toast.success(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada');
        setSelectedTenant(null);
        fetchData();
      } else {
        toast.error('Error al procesar la accion');
      }
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Error al procesar la accion');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Scoring de Inquilinos</h1>
            <p className="text-muted-foreground">
              Evaluacion de riesgo para solicitudes de media estancia
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (selectedTenant) {
    return (
      <div className="container mx-auto p-6">
        <TenantDetail 
          tenant={selectedTenant} 
          onClose={() => setSelectedTenant(null)} 
          onAction={handleAction}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scoring de Inquilinos</h1>
          <p className="text-muted-foreground">
            Evaluacion de riesgo para solicitudes de media estancia
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleNewEvaluation}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Evaluacion
          </Button>
        </div>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total evaluados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Rechazados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Buscar
        </Button>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de inquilinos */}
      <div className="space-y-4">
        {tenants.map((tenant) => (
          <TenantCard 
            key={tenant.id} 
            tenant={tenant} 
            onView={() => setSelectedTenant(tenant)}
          />
        ))}

        {tenants.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay evaluaciones</p>
              <p className="text-muted-foreground">
                {filter !== 'all' 
                  ? 'No se encontraron evaluaciones con el filtro seleccionado'
                  : 'Aun no hay inquilinos registrados para evaluar. Agrega inquilinos desde la seccion de Tenants.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

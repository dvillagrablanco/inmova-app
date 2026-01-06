'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

// ==========================================
// DATOS DE EJEMPLO
// ==========================================

const SAMPLE_TENANTS: TenantScore[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@email.com',
    phone: '+34 612 345 678',
    nationality: 'España',
    purpose: 'Trabajo temporal',
    totalScore: 85,
    riskLevel: 'low',
    documentationScore: 90,
    solvencyScore: 82,
    historyScore: 88,
    profileScore: 80,
    factors: [
      { name: 'DNI verificado', score: 10, maxScore: 10, status: 'positive', details: 'Documento válido hasta 2028' },
      { name: 'Contrato laboral', score: 15, maxScore: 15, status: 'positive', details: 'Contrato indefinido en empresa verificada' },
      { name: 'Ingresos estables', score: 12, maxScore: 15, status: 'neutral', details: 'Ingresos 3x renta mensual' },
      { name: 'Sin incidencias previas', score: 20, maxScore: 20, status: 'positive', details: 'Historial limpio en bases de datos' },
      { name: 'Referencias positivas', score: 8, maxScore: 10, status: 'positive', details: '2 referencias verificadas' },
    ],
    aiAnalysis: 'Perfil de bajo riesgo. La inquilina presenta documentación completa y verificada, con ingresos estables que superan 3 veces la renta mensual. Su historial de alquiler es impecable con referencias positivas de anteriores propietarios. Se recomienda aprobar la solicitud.',
    createdAt: new Date('2026-01-05'),
    status: 'approved',
  },
  {
    id: '2',
    name: 'Marco Rossi',
    email: 'marco.rossi@email.com',
    phone: '+39 333 456 789',
    nationality: 'Italia',
    purpose: 'Estudios',
    totalScore: 68,
    riskLevel: 'medium',
    documentationScore: 75,
    solvencyScore: 60,
    historyScore: 70,
    profileScore: 65,
    factors: [
      { name: 'Pasaporte verificado', score: 10, maxScore: 10, status: 'positive', details: 'Pasaporte italiano válido' },
      { name: 'Matrícula universitaria', score: 10, maxScore: 10, status: 'positive', details: 'Máster en IE Business School' },
      { name: 'Aval parental', score: 10, maxScore: 15, status: 'neutral', details: 'Aval presentado, pendiente verificar' },
      { name: 'Sin historial en España', score: 0, maxScore: 20, status: 'negative', details: 'Primera estancia en el país' },
      { name: 'Depósito adicional', score: 8, maxScore: 10, status: 'positive', details: 'Dispuesto a pagar 3 meses de fianza' },
    ],
    aiAnalysis: 'Perfil de riesgo medio. Estudiante internacional sin historial previo en España, lo que dificulta la verificación. Sin embargo, presenta documentación académica válida y ofrece garantías adicionales (aval parental + depósito extra). Se recomienda aprobar con condiciones: aval parental verificado y 3 meses de fianza.',
    createdAt: new Date('2026-01-04'),
    status: 'pending',
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+44 777 888 999',
    nationality: 'Reino Unido',
    purpose: 'Trabajo temporal',
    totalScore: 45,
    riskLevel: 'high',
    documentationScore: 50,
    solvencyScore: 40,
    historyScore: 45,
    profileScore: 45,
    factors: [
      { name: 'Pasaporte verificado', score: 10, maxScore: 10, status: 'positive', details: 'Pasaporte británico válido' },
      { name: 'Contrato laboral', score: 5, maxScore: 15, status: 'negative', details: 'Contrato temporal de 2 meses' },
      { name: 'Ingresos', score: 5, maxScore: 15, status: 'negative', details: 'Ingresos no verificables completamente' },
      { name: 'Incidencia previa', score: 0, maxScore: 20, status: 'negative', details: 'Impago registrado en 2024' },
      { name: 'Sin referencias', score: 0, maxScore: 10, status: 'negative', details: 'No presenta referencias' },
    ],
    aiAnalysis: 'Perfil de alto riesgo. El solicitante presenta un historial de impago previo y documentación incompleta. Los ingresos declarados no son fácilmente verificables y el contrato laboral es de muy corta duración. Se recomienda rechazar o solicitar garantías adicionales significativas (aval bancario + 6 meses de fianza).',
    createdAt: new Date('2026-01-03'),
    status: 'rejected',
  },
];

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
              <p className="text-sm text-muted-foreground">{tenant.purpose} • {tenant.nationality}</p>
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
    { name: 'Documentación', score: tenant.documentationScore, icon: FileCheck },
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

function TenantDetail({ tenant, onClose }: { tenant: TenantScore; onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose}>← Volver</Button>
        <div className="flex gap-2">
          {tenant.status === 'pending' && (
            <>
              <Button variant="destructive">Rechazar</Button>
              <Button>Aprobar</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Solicitante</CardTitle>
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
                <span className="text-muted-foreground">Teléfono</span>
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

        {/* Desglose de puntuación */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Puntuación</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown tenant={tenant} />
          </CardContent>
        </Card>

        {/* Análisis IA */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <CardTitle>Análisis IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tenant.aiAnalysis}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Factores detallados */}
      <Card>
        <CardHeader>
          <CardTitle>Factores de Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <FactorsList factors={tenant.factors} />
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function ScoringPage() {
  const [selectedTenant, setSelectedTenant] = useState<TenantScore | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTenants = SAMPLE_TENANTS.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (selectedTenant) {
    return (
      <div className="container mx-auto p-6">
        <TenantDetail tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
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
            Evaluación de riesgo para solicitudes de media estancia
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Evaluación
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{SAMPLE_TENANTS.length}</p>
            <p className="text-sm text-muted-foreground">Total evaluados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {SAMPLE_TENANTS.filter(t => t.status === 'approved').length}
            </p>
            <p className="text-sm text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {SAMPLE_TENANTS.filter(t => t.status === 'pending').length}
            </p>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">
              {SAMPLE_TENANTS.filter(t => t.status === 'rejected').length}
            </p>
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
            className="pl-10"
          />
        </div>
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
        {filteredTenants.map((tenant) => (
          <TenantCard 
            key={tenant.id} 
            tenant={tenant} 
            onView={() => setSelectedTenant(tenant)}
          />
        ))}

        {filteredTenants.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay evaluaciones</p>
              <p className="text-muted-foreground">
                No se encontraron evaluaciones con los filtros seleccionados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

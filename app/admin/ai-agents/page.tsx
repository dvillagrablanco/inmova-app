'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Bot,
  Brain,
  Wrench,
  Users,
  TrendingUp,
  Scale,
  Briefcase,
  MessageSquare,
  Activity,
  Settings,
  Play,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Cpu,
  FileText,
  ShieldCheck,
  HeadphonesIcon,
  Megaphone,
  Sparkles,
  ExternalLink,
  LineChart,
  PieChart,
  AlertCircle,
} from 'lucide-react';

// Tipos
interface AgentInfo {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  status: 'active' | 'idle' | 'error' | 'disabled';
  capabilities: string[];
  metrics: {
    totalInteractions: number;
    successRate: number;
    avgResponseTime: number;
    lastActive: string | null;
  };
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    autoEscalate: boolean;
  };
}

interface SystemStatus {
  configured: boolean;
  connected: boolean;
  apiKeyPresent: boolean;
}

// Componente para obtener el icono correcto
const getAgentIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Wrench: Wrench,
    HeadphonesIcon: HeadphonesIcon,
    Briefcase: Briefcase,
    TrendingUp: TrendingUp,
    Scale: Scale,
    Megaphone: Megaphone,
    Bot: Bot,
  };
  return icons[iconName] || Bot;
};

// Skeleton para carga
function AgentsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Estado vacío
function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No hay agentes configurados</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          El sistema de agentes de IA requiere configuración. Asegúrate de que la API de Anthropic esté configurada correctamente.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
          <Button onClick={() => window.open('/admin/integraciones', '_self')}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Integraciones
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIAgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos reales desde la API
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Cargar estado del sistema
      const statusRes = await fetch('/api/admin/ai-agents/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus({
          configured: statusData.configured,
          connected: statusData.connected,
          apiKeyPresent: statusData.apiKeyPresent,
        });
      }

      // Cargar lista de agentes con métricas
      const agentsRes = await fetch('/api/admin/ai-agents/list?metrics=true');
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        if (agentsData.agents && agentsData.agents.length > 0) {
          setAgents(agentsData.agents.map((a: any) => ({
            ...a,
            status: a.enabled ? 'active' : 'disabled',
            metrics: a.metrics || {
              totalInteractions: 0,
              successRate: 0,
              avgResponseTime: 0,
              lastActive: null,
            },
            config: a.defaultConfig || {
              model: 'claude-3-haiku-20240307',
              temperature: 0.5,
              maxTokens: 4096,
              autoEscalate: true,
            },
          })));
        }
      }
    } catch (error) {
      console.error('Error loading AI agents data:', error);
      toast.error('Error al cargar datos de agentes');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas globales
  const globalStats = agents.length > 0 ? {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.enabled && a.status === 'active').length,
    totalInteractions: agents.reduce((sum, a) => sum + (a.metrics?.totalInteractions || 0), 0),
    avgSuccessRate: agents.length > 0 
      ? (agents.reduce((sum, a) => sum + (a.metrics?.successRate || 0), 0) / agents.length).toFixed(1)
      : '0',
    avgResponseTime: agents.length > 0
      ? (agents.reduce((sum, a) => sum + (parseFloat(String(a.metrics?.avgResponseTime)) || 0), 0) / agents.length).toFixed(2)
      : '0',
  } : null;

  // Toggle estado de agente
  const toggleAgentStatus = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    // Actualizar localmente primero (optimistic update)
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const newEnabled = !a.enabled;
        return {
          ...a,
          enabled: newEnabled,
          status: newEnabled ? 'active' : 'disabled'
        };
      }
      return a;
    }));

    toast.success(agent.enabled ? `${agent.name} desactivado` : `${agent.name} activado`);
  };

  // Probar agente
  const testAgent = async () => {
    if (!selectedAgent || !testMessage.trim()) return;
    
    setIsTestLoading(true);
    setTestResponse('');
    
    try {
      const res = await fetch('/api/admin/ai-agents/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: selectedAgent.type,
          message: testMessage
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setTestResponse(data.response || 'Sin respuesta');
      } else {
        setTestResponse('Error al probar el agente. Verifica la configuración de la API de Anthropic.');
      }
    } catch (error) {
      setTestResponse('Error de conexión al probar el agente.');
    } finally {
      setIsTestLoading(false);
    }
  };

  // Guardar configuración de agente
  const saveAgentConfig = () => {
    if (!selectedAgent) return;
    toast.success(`Configuración de ${selectedAgent.name} guardada`);
    setShowConfigDialog(false);
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <AgentsSkeleton />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Agentes de IA</h1>
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                  v1.0.0
                </Badge>
              </div>
              <p className="text-muted-foreground">Sistema avanzado de agentes especializados con Claude 3.5 Sonnet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {systemStatus && !systemStatus.configured && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                API no configurada
              </Badge>
            )}
            {systemStatus?.configured && !systemStatus.connected && (
              <Badge variant="outline" className="text-amber-600 border-amber-400 gap-1">
                <AlertCircle className="h-3 w-3" />
                Sin conexión
              </Badge>
            )}
            {systemStatus?.configured && systemStatus.connected && (
              <Badge className="bg-green-500 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </Badge>
            )}
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-violet-500 to-purple-500"
              onClick={() => router.push('/admin/community-manager')}
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Community Manager
            </Button>
          </div>
        </div>

        {/* Conexión con Anthropic Claude */}
        <Card className={`mb-6 ${systemStatus?.configured && systemStatus?.connected ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Integración con Anthropic Claude</h3>
                    {systemStatus?.configured && systemStatus?.connected ? (
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    ) : systemStatus?.configured ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sin conexión
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No configurado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {systemStatus?.configured && systemStatus?.connected 
                      ? 'Los agentes de IA están usando Claude 3.5 Sonnet para procesar solicitudes'
                      : 'Configura la API de Anthropic para activar los agentes de IA'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin/integraciones-plataforma/ia')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Claude
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin/integraciones')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Integraciones
                </Button>
              </div>
            </div>
            {systemStatus?.apiKeyPresent && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Modelo activo:</span>
                  <Badge variant="outline">Claude 3.5 Sonnet</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Agentes</p>
                    <p className="text-2xl font-bold">{globalStats.totalAgents}</p>
                  </div>
                  <Bot className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold text-green-600">{globalStats.activeAgents}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Interacciones</p>
                    <p className="text-2xl font-bold">
                      {globalStats.totalInteractions > 0 ? globalStats.totalInteractions.toLocaleString() : '-'}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Éxito Promedio</p>
                    <p className="text-2xl font-bold text-green-600">
                      {parseFloat(globalStats.avgSuccessRate) > 0 ? `${globalStats.avgSuccessRate}%` : '-'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tiempo Resp.</p>
                    <p className="text-2xl font-bold">
                      {parseFloat(globalStats.avgResponseTime) > 0 ? `${globalStats.avgResponseTime}s` : '-'}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contenido principal */}
        {agents.length === 0 ? (
          <EmptyState onRefresh={loadData} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="h-4 w-4" />
                Agentes
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <LineChart className="h-4 w-4" />
                Analíticas
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Agentes Activos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Agentes Disponibles
                    </CardTitle>
                    <CardDescription>Estado de los agentes de IA</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {agents.map((agent) => {
                          const IconComponent = getAgentIcon(agent.icon);
                          return (
                            <div
                              key={agent.id}
                              className={`p-4 rounded-lg border ${agent.enabled ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                                    <IconComponent className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{agent.name}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
                                  </div>
                                </div>
                                <Badge 
                                  variant={agent.status === 'active' ? 'default' : 'secondary'}
                                  className={agent.status === 'active' ? 'bg-green-500' : ''}
                                >
                                  {agent.status === 'active' ? '🟢 Activo' : '⭕ Inactivo'}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="text-center p-2 bg-muted/50 rounded">
                                  <p className="text-xs text-muted-foreground">Interacciones</p>
                                  <p className="font-semibold">
                                    {agent.metrics?.totalInteractions > 0 ? agent.metrics.totalInteractions.toLocaleString() : '-'}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-muted/50 rounded">
                                  <p className="text-xs text-muted-foreground">Éxito</p>
                                  <p className="font-semibold text-green-600">
                                    {agent.metrics?.successRate > 0 ? `${agent.metrics.successRate}%` : '-'}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-muted/50 rounded">
                                  <p className="text-xs text-muted-foreground">Tiempo</p>
                                  <p className="font-semibold">
                                    {agent.metrics?.avgResponseTime > 0 ? `${agent.metrics.avgResponseTime}s` : '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Accesos Rápidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      Accesos Rápidos
                    </CardTitle>
                    <CardDescription>Navega a las funcionalidades de IA</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        className="justify-between h-auto py-4"
                        onClick={() => router.push('/admin/community-manager')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Community Manager</p>
                            <p className="text-xs text-muted-foreground">Gestión de redes sociales y blog</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-between h-auto py-4"
                        onClick={() => router.push('/admin/canva')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Canva Studio</p>
                            <p className="text-xs text-muted-foreground">Crear contenido visual</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-between h-auto py-4"
                        onClick={() => router.push('/admin/integraciones')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Cpu className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Integraciones</p>
                            <p className="text-xs text-muted-foreground">Configurar API de Anthropic</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Capacidades del Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    Capacidades del Sistema de IA
                  </CardTitle>
                  <CardDescription>Características avanzadas del sistema de agentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { icon: Bot, label: 'Multi-Agente', desc: 'Coordinación inteligente' },
                      { icon: MessageSquare, label: 'Tool Calling', desc: 'Acciones automáticas' },
                      { icon: RefreshCw, label: 'Handoff', desc: 'Transferencia fluida' },
                      { icon: Users, label: 'Escalación', desc: 'A humanos' },
                      { icon: BarChart3, label: 'Métricas', desc: 'Monitoreo en tiempo real' },
                      { icon: ShieldCheck, label: 'GDPR', desc: 'Cumplimiento normativo' },
                    ].map((cap, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card text-center">
                        <cap.icon className="h-8 w-8 mx-auto mb-2 text-violet-500" />
                        <p className="font-medium text-sm">{cap.label}</p>
                        <p className="text-xs text-muted-foreground">{cap.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => {
                  const IconComponent = getAgentIcon(agent.icon);
                  return (
                    <Card key={agent.id} className={!agent.enabled ? 'opacity-60' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              <Badge 
                                variant={agent.status === 'active' ? 'default' : 'secondary'}
                                className={agent.status === 'active' ? 'bg-green-500' : ''}
                              >
                                {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={agent.enabled}
                            onCheckedChange={() => toggleAgentStatus(agent.id)}
                          />
                        </div>
                        <CardDescription className="mt-2">{agent.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-muted/50 rounded text-center">
                            <p className="text-xs text-muted-foreground">Interacciones</p>
                            <p className="font-semibold">
                              {agent.metrics?.totalInteractions > 0 ? agent.metrics.totalInteractions.toLocaleString() : '-'}
                            </p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded text-center">
                            <p className="text-xs text-muted-foreground">Éxito</p>
                            <p className="font-semibold text-green-600">
                              {agent.metrics?.successRate > 0 ? `${agent.metrics.successRate}%` : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Capacidades */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Capacidades principales</p>
                          <div className="flex flex-wrap gap-1">
                            {agent.capabilities.slice(0, 3).map((cap, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                            {agent.capabilities.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{agent.capabilities.length - 3} más
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Modelo */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Modelo:</span>
                          <Badge variant="outline">{agent.config?.model || 'claude-3-haiku-20240307'}</Badge>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowTestDialog(true);
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Probar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowConfigDialog(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configurar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {agents.some(a => a.metrics?.totalInteractions > 0) ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Interacciones por Agente */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-violet-500" />
                        Interacciones por Agente
                      </CardTitle>
                      <CardDescription>Distribución de conversaciones</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {agents
                          .filter(a => a.metrics?.totalInteractions > 0)
                          .sort((a, b) => (b.metrics?.totalInteractions || 0) - (a.metrics?.totalInteractions || 0))
                          .map((agent) => {
                            const total = agents.reduce((sum, a) => sum + (a.metrics?.totalInteractions || 0), 0);
                            const percentage = total > 0 ? ((agent.metrics?.totalInteractions || 0) / total * 100).toFixed(1) : 0;
                            const IconComponent = getAgentIcon(agent.icon);
                            return (
                              <div key={agent.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span className="text-sm font-medium">{agent.name}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {agent.metrics?.totalInteractions?.toLocaleString() || 0} ({percentage}%)
                                  </span>
                                </div>
                                <Progress value={parseFloat(String(percentage))} className="h-2" />
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tasa de Éxito */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Tasa de Éxito por Agente
                      </CardTitle>
                      <CardDescription>Porcentaje de resolución satisfactoria</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {agents
                          .filter(a => a.metrics?.successRate > 0)
                          .sort((a, b) => (b.metrics?.successRate || 0) - (a.metrics?.successRate || 0))
                          .map((agent) => {
                            const IconComponent = getAgentIcon(agent.icon);
                            const rate = agent.metrics?.successRate || 0;
                            return (
                              <div key={agent.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span className="text-sm font-medium">{agent.name}</span>
                                  </div>
                                  <span className={`text-sm font-semibold ${rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {rate}%
                                  </span>
                                </div>
                                <Progress 
                                  value={rate} 
                                  className={`h-2 ${rate >= 90 ? '[&>div]:bg-green-500' : rate >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Sin datos de analíticas</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Las analíticas se mostrarán cuando los agentes comiencen a procesar interacciones.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Dialog: Configuración de Agente */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurar {selectedAgent?.name}
              </DialogTitle>
              <DialogDescription>
                Ajusta los parámetros del agente de IA
              </DialogDescription>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo</label>
                  <Select defaultValue={selectedAgent.config?.model || 'claude-3-haiku-20240307'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku (rápido)</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus (potente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Temperatura: {selectedAgent.config?.temperature || 0.5}
                  </label>
                  <Slider
                    defaultValue={[selectedAgent.config?.temperature || 0.5]}
                    max={1}
                    step={0.1}
                    className="py-4"
                  />
                  <p className="text-xs text-muted-foreground">
                    Menor = más determinista, Mayor = más creativo
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Select defaultValue={String(selectedAgent.config?.maxTokens || 4096)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024">1,024</SelectItem>
                      <SelectItem value="2048">2,048</SelectItem>
                      <SelectItem value="4096">4,096</SelectItem>
                      <SelectItem value="8192">8,192</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-Escalación</label>
                    <p className="text-xs text-muted-foreground">
                      Escalar a humanos automáticamente si no puede resolver
                    </p>
                  </div>
                  <Switch defaultChecked={selectedAgent.config?.autoEscalate} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-violet-500 to-purple-500"
                onClick={saveAgentConfig}
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Probar Agente */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Probar {selectedAgent?.name}
              </DialogTitle>
              <DialogDescription>
                Envía un mensaje de prueba al agente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje de prueba</label>
                <Textarea
                  placeholder="Escribe un mensaje para probar el agente..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {testResponse && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Respuesta del agente</label>
                  <div className="p-4 rounded-lg border bg-muted/50 max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                Cerrar
              </Button>
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-500"
                onClick={testAgent}
                disabled={isTestLoading || !testMessage.trim()}
              >
                {isTestLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

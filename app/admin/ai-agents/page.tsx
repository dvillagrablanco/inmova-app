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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Pause,
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
  Eye,
  ArrowUpRight,
  LineChart,
  PieChart,
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
    lastActive: string;
  };
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    autoEscalate: boolean;
  };
}

// Datos de los agentes (mock - en producción vendría de la API)
const AGENTS_DATA: AgentInfo[] = [
  {
    id: 'technical_support',
    type: 'technical_support',
    name: 'Soporte Técnico',
    description: 'Gestiona incidencias de mantenimiento, reparaciones y emergencias técnicas',
    icon: 'Wrench',
    color: 'from-orange-500 to-amber-500',
    enabled: true,
    status: 'active',
    capabilities: [
      'Diagnóstico de averías',
      'Programación de reparaciones',
      'Gestión de proveedores',
      'Alertas de emergencia',
      'Historial de mantenimiento',
      'Presupuestos automáticos'
    ],
    metrics: {
      totalInteractions: 1250,
      successRate: 94.5,
      avgResponseTime: 1.2,
      lastActive: '2026-01-10T12:30:00Z'
    },
    config: {
      model: 'claude-3-5-sonnet',
      temperature: 0.3,
      maxTokens: 4096,
      autoEscalate: true
    }
  },
  {
    id: 'customer_service',
    type: 'customer_service',
    name: 'Atención al Cliente',
    description: 'Responde consultas, gestiona quejas y proporciona soporte general a usuarios',
    icon: 'HeadphonesIcon',
    color: 'from-blue-500 to-cyan-500',
    enabled: true,
    status: 'active',
    capabilities: [
      'Respuesta a FAQs',
      'Gestión de quejas',
      'Información de servicios',
      'Seguimiento de solicitudes',
      'Encuestas de satisfacción',
      'Escalación a humanos'
    ],
    metrics: {
      totalInteractions: 3420,
      successRate: 92.1,
      avgResponseTime: 0.8,
      lastActive: '2026-01-10T14:15:00Z'
    },
    config: {
      model: 'claude-3-5-sonnet',
      temperature: 0.5,
      maxTokens: 2048,
      autoEscalate: true
    }
  },
  {
    id: 'commercial_management',
    type: 'commercial_management',
    name: 'Gestión Comercial',
    description: 'Gestiona leads, oportunidades de venta y desarrollo comercial',
    icon: 'Briefcase',
    color: 'from-green-500 to-emerald-500',
    enabled: true,
    status: 'active',
    capabilities: [
      'Cualificación de leads',
      'Seguimiento de oportunidades',
      'Propuestas comerciales',
      'Análisis de conversión',
      'CRM automatizado',
      'Alertas de seguimiento'
    ],
    metrics: {
      totalInteractions: 890,
      successRate: 88.7,
      avgResponseTime: 1.5,
      lastActive: '2026-01-10T11:45:00Z'
    },
    config: {
      model: 'claude-3-5-sonnet',
      temperature: 0.4,
      maxTokens: 3072,
      autoEscalate: false
    }
  },
  {
    id: 'financial_analysis',
    type: 'financial_analysis',
    name: 'Análisis Financiero',
    description: 'Analiza rentabilidad, ROI, optimiza ingresos y gestiona finanzas',
    icon: 'TrendingUp',
    color: 'from-violet-500 to-purple-500',
    enabled: true,
    status: 'active',
    capabilities: [
      'Cálculo de ROI',
      'Proyecciones financieras',
      'Análisis de rentabilidad',
      'Optimización de precios',
      'Reportes de ingresos',
      'Alertas de morosidad'
    ],
    metrics: {
      totalInteractions: 567,
      successRate: 96.2,
      avgResponseTime: 2.1,
      lastActive: '2026-01-10T10:00:00Z'
    },
    config: {
      model: 'claude-3-5-sonnet',
      temperature: 0.2,
      maxTokens: 4096,
      autoEscalate: true
    }
  },
  {
    id: 'legal_compliance',
    type: 'legal_compliance',
    name: 'Legal y Cumplimiento',
    description: 'Gestiona aspectos legales, contratos y cumplimiento normativo',
    icon: 'Scale',
    color: 'from-rose-500 to-pink-500',
    enabled: true,
    status: 'active',
    capabilities: [
      'Revisión de contratos',
      'Cumplimiento normativo',
      'Alertas regulatorias',
      'Gestión de disputas',
      'Documentación legal',
      'Asesoría RGPD'
    ],
    metrics: {
      totalInteractions: 234,
      successRate: 97.8,
      avgResponseTime: 2.5,
      lastActive: '2026-01-10T09:30:00Z'
    },
    config: {
      model: 'claude-3-5-sonnet',
      temperature: 0.1,
      maxTokens: 4096,
      autoEscalate: true
    }
  },
  {
    id: 'community_manager',
    type: 'community_manager',
    name: 'Community Manager',
    description: 'Gestiona redes sociales, crea contenido y administra el blog',
    icon: 'Megaphone',
    color: 'from-fuchsia-500 to-pink-500',
    enabled: true,
    status: 'active',
    capabilities: [
      'Generación de contenido',
      'Programación de posts',
      'Gestión de redes sociales',
      'Administración de blog',
      'Análisis de engagement',
      'Respuesta a comentarios'
    ],
    metrics: {
      totalInteractions: 156,
      successRate: 91.3,
      avgResponseTime: 1.8,
      lastActive: '2026-01-10T13:00:00Z'
    },
    config: {
      model: 'claude-3-5-sonnet',
      temperature: 0.7,
      maxTokens: 2048,
      autoEscalate: false
    }
  }
];

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

export default function AIAgentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState<AgentInfo[]>(AGENTS_DATA);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    // Verificar si API de Anthropic está configurada
    checkApiStatus();
  }, [status, router]);

  const checkApiStatus = async () => {
    try {
      const res = await fetch('/api/admin/ai-agents/status');
      if (res.ok) {
        const data = await res.json();
        setApiConfigured(data.configured);
      }
    } catch (error) {
      console.error('Error checking API status:', error);
    }
  };

  // Calcular estadísticas globales
  const globalStats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.enabled && a.status === 'active').length,
    totalInteractions: agents.reduce((sum, a) => sum + a.metrics.totalInteractions, 0),
    avgSuccessRate: (agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length).toFixed(1),
    avgResponseTime: (agents.reduce((sum, a) => sum + a.metrics.avgResponseTime, 0) / agents.length).toFixed(2),
  };

  // Toggle estado de agente
  const toggleAgentStatus = (agentId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const newEnabled = !agent.enabled;
        toast.success(newEnabled ? `${agent.name} activado` : `${agent.name} desactivado`);
        return {
          ...agent,
          enabled: newEnabled,
          status: newEnabled ? 'active' : 'disabled'
        };
      }
      return agent;
    }));
  };

  // Probar agente
  const testAgent = async () => {
    if (!selectedAgent || !testMessage.trim()) return;
    
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // Guardar configuración de agente
  const saveAgentConfig = (config: any) => {
    if (!selectedAgent) return;
    
    setAgents(prev => prev.map(agent => {
      if (agent.id === selectedAgent.id) {
        return { ...agent, config: { ...agent.config, ...config } };
      }
      return agent;
    }));
    
    toast.success(`Configuración de ${selectedAgent.name} guardada`);
    setShowConfigDialog(false);
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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
            {!apiConfigured && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                API no configurada
              </Badge>
            )}
            <Button variant="outline" onClick={checkApiStatus}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-violet-500 to-purple-500"
              onClick={() => window.open('/admin/community-manager', '_blank')}
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Community Manager
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
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
                  <p className="text-2xl font-bold">{globalStats.totalInteractions.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-green-600">{globalStats.avgSuccessRate}%</p>
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
                  <p className="text-2xl font-bold">{globalStats.avgResponseTime}s</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
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
                    Agentes Activos
                  </CardTitle>
                  <CardDescription>Estado en tiempo real de los agentes de IA</CardDescription>
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
                                {agent.status === 'active' ? '🟢 Activo' : agent.status === 'disabled' ? '⭕ Desactivado' : '🔴 Error'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="text-xs text-muted-foreground">Interacciones</p>
                                <p className="font-semibold">{agent.metrics.totalInteractions.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="text-xs text-muted-foreground">Éxito</p>
                                <p className="font-semibold text-green-600">{agent.metrics.successRate}%</p>
                              </div>
                              <div className="text-center p-2 bg-muted/50 rounded">
                                <p className="text-xs text-muted-foreground">Tiempo</p>
                                <p className="font-semibold">{agent.metrics.avgResponseTime}s</p>
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
                      onClick={() => window.open('/api-docs', '_blank')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Documentación API</p>
                          <p className="text-xs text-muted-foreground">Integrar agentes en tu app</p>
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5" />
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
                              {agent.status === 'active' ? 'Activo' : agent.status === 'disabled' ? 'Desactivado' : 'Error'}
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
                          <p className="font-semibold">{agent.metrics.totalInteractions.toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-center">
                          <p className="text-xs text-muted-foreground">Éxito</p>
                          <p className="font-semibold text-green-600">{agent.metrics.successRate}%</p>
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
                        <Badge variant="outline">{agent.config.model}</Badge>
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
                    {agents.sort((a, b) => b.metrics.totalInteractions - a.metrics.totalInteractions).map((agent) => {
                      const percentage = ((agent.metrics.totalInteractions / globalStats.totalInteractions) * 100).toFixed(1);
                      const IconComponent = getAgentIcon(agent.icon);
                      return (
                        <div key={agent.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span className="text-sm font-medium">{agent.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {agent.metrics.totalInteractions.toLocaleString()} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={parseFloat(percentage)} className="h-2" />
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
                    {agents.sort((a, b) => b.metrics.successRate - a.metrics.successRate).map((agent) => {
                      const IconComponent = getAgentIcon(agent.icon);
                      return (
                        <div key={agent.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span className="text-sm font-medium">{agent.name}</span>
                            </div>
                            <span className={`text-sm font-semibold ${agent.metrics.successRate >= 90 ? 'text-green-600' : agent.metrics.successRate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                              {agent.metrics.successRate}%
                            </span>
                          </div>
                          <Progress 
                            value={agent.metrics.successRate} 
                            className={`h-2 ${agent.metrics.successRate >= 90 ? '[&>div]:bg-green-500' : agent.metrics.successRate >= 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tiempo de Respuesta */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Tiempo de Respuesta Promedio
                  </CardTitle>
                  <CardDescription>Segundos promedio por respuesta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {agents.map((agent) => {
                      const IconComponent = getAgentIcon(agent.icon);
                      return (
                        <div key={agent.id} className="p-4 rounded-lg border bg-card text-center">
                          <div className={`h-10 w-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <p className="text-2xl font-bold">{agent.metrics.avgResponseTime}s</p>
                          <p className="text-xs text-muted-foreground">{agent.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
                  <Select defaultValue={selectedAgent.config.model}>
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
                    Temperatura: {selectedAgent.config.temperature}
                  </label>
                  <Slider
                    defaultValue={[selectedAgent.config.temperature]}
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
                  <Select defaultValue={selectedAgent.config.maxTokens.toString()}>
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
                  <Switch defaultChecked={selectedAgent.config.autoEscalate} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-violet-500 to-purple-500"
                onClick={() => saveAgentConfig({})}
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
                disabled={isLoading || !testMessage.trim()}
              >
                {isLoading ? (
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

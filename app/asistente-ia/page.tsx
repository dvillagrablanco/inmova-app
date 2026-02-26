'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Bot,
  MessageSquare,
  Mic,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Sparkles,
  Brain,
  Wrench,
  HeadphonesIcon,
  Briefcase,
  TrendingUp,
  Scale,
  Megaphone,
  Settings,
  Activity,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileText,
  Paperclip,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionExecuted?: boolean;
  actionType?: string;
  agentType?: string;
}

interface AgentInfo {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  capabilities: string[];
}

// Mapeo de iconos
const iconMap: Record<string, any> = {
  Wrench: Wrench,
  HeadphonesIcon: HeadphonesIcon,
  Briefcase: Briefcase,
  TrendingUp: TrendingUp,
  Scale: Scale,
  Megaphone: Megaphone,
  Bot: Bot,
  FileText: FileText,
  Sparkles: Sparkles,
};

// Colores de los agentes
const colorMap: Record<string, string> = {
  'orange': 'from-orange-500 to-amber-500',
  'blue': 'from-blue-500 to-cyan-500',
  'green': 'from-green-500 to-emerald-500',
  'purple': 'from-purple-500 to-violet-500',
  'red': 'from-red-500 to-rose-500',
  'yellow': 'from-yellow-500 to-amber-400',
  'indigo': 'from-indigo-500 to-blue-500',
  'teal': 'from-teal-500 to-cyan-500',
  'violet': 'from-violet-500 to-purple-500',
  'fuchsia': 'from-fuchsia-500 to-pink-500',
  'amber': 'from-amber-500 to-orange-500',
  'rose': 'from-rose-500 to-pink-500',
};

export default function AIAssistantPage() {
  const { data: _session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    conversations: 0,
    actionsExecuted: 0,
    successRate: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
      loadAgents();
      loadStats();
    }
  }, [status, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar lista de agentes
  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const res = await fetch('/api/admin/ai-agents/list');
      if (res.ok) {
        const data = await res.json();
        if (data.agents && Array.isArray(data.agents)) {
          const enabledAgents = data.agents.filter((a: AgentInfo) => a.enabled);
          setAgents(enabledAgents);
          // Seleccionar el primer agente por defecto
          if (enabledAgents.length > 0 && !selectedAgent) {
            selectAgent(enabledAgents[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const selectAgent = (agent: AgentInfo) => {
    setSelectedAgent(agent);
    // Mensaje inicial del agente seleccionado
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `¡Hola! 👋 Soy ${agent.name}. ${agent.description}\n\nPuedo ayudarte con:\n${agent.capabilities.slice(0, 5).map(c => `• ${c}`).join('\n')}\n\n¿En qué puedo ayudarte?`,
      timestamp: new Date(),
      agentType: agent.type,
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStats = async () => {
    setStats({
      conversations: messages.length > 1 ? 1 : 0,
      actionsExecuted: messages.filter((m) => m.actionExecuted).length,
      successRate: 95,
    });
  };

  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast.success(`Archivo adjuntado: ${file.name}`);
    }
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !attachedFile) || isTyping || !selectedAgent) return;

    const displayContent = attachedFile
      ? `${inputMessage || 'Analiza este documento'}\n📎 ${attachedFile.name}`
      : inputMessage;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    const currentFile = attachedFile;
    setInputMessage('');
    setAttachedFile(null);
    setIsTyping(true);

    try {
      // If there's a file, route to the appropriate processing API
      if (currentFile) {
        const formData = new FormData();
        formData.append('file', currentFile);
        if (currentInput) formData.append('text', currentInput);
        formData.append('context', `Agente: ${selectedAgent.name}. ${currentInput || 'Analiza este documento.'}`);

        // Detect document type by filename and agent
        const fname = currentFile.name.toLowerCase();
        const isInvestmentAgent = selectedAgent.type === 'financial_analysis';
        const isEscritura = fname.includes('escritura');
        const isContrato = fname.includes('contrato') || fname.includes('arrendamiento') || fname.includes('adenda') || fname.includes('anexo');
        const isPoliza = fname.includes('poliza') || fname.includes('póliza') || fname.includes('seguro');
        const isProposal = isInvestmentAgent && !isEscritura && !isContrato && !isPoliza;

        let apiUrl = '/api/ai/document-analysis';
        if (isEscritura) apiUrl = '/api/ai/process-escritura';
        else if (isContrato) apiUrl = '/api/ai/process-contract';
        else if (isPoliza) apiUrl = '/api/ai/process-insurance';
        else if (isProposal) apiUrl = '/api/investment/analysis/ai-analyze-proposal';

        const fileResponse = await fetch(apiUrl, { method: 'POST', body: formData });

        if (!fileResponse.ok) {
          const err = await fileResponse.json().catch(() => ({ error: 'Error procesando documento' }));
          throw new Error(err.error || 'Error procesando documento');
        }

        const fileData = await fileResponse.json();

        // Build response message from the API result
        let responseContent = '';
        const data = fileData.data || fileData;

        if (data.extracted || data.extractedData) {
          const ext = data.extracted || data.extractedData;
          responseContent = `📄 **Documento procesado: ${currentFile.name}**\n\n`;

          if (ext.resumen) responseContent += ext.resumen + '\n\n';
          if (ext.tipo_escritura) responseContent += `**Tipo:** ${ext.tipo_escritura}\n`;
          if (ext.tipo_documento) responseContent += `**Tipo:** ${ext.tipo_documento}\n`;
          if (ext.tipo_contrato) responseContent += `**Contrato:** ${ext.tipo_contrato}\n`;
          if (ext.precio_total) responseContent += `**Precio:** ${ext.precio_total.toLocaleString('es-ES')}€\n`;
          if (ext.renta_mensual) responseContent += `**Renta:** ${ext.renta_mensual.toLocaleString('es-ES')}€/mes\n`;
          if (ext.arrendatario?.nombre) responseContent += `**Inquilino:** ${ext.arrendatario.nombre}\n`;
          if (ext.comprador?.nombre) responseContent += `**Comprador:** ${ext.comprador.nombre}\n`;
          if (ext.vendedor?.nombre) responseContent += `**Vendedor:** ${ext.vendedor.nombre}\n`;
          if (ext.inmueble?.direccion) responseContent += `**Dirección:** ${ext.inmueble.direccion}\n`;
          if (ext.edificio?.nombre) responseContent += `**Edificio:** ${ext.edificio.nombre}\n`;
          if (ext.unidad) responseContent += `**Unidad:** ${ext.unidad}\n`;

          if (ext.analisisIndependiente?.conclusion) {
            responseContent += `\n**Veredicto:** ${ext.analisisIndependiente.conclusion}\n`;
            if (ext.analisisIndependiente.resumenEjecutivo) responseContent += ext.analisisIndependiente.resumenEjecutivo + '\n';
          }

          if (ext.analisis_ia?.recomendaciones?.length) {
            responseContent += '\n**Recomendaciones:**\n' + ext.analisis_ia.recomendaciones.map((r: string) => `• ${r}`).join('\n');
          }

          if (ext.fincas?.length) responseContent += `\n\n**Fincas:** ${ext.fincas.length} encontradas`;
          if (ext.coberturas?.length) responseContent += `\n**Coberturas:** ${ext.coberturas.length} detectadas`;
        } else if (data.rawAnalysis) {
          responseContent = data.rawAnalysis;
        } else if (data.analysis) {
          responseContent = typeof data.analysis === 'string' ? data.analysis : JSON.stringify(data.analysis, null, 2);
        } else {
          responseContent = 'Documento procesado. ' + JSON.stringify(data).substring(0, 500);
        }

        if (data.actions?.length) {
          responseContent += '\n\n**Acciones realizadas:**\n' + data.actions.map((a: string) => `✓ ${a}`).join('\n');
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          agentType: selectedAgent.type,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Text-only message: use the agents/chat API
        const conversationHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            conversationId: `conv_${Date.now()}`,
            preferredAgent: selectedAgent.type,
            conversationHistory,
          }),
        });

        if (!response.ok) throw new Error('Error en la respuesta');

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || data.message || 'Sin respuesta del agente.',
          timestamp: new Date(),
          actionExecuted: data.type === 'action_executed',
          actionType: data.action?.action,
          agentType: data.agentType || selectedAgent.type,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.type === 'action_executed' && data.action?.success) {
          toast.success('Acción ejecutada automáticamente');
          setStats((prev) => ({
            ...prev,
            actionsExecuted: prev.actionsExecuted + 1,
          }));
        }
      }
    } catch (error: any) {
      logger.error('Error enviando mensaje:', error);
      toast.error(error.message || 'Error al procesar tu mensaje');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${error.message || 'Hubo un error al procesar tu mensaje. Inténtalo de nuevo.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Bot;
    return IconComponent;
  };

  const getGradient = (color: string) => {
    return colorMap[color] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Asistente IA</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl flex items-center gap-2">
              <Brain className="h-6 w-6 text-violet-600" />
              Asistentes IA Especializados
            </h1>
            <p className="text-muted-foreground">
              <Badge variant="outline" className="mr-2 bg-violet-50 text-violet-700">
                Powered by Claude 3.5
              </Badge>
              Selecciona un agente especializado para ayudarte
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAgents}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agentes Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Acciones Automatizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.actionsExecuted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Tasa de Éxito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="h-4 w-4" />
              Seleccionar Agente
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Tab: Selección de Agentes */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agentes IA Especializados</CardTitle>
                <CardDescription>
                  Selecciona un agente especializado según tu necesidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAgents ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gray-200" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-32 bg-gray-200 rounded" />
                              <div className="h-3 w-48 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay agentes disponibles</h3>
                    <p className="text-muted-foreground mb-4">
                      Los agentes de IA no están configurados o activados.
                    </p>
                    <Button onClick={() => router.push('/admin/ai-agents')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Ir a Configuración
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => {
                      const IconComponent = getIcon(agent.icon);
                      const isSelected = selectedAgent?.id === agent.id;
                      return (
                        <Card
                          key={agent.id}
                          className={`cursor-pointer transition-all hover:shadow-lg ${
                            isSelected ? 'ring-2 ring-violet-500 shadow-lg' : ''
                          }`}
                          onClick={() => {
                            selectAgent(agent);
                            setActiveTab('chat');
                          }}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getGradient(agent.color)} flex items-center justify-center flex-shrink-0`}>
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">{agent.name}</h3>
                                  {isSelected && (
                                    <Badge className="bg-violet-500 text-xs">Activo</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {agent.description}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {agent.capabilities.slice(0, 2).map((cap, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {cap}
                                    </Badge>
                                  ))}
                                  {agent.capabilities.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{agent.capabilities.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Chat */}
          <TabsContent value="chat">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Panel de Chat Principal */}
              <Card className="lg:col-span-2">
                <CardHeader className="border-b">
                  {selectedAgent ? (
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(selectedAgent.color)} flex items-center justify-center`}>
                        {(() => {
                          const IconComponent = getIcon(selectedAgent.icon);
                          return <IconComponent className="h-5 w-5 text-white" />;
                        })()}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selectedAgent.name}
                          <Badge variant="outline" className="text-xs">Online</Badge>
                        </CardTitle>
                        <CardDescription>{selectedAgent.description}</CardDescription>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Selecciona un Agente</CardTitle>
                        <CardDescription>Ve a la pestaña &quot;Seleccionar Agente&quot; para comenzar</CardDescription>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[450px] px-6">
                    <div className="space-y-4 py-4">
                      {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                          <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>Selecciona un agente para comenzar a chatear</p>
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.role === 'assistant' && (
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              selectedAgent 
                                ? `bg-gradient-to-br ${getGradient(selectedAgent.color)}`
                                : 'bg-primary/10'
                            }`}>
                              {selectedAgent ? (
                                (() => {
                                  const IconComponent = getIcon(selectedAgent.icon);
                                  return <IconComponent className="h-4 w-4 text-white" />;
                                })()
                              ) : (
                                <Bot className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            {message.actionExecuted && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Acción ejecutada: {message.actionType}
                              </div>
                            )}
                            <p className="mt-1 text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3 justify-start">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            selectedAgent 
                              ? `bg-gradient-to-br ${getGradient(selectedAgent.color)}`
                              : 'bg-primary/10'
                          }`}>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                          </div>
                          <div className="max-w-[80%] rounded-lg bg-muted px-4 py-3">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="border-t p-4">
                    {attachedFile && (
                      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-blue-50 rounded-lg text-sm text-blue-700">
                        <Paperclip className="h-3 w-3" />
                        <span className="flex-1 truncate">{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.xlsx,.jpg,.jpeg,.png,.docx"
                        className="hidden"
                        id="chat-file-input"
                        onChange={handleFileAttach}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => document.getElementById('chat-file-input')?.click()}
                        disabled={isTyping || !selectedAgent}
                        title="Adjuntar documento (PDF, imagen, Excel)"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder={selectedAgent 
                          ? `Pregunta a ${selectedAgent.name}...` 
                          : 'Selecciona un agente primero'}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isTyping || !selectedAgent}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={(!inputMessage.trim() && !attachedFile) || isTyping || !selectedAgent}
                        size="icon"
                      >
                        {isTyping ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Panel Lateral */}
              <div className="space-y-4">
                {/* Agente Activo */}
                {selectedAgent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        Agente Activo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getGradient(selectedAgent.color)} flex items-center justify-center`}>
                          {(() => {
                            const IconComponent = getIcon(selectedAgent.icon);
                            return <IconComponent className="h-5 w-5 text-white" />;
                          })()}
                        </div>
                        <div>
                          <p className="font-medium">{selectedAgent.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedAgent.type}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab('agents')}
                      >
                        Cambiar Agente
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Capacidades */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Capacidades IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Auto-resolución</p>
                        <p className="text-xs text-muted-foreground">
                          Ejecuta acciones automáticamente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Especialización</p>
                        <p className="text-xs text-muted-foreground">Agentes expertos en cada área</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Memoria contextual</p>
                        <p className="text-xs text-muted-foreground">Recuerda la conversación</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comandos de Voz */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Comandos de Voz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">Próximamente</Badge>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Control por voz con Whisper AI
                    </p>
                  </CardContent>
                </Card>

                {/* Enlace a Admin */}
                <Card>
                  <CardContent className="pt-6">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/admin/ai-agents')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Agentes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

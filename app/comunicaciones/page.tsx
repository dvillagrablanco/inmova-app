'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Mail,
  Phone,
  Bell,
  Send,
  Search,
  Plus,
  Filter,
  Inbox,
  SendHorizontal,
  CheckCheck,
  Clock,
  User,
  Building2,
  FileText,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Message {
  id: string;
  tipo: 'email' | 'sms' | 'notificacion' | 'chat';
  asunto?: string;
  contenido: string;
  destinatario: string;
  destinatarioNombre?: string;
  estado: 'enviado' | 'entregado' | 'leido' | 'fallido' | 'pendiente';
  fechaEnvio: string;
  relacionadoCon?: {
    tipo: 'inquilino' | 'propiedad' | 'contrato';
    id: string;
    nombre: string;
  };
}

interface CommunicationTemplate {
  id: string;
  nombre: string;
  tipo: 'email' | 'sms' | 'notificacion';
  asunto?: string;
  contenido: string;
  variables: string[];
}

export default function ComunicacionesPage() {
  const router = useRouter();
  const { data: _session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('mensajes');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      // En una implementación real, esto llamaría a APIs
      // Por ahora, mostramos datos vacíos para datos reales
      setMessages([]);
      setTemplates([
        {
          id: '1',
          nombre: 'Recordatorio de Pago',
          tipo: 'email',
          asunto: 'Recordatorio: Pago de alquiler pendiente',
          contenido: 'Estimado/a {{nombre}}, le recordamos que su pago de {{monto}}€ correspondiente al mes de {{mes}} está pendiente.',
          variables: ['nombre', 'monto', 'mes'],
        },
        {
          id: '2',
          nombre: 'Bienvenida Inquilino',
          tipo: 'email',
          asunto: 'Bienvenido/a a {{propiedad}}',
          contenido: 'Estimado/a {{nombre}}, le damos la bienvenida a su nuevo hogar en {{direccion}}.',
          variables: ['nombre', 'propiedad', 'direccion'],
        },
        {
          id: '3',
          nombre: 'Aviso Vencimiento Contrato',
          tipo: 'sms',
          contenido: 'Su contrato en {{propiedad}} vence el {{fecha}}. Contacte con nosotros para renovar.',
          variables: ['propiedad', 'fecha'],
        },
      ]);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'notificacion':
        return <Bell className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'enviado':
        return <Badge className="bg-blue-100 text-blue-800"><SendHorizontal className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'entregado':
        return <Badge className="bg-green-100 text-green-800"><CheckCheck className="h-3 w-3 mr-1" />Entregado</Badge>;
      case 'leido':
        return <Badge className="bg-green-500 text-white"><CheckCheck className="h-3 w-3 mr-1" />Leído</Badge>;
      case 'fallido':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      case 'pendiente':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const stats = {
    enviados: messages.filter(m => m.estado !== 'pendiente').length,
    pendientes: messages.filter(m => m.estado === 'pendiente').length,
    fallidos: messages.filter(m => m.estado === 'fallido').length,
    emails: messages.filter(m => m.tipo === 'email').length,
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      (msg.asunto?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      msg.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.destinatario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || msg.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comunicaciones</h1>
            <p className="text-muted-foreground">
              Gestiona las comunicaciones con inquilinos y propietarios
            </p>
          </div>
          <Button onClick={() => router.push('/comunicaciones/nuevo')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Comunicación
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <SendHorizontal className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enviados}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
              <p className="text-xs text-muted-foreground">Por enviar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
              <Mail className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.fallidos}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.emails}</div>
              <p className="text-xs text-muted-foreground">Total emails</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mensajes">
              <Inbox className="h-4 w-4 mr-2" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger value="plantillas">
              <FileText className="h-4 w-4 mr-2" />
              Plantillas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mensajes" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar mensajes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="notificacion">Notificación</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay mensajes</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || typeFilter !== 'all'
                      ? 'No se encontraron mensajes con los filtros seleccionados'
                      : 'Comienza enviando tu primera comunicación'}
                  </p>
                  <Button onClick={() => router.push('/comunicaciones/nuevo')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <Card key={message.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getTypeIcon(message.tipo)}
                          </div>
                          <div className="space-y-1">
                            {message.asunto && (
                              <h4 className="font-medium">{message.asunto}</h4>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {message.contenido}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {message.destinatarioNombre || message.destinatario}
                              </span>
                              <span>
                                {new Date(message.fechaEnvio).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(message.estado)}
                          <Badge variant="outline" className="text-xs">
                            {message.tipo}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="plantillas" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.nombre}</CardTitle>
                      <Badge variant="outline">{template.tipo}</Badge>
                    </div>
                    {template.asunto && (
                      <CardDescription>{template.asunto}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {template.contenido}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                      <Button size="sm" className="flex-1">
                        Usar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

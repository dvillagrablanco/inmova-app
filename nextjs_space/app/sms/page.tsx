'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, ArrowLeft, Send, MessageSquare, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function SMSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [formData, setFormData] = useState({ tenantId: '', templateId: '', tipo: 'personalizado', mensaje: '' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const [smsRes, templatesRes, tenantsRes] = await Promise.all([
        fetch('/api/sms'),
        fetch('/api/sms/templates'),
        fetch('/api/tenants')
      ]);

      // Verificar que todas las respuestas sean exitosas
      if (!smsRes.ok || !templatesRes.ok || !tenantsRes.ok) {
        throw new Error('Error al cargar datos del servidor');
      }

      const [smsData, templatesData, tenantsData] = await Promise.all([
        smsRes.json(),
        templatesRes.json(),
        tenantsRes.json()
      ]);

      setSmsLogs(Array.isArray(smsData) ? smsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos de SMS:', error);
      toast.error('Error al cargar datos. Por favor, intenta de nuevo.');
      setLoading(false);
    }
  };

  const handleEnviar = async () => {
    if (!formData.tenantId || !formData.mensaje) {
      toast.error('Selecciona un inquilino y escribe un mensaje');
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al enviar SMS');

      toast.success('SMS enviado exitosamente (simulado)');
      setOpenDialog(false);
      fetchData();
      setFormData({ tenantId: '', templateId: '', tipo: 'personalizado', mensaje: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleInstalarPlantillas = async () => {
    try {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'instalar_predefinidas' })
      });

      if (!response.ok) throw new Error('Error al instalar plantillas');

      const data = await response.json();
      toast.success(data.mensaje);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Cargando módulo SMS...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />Volver al Dashboard
              </Button>

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>SMS</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Centro de Mensajería SMS</h1>
                  <p className="text-muted-foreground">Sistema de SMS con plantillas y logs (simulado)</p>
                </div>
                <div className="flex gap-2">
                  {templates.length === 0 && (
                    <Button variant="outline" onClick={handleInstalarPlantillas}>
                      <FileText className="h-4 w-4 mr-2" />Instalar Plantillas
                    </Button>
                  )}
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button><Send className="h-4 w-4 mr-2" />Enviar SMS</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enviar SMS</DialogTitle>
                        <DialogDescription>Envía un mensaje a un inquilino (simulado)</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Inquilino</Label>
                          <Select value={formData.tenantId} onValueChange={(value) => setFormData({ ...formData, tenantId: value })}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent>
                              {tenants.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.nombreCompleto} - {t.telefono}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Plantilla (opcional)</Label>
                          <Select value={formData.templateId} onValueChange={(value) => {
                            const template = templates.find(t => t.id === value);
                            setFormData({ ...formData, templateId: value, mensaje: template?.mensaje || '', tipo: template?.tipo || 'personalizado' });
                          }}>
                            <SelectTrigger><SelectValue placeholder="Sin plantilla" /></SelectTrigger>
                            <SelectContent>
                              {templates.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Mensaje (máx 160 caracteres)</Label>
                          <Textarea
                            value={formData.mensaje}
                            onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                            maxLength={160}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground text-right">{formData.mensaje.length}/160</p>
                        </div>
                        <Button onClick={handleEnviar} disabled={enviando} className="w-full">
                          {enviando ? 'Enviando...' : 'Enviar SMS'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: 'Total Enviados', value: smsLogs.filter(s => s.estado === 'enviado').length, icon: MessageSquare },
                { title: 'Exitosos', value: smsLogs.filter(s => s.exitoso === true).length, icon: CheckCircle },
                { title: 'Fallidos', value: smsLogs.filter(s => s.exitoso === false).length, icon: XCircle },
                { title: 'Programados', value: smsLogs.filter(s => s.estado === 'programado').length, icon: Clock }
              ].map((kpi, idx) => (
                <Card key={idx}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="logs" className="space-y-4">
              <TabsList>
                <TabsTrigger value="logs">Logs de SMS</TabsTrigger>
                <TabsTrigger value="templates">Plantillas ({templates.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle>Historial de SMS</CardTitle>
                    <CardDescription>Mensajes enviados y programados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {smsLogs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No hay mensajes</p>
                      ) : (
                        smsLogs.map((sms) => (
                          <Card key={sms.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{sms.nombreDestinatario}</span>
                                  <Badge variant={sms.estado === 'enviado' ? 'default' : 'secondary'}>{sms.estado}</Badge>
                                  {sms.exitoso !== null && (
                                    <Badge variant={sms.exitoso ? 'default' : 'destructive'}>
                                      {sms.exitoso ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                      {sms.exitoso ? 'Exitoso' : 'Fallido'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{sms.telefono}</p>
                                <p className="text-sm">{sms.mensaje}</p>
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Tipo: {sms.tipo}</span>
                                  <span>Fecha: {new Date(sms.createdAt).toLocaleString('es-ES')}</span>
                                  {sms.costeEstimado && <span>Coste: {sms.costeEstimado.toFixed(3)}€</span>}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle>Plantillas de SMS</CardTitle>
                    <CardDescription>Mensajes predefinidos con variables</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {templates.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">No hay plantillas configuradas</p>
                          <Button onClick={handleInstalarPlantillas}>Instalar Plantillas Predefinidas</Button>
                        </div>
                      ) : (
                        templates.map((template) => (
                          <Card key={template.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{template.nombre}</span>
                                  <Badge variant={template.activa ? 'default' : 'secondary'}>
                                    {template.activa ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </div>
                                {template.descripcion && (
                                  <p className="text-sm text-muted-foreground mb-2">{template.descripcion}</p>
                                )}
                                <p className="text-sm bg-muted p-2 rounded">{template.mensaje}</p>
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>Tipo: {template.tipo}</span>
                                  <span>Usada: {template.vecesUsada} veces</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

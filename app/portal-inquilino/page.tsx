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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, ArrowLeft, CreditCard, FileText, Wrench, MessageSquare, Bell, Euro, Calendar, CheckCircle2, Clock, AlertTriangle, Download, Send, Building2, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalInquilinoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showIncidenciaDialog, setShowIncidenciaDialog] = useState(false);
  const [inquilino, setInquilino] = useState<any>(null);
  const [pagos, setPagos] = useState<any[]>([]);
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') {
      fetchTenantData();
    }
  }, [status, router]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const [profileRes, pagosRes, incidenciasRes, docsRes] = await Promise.all([
        fetch('/api/portal-inquilino/perfil'),
        fetch('/api/portal-inquilino/payments'),
        fetch('/api/portal-inquilino/incidencias'),
        fetch('/api/portal-inquilino/documents'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setInquilino(data);
      }
      if (pagosRes.ok) {
        const data = await pagosRes.json();
        setPagos(Array.isArray(data) ? data : data.data || []);
      }
      if (incidenciasRes.ok) {
        const data = await incidenciasRes.json();
        setIncidencias(Array.isArray(data) ? data : data.data || []);
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocumentos(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Portal del Inquilino</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        {/* Bienvenida */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Bienvenido{inquilino?.nombre ? `, ${inquilino.nombre.split(' ')[0]}` : ''}</CardTitle>
            <CardDescription className="text-white/80">{inquilino?.propiedad || 'Portal del Inquilino'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {inquilino?.contrato ? (
                <>
                  <div><p className="text-white/70 text-sm">Próximo pago</p><p className="text-xl font-bold">€{inquilino.contrato.renta || 0}</p></div>
                  <div><p className="text-white/70 text-sm">Contrato hasta</p><p className="text-xl font-bold">{inquilino.contrato.fin ? new Date(inquilino.contrato.fin).toLocaleDateString('es-ES') : '-'}</p></div>
                </>
              ) : (
                <p className="text-white/80">No hay contrato activo</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pagos">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pagos"><CreditCard className="h-4 w-4 mr-2" />Pagos</TabsTrigger>
            <TabsTrigger value="incidencias"><Wrench className="h-4 w-4 mr-2" />Incidencias</TabsTrigger>
            <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-2" />Documentos</TabsTrigger>
            <TabsTrigger value="contacto"><MessageSquare className="h-4 w-4 mr-2" />Contacto</TabsTrigger>
          </TabsList>

          <TabsContent value="pagos" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pagos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay pagos registrados</p>
                  ) : pagos.map((pago, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div><p className="font-medium">{pago.mes}</p><p className="text-sm text-muted-foreground">{pago.estado === 'pagado' ? `Pagado: ${pago.fecha}` : `Vence: ${pago.vence}`}</p></div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold">€{pago.monto}</p>
                        <Badge className={pago.estado === 'pagado' ? 'bg-green-500' : 'bg-yellow-500'}>{pago.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</Badge>
                        {pago.estado === 'pendiente' && <Button size="sm">Pagar Ahora</Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidencias" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowIncidenciaDialog(true)}><Wrench className="h-4 w-4 mr-2" />Reportar Incidencia</Button>
            </div>
            <Card>
              <CardHeader><CardTitle>Mis Incidencias</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {incidencias.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay incidencias registradas</p>
                  ) : incidencias.map((inc) => (
                    <div key={inc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div><p className="font-medium">{inc.titulo}</p><p className="text-sm text-muted-foreground">Reportada: {inc.fecha}</p></div>
                      <Badge className={inc.estado === 'resuelta' ? 'bg-green-500' : 'bg-blue-500'}>{inc.estado === 'resuelta' ? 'Resuelta' : 'En Proceso'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Mis Documentos</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay documentos disponibles</p>
                  ) : documentos.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">{doc.nombre}</p><p className="text-sm text-muted-foreground">{doc.tipo} • {doc.fecha}</p></div></div>
                      <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Descargar</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacto" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Contactar con el Propietario</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium">{inquilino?.propietario || 'Propietario'}</p>
                    {inquilino?.contactoPropietario && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {inquilino.contactoPropietario.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{inquilino.contactoPropietario.email}</span>}
                        {inquilino.contactoPropietario.telefono && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{inquilino.contactoPropietario.telefono}</span>}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <Textarea placeholder="Escribe tu mensaje..." rows={4} />
                  </div>
                  <Button><Send className="h-4 w-4 mr-2" />Enviar Mensaje</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Incidencia */}
        <Dialog open={showIncidenciaDialog} onOpenChange={setShowIncidenciaDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reportar Incidencia</DialogTitle><DialogDescription>Describe el problema que has detectado</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Título</Label><Input placeholder="Ej: Grifo del baño gotea" /></div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea placeholder="Describe el problema con detalle..." rows={4} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIncidenciaDialog(false)}>Cancelar</Button>
              <Button onClick={() => { toast.success('Incidencia reportada'); setShowIncidenciaDialog(false); }}>Enviar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}

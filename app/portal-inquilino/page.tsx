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

  useEffect(() => {
    if (status === 'authenticated') setLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const inquilino = {
    nombre: 'María García López',
    email: 'maria.garcia@email.com',
    telefono: '+34 612 345 678',
    propiedad: 'Piso C/ Mayor 45, 3ºA',
    propietario: 'Inmobiliaria Centro S.L.',
    contrato: { inicio: '2024-06-01', fin: '2025-05-31', renta: 950, deposito: 1900 },
  };

  const pagos = [
    { mes: 'Enero 2025', monto: 950, estado: 'pagado', fecha: '2025-01-05' },
    { mes: 'Febrero 2025', monto: 950, estado: 'pendiente', vence: '2025-02-05' },
  ];

  const incidencias = [
    { id: 1, titulo: 'Grifo del baño gotea', estado: 'en_proceso', fecha: '2025-01-18' },
    { id: 2, titulo: 'Calefacción no funciona bien', estado: 'resuelta', fecha: '2025-01-10' },
  ];

  const documentos = [
    { nombre: 'Contrato de arrendamiento', tipo: 'PDF', fecha: '2024-06-01' },
    { nombre: 'Inventario inicial', tipo: 'PDF', fecha: '2024-06-01' },
    { nombre: 'Recibos 2024', tipo: 'ZIP', fecha: '2024-12-31' },
  ];

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
            <CardTitle className="text-2xl">Bienvenido, {inquilino.nombre.split(' ')[0]}</CardTitle>
            <CardDescription className="text-white/80">{inquilino.propiedad}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <div><p className="text-white/70 text-sm">Próximo pago</p><p className="text-xl font-bold">€{inquilino.contrato.renta}</p><p className="text-white/70 text-sm">Vence: 5 Feb 2025</p></div>
              <div><p className="text-white/70 text-sm">Contrato hasta</p><p className="text-xl font-bold">{new Date(inquilino.contrato.fin).toLocaleDateString('es-ES')}</p></div>
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
                  {pagos.map((pago, idx) => (
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
                  {incidencias.map((inc) => (
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
                  {documentos.map((doc, idx) => (
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
                    <p className="font-medium">{inquilino.propietario}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-4 w-4" />contacto@inmobiliaria.com</span>
                      <span className="flex items-center gap-1"><Phone className="h-4 w-4" />+34 900 123 456</span>
                    </div>
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

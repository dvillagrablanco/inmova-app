'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Home, Plus, Users, Phone, Mail, TrendingUp, Target, Award } from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  estado: string;
  scoring: number;
  probabilidadCierre: number;
  fuente: string;
  createdAt: string;
}

const ESTADO_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-500',
  contactado: 'bg-cyan-500',
  calificado: 'bg-purple-500',
  visitado: 'bg-yellow-500',
  propuesta_enviada: 'bg-orange-500',
  negociacion: 'bg-pink-500',
  ganado: 'bg-green-500',
  perdido: 'bg-gray-500',
};

const ESTADO_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  visitado: 'Visitado',
  propuesta_enviada: 'Propuesta Enviada',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

export default function CrmPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    fuente: 'web',
    presupuesto: '',
    necesidades: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch('/api/crm/leads'),
        fetch('/api/crm/stats'),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Lead creado exitosamente');
        setOpenDialog(false);
        setFormData({
          nombreCompleto: '',
          email: '',
          telefono: '',
          fuente: 'web',
          presupuesto: '',
          necesidades: '',
        });
        fetchData();
      } else {
        toast.error('Error al crear lead');
      }
    } catch (error) {
      toast.error('Error al crear lead');
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="text-lg">Cargando...</div></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          <div className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">CRM - Gestión de Leads</h1>
                <Breadcrumb className="mt-2">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>CRM</BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Lead
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Lead</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Nombre Completo *</Label>
                        <Input
                          value={formData.nombreCompleto}
                          onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Teléfono *</Label>
                        <Input
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Fuente</Label>
                        <Select value={formData.fuente} onValueChange={(v) => setFormData({ ...formData, fuente: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="web">Web</SelectItem>
                            <SelectItem value="referido">Referido</SelectItem>
                            <SelectItem value="llamada">Llamada</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="redes_sociales">Redes Sociales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Presupuesto</Label>
                        <Input
                          type="number"
                          value={formData.presupuesto}
                          onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Necesidades</Label>
                        <Textarea
                          value={formData.necesidades}
                          onChange={(e) => setFormData({ ...formData, necesidades: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full">Crear Lead</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 mb-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.tasaConversion || 0).toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ganados</CardTitle>
                <Award className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.ganado || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Pipeline</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{(stats.valorTotalPipeline || 0).toLocaleString('es-ES')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium">{lead.nombreCompleto}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                        <Phone className="h-3 w-3 ml-2" />
                        {lead.telefono}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={ESTADO_COLORS[lead.estado]}>
                        {ESTADO_LABELS[lead.estado]}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">Score: {lead.scoring}/100</div>
                        <div className="text-muted-foreground">{lead.probabilidadCierre.toFixed(0)}% prob.</div>
                      </div>
                    </div>
                  </div>
                ))}
                {leads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay leads. Crea tu primer lead para comenzar.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

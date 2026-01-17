'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  UserPlus,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Send,
} from 'lucide-react';

// Array vacío - se llenará con datos reales de la BD
const solicitudesPendientes: Array<{
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  zona: string;
  experiencia: string;
  fecha: string;
  estado: string;
}> = [];

const zonasDisponibles = [
  'Madrid Centro', 'Madrid Norte', 'Madrid Sur',
  'Barcelona Centro', 'Barcelona Eixample',
  'Valencia', 'Sevilla', 'Málaga', 'Bilbao',
  'Zaragoza', 'Alicante', 'Murcia', 'Palma'
];

export default function RedAgentesRegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    zona: '',
    experiencia: '',
    cv: null as File | null,
    mensaje: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Solicitud enviada correctamente');
    // Reset form
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      zona: '',
      experiencia: '',
      cv: null,
      mensaje: '',
    });
  };

  const handleAprobar = (id: number) => {
    toast.success('Agente aprobado correctamente');
  };

  const handleRechazar = (id: number) => {
    toast.error('Solicitud rechazada');
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/red-agentes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Registro de Agentes</h1>
              <p className="text-muted-foreground">
                Alta de nuevos agentes y gestión de solicitudes
              </p>
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{solicitudesPendientes.filter(s => s.estado === 'pendiente').length}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{solicitudesPendientes.filter(s => s.estado === 'revision').length}</p>
                <p className="text-xs text-muted-foreground">En Revisión</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{solicitudesPendientes.filter(s => s.estado === 'aprobada').length}</p>
                <p className="text-xs text-muted-foreground">Aprobadas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{solicitudesPendientes.filter(s => s.estado === 'rechazada').length}</p>
                <p className="text-xs text-muted-foreground">Rechazadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="solicitudes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="solicitudes">Solicitudes Pendientes</TabsTrigger>
            <TabsTrigger value="nuevo">Registrar Nuevo Agente</TabsTrigger>
          </TabsList>

          <TabsContent value="solicitudes">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes de Registro</CardTitle>
                <CardDescription>Gestiona las solicitudes de nuevos agentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {solicitudesPendientes.map((solicitud) => (
                    <div key={solicitud.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{solicitud.nombre}</h3>
                            <Badge variant={
                              solicitud.estado === 'aprobada' ? 'default' :
                              solicitud.estado === 'revision' ? 'secondary' :
                              solicitud.estado === 'rechazada' ? 'destructive' : 'outline'
                            }>
                              {solicitud.estado === 'aprobada' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {solicitud.estado === 'revision' && <Clock className="h-3 w-3 mr-1" />}
                              {solicitud.estado === 'rechazada' && <XCircle className="h-3 w-3 mr-1" />}
                              {solicitud.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
                              {solicitud.estado}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {solicitud.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {solicitud.telefono}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {solicitud.zona}
                            </span>
                          </div>
                          <p className="text-sm mt-1">Experiencia: {solicitud.experiencia}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {solicitud.fecha}
                        </div>
                        {(solicitud.estado === 'pendiente' || solicitud.estado === 'revision') && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAprobar(solicitud.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRechazar(solicitud.id)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nuevo">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nuevo Agente</CardTitle>
                <CardDescription>Completa el formulario para dar de alta un nuevo agente</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Nombre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidos">Apellidos *</Label>
                      <Input
                        id="apellidos"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        placeholder="Apellidos"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+34 600 000 000"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zona">Zona de Trabajo *</Label>
                      <Select
                        value={formData.zona}
                        onValueChange={(value) => setFormData({ ...formData, zona: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una zona" />
                        </SelectTrigger>
                        <SelectContent>
                          {zonasDisponibles.map((zona) => (
                            <SelectItem key={zona} value={zona}>{zona}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experiencia">Años de Experiencia</Label>
                      <Select
                        value={formData.experiencia}
                        onValueChange={(value) => setFormData({ ...formData, experiencia: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sin experiencia</SelectItem>
                          <SelectItem value="1">1-2 años</SelectItem>
                          <SelectItem value="3">3-5 años</SelectItem>
                          <SelectItem value="5">5-10 años</SelectItem>
                          <SelectItem value="10">+10 años</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje">Notas adicionales</Label>
                    <Textarea
                      id="mensaje"
                      value={formData.mensaje}
                      onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                      placeholder="Información adicional sobre el agente..."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push('/red-agentes')}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrar Agente
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

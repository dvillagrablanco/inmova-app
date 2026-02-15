import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewLead() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    nombreContacto: '',
    emailContacto: '',
    telefonoContacto: '',
    nombreEmpresa: '',
    sector: '',
    tipoCliente: '',
    propiedadesEstimadas: '',
    presupuestoMensual: '',
    origenCaptura: '',
    prioridad: 'media',
    notas: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const salesRepId = localStorage.getItem('salesRepId');
      if (!salesRepId) {
        toast.error('No se encontró tu ID de comercial');
        router.push('/login');
        return;
      }

      const payload = {
        ...formData,
        salesRepId,
        propiedadesEstimadas: formData.propiedadesEstimadas ? parseInt(formData.propiedadesEstimadas) : undefined,
        presupuestoMensual: formData.presupuestoMensual ? parseFloat(formData.presupuestoMensual) : undefined,
      };

      const response = await fetch('/api/sales-team/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Lead creado exitosamente');
        router.push('/sales-portal/leads');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear lead');
      }
    } catch (error) {
      toast.error('Error al crear lead');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nuevo Lead - Portal Comercial</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/sales-portal">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nuevo Lead</h1>
            <p className="text-gray-600">Completa la información del lead captado</p>
          </div>

          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información de contacto */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombreContacto">Nombre del Contacto *</Label>
                      <Input
                        id="nombreContacto"
                        value={formData.nombreContacto}
                        onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
                        required
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emailContacto">Email *</Label>
                      <Input
                        id="emailContacto"
                        type="email"
                        value={formData.emailContacto}
                        onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })}
                        required
                        placeholder="juan@empresa.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="telefonoContacto">Teléfono</Label>
                      <Input
                        id="telefonoContacto"
                        value={formData.telefonoContacto}
                        onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                        placeholder="+34 600 000 000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nombreEmpresa">Nombre de la Empresa *</Label>
                      <Input
                        id="nombreEmpresa"
                        value={formData.nombreEmpresa}
                        onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                        required
                        placeholder="Empresa S.L."
                      />
                    </div>
                  </div>
                </div>

                {/* Información del negocio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Negocio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                      <Select value={formData.tipoCliente} onValueChange={(value) => setFormData({ ...formData, tipoCliente: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alquiler_tradicional">Alquiler Tradicional</SelectItem>
                          <SelectItem value="str_vacacional">STR Vacacional</SelectItem>
                          <SelectItem value="coliving">Coliving</SelectItem>
                          <SelectItem value="construccion">Construcción</SelectItem>
                          <SelectItem value="flipping">Flipping</SelectItem>
                          <SelectItem value="servicios_profesionales">Servicios Profesionales</SelectItem>
                          <SelectItem value="mixto">Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sector">Sector</Label>
                      <Input
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Ej: Inmobiliario, Hoteles, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="propiedadesEstimadas">Propiedades Estimadas</Label>
                      <Input
                        id="propiedadesEstimadas"
                        type="number"
                        value={formData.propiedadesEstimadas}
                        onChange={(e) => setFormData({ ...formData, propiedadesEstimadas: e.target.value })}
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="presupuestoMensual">Presupuesto Mensual Estimado (€)</Label>
                      <Input
                        id="presupuestoMensual"
                        type="number"
                        step="0.01"
                        value={formData.presupuestoMensual}
                        onChange={(e) => setFormData({ ...formData, presupuestoMensual: e.target.value })}
                        placeholder="500"
                      />
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="origenCaptura">Origen de Captura</Label>
                      <Select value={formData.origenCaptura} onValueChange={(value) => setFormData({ ...formData, origenCaptura: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar origen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="referido">Referido</SelectItem>
                          <SelectItem value="cold_call">Llamada Fría</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="prioridad">Prioridad</Label>
                      <Select value={formData.prioridad} onValueChange={(value) => setFormData({ ...formData, prioridad: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={4}
                      placeholder="Información adicional sobre el lead..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-4 pt-4">
                  <Link href="/sales-portal">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creando...' : 'Crear Lead'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

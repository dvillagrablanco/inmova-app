'use client';
export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { ArrowLeft, Send, Wrench } from 'lucide-react';
import Link from 'next/link';
import logger, { logError } from '@/lib/logger';


export default function PortalInquilinoMantenimientoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('tenant_token');
      if (!token) {
        router.push('/portal-inquilino/login');
        return;
      }

      const res = await fetch('/api/portal-inquilino/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Solicitud enviada correctamente');
        router.push('/portal-inquilino/dashboard');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al enviar solicitud');
      }
    } catch (error) {
      logger.error('Error al enviar solicitud:', error);
      toast.error('Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">INMOVA</h1>
              <p className="text-sm text-muted-foreground">Portal del Inquilino</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/portal-inquilino/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nueva Solicitud de Mantenimiento</CardTitle>
              <CardDescription>
                Describe el problema o la reparación que necesitas y nos pondremos en contacto
                contigo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="titulo">Título de la Solicitud *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Fuga de agua en baño"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja - Puede esperar</SelectItem>
                      <SelectItem value="media">Media - Importante pero no urgente</SelectItem>
                      <SelectItem value="alta">Alta - Requiere atención inmediata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción Detallada *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe el problema con el mayor detalle posible...\n\nIncluye:\n- Cuándo comenzó el problema\n- Dónde se encuentra exactamente\n- Cualquier otro detalle relevante"
                    rows={8}
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Información importante:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Revisaremos tu solicitud en un plazo de 24-48 horas</li>
                    <li>Te contactaremos por teléfono o email para coordinar la reparación</li>
                    <li>
                      En caso de emergencia (fuga grave, falta de electricidad), llámanos
                      directamente
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Link href="/portal-inquilino/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

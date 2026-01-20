'use client';

/**
 * Partners - Soporte
 * 
 * Centro de ayuda y soporte dedicado para partners
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  MessageSquare,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  LifeBuoy,
  BookOpen,
  Mail,
  Phone,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Ticket {
  id: string;
  asunto: string;
  categoria: string;
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta';
  fechaCreacion: Date;
  ultimaActualizacion: Date;
}

const FAQ_ITEMS = [
  {
    question: '¿Cómo puedo obtener mis comisiones?',
    answer: 'Las comisiones se procesan mensualmente y se depositan automáticamente en la cuenta bancaria configurada en tu perfil. Puedes ver el estado de tus comisiones en la sección "Comisiones" del dashboard.',
  },
  {
    question: '¿Cómo funciona el sistema de referidos?',
    answer: 'Cuando refieres un nuevo cliente a través de tu link personalizado o código de referido, y este cliente activa una suscripción, recibirás una comisión según el plan contratado. El tracking es automático.',
  },
  {
    question: '¿Cuánto tiempo tarda en procesarse un lead?',
    answer: 'Los leads se procesan en un máximo de 24-48 horas laborables. Recibirás una notificación cuando el lead sea contactado y otra cuando se convierta en cliente.',
  },
  {
    question: '¿Cómo puedo integrar la API?',
    answer: 'Puedes encontrar toda la documentación de la API en la sección "Integraciones". Allí encontrarás tus claves de API, ejemplos de código y documentación técnica completa.',
  },
  {
    question: '¿Qué materiales de marketing tengo disponibles?',
    answer: 'En la sección "Recursos" encontrarás logos, banners, plantillas de email, presentaciones y otros materiales que puedes usar en tus campañas de marketing.',
  },
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TK-001',
    asunto: 'Consulta sobre integración API',
    categoria: 'tecnico',
    estado: 'en_progreso',
    prioridad: 'alta',
    fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    ultimaActualizacion: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 'TK-002',
    asunto: 'Problema con comisiones de diciembre',
    categoria: 'facturacion',
    estado: 'abierto',
    prioridad: 'media',
    fechaCreacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    ultimaActualizacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'TK-003',
    asunto: 'Solicitud de materiales personalizados',
    categoria: 'marketing',
    estado: 'resuelto',
    prioridad: 'baja',
    fechaCreacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ultimaActualizacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function PartnersSoportePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    asunto: '',
    categoria: 'general',
    prioridad: 'media',
    descripcion: '',
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.asunto.trim() || !formData.descripcion.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTicket: Ticket = {
        id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
        asunto: formData.asunto,
        categoria: formData.categoria,
        estado: 'abierto',
        prioridad: formData.prioridad as 'baja' | 'media' | 'alta',
        fechaCreacion: new Date(),
        ultimaActualizacion: new Date(),
      };
      
      setTickets([newTicket, ...tickets]);
      toast.success('Ticket creado correctamente');
      setIsDialogOpen(false);
      setFormData({
        asunto: '',
        categoria: 'general',
        prioridad: 'media',
        descripcion: '',
      });
    } catch (error) {
      toast.error('Error al crear el ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (estado: Ticket['estado']) => {
    const config = {
      abierto: { label: 'Abierto', variant: 'outline' as const, icon: AlertCircle },
      en_progreso: { label: 'En Progreso', variant: 'default' as const, icon: Clock },
      resuelto: { label: 'Resuelto', variant: 'secondary' as const, icon: CheckCircle },
      cerrado: { label: 'Cerrado', variant: 'secondary' as const, icon: CheckCircle },
    };
    const { label, variant, icon: Icon } = config[estado];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const filteredFAQ = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Centro de Soporte</h1>
          <p className="text-muted-foreground">
            Ayuda y soporte dedicado para partners
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Quick Contact */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-sm text-muted-foreground">partners@inmova.app</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Teléfono</h3>
                <p className="text-sm text-muted-foreground">+34 91 XXX XX XX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Chat en vivo</h3>
                <p className="text-sm text-muted-foreground">Lun-Vie 9:00-18:00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Preguntas Frecuentes
          </CardTitle>
          <CardDescription>
            Encuentra respuestas rápidas a las preguntas más comunes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en preguntas frecuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Accordion type="single" collapsible className="w-full">
            {filteredFAQ.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Mis Tickets de Soporte
          </CardTitle>
          <CardDescription>
            Historial de tus solicitudes de soporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <LifeBuoy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes tickets de soporte</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.id}
                      </span>
                      {getStatusBadge(ticket.estado)}
                      <Badge variant="outline" className="capitalize">
                        {ticket.categoria}
                      </Badge>
                    </div>
                    <p className="font-medium">{ticket.asunto}</p>
                    <p className="text-sm text-muted-foreground">
                      Última actualización: {format(ticket.ultimaActualizacion, "d MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver detalles
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Ticket de Soporte</DialogTitle>
            <DialogDescription>
              Describe tu problema y te ayudaremos lo antes posible
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitTicket}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asunto">Asunto *</Label>
                <Input
                  id="asunto"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Describe brevemente tu problema"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="facturacion">Facturación</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="integraciones">Integraciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe tu problema con el mayor detalle posible..."
                  rows={5}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Enviar Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Megaphone,
  AlertTriangle,
  Info,
  Bell,
  Plus,
  Calendar,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Announcement {
  id: string;
  titulo: string;
  contenido: string;
  prioridad: string;
  fechaInicio: string;
  fechaFin?: string;
  building?: {
    id: string;
    nombre: string;
  };
}

const PRIORITY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  urgente: { icon: AlertTriangle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Urgente' },
  importante: { icon: Bell, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Importante' },
  normal: { icon: Megaphone, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Normal' },
  informativo: { icon: Info, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Informativo' },
};

export default function AnnouncementsPanel() {
  const { canManageAnnouncements, isAdmin, isCommunityManager } = usePermissions();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    prioridad: 'normal',
    fechaInicio: '',
    fechaFin: '',
  });

  const canCreate = canManageAnnouncements || isAdmin || isCommunityManager;

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/community/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async () => {
    try {
      const res = await fetch('/api/community/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Anuncio creado correctamente');
        setShowCreateDialog(false);
        setFormData({
          titulo: '',
          contenido: '',
          prioridad: 'normal',
          fechaInicio: '',
          fechaFin: '',
        });
        fetchAnnouncements();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear anuncio');
      }
    } catch (error) {
      toast.error('Error al crear anuncio');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {canCreate && (
        <div className="flex justify-end">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Anuncio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Anuncio</DialogTitle>
                <DialogDescription>
                  Publica un anuncio para la comunidad.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título del anuncio"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contenido">Contenido</Label>
                  <Textarea
                    id="contenido"
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    placeholder="Contenido del anuncio..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="importante">Importante</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="informativo">Informativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fechaFin">Fecha Fin (opcional)</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAnnouncement} disabled={!formData.titulo || !formData.contenido}>
                  Publicar Anuncio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay anuncios</h3>
              <p className="text-muted-foreground mb-4">
                Crea el primer anuncio para tu comunidad.
              </p>
              {canCreate && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Anuncio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const priorityConfig = PRIORITY_CONFIG[announcement.prioridad] || PRIORITY_CONFIG.normal;
            const IconComponent = priorityConfig.icon;

            return (
              <Card key={announcement.id} className={`border-l-4 ${announcement.prioridad === 'urgente' ? 'border-l-red-500' : announcement.prioridad === 'importante' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${priorityConfig.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{announcement.titulo}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(announcement.fechaInicio), "d 'de' MMMM, yyyy", { locale: es })}
                          {announcement.fechaFin && (
                            <span> - {format(new Date(announcement.fechaFin), "d 'de' MMMM", { locale: es })}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={priorityConfig.color}>
                      {priorityConfig.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.contenido}
                  </p>
                  {announcement.building && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Edificio: {announcement.building.nombre}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

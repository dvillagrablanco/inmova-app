'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Calendar,
  Users,
  MapPin,
  Clock,
  Plus,
  Trophy,
  Star,
  Zap,
  Medal,
  Crown,
  PartyPopper,
  Coffee,
  Utensils,
  Dumbbell,
  Film,
  Music,
  Gamepad2,
  BookOpen,
  Palette,
  Heart,
  Target,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  organizer: string;
  attendees: number;
  maxAttendees?: number;
  points: number;
  isJoined: boolean;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  rank: number;
  badges: string[];
}

const eventTypes = [
  { id: 'social', label: 'Social', icon: PartyPopper, color: 'bg-pink-100 text-pink-800' },
  { id: 'food', label: 'Comida', icon: Utensils, color: 'bg-orange-100 text-orange-800' },
  { id: 'sport', label: 'Deporte', icon: Dumbbell, color: 'bg-green-100 text-green-800' },
  { id: 'movie', label: 'Cine', icon: Film, color: 'bg-purple-100 text-purple-800' },
  { id: 'music', label: 'Música', icon: Music, color: 'bg-blue-100 text-blue-800' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'bg-indigo-100 text-indigo-800' },
  { id: 'learning', label: 'Aprendizaje', icon: BookOpen, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'creative', label: 'Creativo', icon: Palette, color: 'bg-red-100 text-red-800' },
];

const badges = [
  {
    id: 'social_butterfly',
    name: 'Mariposa Social',
    icon: Heart,
    description: 'Asistir a 10 eventos',
  },
  { id: 'organizer', name: 'Organizador', icon: Crown, description: 'Organizar 3 eventos' },
  {
    id: 'early_bird',
    name: 'Madrugador',
    icon: Zap,
    description: 'Ser el primero en apuntarse 5 veces',
  },
  {
    id: 'community_star',
    name: 'Estrella Comunidad',
    icon: Star,
    description: 'Acumular 500 puntos',
  },
];

export default function ColivingEventosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [userBadges, setUserBadges] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'social',
    maxAttendees: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
      fetchLeaderboard();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/coliving/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/coliving/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const response = await fetch('/api/coliving/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('¡Evento creado! +20 puntos');
        setOpenDialog(false);
        setForm({
          title: '',
          description: '',
          date: '',
          time: '',
          location: '',
          type: 'social',
          maxAttendees: 0,
        });
        setUserPoints((prev) => prev + 20);
        fetchEvents();
      } else {
        toast.error('Error al crear evento');
      }
    } catch (error) {
      toast.error('Error al crear evento');
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/coliving/events/${eventId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('¡Te has apuntado! +10 puntos');
        setUserPoints((prev) => prev + 10);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, isJoined: true, attendees: e.attendees + 1 } : e
          )
        );
      }
    } catch (error) {
      toast.error('Error al apuntarse');
    }
  };

  const getEventTypeConfig = (type: string) => {
    return eventTypes.find((t) => t.id === type) || eventTypes[0];
  };

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.date) < new Date());

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/coliving">Coliving</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Eventos y Gamificación</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Eventos y Comunidad</h1>
            <p className="text-muted-foreground">Participa en eventos y gana puntos</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpenDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Cena comunitaria"
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detalles del evento..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Hora *</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Ubicación</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ej: Sala común, Terraza..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Evento</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Plazas Máximas</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.maxAttendees}
                      onChange={(e) =>
                        setForm({ ...form, maxAttendees: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0 = sin límite"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Evento (+20 pts)</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gamification Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                Tus Puntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">{userPoints}</div>
              <Progress value={Math.min((userPoints / 500) * 100, 100)} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {500 - userPoints > 0
                  ? `${500 - userPoints} puntos para siguiente nivel`
                  : '¡Nivel máximo!'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos Asistidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.filter((e) => e.isJoined).length}</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos Organizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+20 pts cada uno</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Insignias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                {userBadges.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aún no tienes insignias</p>
                ) : (
                  userBadges.map((badge) => (
                    <Badge key={badge} variant="secondary">
                      {badge}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Events */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                <TabsTrigger value="past">Pasados</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-4">
                {upcomingEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay eventos próximos</p>
                      <Button className="mt-4" onClick={() => setOpenDialog(true)}>
                        Crear el Primer Evento
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingEvents.map((event) => {
                    const typeConfig = getEventTypeConfig(event.type);
                    const TypeIcon = typeConfig.icon;

                    return (
                      <Card key={event.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${typeConfig.color}`}>
                                <TypeIcon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{event.title}</h3>
                                  <Badge variant="outline">+{event.points} pts</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {event.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {event.attendees}
                                    {event.maxAttendees ? `/${event.maxAttendees}` : ''} asistentes
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div>
                              {event.isJoined ? (
                                <Badge className="bg-green-100 text-green-800">Apuntado ✓</Badge>
                              ) : (
                                <Button size="sm" onClick={() => handleJoinEvent(event.id)}>
                                  Me Apunto
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-4">
                {pastEvents.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground">No hay eventos pasados</p>
                    </CardContent>
                  </Card>
                ) : (
                  pastEvents.map((event) => (
                    <Card key={event.id} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {event.date} - {event.attendees} asistentes
                            </p>
                          </div>
                          {event.isJoined && (
                            <Badge variant="secondary">Asististe +{event.points} pts</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Leaderboard */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking Comunidad
                </CardTitle>
                <CardDescription>Top residentes más activos</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    Participa en eventos para aparecer en el ranking
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, idx) => (
                      <div key={entry.id} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            idx === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : idx === 1
                                ? 'bg-gray-100 text-gray-800'
                                : idx === 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-muted'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.avatar} />
                          <AvatarFallback>
                            {entry.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.points} pts</p>
                        </div>
                        {idx === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-purple-500" />
                  Insignias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((badge) => {
                    const BadgeIcon = badge.icon;
                    const isEarned = userBadges.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg text-center ${
                          isEarned ? 'bg-purple-100' : 'bg-muted opacity-50'
                        }`}
                      >
                        <BadgeIcon
                          className={`h-6 w-6 mx-auto mb-1 ${
                            isEarned ? 'text-purple-600' : 'text-muted-foreground'
                          }`}
                        />
                        <p className="text-xs font-medium">{badge.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

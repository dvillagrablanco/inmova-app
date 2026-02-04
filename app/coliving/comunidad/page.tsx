'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Users,
  MessageSquare,
  Calendar,
  Heart,
  Search,
  Plus,
  Star,
  MapPin,
  Briefcase,
  Globe,
  Coffee,
  Music,
  Camera,
  Book,
  Gamepad2,
  Utensils,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { toast } from 'sonner';

interface Resident {
  id: string;
  name: string;
  avatar?: string;
  room: string;
  property: string;
  moveInDate: string;
  profession?: string;
  interests: string[];
  bio?: string;
  isOnline: boolean;
}

interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees?: number;
  type: string;
}

const interestIcons: Record<string, any> = {
  coffee: Coffee,
  music: Music,
  photography: Camera,
  reading: Book,
  gaming: Gamepad2,
  cooking: Utensils,
};

export default function ColivingComunidadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('residents');
  const [searchTerm, setSearchTerm] = useState('');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const handleMessageResident = (name: string) => {
    toast.success(`Mensaje preparado para ${name}`);
  };

  const handleLikeResident = (name: string) => {
    toast.info(`Favorito actualizado: ${name}`);
  };

  const handleJoinEvent = (title: string) => {
    toast.success(`Inscripcion enviada: ${title}`);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchResidents();
      fetchEvents();
    }
  }, [status]);

  const fetchResidents = async () => {
    try {
      const response = await fetch('/api/coliving/residents');
      if (response.ok) {
        const data = await response.json();
        setResidents(data);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/coliving/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.profession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.interests.some((i) => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <BreadcrumbPage>Comunidad</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Comunidad Coliving</h1>
            <p className="text-muted-foreground">
              Conecta con otros residentes y participa en eventos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/coliving/eventos')}>
              <Calendar className="mr-2 h-4 w-4" />
              Ver Eventos
            </Button>
            <Button onClick={() => router.push('/coliving/eventos/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Evento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Residentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{residents.length}</div>
              <p className="text-xs text-muted-foreground">
                {residents.filter((r) => r.isOnline).length} online ahora
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Eventos Este Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">Programados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conexiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Nuevas esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Puntos Comunidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                <Trophy className="h-5 w-5 text-yellow-500" />0
              </div>
              <p className="text-xs text-muted-foreground">Tu ranking</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="residents">
              <Users className="h-4 w-4 mr-2" />
              Residentes
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Próximos Eventos
            </TabsTrigger>
            <TabsTrigger value="feed">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feed Social
            </TabsTrigger>
          </TabsList>

          {/* Residents Tab */}
          <TabsContent value="residents" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, profesión o intereses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Residents Grid */}
            {filteredResidents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay residentes registrados</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResidents.map((resident) => (
                  <Card key={resident.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={resident.avatar} />
                            <AvatarFallback>
                              {resident.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          {resident.isOnline && (
                            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{resident.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {resident.room} - {resident.property}
                          </p>
                          {resident.profession && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {resident.profession}
                            </p>
                          )}
                        </div>
                      </div>

                      {resident.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {resident.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {resident.interests.slice(0, 4).map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleMessageResident(resident.name)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Mensaje
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeResident(resident.name)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay eventos programados</p>
                <Button className="mt-4" onClick={() => router.push('/coliving/eventos/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Evento
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {event.type}
                          </Badge>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {event.date} a las {event.time}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {event.attendees}
                            {event.maxAttendees && `/${event.maxAttendees}`}
                          </p>
                          <p className="text-xs text-muted-foreground">asistentes</p>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => handleJoinEvent(event.title)}
                      >
                        Me Apunto
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-4">
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">El feed social estará disponible pronto</p>
              <p className="text-sm text-muted-foreground mt-2">
                Comparte fotos, actividades y conecta con tu comunidad
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

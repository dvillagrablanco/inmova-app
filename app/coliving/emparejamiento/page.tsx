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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Users,
  Search,
  Home,
  ArrowLeft,
  Heart,
  UserCheck,
  MessageSquare,
  Star,
  Sparkles,
  Target,
  ThumbsUp,
  ThumbsDown,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Briefcase,
  Music,
  Utensils,
  Dumbbell,
  Book,
  Camera,
  Palette,
  Code,
  Coffee,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface ColivingProfile {
  id: string;
  tenantId: string;
  bio?: string;
  intereses: string[];
  profesion?: string;
  idiomas: string[];
  redesSociales?: Record<string, string>;
  buscoCompañeros: boolean;
  interesCompartir: string[];
  disponibilidad: Record<string, string[]>;
  puntosReputacion: number;
  nivel: string;
  badges: any[];
  perfilPublico: boolean;
  mostrarContacto: boolean;
  tenant?: {
    nombreCompleto: string;
    email?: string;
  };
}

interface Match {
  profile: ColivingProfile;
  score: number;
  interesesComunes: string[];
}

interface SavedMatch {
  id: string;
  profile1Id: string;
  profile2Id: string;
  scoreCompatibilidad: number;
  interesesComunes: string[];
  estado: string;
  mensajeIntroduccion?: string;
  fechaMatch: string;
  fechaAceptacion?: string;
}

// Iconos para intereses
const INTERES_ICONS: Record<string, any> = {
  musica: Music,
  cocina: Utensils,
  fitness: Dumbbell,
  lectura: Book,
  fotografia: Camera,
  arte: Palette,
  tecnologia: Code,
  cafe: Coffee,
  networking: Users,
  viajes: Globe,
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ColivingEmparejamientoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [myProfile, setMyProfile] = useState<ColivingProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([]);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCreateProfileDialog, setShowCreateProfileDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState('sugeridos');

  // Estados para crear perfil
  const [profileForm, setProfileForm] = useState({
    bio: '',
    intereses: [] as string[],
    profesion: '',
    idiomas: ['es'],
    interesCompartir: [] as string[],
    buscoCompañeros: true,
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (status === 'authenticated') {
      loadMyProfile();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar mi perfil
  const loadMyProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coliving/profiles');
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setMyProfile(data);
          // Si tengo perfil, buscar matches
          await findMatches(data.id);
        } else {
          // No tengo perfil, mostrar opción de crear
          setMyProfile(null);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar matches
  const findMatches = async (profileId: string) => {
    try {
      setSearching(true);
      const response = await fetch(`/api/coliving/matches?profileId=${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setMatches(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Error al buscar matches');
    } finally {
      setSearching(false);
    }
  };

  // Crear perfil
  const handleCreateProfile = async () => {
    try {
      const response = await fetch('/api/coliving/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const data = await response.json();
        setMyProfile(data);
        setShowCreateProfileDialog(false);
        toast.success('Perfil creado exitosamente');
        await findMatches(data.id);
      } else {
        toast.error('Error al crear perfil');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Error al crear perfil');
    }
  };

  // Aceptar match
  const handleAcceptMatch = async (profileId: string) => {
    if (!myProfile) return;

    try {
      const response = await fetch('/api/coliving/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile1Id: myProfile.id,
          profile2Id: profileId,
          companyId: session?.user?.companyId,
        }),
      });

      if (response.ok) {
        toast.success('¡Match creado! Ahora pueden conectarse');
        // Actualizar lista
        setMatches(prev => prev.filter(m => m.profile.id !== profileId));
      } else {
        toast.error('Error al crear match');
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      toast.error('Error al crear match');
    }
  };

  // Rechazar match
  const handleRejectMatch = (profileId: string) => {
    setMatches(prev => prev.filter(m => m.profile.id !== profileId));
    toast.info('Match descartado');
  };

  // Toggle interés en formulario
  const toggleInteres = (interes: string) => {
    setProfileForm(prev => ({
      ...prev,
      intereses: prev.intereses.includes(interes)
        ? prev.intereses.filter(i => i !== interes)
        : [...prev.intereses, interes],
    }));
  };

  // Toggle compartir en formulario
  const toggleCompartir = (item: string) => {
    setProfileForm(prev => ({
      ...prev,
      interesCompartir: prev.interesCompartir.includes(item)
        ? prev.interesCompartir.filter(i => i !== item)
        : [...prev.interesCompartir, item],
    }));
  };

  // Obtener color del nivel
  const getNivelColor = (nivel: string): string => {
    switch (nivel) {
      case 'platino': return 'bg-purple-100 text-purple-700';
      case 'oro': return 'bg-yellow-100 text-yellow-700';
      case 'plata': return 'bg-gray-100 text-gray-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  // Obtener color del score
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Lista de intereses disponibles
  const INTERESES = [
    'musica', 'cocina', 'fitness', 'lectura', 'fotografia',
    'arte', 'tecnologia', 'cafe', 'networking', 'viajes',
    'yoga', 'cine', 'gaming', 'naturaleza', 'deportes',
  ];

  // Lista de cosas para compartir
  const COMPARTIR = [
    'coche', 'recetas', 'eventos', 'gastos_comunes', 'streaming',
    'gym', 'herramientas', 'libros', 'experiencias',
  ];

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Si no tiene perfil, mostrar pantalla de creación
  if (!myProfile) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/coliving')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>

          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <Heart className="h-12 w-12 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Crea tu Perfil de Coliving</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Para encontrar compañeros compatibles, primero necesitas crear tu perfil.
                Cuéntanos sobre tus intereses y preferencias.
              </p>
              <Button size="lg" onClick={() => setShowCreateProfileDialog(true)}>
                <Sparkles className="h-5 w-5 mr-2" />
                Crear Mi Perfil
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dialog crear perfil */}
        <Dialog open={showCreateProfileDialog} onOpenChange={setShowCreateProfileDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Perfil de Coliving</DialogTitle>
              <DialogDescription>
                Completa tu perfil para encontrar compañeros compatibles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Bio */}
              <div className="space-y-2">
                <Label>Cuéntanos sobre ti</Label>
                <Textarea
                  placeholder="Me apasiona la cocina, trabajo en tecnología y busco un ambiente tranquilo..."
                  value={profileForm.bio}
                  onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Profesión */}
              <div className="space-y-2">
                <Label>Profesión</Label>
                <Input
                  placeholder="Desarrollador de software, Diseñador, etc."
                  value={profileForm.profesion}
                  onChange={e => setProfileForm(prev => ({ ...prev, profesion: e.target.value }))}
                />
              </div>

              {/* Intereses */}
              <div className="space-y-2">
                <Label>Tus intereses (selecciona varios)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERESES.map(interes => (
                    <Badge
                      key={interes}
                      variant={profileForm.intereses.includes(interes) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleInteres(interes)}
                    >
                      {interes}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Qué quieres compartir */}
              <div className="space-y-2">
                <Label>¿Qué te gustaría compartir?</Label>
                <div className="flex flex-wrap gap-2">
                  {COMPARTIR.map(item => (
                    <Badge
                      key={item}
                      variant={profileForm.interesCompartir.includes(item) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleCompartir(item)}
                    >
                      {item.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateProfileDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProfile} disabled={profileForm.intereses.length < 2}>
                Crear Perfil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/coliving')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
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
                <BreadcrumbPage>Emparejamiento</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Emparejamiento Coliving</h1>
              <p className="text-muted-foreground">
                Encuentra compañeros de piso compatibles contigo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getNivelColor(myProfile.nivel)} variant="outline">
              <Star className="h-3 w-3 mr-1" />
              Nivel {myProfile.nivel}
            </Badge>
            <Badge variant="outline">
              {myProfile.puntosReputacion} puntos
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => findMatches(myProfile.id)}
              disabled={searching}
            >
              {searching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{matches.length}</p>
                  <p className="text-xs text-muted-foreground">Matches Sugeridos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{savedMatches.length}</p>
                  <p className="text-xs text-muted-foreground">Conexiones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{myProfile.intereses.length}</p>
                  <p className="text-xs text-muted-foreground">Intereses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{myProfile.idiomas.length}</p>
                  <p className="text-xs text-muted-foreground">Idiomas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sugeridos" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Sugeridos ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="conexiones" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Mis Conexiones ({savedMatches.length})
            </TabsTrigger>
            <TabsTrigger value="perfil" className="gap-2">
              <Users className="h-4 w-4" />
              Mi Perfil
            </TabsTrigger>
          </TabsList>

          {/* Tab: Sugeridos */}
          <TabsContent value="sugeridos" className="mt-6">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No hay matches disponibles</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No encontramos perfiles compatibles en este momento. 
                    Intenta actualizar tus intereses o vuelve más tarde.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                  <Card key={match.profile.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                              {match.profile.tenant?.nombreCompleto?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {match.profile.tenant?.nombreCompleto || 'Usuario'}
                            </CardTitle>
                            {match.profile.profesion && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {match.profile.profesion}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(match.score)}`}>
                            {match.score}%
                          </div>
                          <p className="text-xs text-muted-foreground">compatible</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Bio */}
                      {match.profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {match.profile.bio}
                        </p>
                      )}

                      {/* Intereses comunes */}
                      <div>
                        <p className="text-xs font-medium mb-2 flex items-center gap-1">
                          <Heart className="h-3 w-3 text-pink-500" />
                          Intereses en común ({match.interesesComunes.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {match.interesesComunes.slice(0, 5).map(interes => (
                            <Badge key={interes} variant="secondary" className="text-xs capitalize">
                              {interes}
                            </Badge>
                          ))}
                          {match.interesesComunes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.interesesComunes.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="space-y-1">
                        <Progress value={match.score} className="h-2" />
                      </div>

                      {/* Badges del perfil */}
                      <div className="flex items-center gap-2">
                        <Badge className={getNivelColor(match.profile.nivel)} variant="outline">
                          <Star className="h-3 w-3 mr-1" />
                          {match.profile.nivel}
                        </Badge>
                        {match.profile.idiomas.slice(0, 2).map(idioma => (
                          <Badge key={idioma} variant="outline" className="uppercase">
                            {idioma}
                          </Badge>
                        ))}
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRejectMatch(match.profile.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Pasar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                          onClick={() => handleAcceptMatch(match.profile.id)}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Conectar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Conexiones */}
          <TabsContent value="conexiones" className="mt-6">
            <Card>
              <CardContent className="py-16 text-center">
                <UserCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Tus Conexiones</h3>
                <p className="text-muted-foreground">
                  Aquí aparecerán las personas con las que hayas conectado
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Mi Perfil */}
          <TabsContent value="perfil" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mi Perfil de Coliving</CardTitle>
                <CardDescription>
                  Así te ven los demás residentes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                      {myProfile.tenant?.nombreCompleto?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{myProfile.tenant?.nombreCompleto}</h3>
                    {myProfile.profesion && (
                      <p className="text-muted-foreground">{myProfile.profesion}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getNivelColor(myProfile.nivel)}>
                        <Star className="h-3 w-3 mr-1" />
                        Nivel {myProfile.nivel}
                      </Badge>
                      <Badge variant="outline">{myProfile.puntosReputacion} puntos</Badge>
                    </div>
                  </div>
                </div>

                {myProfile.bio && (
                  <div>
                    <h4 className="font-medium mb-2">Sobre mí</h4>
                    <p className="text-muted-foreground">{myProfile.bio}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Mis intereses</h4>
                  <div className="flex flex-wrap gap-2">
                    {myProfile.intereses.map(interes => (
                      <Badge key={interes} className="capitalize">
                        {interes}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Me gustaría compartir</h4>
                  <div className="flex flex-wrap gap-2">
                    {myProfile.interesCompartir.map(item => (
                      <Badge key={item} variant="secondary" className="capitalize">
                        {item.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Idiomas</h4>
                  <div className="flex flex-wrap gap-2">
                    {myProfile.idiomas.map(idioma => (
                      <Badge key={idioma} variant="outline" className="uppercase">
                        {idioma}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

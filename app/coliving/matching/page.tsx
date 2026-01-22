'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Users,
  Home,
  MapPin,
  Euro,
  Calendar,
  Heart,
  Search,
  Sparkles,
  BedDouble,
  Bath,
  Wind,
  Wifi,
  CheckCircle2,
  XCircle,
  Star,
  Loader2,
  ChevronRight,
  ChevronDown,
  User,
  Briefcase,
  Clock,
  Cigarette,
  Dog,
  Music,
  BookOpen,
  Gamepad2,
  Dumbbell,
  Coffee,
  Globe,
  Filter,
  RotateCcw,
  Send,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';

interface PerfilInquilino {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  avatar?: string;
  edad: number;
  genero: 'masculino' | 'femenino' | 'otro' | 'sin_preferencia';
  ocupacion: string;
  presupuestoMin: number;
  presupuestoMax: number;
  fechaEntrada: string;
  duracionMeses: number;
  preferencias: {
    fumador: boolean;
    mascotas: boolean;
    estudiante: boolean;
    trabajador: boolean;
    horarios: 'diurno' | 'nocturno' | 'flexible';
    limpieza: number;
    ruido: number;
    social: number;
    visitantes: 'nunca' | 'ocasional' | 'frecuente';
    cocinaTipo: 'individual' | 'compartida' | 'indiferente';
    baño: 'privado' | 'compartido' | 'indiferente';
    zonas: string[];
    idiomas: string[];
    intereses: string[];
  };
}

interface Habitacion {
  id: string;
  propiedadId: string;
  propiedadNombre: string;
  direccion: string;
  zona: string;
  numero: string;
  superficie: number;
  precio: number;
  disponible: boolean;
  fechaDisponible: string;
  caracteristicas: {
    bañoPrivado: boolean;
    amueblada: boolean;
    balcon: boolean;
    aireAcondicionado: boolean;
    calefaccion: boolean;
    armarioEmpotrado: boolean;
  };
  reglas: {
    fumadores: boolean;
    mascotas: boolean;
    parejas: boolean;
    visitasNocturnas: boolean;
  };
  fotos: string[];
  inquilinosActuales: number;
  capacidadTotal: number;
}

interface MatchResult {
  habitacion: Habitacion;
  puntuacion: number;
  detalles: {
    presupuesto: number;
    preferencias: number;
    ubicacion: number;
    disponibilidad: number;
    compatibilidadCompañeros: number;
  };
  compañeros: Array<{
    nombre: string;
    edad: number;
    ocupacion: string;
    compatibilidad: number;
  }>;
}

const ZONAS = ['Malasaña', 'Chamberí', 'Moncloa', 'Lavapiés', 'Argüelles', 'Salamanca', 'Centro', 'Tetuán'];
const IDIOMAS = ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Chino', 'Japonés'];
const INTERESES = [
  { id: 'yoga', nombre: 'Yoga', icon: '🧘' },
  { id: 'musica', nombre: 'Música', icon: '🎵' },
  { id: 'lectura', nombre: 'Lectura', icon: '📚' },
  { id: 'gaming', nombre: 'Gaming', icon: '🎮' },
  { id: 'deporte', nombre: 'Deporte', icon: '💪' },
  { id: 'cocina', nombre: 'Cocina', icon: '👨‍🍳' },
  { id: 'viajes', nombre: 'Viajes', icon: '✈️' },
  { id: 'cine', nombre: 'Cine', icon: '🎬' },
  { id: 'arte', nombre: 'Arte', icon: '🎨' },
  { id: 'tecnologia', nombre: 'Tecnología', icon: '💻' },
  { id: 'naturaleza', nombre: 'Naturaleza', icon: '🌿' },
  { id: 'social', nombre: 'Vida social', icon: '🎉' },
];

const perfilInicial: PerfilInquilino = {
  id: '',
  nombre: '',
  email: '',
  edad: 25,
  genero: 'sin_preferencia',
  ocupacion: '',
  presupuestoMin: 400,
  presupuestoMax: 700,
  fechaEntrada: new Date().toISOString().split('T')[0],
  duracionMeses: 12,
  preferencias: {
    fumador: false,
    mascotas: false,
    estudiante: false,
    trabajador: true,
    horarios: 'flexible',
    limpieza: 3,
    ruido: 3,
    social: 3,
    visitantes: 'ocasional',
    cocinaTipo: 'indiferente',
    baño: 'indiferente',
    zonas: [],
    idiomas: ['Español'],
    intereses: [],
  },
};

export default function MatchingPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [paso, setPaso] = useState(1);
  const [perfil, setPerfil] = useState<PerfilInquilino>(perfilInicial);
  const [resultados, setResultados] = useState<MatchResult[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [mejorMatch, setMejorMatch] = useState<MatchResult | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      loadHabitaciones();
    }
  }, [status]);

  const loadHabitaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coliving/matching');
      if (response.ok) {
        const data = await response.json();
        setHabitaciones(data.habitaciones || []);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarMatching = async () => {
    setBuscando(true);
    try {
      const response = await fetch('/api/coliving/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil }),
      });

      if (response.ok) {
        const data = await response.json();
        setResultados(data.resultados || []);
        setMejorMatch(data.mejorMatch);
        setPaso(4); // Ir a resultados
        toast.success(`¡Encontramos ${data.total} habitaciones compatibles!`);
      } else {
        toast.error('Error al buscar habitaciones');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setBuscando(false);
    }
  };

  const updatePreferencia = (key: string, value: any) => {
    setPerfil((prev) => ({
      ...prev,
      preferencias: {
        ...prev.preferencias,
        [key]: value,
      },
    }));
  };

  const toggleZona = (zona: string) => {
    const zonas = perfil.preferencias.zonas.includes(zona)
      ? perfil.preferencias.zonas.filter((z) => z !== zona)
      : [...perfil.preferencias.zonas, zona];
    updatePreferencia('zonas', zonas);
  };

  const toggleInteres = (interes: string) => {
    const intereses = perfil.preferencias.intereses.includes(interes)
      ? perfil.preferencias.intereses.filter((i) => i !== interes)
      : [...perfil.preferencias.intereses, interes];
    updatePreferencia('intereses', intereses);
  };

  const toggleIdioma = (idioma: string) => {
    const idiomas = perfil.preferencias.idiomas.includes(idioma)
      ? perfil.preferencias.idiomas.filter((i) => i !== idioma)
      : [...perfil.preferencias.idiomas, idioma];
    updatePreferencia('idiomas', idiomas);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Heart className="h-8 w-8 text-pink-500" />
              Matching de Habitaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Encuentra la habitación perfecta y compañeros compatibles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {habitaciones.length} habitaciones disponibles
            </Badge>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'Datos básicos' },
              { num: 2, label: 'Preferencias' },
              { num: 3, label: 'Estilo de vida' },
              { num: 4, label: 'Resultados' },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => step.num < paso && setPaso(step.num)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    paso === step.num
                      ? 'bg-primary text-primary-foreground'
                      : paso > step.num
                      ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                    {paso > step.num ? <CheckCircle2 className="h-4 w-4" /> : step.num}
                  </span>
                  <span className="hidden md:inline text-sm font-medium">{step.label}</span>
                </button>
                {idx < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido por paso */}
        {paso === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cuéntanos sobre ti
              </CardTitle>
              <CardDescription>
                Información básica para encontrar tu habitación ideal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nombre completo</Label>
                  <Input
                    value={perfil.nombre}
                    onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                    placeholder="tu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Edad</Label>
                  <Input
                    type="number"
                    min={18}
                    max={99}
                    value={perfil.edad}
                    onChange={(e) => setPerfil({ ...perfil, edad: parseInt(e.target.value) || 25 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ocupación</Label>
                  <Input
                    value={perfil.ocupacion}
                    onChange={(e) => setPerfil({ ...perfil, ocupacion: e.target.value })}
                    placeholder="Ej: Desarrollador, Estudiante..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Presupuesto mensual</Label>
                  <div className="pt-4">
                    <Slider
                      value={[perfil.presupuestoMin, perfil.presupuestoMax]}
                      onValueChange={([min, max]) =>
                        setPerfil({ ...perfil, presupuestoMin: min, presupuestoMax: max })
                      }
                      min={200}
                      max={1500}
                      step={50}
                    />
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>{perfil.presupuestoMin}€</span>
                      <span>{perfil.presupuestoMax}€</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de entrada</Label>
                  <Input
                    type="date"
                    value={perfil.fechaEntrada}
                    onChange={(e) => setPerfil({ ...perfil, fechaEntrada: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zonas de interés</Label>
                <div className="flex flex-wrap gap-2">
                  {ZONAS.map((zona) => (
                    <Badge
                      key={zona}
                      variant={perfil.preferencias.zonas.includes(zona) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleZona(zona)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {zona}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setPaso(2)}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {paso === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Preferencias de alojamiento
              </CardTitle>
              <CardDescription>¿Qué características buscas en tu habitación?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <Label>Baño</Label>
                    </div>
                    <Select
                      value={perfil.preferencias.baño}
                      onValueChange={(v: any) => updatePreferencia('baño', v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="privado">Privado</SelectItem>
                        <SelectItem value="compartido">Compartido</SelectItem>
                        <SelectItem value="indiferente">Indiferente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                      <Label>Cocina</Label>
                    </div>
                    <Select
                      value={perfil.preferencias.cocinaTipo}
                      onValueChange={(v: any) => updatePreferencia('cocinaTipo', v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="compartida">Compartida</SelectItem>
                        <SelectItem value="indiferente">Indiferente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Label>Visitas</Label>
                    </div>
                    <Select
                      value={perfil.preferencias.visitantes}
                      onValueChange={(v: any) => updatePreferencia('visitantes', v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nunca">Sin visitas</SelectItem>
                        <SelectItem value="ocasional">Ocasionalmente</SelectItem>
                        <SelectItem value="frecuente">Frecuentemente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Cigarette className="h-4 w-4 text-muted-foreground" />
                      <span>Fumador</span>
                    </div>
                    <Switch
                      checked={perfil.preferencias.fumador}
                      onCheckedChange={(v) => updatePreferencia('fumador', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Dog className="h-4 w-4 text-muted-foreground" />
                      <span>Tengo mascota</span>
                    </div>
                    <Switch
                      checked={perfil.preferencias.mascotas}
                      onCheckedChange={(v) => updatePreferencia('mascotas', v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>Soy estudiante</span>
                    </div>
                    <Switch
                      checked={perfil.preferencias.estudiante}
                      onCheckedChange={(v) => updatePreferencia('estudiante', v)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Idiomas que hablas</Label>
                <div className="flex flex-wrap gap-2">
                  {IDIOMAS.map((idioma) => (
                    <Badge
                      key={idioma}
                      variant={perfil.preferencias.idiomas.includes(idioma) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleIdioma(idioma)}
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      {idioma}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setPaso(1)}>
                Anterior
              </Button>
              <Button onClick={() => setPaso(3)}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {paso === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Estilo de vida
              </CardTitle>
              <CardDescription>
                Esto nos ayuda a encontrar compañeros compatibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horario habitual
                  </Label>
                  <Select
                    value={perfil.preferencias.horarios}
                    onValueChange={(v: any) => updatePreferencia('horarios', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diurno">Madrugador 🌅</SelectItem>
                      <SelectItem value="nocturno">Noctámbulo 🌙</SelectItem>
                      <SelectItem value="flexible">Flexible ⚖️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nivel de limpieza (1-5)</Label>
                  <Slider
                    value={[perfil.preferencias.limpieza]}
                    onValueChange={([v]) => updatePreferencia('limpieza', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Relajado</span>
                    <span>Muy ordenado</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tolerancia al ruido (1-5)</Label>
                  <Slider
                    value={[perfil.preferencias.ruido]}
                    onValueChange={([v]) => updatePreferencia('ruido', v)}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Silencioso</span>
                    <span>Animado</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nivel social (1-5)</Label>
                <Slider
                  value={[perfil.preferencias.social]}
                  onValueChange={([v]) => updatePreferencia('social', v)}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Prefiero mi espacio</span>
                  <span>Muy sociable</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Intereses y hobbies</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {INTERESES.map((interes) => (
                    <button
                      key={interes.id}
                      onClick={() => toggleInteres(interes.id)}
                      className={`p-3 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
                        perfil.preferencias.intereses.includes(interes.id)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span>{interes.icon}</span>
                      <span>{interes.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setPaso(2)}>
                Anterior
              </Button>
              <Button onClick={buscarMatching} disabled={buscando} className="gap-2">
                {buscando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Encontrar mi Match
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {paso === 4 && (
          <div className="space-y-6">
            {/* Mejor Match */}
            {mejorMatch && (
              <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-2">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Mejor Match
                      </Badge>
                      <CardTitle className="text-2xl">
                        {mejorMatch.habitacion.propiedadNombre} - Hab. {mejorMatch.habitacion.numero}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {mejorMatch.habitacion.direccion}
                      </CardDescription>
                    </div>
                    <div className={`text-center p-4 rounded-full ${getScoreBg(mejorMatch.puntuacion)}`}>
                      <span className={`text-3xl font-bold ${getScoreColor(mejorMatch.puntuacion)}`}>
                        {mejorMatch.puntuacion}%
                      </span>
                      <p className="text-xs text-muted-foreground">Compatibilidad</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{mejorMatch.habitacion.precio}€/mes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span>{mejorMatch.habitacion.superficie}m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {mejorMatch.habitacion.inquilinosActuales}/{mejorMatch.habitacion.capacidadTotal} ocupados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Disponible:{' '}
                        {new Date(mejorMatch.habitacion.fechaDisponible).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mejorMatch.habitacion.caracteristicas.bañoPrivado && (
                      <Badge variant="secondary">
                        <Bath className="h-3 w-3 mr-1" />
                        Baño privado
                      </Badge>
                    )}
                    {mejorMatch.habitacion.caracteristicas.amueblada && (
                      <Badge variant="secondary">
                        <BedDouble className="h-3 w-3 mr-1" />
                        Amueblada
                      </Badge>
                    )}
                    {mejorMatch.habitacion.caracteristicas.aireAcondicionado && (
                      <Badge variant="secondary">
                        <Wind className="h-3 w-3 mr-1" />
                        A/C
                      </Badge>
                    )}
                    {mejorMatch.habitacion.caracteristicas.balcon && (
                      <Badge variant="secondary">Balcón</Badge>
                    )}
                  </div>

                  {/* Compatibilidad con compañeros */}
                  {mejorMatch.compañeros.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tus futuros compañeros:</Label>
                      <div className="flex flex-wrap gap-4">
                        {mejorMatch.compañeros.map((comp, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{comp.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {comp.edad} años · {comp.ocupacion}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Progress value={comp.compatibilidad} className="h-1 w-16" />
                                <span className="text-xs">{comp.compatibilidad}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desglose de puntuación */}
                  <div className="grid grid-cols-5 gap-2 pt-4 border-t">
                    {Object.entries(mejorMatch.detalles).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-4">
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Solicitar visita
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Ver detalles
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Otros resultados */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Otras opciones compatibles</h2>
              <Button variant="ghost" size="sm" onClick={() => setPaso(1)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Nueva búsqueda
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resultados.slice(1).map((result) => (
                <Card key={result.habitacion.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Hab. {result.habitacion.numero}
                      </CardTitle>
                      <Badge className={getScoreBg(result.puntuacion)}>
                        <span className={getScoreColor(result.puntuacion)}>
                          {result.puntuacion}% match
                        </span>
                      </Badge>
                    </div>
                    <CardDescription>{result.habitacion.propiedadNombre}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {result.habitacion.zona}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{result.habitacion.precio}€</span>
                      <span className="text-sm text-muted-foreground">/mes</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.habitacion.caracteristicas.bañoPrivado && (
                        <Badge variant="outline" className="text-xs">Baño priv.</Badge>
                      )}
                      {result.habitacion.caracteristicas.amueblada && (
                        <Badge variant="outline" className="text-xs">Amueblada</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.compañeros.length} compañeros actuales
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" size="sm">
                      Ver detalles
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {resultados.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No se encontraron habitaciones</h3>
                  <p className="text-muted-foreground mt-2">
                    Intenta ampliar tu presupuesto o zonas de búsqueda
                  </p>
                  <Button className="mt-4" onClick={() => setPaso(1)}>
                    Modificar preferencias
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

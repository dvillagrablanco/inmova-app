'use client';

/**
 * Partners - Capacitación
 * 
 * Programa de formación y certificación para partners
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  Play,
  Clock,
  CheckCircle,
  Lock,
  Star,
  Trophy,
  Video,
  FileText,
  BookOpen,
  Award,
  Calendar,
} from 'lucide-react';

interface Course {
  id: string;
  titulo: string;
  descripcion: string;
  duracion: string;
  modulos: number;
  completado: number;
  nivel: 'basico' | 'intermedio' | 'avanzado';
  obligatorio: boolean;
}

interface Webinar {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  ponente: string;
  estado: 'proximo' | 'en_vivo' | 'grabado';
}

const COURSES: Course[] = [
  {
    id: '1',
    titulo: 'Introducción a Inmova',
    descripcion: 'Conoce la plataforma, sus funcionalidades y beneficios principales',
    duracion: '45 min',
    modulos: 5,
    completado: 5,
    nivel: 'basico',
    obligatorio: true,
  },
  {
    id: '2',
    titulo: 'Técnicas de Venta para Partners',
    descripcion: 'Aprende a presentar Inmova a potenciales clientes',
    duracion: '1h 30min',
    modulos: 8,
    completado: 6,
    nivel: 'intermedio',
    obligatorio: true,
  },
  {
    id: '3',
    titulo: 'Gestión de Leads',
    descripcion: 'Cómo captar, cualificar y convertir leads en clientes',
    duracion: '2h',
    modulos: 10,
    completado: 0,
    nivel: 'intermedio',
    obligatorio: false,
  },
  {
    id: '4',
    titulo: 'Integración API Avanzada',
    descripcion: 'Domina las integraciones técnicas de la plataforma',
    duracion: '3h',
    modulos: 12,
    completado: 0,
    nivel: 'avanzado',
    obligatorio: false,
  },
];

const WEBINARS: Webinar[] = [
  {
    id: '1',
    titulo: 'Novedades Q1 2026',
    fecha: '2026-01-25',
    hora: '11:00',
    ponente: 'María García - Product Manager',
    estado: 'proximo',
  },
  {
    id: '2',
    titulo: 'Estrategias de Marketing Digital',
    fecha: '2026-01-18',
    hora: '16:00',
    ponente: 'Carlos López - Marketing Lead',
    estado: 'proximo',
  },
  {
    id: '3',
    titulo: 'Mejores Prácticas de Partners',
    fecha: '2026-01-10',
    hora: '11:00',
    ponente: 'Ana Martínez - Partner Success',
    estado: 'grabado',
  },
];

const CERTIFICATIONS = [
  {
    id: 'basic',
    nombre: 'Partner Certificado',
    requisitos: ['Completar curso de Introducción', 'Aprobar examen básico'],
    obtenida: true,
    fecha: '2025-11-15',
  },
  {
    id: 'silver',
    nombre: 'Partner Silver',
    requisitos: ['Partner Certificado', '10+ clientes referidos', 'Completar formación intermedia'],
    obtenida: false,
    progreso: 60,
  },
  {
    id: 'gold',
    nombre: 'Partner Gold',
    requisitos: ['Partner Silver', '50+ clientes referidos', 'Completar toda la formación'],
    obtenida: false,
    progreso: 0,
  },
];

export default function PartnersCapacitacionPage() {
  const [activeTab, setActiveTab] = useState('cursos');

  const getNivelBadge = (nivel: Course['nivel']) => {
    const config = {
      basico: { label: 'Básico', variant: 'secondary' as const },
      intermedio: { label: 'Intermedio', variant: 'default' as const },
      avanzado: { label: 'Avanzado', variant: 'destructive' as const },
    };
    return <Badge variant={config[nivel].variant}>{config[nivel].label}</Badge>;
  };

  const totalModulos = COURSES.reduce((sum, c) => sum + c.modulos, 0);
  const completadosTotal = COURSES.reduce((sum, c) => sum + c.completado, 0);
  const progresoGeneral = Math.round((completadosTotal / totalModulos) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Capacitación</h1>
          <p className="text-muted-foreground">
            Programa de formación y certificación
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progreso General</p>
            <p className="text-xl font-bold">{progresoGeneral}%</p>
          </div>
          <Progress value={progresoGeneral} className="w-32" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cursos</p>
                <p className="text-2xl font-bold">{COURSES.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">
                  {COURSES.filter(c => c.completado === c.modulos).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificaciones</p>
                <p className="text-2xl font-bold">
                  {CERTIFICATIONS.filter(c => c.obtenida).length}
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Webinars</p>
                <p className="text-2xl font-bold">{WEBINARS.length}</p>
              </div>
              <Video className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cursos">
            <GraduationCap className="h-4 w-4 mr-2" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="webinars">
            <Video className="h-4 w-4 mr-2" />
            Webinars
          </TabsTrigger>
          <TabsTrigger value="certificaciones">
            <Trophy className="h-4 w-4 mr-2" />
            Certificaciones
          </TabsTrigger>
        </TabsList>

        {/* Cursos Tab */}
        <TabsContent value="cursos" className="space-y-4">
          {COURSES.map((course) => {
            const isCompleted = course.completado === course.modulos;
            const progress = (course.completado / course.modulos) * 100;

            return (
              <Card key={course.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{course.titulo}</h3>
                        {getNivelBadge(course.nivel)}
                        {course.obligatorio && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Obligatorio
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duracion}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {course.modulos} módulos
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="flex-1 max-w-xs" />
                        <span className="text-sm text-muted-foreground">
                          {course.completado}/{course.modulos}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant={isCompleted ? 'outline' : 'default'}
                      className="flex-shrink-0"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isCompleted ? 'Repasar' : progress > 0 ? 'Continuar' : 'Empezar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Webinars Tab */}
        <TabsContent value="webinars" className="space-y-4">
          {WEBINARS.map((webinar) => (
            <Card key={webinar.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{webinar.titulo}</h3>
                      <Badge
                        variant={webinar.estado === 'proximo' ? 'default' : 'secondary'}
                      >
                        {webinar.estado === 'proximo' && 'Próximo'}
                        {webinar.estado === 'en_vivo' && '🔴 En vivo'}
                        {webinar.estado === 'grabado' && 'Grabado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {webinar.ponente}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {webinar.fecha} a las {webinar.hora}
                    </p>
                  </div>
                  <Button
                    variant={webinar.estado === 'grabado' ? 'outline' : 'default'}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {webinar.estado === 'grabado' ? 'Ver grabación' : 'Registrarse'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Certificaciones Tab */}
        <TabsContent value="certificaciones" className="space-y-4">
          {CERTIFICATIONS.map((cert) => (
            <Card
              key={cert.id}
              className={cert.obtenida ? 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      cert.obtenida
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-muted'
                    }`}>
                      {cert.obtenida ? (
                        <Trophy className="h-6 w-6 text-yellow-600" />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{cert.nombre}</h3>
                        {cert.obtenida && (
                          <Badge className="bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Obtenida
                          </Badge>
                        )}
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {cert.requisitos.map((req, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className={`h-3 w-3 ${
                              cert.obtenida ? 'text-green-500' : 'text-muted-foreground'
                            }`} />
                            {req}
                          </li>
                        ))}
                      </ul>
                      {cert.obtenida && cert.fecha && (
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Obtenida el {cert.fecha}
                        </p>
                      )}
                      {!cert.obtenida && cert.progreso !== undefined && (
                        <div className="flex items-center gap-2">
                          <Progress value={cert.progreso} className="max-w-xs" />
                          <span className="text-sm text-muted-foreground">
                            {cert.progreso}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {cert.obtenida && (
                    <Button variant="outline">
                      <Award className="h-4 w-4 mr-2" />
                      Descargar Certificado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

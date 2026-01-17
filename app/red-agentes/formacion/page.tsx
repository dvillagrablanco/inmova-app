'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Users,
  ArrowLeft,
  Play,
  CheckCircle2,
  Star,
  Calendar,
  Video,
  FileText,
} from 'lucide-react';

// Arrays vacíos - se llenarán con datos reales de la BD
const cursosDisponibles: Array<{
  id: number;
  titulo: string;
  descripcion: string;
  duracion: string;
  modulos: number;
  nivel: string;
  categoria: string;
  imagen: string;
  inscritos: number;
}> = [];

const certificaciones: Array<{
  nombre: string;
  agentes: number;
  requisitos: string;
  color: string;
}> = [];

const progresoAgentes: Array<{
  nombre: string;
  curso: string;
  progreso: number;
  ultimaActividad: string;
}> = [];

export default function RedAgentesFormacionPage() {
  const router = useRouter();

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
              <h1 className="text-3xl font-bold">Formación y Certificación</h1>
              <p className="text-muted-foreground">
                Cursos y certificaciones para agentes de la red
              </p>
            </div>
          </div>
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Crear Curso
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cursosDisponibles.length}</p>
                <p className="text-xs text-muted-foreground">Cursos Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Award className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificaciones.length}</p>
                <p className="text-xs text-muted-foreground">Certificaciones</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">41</p>
                <p className="text-xs text-muted-foreground">Agentes Certificados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">57h</p>
                <p className="text-xs text-muted-foreground">Contenido Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cursos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cursos">Cursos Disponibles</TabsTrigger>
            <TabsTrigger value="certificaciones">Certificaciones</TabsTrigger>
            <TabsTrigger value="progreso">Progreso Agentes</TabsTrigger>
          </TabsList>

          <TabsContent value="cursos">
            <div className="grid md:grid-cols-2 gap-4">
              {cursosDisponibles.map((curso) => (
                <Card key={curso.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="text-4xl">{curso.imagen}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{curso.titulo}</h3>
                          <Badge variant="outline">{curso.nivel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{curso.descripcion}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {curso.duracion}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {curso.modulos} módulos
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {curso.inscritos} inscritos
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Empezar
                          </Button>
                          <Button size="sm" variant="outline">Ver contenido</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="certificaciones">
            <div className="grid md:grid-cols-2 gap-4">
              {certificaciones.map((cert, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${cert.color} flex items-center justify-center`}>
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{cert.nombre}</h3>
                        <p className="text-sm text-muted-foreground">{cert.requisitos}</p>
                        <p className="text-sm mt-1">
                          <span className="font-semibold">{cert.agentes}</span> agentes certificados
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Ver requisitos</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progreso">
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Formación</CardTitle>
                <CardDescription>Seguimiento del avance de los agentes en sus cursos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progresoAgentes.map((agente, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{agente.nombre}</p>
                          <p className="text-sm text-muted-foreground">{agente.curso}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{agente.progreso}%</p>
                          <p className="text-xs text-muted-foreground">{agente.ultimaActividad}</p>
                        </div>
                      </div>
                      <Progress value={agente.progreso} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

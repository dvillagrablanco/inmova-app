'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, BookOpen, Award, ChevronRight } from 'lucide-react';

export default function PartnerAcademyPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/partners/academy').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setCourses(d.courses || []); setStats(d.stats); }
    });
  }, []);

  const nivelColors: Record<string, string> = { basico: 'bg-green-100 text-green-800', intermedio: 'bg-blue-100 text-blue-800', avanzado: 'bg-purple-100 text-purple-800' };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-8 w-8 text-indigo-600" /> Academy Partners</h1>
          <p className="text-gray-500">Formación y certificación para partners INMOVA</p>
        </div>
        {stats && <Badge variant="outline" className="text-sm">{stats.totalCursos} cursos · {stats.totalModulos} módulos · {stats.duracionTotal}</Badge>}
      </div>

      <div className="space-y-4">
        {courses.map((course: any) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    {course.titulo}
                  </CardTitle>
                  <CardDescription>{course.descripcion}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={nivelColors[course.nivel] || ''}>{course.nivel}</Badge>
                  <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{course.duracion}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {course.modulos.map((mod: any) => (
                  <div key={mod.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{mod.titulo}</span>
                    <span className="text-xs text-gray-400">{mod.duracion}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Award className="h-3.5 w-3.5" />
                  Requisito: certificación {course.requisitoCertificacion}
                </div>
                <Button size="sm">Empezar curso <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

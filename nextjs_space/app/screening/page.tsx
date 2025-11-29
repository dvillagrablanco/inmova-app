'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Home, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function ScreeningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [screenings, setScreenings] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchScreenings();
  }, [status]);

  const fetchScreenings = async () => {
    try {
      const res = await fetch('/api/screening');
      const data = await res.json();
      setScreenings(data);
      setLoading(false);
    } catch (error) {
      toast.error('Error al cargar screenings');
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;

  const getRiesgoColor = (nivel: string) => {
    switch (nivel) {
      case 'bajo': return 'bg-green-500';
      case 'medio': return 'bg-yellow-500';
      case 'alto': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />Volver al Dashboard
              </Button>

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>Screening</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <h1 className="text-3xl font-bold">Screening Avanzado</h1>
              <p className="text-muted-foreground">Verificación y scoring de candidatos con 20+ criterios</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: 'Total', value: screenings.length, icon: User },
                { title: 'Aprobados', value: screenings.filter(s => s.aprobado === true).length, icon: CheckCircle2 },
                { title: 'Rechazados', value: screenings.filter(s => s.aprobado === false).length, icon: XCircle },
                { title: 'Scoring Promedio', value: screenings.length > 0 ? Math.round(screenings.reduce((sum, s) => sum + s.scoringTotal, 0) / screenings.length) : 0, icon: Shield }
              ].map((kpi, idx) => (
                <Card key={idx}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                    <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpi.value}{kpi.title.includes('Scoring') ? '/100' : ''}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Screenings Activos</CardTitle>
                <CardDescription>Verificaciones en proceso y completadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {screenings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay screenings realizados</p>
                  ) : (
                    screenings.map((screening) => (
                      <Card key={screening.id} className="p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{screening.candidate?.nombreCompleto}</h3>
                              <Badge variant={screening.estado === 'aprobado' ? 'default' : screening.estado === 'rechazado' ? 'destructive' : 'secondary'}>
                                {screening.estado}
                              </Badge>
                              <Badge className={getRiesgoColor(screening.nivelRiesgoGlobal)}>
                                Riesgo {screening.nivelRiesgoGlobal}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {screening.candidate?.email} • {screening.candidate?.telefono}
                            </p>
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Scoring Total</span>
                                <span className="font-semibold">{screening.scoringTotal}/100</span>
                              </div>
                              <Progress value={screening.scoringTotal} className="h-2" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">Identidad</span>
                                <p className="font-semibold">{screening.dniPuntos}/20</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Laboral</span>
                                <p className="font-semibold">{screening.laboralPuntos}/25</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Económica</span>
                                <p className="font-semibold">{screening.economicaPuntos}/25</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Referencias</span>
                                <p className="font-semibold">{screening.referenciasPuntos}/15</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Antecedentes</span>
                                <p className="font-semibold">{screening.antecedentesPuntos}/15</p>
                              </div>
                            </div>
                            {screening.flagsRiesgo && screening.flagsRiesgo.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm font-medium mb-1 flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                  Flags de riesgo:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {screening.flagsRiesgo.slice(0, 3).map((flag: any, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {flag.descripcion}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

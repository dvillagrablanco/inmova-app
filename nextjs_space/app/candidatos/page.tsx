'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Building2, Calendar } from 'lucide-react';

export default function CandidatosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCandidates();
    }
  }, [status]);

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      nuevo: 'bg-blue-500',
      en_revision: 'bg-yellow-500',
      preseleccionado: 'bg-purple-500',
      aprobado: 'bg-green-500',
      rechazado: 'bg-red-500',
    };
    return colors[estado] || 'bg-gray-500';
  };

  const getScoringColor = (scoring: number) => {
    if (scoring >= 80) return 'text-green-600';
    if (scoring >= 60) return 'text-yellow-600';
    if (scoring >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto main-content">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Candidatos</h1>
                <p className="text-gray-500 mt-2">Gestión de candidatos a inquilinos</p>
              </div>
              <Button className="bg-black hover:bg-gray-800">
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Candidato
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Candidatos</CardDescription>
                <CardTitle className="text-3xl">{candidates.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Nuevos</CardDescription>
                <CardTitle className="text-3xl">
                  {candidates.filter(c => c.estado === 'nuevo').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>En Revisión</CardDescription>
                <CardTitle className="text-3xl">
                  {candidates.filter(c => c.estado === 'en_revision').length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Aprobados</CardDescription>
                <CardTitle className="text-3xl">
                  {candidates.filter(c => c.estado === 'aprobado').length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Lista de Candidatos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Candidatos</CardTitle>
              <CardDescription>
                Candidatos registrados para unidades disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidates.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay candidatos registrados</p>
                  <Button className="mt-4">Registrar Primer Candidato</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {candidate.nombreCompleto}
                            </h3>
                            <Badge className={getEstadoBadge(candidate.estado)}>
                              {candidate.estado.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>
                                {candidate.unit?.building?.nombre} - {candidate.unit?.numero}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(candidate.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Scoring:</span>
                              <span className={`font-bold ${getScoringColor(candidate.scoring)}`}>
                                {candidate.scoring}/100
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Visitas:</span>
                              <span className="font-semibold">
                                {candidate.visits?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                          <Button size="sm" className="bg-black hover:bg-gray-800">
                            Programar Visita
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

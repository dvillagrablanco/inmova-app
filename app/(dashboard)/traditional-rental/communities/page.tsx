'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Euro, Wallet, Vote, Plus } from 'lucide-react';

interface Comunidad {
  id: string;
  nombreComunidad: string;
  direccion?: string;
  building?: { id: string; name?: string; address?: string };
  totalUnidades?: number;
  facturasPendientes?: number;
  importePendiente?: number;
}

function VotacionesContent({ comunidades }: { comunidades: Comunidad[] }) {
  const [votaciones, setVotaciones] = useState<
    Array<{
      id: string;
      titulo: string;
      estado?: string;
      votos?: unknown[];
      totalVotantes?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVotaciones() {
      try {
        const res = await fetch('/api/votaciones');
        if (res.ok) {
          const data = await res.json();
          setVotaciones(Array.isArray(data) ? data : (data?.data ?? data?.votaciones ?? []));
        } else {
          setVotaciones([]);
        }
      } catch {
        setVotaciones([]);
      } finally {
        setLoading(false);
      }
    }
    fetchVotaciones();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (votaciones.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Sin datos disponibles</p>
        <p className="text-sm mt-1">Crea votaciones para que los propietarios participen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {votaciones.map((v) => {
        const totalVotos = Array.isArray(v.votos) ? v.votos.length : 0;
        const total = v.totalVotantes ?? 1;
        const pct = total > 0 ? Math.round((totalVotos / total) * 100) : 0;
        const activa = v.estado !== 'cerrada' && v.estado !== 'finalizada';
        return (
          <div key={v.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{v.titulo}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Participación: {totalVotos}/{total} ({pct}%)
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${activa ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {activa ? 'En curso' : 'Cerrada'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <Button size="sm" disabled={!activa}>
              {activa ? 'Emitir Voto' : 'Ver Resultados'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default function CommunitiesPage() {
  const [activeTab, setActiveTab] = useState('minutes');
  const [comunidades, setComunidades] = useState<Comunidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComunidades() {
      try {
        const res = await fetch('/api/comunidades');
        if (res.ok) {
          const data = await res.json();
          setComunidades(data.comunidades ?? data.data ?? []);
        } else {
          setComunidades([]);
        }
      } catch {
        setComunidades([]);
      } finally {
        setLoading(false);
      }
    }
    fetchComunidades();
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Comunidades</h1>
          <p className="text-gray-600">
            Actas digitales, cuotas, fondos de reserva y votaciones telemáticas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="minutes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Actas
            </TabsTrigger>
            <TabsTrigger value="fees" className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Cuotas
            </TabsTrigger>
            <TabsTrigger value="funds" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Fondos
            </TabsTrigger>
            <TabsTrigger value="votes" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Votaciones
            </TabsTrigger>
          </TabsList>

          {/* ACTAS */}
          <TabsContent value="minutes">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Actas de Junta</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Acta
                </Button>
              </div>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : comunidades.length > 0 ? (
                <div className="space-y-3">
                  {comunidades.map((c) => (
                    <div key={c.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{c.nombreComunidad}</h4>
                          <p className="text-sm text-gray-600">
                            {c.building?.name ?? c.direccion ?? 'Sin edificio'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Unidades: {c.totalUnidades ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline">
                          Ver Actas
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sin datos disponibles</p>
                  <p className="text-sm mt-1">Añade comunidades para gestionar actas</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* CUOTAS */}
          <TabsContent value="fees">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Cuotas de Comunidad</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generar Cuotas
                </Button>
              </div>
              {loading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : comunidades.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Pendiente</p>
                      <p className="text-2xl font-bold text-blue-600">
                        €
                        {comunidades
                          .reduce((s, c) => s + (c.importePendiente ?? 0), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Comunidades</p>
                      <p className="text-2xl font-bold text-green-600">{comunidades.length}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Facturas Pendientes</p>
                      <p className="text-2xl font-bold text-red-600">
                        {comunidades.reduce((s, c) => s + (c.facturasPendientes ?? 0), 0)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {comunidades.map((c) => (
                      <div key={c.id} className="flex justify-between items-center border-b py-3">
                        <div>
                          <p className="font-medium">{c.nombreComunidad}</p>
                          <p className="text-sm text-gray-600">
                            {c.building?.name ?? c.direccion ?? '—'} •{' '}
                            {(c.importePendiente ?? 0).toLocaleString()}€ pendiente
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {(c.facturasPendientes ?? 0) > 0 ? (
                            <>
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                Pendiente
                              </span>
                              <Button size="sm">Marcar Pagado</Button>
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Al día
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sin datos disponibles</p>
                  <p className="text-sm mt-1">Añade comunidades para gestionar cuotas</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* FONDOS */}
          <TabsContent value="funds">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Fondos de Reserva</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Fondo
                </Button>
              </div>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : comunidades.length > 0 ? (
                <div className="space-y-4">
                  {comunidades.map((c) => (
                    <div key={c.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{c.nombreComunidad}</h4>
                          <p className="text-sm text-gray-600">
                            {c.building?.name ?? c.direccion ?? '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            €{(c.importePendiente ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">Fondos pendientes</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Añadir Ingreso
                        </Button>
                        <Button size="sm" variant="outline">
                          Registrar Gasto
                        </Button>
                        <Button size="sm" variant="outline">
                          Ver Movimientos
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sin datos disponibles</p>
                  <p className="text-sm mt-1">Pendiente de configurar fondos por comunidad</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* VOTACIONES */}
          <TabsContent value="votes">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Votaciones Telemáticas</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Votación
                </Button>
              </div>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <VotacionesContent comunidades={comunidades} />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}

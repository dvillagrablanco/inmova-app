'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Users,
  Building2,
  TrendingUp,
  ArrowLeft,
  Plus,
  Edit,
  Search,
  MoreVertical,
} from 'lucide-react';

// Datos de zonas
const zonasData = [
  { id: 1, nombre: 'Madrid Centro', agentes: 8, propiedades: 45, operaciones: 12, comisiones: 18500, cobertura: 85, color: 'bg-blue-500' },
  { id: 2, nombre: 'Barcelona Eixample', agentes: 5, propiedades: 32, operaciones: 8, comisiones: 12200, cobertura: 70, color: 'bg-green-500' },
  { id: 3, nombre: 'Valencia Centro', agentes: 4, propiedades: 28, operaciones: 5, comisiones: 7800, cobertura: 60, color: 'bg-amber-500' },
  { id: 4, nombre: 'Sevilla', agentes: 3, propiedades: 22, operaciones: 4, comisiones: 5200, cobertura: 55, color: 'bg-purple-500' },
  { id: 5, nombre: 'Málaga Costa', agentes: 3, propiedades: 18, operaciones: 3, comisiones: 4100, cobertura: 45, color: 'bg-cyan-500' },
  { id: 6, nombre: 'Bilbao', agentes: 2, propiedades: 15, operaciones: 2, comisiones: 3200, cobertura: 40, color: 'bg-pink-500' },
];

export default function RedAgentesZonasPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const zonasFiltradas = zonasData.filter(zona =>
    zona.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAgentes = zonasData.reduce((sum, z) => sum + z.agentes, 0);
  const totalPropiedades = zonasData.reduce((sum, z) => sum + z.propiedades, 0);
  const totalOperaciones = zonasData.reduce((sum, z) => sum + z.operaciones, 0);

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
              <h1 className="text-3xl font-bold">Zonas y Territorios</h1>
              <p className="text-muted-foreground">
                Gestión de zonas geográficas y asignación de agentes
              </p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Zona
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{zonasData.length}</p>
                <p className="text-xs text-muted-foreground">Zonas Activas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAgentes}</p>
                <p className="text-xs text-muted-foreground">Agentes Asignados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPropiedades}</p>
                <p className="text-xs text-muted-foreground">Propiedades</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOperaciones}</p>
                <p className="text-xs text-muted-foreground">Operaciones Mes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar zona..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid de zonas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zonasFiltradas.map((zona) => (
            <Card key={zona.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${zona.color}`} />
                    <CardTitle className="text-lg">{zona.nombre}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{zona.agentes}</p>
                    <p className="text-xs text-muted-foreground">Agentes</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{zona.propiedades}</p>
                    <p className="text-xs text-muted-foreground">Propiedades</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Operaciones este mes</span>
                    <span className="font-semibold">{zona.operaciones}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Comisiones</span>
                    <span className="font-semibold text-green-600">€{zona.comisiones.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Cobertura</span>
                    <span className="font-semibold">{zona.cobertura}%</span>
                  </div>
                  <Progress value={zona.cobertura} />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="h-4 w-4 mr-1" />
                    Agentes
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

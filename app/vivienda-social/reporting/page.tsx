'use client';

/**
 * Vivienda Social - Informes
 * 
 * Generación de informes y reportes de vivienda social
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Euro,
  Home,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

interface InformeDisponible {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'mensual' | 'trimestral' | 'anual' | 'puntual';
  ultimaGeneracion: string;
  formato: string[];
}

const INFORMES_DISPONIBLES: InformeDisponible[] = [
  {
    id: '1',
    nombre: 'Informe de Ocupación',
    descripcion: 'Estado de ocupación de todas las viviendas protegidas',
    tipo: 'mensual',
    ultimaGeneracion: '2026-01-01',
    formato: ['PDF', 'Excel'],
  },
  {
    id: '2',
    nombre: 'Informe de Solicitudes',
    descripcion: 'Resumen de solicitudes recibidas, aprobadas y rechazadas',
    tipo: 'mensual',
    ultimaGeneracion: '2026-01-01',
    formato: ['PDF', 'Excel'],
  },
  {
    id: '3',
    nombre: 'Informe de Cumplimiento',
    descripcion: 'Estado de cumplimiento normativo de adjudicatarios',
    tipo: 'trimestral',
    ultimaGeneracion: '2025-10-01',
    formato: ['PDF'],
  },
  {
    id: '4',
    nombre: 'Informe Financiero',
    descripcion: 'Recaudación, morosidad y proyecciones financieras',
    tipo: 'mensual',
    ultimaGeneracion: '2026-01-01',
    formato: ['PDF', 'Excel'],
  },
  {
    id: '5',
    nombre: 'Memoria Anual',
    descripcion: 'Resumen completo de gestión del año',
    tipo: 'anual',
    ultimaGeneracion: '2025-01-15',
    formato: ['PDF'],
  },
  {
    id: '6',
    nombre: 'Listado de Adjudicatarios',
    descripcion: 'Lista completa de adjudicatarios con datos básicos',
    tipo: 'puntual',
    ultimaGeneracion: '2026-01-15',
    formato: ['PDF', 'Excel', 'CSV'],
  },
];

const ESTADISTICAS = {
  viviendas: { total: 420, vpo: 280, jovenes: 80, social: 60 },
  ocupacion: { ocupadas: 398, disponibles: 12, tramite: 10 },
  solicitudes: { mes: 45, aprobadas: 12, rechazadas: 8, pendientes: 25 },
  financiero: { recaudado: 178500, pendiente: 12300, morosidad: 3.2 },
};

export default function ViviendaSocialReportingPage() {
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2026-01');
  const [generando, setGenerando] = useState<string | null>(null);

  const handleGenerarInforme = (informe: InformeDisponible, formato: string) => {
    setGenerando(informe.id);
    toast.success(`Generando ${informe.nombre} en ${formato}...`);
    
    setTimeout(() => {
      setGenerando(null);
      toast.success(`${informe.nombre} generado correctamente`);
    }, 2000);
  };

  const handleGenerarInformePersonalizado = () => {
    toast.success('Generando informe personalizado...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Informes y Estadísticas
          </h1>
          <p className="text-muted-foreground">
            Generación de informes de gestión de vivienda social
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-01">Enero 2026</SelectItem>
              <SelectItem value="2025-12">Diciembre 2025</SelectItem>
              <SelectItem value="2025-11">Noviembre 2025</SelectItem>
              <SelectItem value="2025-Q4">Q4 2025</SelectItem>
              <SelectItem value="2025">Año 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGenerarInformePersonalizado}>
            <FileText className="h-4 w-4 mr-2" />
            Informe Personalizado
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viviendas</p>
                <p className="text-2xl font-bold">{ESTADISTICAS.viviendas.total}</p>
                <p className="text-xs text-muted-foreground">
                  {ESTADISTICAS.ocupacion.ocupadas} ocupadas
                </p>
              </div>
              <Home className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitudes/mes</p>
                <p className="text-2xl font-bold">{ESTADISTICAS.solicitudes.mes}</p>
                <p className="text-xs text-green-600">
                  +{ESTADISTICAS.solicitudes.aprobadas} aprobadas
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recaudación</p>
                <p className="text-2xl font-bold">€{(ESTADISTICAS.financiero.recaudado / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">
                  {ESTADISTICAS.financiero.morosidad}% morosidad
                </p>
              </div>
              <Euro className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">
                  {Math.round((ESTADISTICAS.ocupacion.ocupadas / ESTADISTICAS.viviendas.total) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {ESTADISTICAS.ocupacion.disponibles} disponibles
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informes Disponibles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informes Disponibles</CardTitle>
              <CardDescription>
                Selecciona y genera los informes que necesites
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {INFORMES_DISPONIBLES.map((informe) => (
                <div
                  key={informe.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{informe.nombre}</h4>
                      <Badge variant="outline" className="text-xs">
                        {informe.tipo === 'mensual'
                          ? 'Mensual'
                          : informe.tipo === 'trimestral'
                          ? 'Trimestral'
                          : informe.tipo === 'anual'
                          ? 'Anual'
                          : 'Puntual'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {informe.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última generación: {informe.ultimaGeneracion}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {informe.formato.map((fmt) => (
                      <Button
                        key={fmt}
                        variant="outline"
                        size="sm"
                        disabled={generando === informe.id}
                        onClick={() => handleGenerarInforme(informe, fmt)}
                      >
                        {fmt === 'PDF' ? (
                          <FileText className="h-4 w-4 mr-1" />
                        ) : fmt === 'Excel' ? (
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        {fmt}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4">
          {/* Distribución de Viviendas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribución
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">VPO General</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(ESTADISTICAS.viviendas.vpo / ESTADISTICAS.viviendas.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{ESTADISTICAS.viviendas.vpo}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">VPO Jóvenes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(ESTADISTICAS.viviendas.jovenes / ESTADISTICAS.viviendas.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{ESTADISTICAS.viviendas.jovenes}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Alquiler Social</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${(ESTADISTICAS.viviendas.social / ESTADISTICAS.viviendas.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{ESTADISTICAS.viviendas.social}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Solicitudes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Solicitudes del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <span className="text-sm">Pendientes</span>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {ESTADISTICAS.solicitudes.pendientes}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">Aprobadas</span>
                <Badge className="bg-green-100 text-green-700">
                  {ESTADISTICAS.solicitudes.aprobadas}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="text-sm">Rechazadas</span>
                <Badge className="bg-red-100 text-red-700">
                  {ESTADISTICAS.solicitudes.rechazadas}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Resumen Ejecutivo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Dashboard
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exportar Todo (ZIP)
              </Button>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Informes Recientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { nombre: 'Ocupación Enero', fecha: '2026-01-01', formato: 'PDF' },
                { nombre: 'Financiero Dic', fecha: '2025-12-31', formato: 'Excel' },
                { nombre: 'Cumplimiento Q4', fecha: '2025-12-15', formato: 'PDF' },
              ].map((informe, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div>
                    <p className="font-medium">{informe.nombre}</p>
                    <p className="text-xs text-muted-foreground">{informe.fecha}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

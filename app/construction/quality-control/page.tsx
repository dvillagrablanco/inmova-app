'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  FileText,
  Calendar,
  User,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Inspection {
  id: string;
  phase: string;
  date: string;
  inspector: string;
  status: 'passed' | 'failed' | 'conditional';
  score: number;
  checklist: Array<{
    item: string;
    status: 'ok' | 'warning' | 'fail';
    notes?: string;
  }>;
  photos: number;
  report: string;
}

export default function QualityControlPage() {
  const router = useRouter();
  const [inspections] = useState<Inspection[]>([]);

  const getStatusBadge = (status: string) => {
    const config = {
      passed: { color: 'bg-green-500', label: 'Aprobado', icon: CheckCircle },
      failed: { color: 'bg-red-500', label: 'Rechazado', icon: XCircle },
      conditional: { color: 'bg-yellow-500', label: 'Condicional', icon: AlertTriangle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.passed;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getItemStatusIcon = (status: string) => {
    const config = {
      ok: { icon: CheckCircle, color: 'text-green-600' },
      warning: { icon: AlertTriangle, color: 'text-yellow-600' },
      fail: { icon: XCircle, color: 'text-red-600' },
    };
    const { icon: Icon, color } = config[status as keyof typeof config] || config.ok;
    return <Icon className={`h-4 w-4 ${color}`} />;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const avgScore = inspections.length > 0
    ? Math.round(inspections.reduce((sum, i) => sum + i.score, 0) / inspections.length)
    : 0;

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Control de Calidad</h1>
                <p className="text-muted-foreground mt-2">
                  Inspecciones y auditorías de construcción
                </p>
              </div>
              <Button onClick={() => toast.info('Programando nueva inspección...')}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Inspección
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Inspecciones Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inspections.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Realizadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Puntuación Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${avgScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {avgScore}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Calidad global</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {inspections.filter(i => i.status === 'passed').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sin observaciones</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Acciones Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {inspections.filter(i => i.status === 'conditional' || i.status === 'failed').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="inspections" className="space-y-4">
              <TabsList>
                <TabsTrigger value="inspections">Inspecciones</TabsTrigger>
                <TabsTrigger value="calendar">Calendario</TabsTrigger>
              </TabsList>

              <TabsContent value="inspections" className="space-y-4">
                {inspections.map((inspection) => (
                  <Card key={inspection.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{inspection.phase}</CardTitle>
                            {getStatusBadge(inspection.status)}
                          </div>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(inspection.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {inspection.inspector}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">
                            {inspection.score}
                            <span className="text-lg text-muted-foreground">/100</span>
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3">Checklist de Calidad:</h4>
                        <div className="space-y-2">
                          {inspection.checklist.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                              {getItemStatusIcon(item.status)}
                              <div className="flex-1">
                                <p className="font-medium">{item.item}</p>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold mb-2">Informe del Inspector:</h4>
                        <p className="text-sm">{inspection.report}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Camera className="h-4 w-4" />
                          <span>{inspection.photos} fotografías adjuntas</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Ver Fotos
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Descargar Informe
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="calendar">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendario de Inspecciones</CardTitle>
                    <CardDescription>Próximas inspecciones programadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Integración con calendario disponible próximamente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}

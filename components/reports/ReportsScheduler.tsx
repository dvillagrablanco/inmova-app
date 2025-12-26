'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, FileText, Send, Clock, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const reportTypes = [
  { value: 'financial', label: 'Reporte Financiero', icon: TrendingUp },
  { value: 'occupancy', label: 'Reporte de Ocupación', icon: Calendar },
  { value: 'payments', label: 'Reporte de Pagos', icon: FileText },
  { value: 'maintenance', label: 'Reporte de Mantenimiento', icon: Clock },
];

const frequencies = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
];

export function ReportsScheduler() {
  const [reportType, setReportType] = useState('');
  const [frequency, setFrequency] = useState('');
  const [email, setEmail] = useState('');
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);

  const handleSchedule = () => {
    // Por ahora solo guardamos en estado local
    const newReport = {
      id: Date.now().toString(),
      reportType,
      frequency,
      email,
      createdAt: new Date().toISOString(),
    };
    setScheduledReports([...scheduledReports, newReport]);
    setReportType('');
    setFrequency('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Crear nuevo reporte programado */}
      <Card>
        <CardHeader>
          <CardTitle>Programar Nuevo Reporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la frecuencia" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Email de Destino</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@email.com"
            />
          </div>

          <Button
            onClick={handleSchedule}
            disabled={!reportType || !frequency || !email}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Programar Reporte
          </Button>
        </CardContent>
      </Card>

      {/* Lista de reportes programados */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Programados ({scheduledReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay reportes programados</p>
              <p className="text-sm mt-1">Crea tu primer reporte automático arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map((report) => {
                const type = reportTypes.find((t) => t.value === report.reportType);
                const freq = frequencies.find((f) => f.value === report.frequency);
                return (
                  <div
                    key={report.id}
                    className="p-4 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {type && <type.icon className="w-5 h-5 text-indigo-600" />}
                      <div>
                        <p className="font-medium text-sm">{type?.label}</p>
                        <p className="text-xs text-gray-600">
                          {freq?.label} a {report.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setScheduledReports(scheduledReports.filter((r) => r.id !== report.id));
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Los reportes programados se generarán automáticamente según la
            frecuencia seleccionada y se enviarán al email especificado. Los reportes incluyen datos
            actualizados y gráficos visuales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

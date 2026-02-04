'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, Building, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function CompliancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('certificates');

  const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openDocumentos = (tipo: string, message: string) => {
    router.push(`/documentos?tipo=${tipo}`);
    toast.info(message);
  };

  const handleRegistrarCertificado = () => {
    openDocumentos('certificado_energetico', 'Sube el certificado en Documentos');
  };

  const handleRenovarCertificado = () => {
    openDocumentos('certificado_energetico', 'Actualiza el certificado en Documentos');
  };

  const handleProgramarITE = () => {
    openDocumentos('ite', 'Programa la ITE desde Documentos');
  };

  const handleVerITE = (building: string) => {
    openDocumentos('ite', `Revisa la documentación de ${building}`);
  };

  const handleGenerateModelo347 = (year: string, mode: 'view' | 'export') => {
    const rows = [
      ['Ejercicio', year],
      ['Operaciones', 47],
      ['Total Ingresos (€)', 185000],
      ['Total Gastos (€)', 42000],
    ];
    downloadCsv(`modelo_347_${year}.csv`, rows);
    toast.success(mode === 'view' ? 'Declaración generada' : 'Exportación completada');
  };

  const handleGenerateModelo180 = () => {
    const rows = [
      ['Trimestre', 'Importe (€)', 'Retención'],
      ['T1 2024', 850, '24%'],
      ['T2 2024', 920, '24%'],
      ['T3 2024', 1100, '24%'],
      ['T4 2024', 980, '24%'],
    ];
    downloadCsv('modelo_180_2024.csv', rows);
    toast.success('Modelo 180 generado');
  };

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Cumplimiento Legal</h1>
            <p className="text-gray-600 mb-8">
              Certificados energéticos, ITEs, Cédulas de habitabilidad y Modelos fiscales
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="certificates">Certificados CEE</TabsTrigger>
                <TabsTrigger value="inspections">ITEs</TabsTrigger>
                <TabsTrigger value="modelo347">Modelo 347</TabsTrigger>
                <TabsTrigger value="modelo180">Modelo 180</TabsTrigger>
              </TabsList>

              {/* CERTIFICADOS ENERGÉTICOS */}
              <TabsContent value="certificates">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].slice(0, 3).map((letter, i) => (
                    <div key={letter} className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Calificación {letter}</p>
                      <p className="text-2xl font-bold">{[8, 12, 4][i]} unidades</p>
                    </div>
                  ))}
                </div>
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Certificados Próximos a Vencer</h3>
                    <Button onClick={handleRegistrarCertificado}>Registrar Nuevo</Button>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Unidad 3{i} - Torre Vista Mar</h4>
                            <p className="text-sm text-gray-600">Calificación: C</p>
                            <p className="text-sm text-gray-600">Vence: 15/03/2025</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {60 + i * 5} días
                          </span>
                        </div>
                        <Button size="sm" className="mt-3" variant="outline" onClick={handleRenovarCertificado}>
                          Renovar
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* INSPECCIONES TÉCNICAS */}
              <TabsContent value="inspections">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Calendario de ITEs</h3>
                    <Button onClick={handleProgramarITE}>Programar ITE</Button>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        building: 'Torre Vista Mar',
                        last: '2020-05-12',
                        next: '2025-05-12',
                        urgency: 'media',
                      },
                      {
                        building: 'Edificio Sol',
                        last: '2022-08-20',
                        next: '2027-08-20',
                        urgency: 'baja',
                      },
                      {
                        building: 'Residencial Plaza',
                        last: '2024-01-15',
                        next: '2024-06-15',
                        urgency: 'alta',
                      },
                    ].map((item, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.building}</h4>
                            <p className="text-sm text-gray-600">Última ITE: {item.last}</p>
                            <p className="text-sm text-gray-600">Próxima ITE: {item.next}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              item.urgency === 'alta'
                                ? 'bg-red-100 text-red-800'
                                : item.urgency === 'media'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            Urgencia {item.urgency}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3"
                          variant="outline"
                          onClick={() => handleVerITE(item.building)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* MODELO 347 */}
              <TabsContent value="modelo347">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Declaración Anual Operaciones (Modelo 347)
                    </h3>
                    <Button onClick={() => handleGenerateModelo347('2024', 'export')}>
                      Generar Ejercicio 2024
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Operaciones</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Ingresos</p>
                      <p className="text-2xl font-bold">€185K</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Gastos</p>
                      <p className="text-2xl font-bold">€42K</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['2024', '2023', '2022'].map((year) => (
                      <div key={year} className="flex justify-between items-center border-b py-3">
                        <span className="font-medium">Ejercicio {year}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleGenerateModelo347(year, 'view')}>
                            Ver Declaración
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGenerateModelo347(year, 'export')}>
                            Exportar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* MODELO 180 */}
              <TabsContent value="modelo180">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Retenciones No Residentes (Modelo 180)
                    </h3>
                    <Button onClick={handleGenerateModelo180}>Generar Trimestre</Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {['T1', 'T2', 'T3', 'T4'].map((t, i) => (
                      <div key={t} className="bg-purple-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">{t} 2024</p>
                        <p className="text-lg font-bold">€{[850, 920, 1100, 980][i]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">Inquilino No Residente {i}</h4>
                            <p className="text-sm text-gray-600">
                              País: {i === 1 ? 'Francia' : 'Alemania'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Base imponible: €{i === 1 ? 3600 : 4200}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Retenido</p>
                            <p className="text-lg font-bold text-purple-600">
                              €{i === 1 ? 864 : 1008}
                            </p>
                            <p className="text-xs text-gray-600">24%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}

'use client';

/**
 * Portal Inquilino - Mi Contrato
 * 
 * Permite al inquilino ver y gestionar su contrato de arrendamiento
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Calendar,
  Euro,
  Home,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  fianza: number;
  estado: string;
  tipo: string;
  condicionesEspeciales?: string;
  clausulas?: string;
  unit: {
    id: string;
    numero: string;
    tipo: string;
    superficie?: number;
    building: {
      id: string;
      nombre: string;
      direccion: string;
    };
  };
}

export default function PortalInquilinoContratoPage() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-inquilino/dashboard');
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesión expirada');
          return;
        }
        throw new Error('Error al cargar contratos');
      }

      const data = await response.json();
      setContracts(data.contracts || []);
      if (data.contracts?.length > 0) {
        setSelectedContract(data.contracts[0]);
      }
    } catch (error) {
      toast.error('Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (contractId: string) => {
    try {
      toast.info('Generando PDF del contrato...');
      
      const response = await fetch(`/api/contracts/${contractId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar el PDF');
    }
  };

  const getStatusBadge = (estado: string) => {
    const statuses: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      activo: { label: 'Activo', variant: 'default' },
      vencido: { label: 'Vencido', variant: 'destructive' },
      cancelado: { label: 'Cancelado', variant: 'secondary' },
      renovado: { label: 'Renovado', variant: 'outline' },
    };
    const status = statuses[estado] || { label: estado, variant: 'outline' };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getDaysRemaining = (fechaFin: string) => {
    const days = differenceInDays(parseISO(fechaFin), new Date());
    if (days < 0) return { text: 'Vencido', color: 'text-red-600' };
    if (days <= 30) return { text: `${days} días restantes`, color: 'text-yellow-600' };
    if (days <= 90) return { text: `${days} días restantes`, color: 'text-blue-600' };
    return { text: `${days} días restantes`, color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mi Contrato</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Contrato Activo</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No tienes ningún contrato de arrendamiento activo en este momento.
              Contacta con tu gestor si crees que esto es un error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mi Contrato</h1>
          <p className="text-muted-foreground">
            Información y documentación de tu contrato de arrendamiento
          </p>
        </div>
        {selectedContract && (
          <Button onClick={() => handleDownloadPDF(selectedContract.id)}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        )}
      </div>

      {/* Si hay múltiples contratos, mostrar selector */}
      {contracts.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {contracts.map((contract) => (
                <Button
                  key={contract.id}
                  variant={selectedContract?.id === contract.id ? 'default' : 'outline'}
                  onClick={() => setSelectedContract(contract)}
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  {contract.unit.building.nombre} - {contract.unit.numero}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedContract && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Información Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Datos del Contrato
              </CardTitle>
              <CardDescription>
                Información general de tu contrato de arrendamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estado</span>
                {getStatusBadge(selectedContract.estado)}
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium capitalize">
                    {selectedContract.tipo || 'Residencial'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha Inicio</span>
                  <span className="font-medium">
                    {format(parseISO(selectedContract.fechaInicio), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha Fin</span>
                  <span className="font-medium">
                    {format(parseISO(selectedContract.fechaFin), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duración Restante</span>
                  <span className={`font-medium ${getDaysRemaining(selectedContract.fechaFin).color}`}>
                    {getDaysRemaining(selectedContract.fechaFin).text}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Económica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Información Económica
              </CardTitle>
              <CardDescription>
                Detalles de la renta y fianza
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Renta Mensual</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{selectedContract.rentaMensual.toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Fianza Depositada</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{(selectedContract.fianza || selectedContract.rentaMensual * 2).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Renta al día</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Fianza depositada en organismo oficial</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Inmueble */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Inmueble Arrendado
              </CardTitle>
              <CardDescription>
                Datos de la vivienda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edificio</span>
                <span className="font-medium">{selectedContract.unit.building.nombre}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dirección</span>
                <span className="font-medium text-right max-w-[200px]">
                  {selectedContract.unit.building.direccion}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unidad</span>
                <span className="font-medium">{selectedContract.unit.numero}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium capitalize">{selectedContract.unit.tipo}</span>
              </div>
              
              {selectedContract.unit.superficie && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Superficie</span>
                  <span className="font-medium">{selectedContract.unit.superficie} m²</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alertas y Recordatorios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Alertas y Recordatorios
              </CardTitle>
              <CardDescription>
                Información importante sobre tu contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {differenceInDays(parseISO(selectedContract.fechaFin), new Date()) <= 90 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Contrato próximo a vencer
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Tu contrato vence en {getDaysRemaining(selectedContract.fechaFin).text.replace(' restantes', '')}.
                      Contacta con tu gestor para renovar.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Renovación automática
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Según la LAU, tu contrato se renovará automáticamente si ninguna
                    de las partes comunica lo contrario con 30 días de antelación.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Condiciones Especiales */}
      {selectedContract?.condicionesEspeciales && (
        <Card>
          <CardHeader>
            <CardTitle>Condiciones Especiales</CardTitle>
            <CardDescription>
              Cláusulas adicionales acordadas en tu contrato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {selectedContract.condicionesEspeciales}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

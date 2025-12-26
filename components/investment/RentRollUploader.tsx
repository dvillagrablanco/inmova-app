'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Eye,
  Link2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RentRollUnit {
  unitNumber: string;
  tenant?: string;
  occupied: boolean;
  currentRent: number;
  marketRent?: number;
  leaseStart?: Date;
  leaseEnd?: Date;
  deposit?: number;
  squareMeters?: number;
}

interface ParsedRentRoll {
  buildingName?: string;
  address?: string;
  totalUnits: number;
  occupiedUnits: number;
  totalMonthlyRent: number;
  averageRentPerUnit: number;
  occupancyRate: number;
  units: RentRollUnit[];
}

export function RentRollUploader({
  propertyId,
  onComplete,
}: {
  propertyId?: string;
  onComplete?: (rentRollId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (propertyId) {
        formData.append('propertyId', propertyId);
      }

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/rent-roll/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error procesando documento');
      }

      const data = await response.json();
      setResult(data);

      if (onComplete) {
        onComplete(data.rentRoll.id);
      }
    } catch (err) {
      console.error('Error uploading rent roll:', err);
      setError(err instanceof Error ? err.message : 'Error procesando documento');
    } finally {
      setUploading(false);
    }
  };

  const createAnalysisFromRentRoll = () => {
    if (result?.rentRoll?.id) {
      router.push(`/analisis-inversion?rentRollId=${result.rentRoll.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Rent Roll
          </CardTitle>
          <CardDescription>
            Carga un documento de rent roll en PDF, Excel, CSV o imagen para analizarlo
            automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Seleccionar Archivo</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="text-sm text-muted-foreground">
              Formatos soportados: PDF, Excel (.xlsx, .xls), CSV, Imágenes (.jpg, .png)
            </p>
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Archivo seleccionado:</strong> {file.name} (
                {(file.size / 1024).toFixed(2)} KB)
              </AlertDescription>
            </Alert>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando documento...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'Procesando...' : 'Procesar Rent Roll'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {result && (
        <>
          {/* Validación */}
          {result.validation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.validation.valid ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Documento Validado
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Errores de Validación
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.validation.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Errores:</h4>
                    <ul className="space-y-1">
                      {result.validation.errors.map((err: string, i: number) => (
                        <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                          <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.validation.warnings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-2">Advertencias:</h4>
                    <ul className="space-y-1">
                      {result.validation.warnings.map((warn: string, i: number) => (
                        <li key={i} className="text-sm text-orange-600 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.validation.valid && result.validation.errors.length === 0 && (
                  <p className="text-sm text-green-600">
                    ✓ Documento procesado exitosamente sin errores
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resumen */}
          {result.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Rent Roll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Unidades</p>
                    <p className="text-2xl font-bold">{result.summary.overview.totalUnits}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ocupadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.summary.overview.occupiedUnits}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ocupación</p>
                    <p className="text-2xl font-bold">
                      {result.summary.overview.occupancyRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Renta Mensual Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      €{result.summary.income.totalMonthlyRent.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold">Distribución de Rentas</h4>
                  <div className="grid gap-2 md:grid-cols-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mínima:</span>
                      <span className="ml-2 font-semibold">
                        €{result.summary.rentDistribution.min.toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Promedio:</span>
                      <span className="ml-2 font-semibold">
                        €{result.summary.rentDistribution.average.toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mediana:</span>
                      <span className="ml-2 font-semibold">
                        €{result.summary.rentDistribution.median.toFixed(0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Máxima:</span>
                      <span className="ml-2 font-semibold">
                        €{result.summary.rentDistribution.max.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {result.summary.vacantUnitsDetails.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">
                      Unidades Vacantes ({result.summary.vacantUnitsDetails.length})
                    </h4>
                    <div className="space-y-2">
                      {result.summary.vacantUnitsDetails.map((unit: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-2 bg-muted rounded"
                        >
                          <span className="font-medium">{unit.unitNumber}</span>
                          <Badge variant="outline">
                            Potencial: €{unit.potentialMonthlyIncome.toFixed(0)}/mes
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          {result.rentRoll && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={createAnalysisFromRentRoll} className="w-full" size="lg">
                  <Link2 className="h-4 w-4 mr-2" />
                  Crear Análisis de Inversión desde este Rent Roll
                </Button>

                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles Completos
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Procesado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default RentRollUploader;

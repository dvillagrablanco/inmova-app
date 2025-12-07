'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Scan,
  FileText,
  CreditCard,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Copy,
  Download,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  processImageOCR,
  processDocument,
  extractDNIData,
  extractContractData,
  isFileTypeSupported,
  getSupportedFileTypes,
} from '@/lib/ocr-service';
import logger, { logError } from '@/lib/logger';

interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  dniData?: any;
  contractData?: any;
}

export default function OCRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [activeTab, setActiveTab] = useState<'dni' | 'contract' | 'general'>('general');

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo usando la función del servicio
      if (!isFileTypeSupported(file.type)) {
        toast.error(
          'Tipo de archivo no soportado. Se permiten: Imágenes (JPG, PNG, GIF, BMP, TIFF), PDF, DOC, DOCX'
        );
        return;
      }

      // Validar tamaño (max 20MB para PDFs/DOCs, 10MB para imágenes)
      const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`El archivo no puede superar los ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      setSelectedFile(file);
      setResult(null);

      // Crear preview solo para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const processOCR = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo primero');
      return;
    }

    setProcessing(true);
    try {
      // Procesar el documento con OCR (detecta automáticamente el tipo)
      const ocrResult = await processDocument(selectedFile);

      let extractedData: any = {};

      // Extraer datos específicos según el tipo de documento
      if (activeTab === 'dni') {
        extractedData = { dniData: extractDNIData(ocrResult.text) };
      } else if (activeTab === 'contract') {
        extractedData = { contractData: extractContractData(ocrResult.text) };
      }

      setResult({
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        processingTime: ocrResult.processingTime,
        ...extractedData,
      });

      toast.success('¡OCR completado exitosamente!');
    } catch (error) {
      logger.error('Error al procesar OCR:', error);
      toast.error('Error al procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      toast.success('Texto copiado al portapapeles');
    }
  };

  const downloadText = () => {
    if (result?.text) {
      const blob = new Blob([result.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ocr-result-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Texto descargado');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Scan className="h-8 w-8 text-blue-600" />
                OCR - Reconocimiento de Texto
              </h1>
              <p className="mt-2 text-gray-600">
                Escanea documentos, DNIs y contratos automáticamente con inteligencia artificial
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="dni" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  DNI/Pasaporte
                </TabsTrigger>
                <TabsTrigger value="contract" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contrato
                </TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general">
                <Card>
                  <CardHeader>
                    <CardTitle>Escaneo General</CardTitle>
                    <CardDescription>Extrae texto de cualquier documento o imagen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-general">
                          Seleccionar Archivo (Imagen, PDF o DOC)
                        </Label>
                        <Input
                          id="file-general"
                          type="file"
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* DNI Tab */}
              <TabsContent value="dni">
                <Card>
                  <CardHeader>
                    <CardTitle>Escaneo de DNI/Pasaporte</CardTitle>
                    <CardDescription>
                      Extrae automáticamente nombre, número de documento, fecha de nacimiento, etc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-dni">
                          Seleccionar Archivo (Imagen, PDF o DOC) del DNI
                        </Label>
                        <Input
                          id="file-dni"
                          type="file"
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contract Tab */}
              <TabsContent value="contract">
                <Card>
                  <CardHeader>
                    <CardTitle>Escaneo de Contrato</CardTitle>
                    <CardDescription>
                      Extrae fechas, renta mensual y datos del inquilino automáticamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-contract">
                          Seleccionar Archivo (Imagen, PDF o DOC) del Contrato
                        </Label>
                        <Input
                          id="file-contract"
                          type="file"
                          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Preview & Process */}
            {previewUrl && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vista Previa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-h-96 object-contain rounded-lg border"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          Información del Archivo
                        </p>
                        <p className="text-sm text-blue-700">Nombre: {selectedFile?.name}</p>
                        <p className="text-sm text-blue-700">
                          Tamaño: {((selectedFile?.size || 0) / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        onClick={processOCR}
                        disabled={processing}
                        size="lg"
                        className="w-full"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Scan className="mr-2 h-5 w-5" />
                            Escanear con OCR
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Confianza</p>
                          <p className="text-2xl font-bold">{result.confidence.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Tiempo</p>
                          <p className="text-2xl font-bold">
                            {(result.processingTime / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">Caracteres</p>
                          <p className="text-2xl font-bold">{result.text.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Extracted Data */}
                {result.dniData && Object.keys(result.dniData).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Datos Extraídos del DNI
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.dniData.numeroDocumento && (
                          <div>
                            <Label>Número de Documento</Label>
                            <p className="mt-1 font-mono font-bold">
                              {result.dniData.numeroDocumento}
                            </p>
                          </div>
                        )}
                        {result.dniData.fechaNacimiento && (
                          <div>
                            <Label>Fecha de Nacimiento</Label>
                            <p className="mt-1">{result.dniData.fechaNacimiento}</p>
                          </div>
                        )}
                        {result.dniData.sexo && (
                          <div>
                            <Label>Sexo</Label>
                            <p className="mt-1">{result.dniData.sexo}</p>
                          </div>
                        )}
                        {result.dniData.nacionalidad && (
                          <div>
                            <Label>Nacionalidad</Label>
                            <p className="mt-1">{result.dniData.nacionalidad}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.contractData && Object.keys(result.contractData).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Datos Extraídos del Contrato
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.contractData.fechaInicio && (
                          <div>
                            <Label>Fecha de Inicio</Label>
                            <p className="mt-1">{result.contractData.fechaInicio}</p>
                          </div>
                        )}
                        {result.contractData.fechaFin && (
                          <div>
                            <Label>Fecha de Fin</Label>
                            <p className="mt-1">{result.contractData.fechaFin}</p>
                          </div>
                        )}
                        {result.contractData.rentaMensual && (
                          <div>
                            <Label>Renta Mensual</Label>
                            <p className="mt-1 text-lg font-bold text-green-600">
                              {result.contractData.rentaMensual.toFixed(2)} €
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Full Text */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Texto Completo
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={copyToClipboard}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button size="sm" variant="outline" onClick={downloadText}>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{result.text}</pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {!previewUrl && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Upload className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sube un archivo (imagen, PDF o DOC) para comenzar
                  </h3>
                  <p className="text-gray-600">
                    Selecciona el tipo de documento arriba y luego sube el archivo
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

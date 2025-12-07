'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Scan,
  FileText,
  Home,
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  CreditCard,
  FileCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import logger, { logError } from '@/lib/logger';

interface OCRResult {
  success: boolean;
  documentType: string;
  extractedData: any;
  rawText: string;
}

export default function OCRImportPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [documentType, setDocumentType] = useState('generic');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (session?.user?.role !== 'administrador' && session?.user?.role !== 'super_admin') {
    router.push('/dashboard');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Por favor selecciona una imagen válida (JPG, PNG, WEBP)');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB
        toast.error('La imagen no debe superar los 10MB');
        return;
      }

      setFile(selectedFile);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error('Por favor selecciona una imagen primero');
      return;
    }

    try {
      setProcessing(true);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('/api/admin/ocr-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        toast.success('¡Documento procesado exitosamente!');
      } else {
        toast.error(data.error || 'Error al procesar el documento');
      }
    } catch (error) {
      logger.error('Error processing OCR:', error);
      toast.error('Error al procesar el documento');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImagePreview('');
    setDocumentType('generic');
    setResult(null);
  };

  const renderExtractedData = () => {
    if (!result || !result.extractedData) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Datos Extraídos
          </CardTitle>
          <CardDescription>Revisa y verifica la información extraída del documento</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="structured">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="structured">Vista Estructurada</TabsTrigger>
              <TabsTrigger value="raw">Texto Original</TabsTrigger>
            </TabsList>

            <TabsContent value="structured" className="space-y-4 mt-4">
              {result.extractedData.rawText ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Formato Genérico</AlertTitle>
                  <AlertDescription className="mt-2">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">
                      {result.extractedData.rawText}
                    </pre>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.extractedData).map(([key, value]) => (
                    <div key={key} className="p-3 border rounded-md bg-gray-50">
                      <Label className="text-xs text-gray-600 uppercase">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="mt-1 font-medium">
                        {value !== null ? (
                          String(value)
                        ) : (
                          <span className="text-gray-400">No disponible</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Nota</AlertTitle>
                <AlertDescription className="text-blue-800">
                  Los datos han sido extraídos automáticamente mediante IA. Por favor, verifica su
                  exactitud antes de utilizarlos.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{result.rawText}</pre>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Procesar Otro Documento
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result.extractedData, null, 2));
                toast.success('Datos copiados al portapapeles');
              }}
              className="flex-1"
            >
              Copiar Datos JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
                <Scan className="h-8 w-8" />
                Importación con OCR (Escaneo de Documentos)
              </h1>
              <p className="text-muted-foreground">
                Escanea y extrae datos automáticamente de DNI, facturas, contratos y otros
                documentos
              </p>
            </div>

            {/* Tipo de Documento */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Tipo de Documento
                </CardTitle>
                <CardDescription>
                  Selecciona el tipo de documento para optimizar la extracción de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      documentType === 'dni' ? 'ring-2 ring-indigo-600' : ''
                    }`}
                    onClick={() => setDocumentType('dni')}
                  >
                    <CardContent className="p-4 text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                      <p className="font-semibold text-sm">DNI/NIE</p>
                      <p className="text-xs text-muted-foreground mt-1">Documentos de identidad</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      documentType === 'invoice' ? 'ring-2 ring-indigo-600' : ''
                    }`}
                    onClick={() => setDocumentType('invoice')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="font-semibold text-sm">Factura</p>
                      <p className="text-xs text-muted-foreground mt-1">Facturas y recibos</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      documentType === 'contract' ? 'ring-2 ring-indigo-600' : ''
                    }`}
                    onClick={() => setDocumentType('contract')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileCheck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-semibold text-sm">Contrato</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contratos de arrendamiento
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      documentType === 'generic' ? 'ring-2 ring-indigo-600' : ''
                    }`}
                    onClick={() => setDocumentType('generic')}
                  >
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p className="font-semibold text-sm">Genérico</p>
                      <p className="text-xs text-muted-foreground mt-1">Cualquier documento</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Carga de Imagen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Cargar Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative w-full max-w-md mx-auto">
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <Image src={imagePreview} alt="Preview" fill className="object-contain" />
                        </div>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={handleProcess} disabled={processing} className="gap-2">
                          {processing ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Scan className="h-4 w-4" />
                              Escanear y Extraer Datos
                            </>
                          )}
                        </Button>
                        <Button onClick={handleReset} variant="outline">
                          Cambiar Imagen
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Archivo: {file?.name} ({(file?.size || 0 / 1024).toFixed(0)} KB)
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Sube una imagen del documento</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Formatos soportados: JPG, PNG, WEBP (máximo 10MB)
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileChange}
                      />
                      <Button asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Seleccionar Imagen
                        </label>
                      </Button>
                    </>
                  )}
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Tecnología de IA Avanzada</AlertTitle>
                  <AlertDescription>
                    Utilizamos modelos de visión artificial de última generación para extraer y
                    estructurar automáticamente la información de tus documentos con alta precisión.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Resultados */}
            {renderExtractedData()}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building2,
  Home as HomeIcon,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ImportarPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const handleDownloadTemplate = async (type: string) => {
    try {
      const res = await fetch(`/api/import/template?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantilla_${type}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Plantilla descargada');
      }
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast.error('Error al descargar plantilla');
    }
  };

  const handleImport = async (type: string, file: File) => {
    setImporting(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/import?type=${type}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);

        if (data.errors.length === 0) {
          toast.success(`${data.success} registros importados correctamente`);
        } else {
          toast.warning(
            `${data.success} registros importados, ${data.errors.length} con errores`
          );
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al importar');
      }
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error('Error al importar archivo');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (type: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Por favor, selecciona un archivo CSV');
        return;
      }
      handleImport(type, file);
    }
  };

  const handleClearData = async () => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar todos los datos de ejemplo? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch('/api/import?action=clear', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Datos de ejemplo eliminados correctamente');
        router.refresh();
      } else {
        toast.error('Error al eliminar datos');
      }
    } catch (error) {
      console.error('Error al eliminar datos:', error);
      toast.error('Error al eliminar datos');
    } finally {
      setClearing(false);
    }
  };

  const ImportCard = ({
    type,
    title,
    description,
    icon: Icon,
  }: {
    type: string;
    title: string;
    description: string;
    icon: any;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleDownloadTemplate(type)}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla
          </Button>
        </div>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange(type, e)}
            className="hidden"
            id={`file-${type}`}
            disabled={importing}
          />
          <label htmlFor={`file-${type}`}>
            <Button
              variant="default"
              className="w-full"
              disabled={importing}
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {importing ? 'Importando...' : 'Seleccionar Archivo CSV'}
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <HomeIcon className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Importación</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="h-8 w-8" />
                Importación y Exportación de Datos
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus datos de forma masiva mediante archivos CSV
              </p>
            </div>

      {/* Resultados de importación */}
      {results && (
        <Alert className="mb-6">
          {results.errors.length === 0 ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {results.errors.length === 0 ? 'Importación exitosa' : 'Importación con errores'}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p>
                Total de registros procesados: <strong>{results.total}</strong>
              </p>
              <p>
                Registros importados correctamente: <strong className="text-green-600">{results.success}</strong>
              </p>
              {results.errors.length > 0 && (
                <>
                  <p>
                    Registros con errores: <strong className="text-red-600">{results.errors.length}</strong>
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">Ver errores</summary>
                    <div className="mt-2 max-h-48 overflow-auto text-xs">
                      {results.errors.map((err: any, idx: number) => (
                        <div key={idx} className="border-b py-2">
                          <p>
                            <strong>Fila {err.row}:</strong> {err.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import">Importar</TabsTrigger>
          <TabsTrigger value="export">Exportar</TabsTrigger>
        </TabsList>

        {/* Tab de Importación */}
        <TabsContent value="import" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <ImportCard
              type="buildings"
              title="Edificios"
              description="Importar edificios y propiedades"
              icon={Building2}
            />
            <ImportCard
              type="units"
              title="Unidades"
              description="Importar unidades o apartamentos"
              icon={HomeIcon}
            />
            <ImportCard
              type="tenants"
              title="Inquilinos"
              description="Importar inquilinos y arrendatarios"
              icon={Users}
            />
          </div>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Limpiar Datos de Ejemplo
              </CardTitle>
              <CardDescription>
                Elimina todos los datos de ejemplo antes de importar tus datos reales. Esta acción no se puede deshacer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleClearData}
                disabled={clearing}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {clearing ? 'Eliminando...' : 'Eliminar Todos los Datos'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Exportación */}
        <TabsContent value="export" className="space-y-6">
          <p className="text-muted-foreground">
            Exporta tus datos existentes a formato CSV para crear respaldos o trabajar con ellos en otras aplicaciones.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { type: 'buildings', label: 'Edificios', icon: Building2 },
              { type: 'units', label: 'Unidades', icon: HomeIcon },
              { type: 'tenants', label: 'Inquilinos', icon: Users },
            ].map((item) => (
              <Card key={item.type}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={`/api/export?type=${item.type}`} download>
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { type: 'contracts', label: 'Contratos' },
              { type: 'payments', label: 'Pagos' },
              { type: 'expenses', label: 'Gastos' },
            ].map((item) => (
              <Card key={item.type}>
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={`/api/export?type=${item.type}`} download>
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

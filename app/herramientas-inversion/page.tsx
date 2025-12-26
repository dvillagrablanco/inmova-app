import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  Upload,
  Link2,
  BarChart3,
  FileCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Herramientas de Inversión | INMOVA',
  description:
    'Suite completa de herramientas para análisis de inversión inmobiliaria: calculadoras, OCR, integraciones y más',
};

export default function HerramientasInversionPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">
          🏢 Herramientas de Análisis de Inversión
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Suite profesional completa para analizar, comparar y optimizar tus inversiones
          inmobiliarias
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Métricas Calculadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">13</div>
            <p className="text-xs text-muted-foreground">ROI, TIR, Cap Rate...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verticales Soportados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Piso, Local, Garaje, Trastero, Edificio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Formatos OCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">PDF, Excel, CSV, Imágenes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Integraciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Idealista, Pisos, Notarios...</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">
              🆕 Análisis Venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">Nuevo</div>
            <p className="text-xs text-green-700">Ciclo completo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 0. Analizador de VENTA - NUEVO */}
        <Card className="border-2 border-green-500 relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Badge className="bg-green-500 text-white">NUEVO</Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <TrendingDown className="h-8 w-8 text-green-600" />
              <Sparkles className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="mt-4">Análisis de Venta</CardTitle>
            <CardDescription>
              Determina el momento óptimo para vender y calcula el ROI total de tu inversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>ROI total y anualizado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Plusvalía neta (después impuestos)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Análisis break-even</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Recomendación: vender vs mantener</span>
              </li>
            </ul>
            <Link href="/analisis-venta">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Analizar Venta
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 1. Analizador */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Calculator className="h-8 w-8 text-primary" />
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <CardTitle className="mt-4">Analizador de Inversión</CardTitle>
            <CardDescription>
              Análisis completo con 13 métricas financieras, proyecciones y recomendaciones por IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>ROI, TIR, Cash-on-Cash, Cap Rate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Proyecciones a largo plazo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Análisis de riesgos automático</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Recomendaciones inteligentes</span>
              </li>
            </ul>
            <Link href="/analisis-inversion">
              <Button className="w-full">
                Crear Análisis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 2. Rent Roll Uploader */}
        <Card>
          <CardHeader>
            <Upload className="h-8 w-8 text-blue-600" />
            <CardTitle className="mt-4">Upload Rent Roll</CardTitle>
            <CardDescription>
              Procesa automáticamente documentos de rent roll con OCR avanzado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>PDF, Excel, CSV, Imágenes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Extracción automática de datos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Validación y resumen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Vinculación con análisis</span>
              </li>
            </ul>
            <Link href="/herramientas-inversion/rent-roll">
              <Button className="w-full" variant="outline">
                Subir Rent Roll
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 3. Property Importer */}
        <Card>
          <CardHeader>
            <Link2 className="h-8 w-8 text-purple-600" />
            <CardTitle className="mt-4">Import desde Portales</CardTitle>
            <CardDescription>
              Importa propiedades directamente desde Idealista y Pisos.com
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Idealista y Pisos.com</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Import con 1 click desde URL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Análisis automático incluido</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">✓</span>
                <span>Análisis de mercado</span>
              </li>
            </ul>
            <Link href="/herramientas-inversion/importar">
              <Button className="w-full" variant="outline">
                Importar Propiedad
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 4. Comparador */}
        <Card>
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <CardTitle className="mt-4">Comparador de Análisis</CardTitle>
            <CardDescription>
              Compara múltiples inversiones lado a lado con tabla profesional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-orange-600">✓</span>
                <span>Comparación multi-análisis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600">✓</span>
                <span>Destacado de mejores métricas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600">✓</span>
                <span>Resumen de riesgos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600">✓</span>
                <span>Exportar comparación PDF</span>
              </li>
            </ul>
            <Link href="/herramientas-inversion/comparador">
              <Button className="w-full" variant="outline">
                Comparar Análisis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 5. Verificación Notarial */}
        <Card>
          <CardHeader>
            <FileCheck className="h-8 w-8 text-green-600" />
            <CardTitle className="mt-4">Verificación Notarial</CardTitle>
            <CardDescription>
              Verifica propiedades con Registro de la Propiedad y Catastro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Nota simple automática</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Consulta catastral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Cálculo costos notariales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Gestión de citas</span>
              </li>
            </ul>
            <Link href="/herramientas-inversion/verificacion">
              <Button className="w-full" variant="outline">
                Verificar Propiedad
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 6. Mis Análisis */}
        <Card>
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <CardTitle className="mt-4">Mis Análisis</CardTitle>
            <CardDescription>
              Gestiona, comparte y exporta todos tus análisis de inversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">✓</span>
                <span>Historial completo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">✓</span>
                <span>Compartir con permisos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">✓</span>
                <span>Exportar PDFs profesionales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-600">✓</span>
                <span>Recomendaciones IA</span>
              </li>
            </ul>
            <Link href="/herramientas-inversion/mis-analisis">
              <Button className="w-full" variant="outline">
                Ver Mis Análisis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl">¿Por qué usar nuestras herramientas?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-4xl">⚡</div>
              <h3 className="font-semibold">Rapidez</h3>
              <p className="text-sm text-muted-foreground">
                Ahorra 10+ horas por análisis con procesamiento automático y cálculos instantáneos
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">🎯</div>
              <h3 className="font-semibold">Precisión</h3>
              <p className="text-sm text-muted-foreground">
                13 métricas financieras calculadas con fórmulas profesionales certificadas
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">🤖</div>
              <h3 className="font-semibold">Inteligencia</h3>
              <p className="text-sm text-muted-foreground">
                Recomendaciones personalizadas por IA basadas en análisis de miles de inversiones
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">📊</div>
              <h3 className="font-semibold">Profesional</h3>
              <p className="text-sm text-muted-foreground">
                Exporta reportes PDF con branding personalizado para presentar a clientes o socios
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">🔗</div>
              <h3 className="font-semibold">Integrado</h3>
              <p className="text-sm text-muted-foreground">
                Conecta con Idealista, Pisos.com, Registro de Propiedad y más sin salir de la app
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">🔒</div>
              <h3 className="font-semibold">Seguro</h3>
              <p className="text-sm text-muted-foreground">
                Tus análisis privados con opciones de compartir controladas y encriptación completa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="text-center border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-2xl">¿Listo para empezar?</CardTitle>
          <CardDescription className="text-base">
            Crea tu primer análisis de inversión en menos de 5 minutos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analisis-inversion">
              <Button size="lg" className="min-w-[200px]">
                Crear Análisis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/herramientas-inversion/tutorial">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Ver Tutorial
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            No requiere tarjeta de crédito • Empieza gratis • 3 análisis incluidos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

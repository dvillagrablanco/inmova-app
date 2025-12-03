'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Building2, Download, FileSpreadsheet, CheckCircle, Clock, 
  ArrowRight, AlertCircle, FileText, Database, Upload,
  Shield, Zap, Users, Star, PlayCircle, ChevronRight,
  CheckCircle2, XCircle, Rocket
} from 'lucide-react';

export default function MigracionPage() {
  const [activeSource, setActiveSource] = useState('excel');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">INMOVA</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/landing/campanas/launch2025">
                <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                  Ver Oferta LAUNCH2025
                </Button>
              </Link>
              <Link href="/register?coupon=LAUNCH2025">
                <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white">
                  Comenzar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 text-sm px-4 py-1">
            <Database className="h-4 w-4 mr-2" />
            Guía de Migración
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Migra a INMOVA en 24 Horas
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Importa tus datos desde Excel, Buildium, Homming o cualquier sistema.
            <br />
            <strong className="text-indigo-600">Sin pérdida de información. Sin interrupciones.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-lg h-14 px-8"
              onClick={() => {
                window.open('/landing/contacto?subject=Plantilla%20Excel', '_blank');
              }}
            >
              <Download className="mr-2 h-5 w-5" />
              Descargar Plantilla Excel
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg h-14 px-8"
              onClick={() => {
                window.open('/landing/contacto?subject=Video%20Tutorial', '_blank');
              }}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Ver Video Tutorial
            </Button>
          </div>

          <Alert className="max-w-2xl mx-auto bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-semibold">Migración Asistida GRATIS</AlertTitle>
            <AlertDescription className="text-green-700">
              Con el código <strong>LAUNCH2025</strong>, nuestro equipo migra tus datos sin coste adicional (valor €500).
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* TABS POR TIPO DE SISTEMA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="excel" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="excel" className="text-lg">Excel / CSV</TabsTrigger>
              <TabsTrigger value="buildium" className="text-lg">Buildium</TabsTrigger>
              <TabsTrigger value="homming" className="text-lg">Homming / Rentger</TabsTrigger>
              <TabsTrigger value="otro" className="text-lg">Otro Sistema</TabsTrigger>
            </TabsList>

            {/* EXCEL / CSV */}
            <TabsContent value="excel" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    Migración desde Excel o CSV
                  </CardTitle>
                  <CardDescription className="text-lg">
                    La opción más simple. Descarga nuestra plantilla, rellena tus datos y súbelos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-indigo-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-indigo-600">1</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Descarga Plantilla</h3>
                      <p className="text-gray-600 text-sm">Plantilla pre-configurada con todos los campos necesarios</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-indigo-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-indigo-600">2</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Rellena Tus Datos</h3>
                      <p className="text-gray-600 text-sm">Copia-pega desde tu Excel actual o introduce datos manualmente</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-indigo-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-indigo-600">3</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Importa en INMOVA</h3>
                      <p className="text-gray-600 text-sm">Sube el archivo y validamos automáticamente los datos</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      Datos Que Puedes Importar:
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Edificios y unidades</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Inquilinos y propietarios</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Contratos activos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Historial de pagos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Proveedores y contactos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>Órdenes de mantenimiento</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        window.open('/landing/contacto?subject=Plantilla%20Excel%20INMOVA', '_blank');
                      }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Descargar Plantilla Excel INMOVA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BUILDIUM */}
            <TabsContent value="buildium" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Database className="h-8 w-8 text-blue-600" />
                    Migración desde Buildium
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Importación directa mediante API o exportación de datos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-indigo-50 border-indigo-200">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    <AlertTitle className="text-indigo-800 font-semibold">Migración Automática con API</AlertTitle>
                    <AlertDescription className="text-indigo-700">
                      Nuestro equipo puede conectarse directamente a tu cuenta Buildium con permisos de lectura para importar todo automáticamente.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-xl">Opción 1: Exportación Manual</h3>
                    <div className="space-y-3 pl-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-indigo-100 text-indigo-600 font-semibold px-3 py-1 rounded-full text-sm">Paso 1</span>
                        <div>
                          <p className="font-medium">Accede a Buildium &gt; Reports</p>
                          <p className="text-sm text-gray-600">Ve a la sección de reportes en tu panel de Buildium</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-indigo-100 text-indigo-600 font-semibold px-3 py-1 rounded-full text-sm">Paso 2</span>
                        <div>
                          <p className="font-medium">Exporta estos reportes como CSV:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside ml-4 mt-1">
                            <li>Properties & Units Report</li>
                            <li>Tenants Report</li>
                            <li>Owners Report</li>
                            <li>Lease Ledger</li>
                            <li>Work Orders Report</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-indigo-100 text-indigo-600 font-semibold px-3 py-1 rounded-full text-sm">Paso 3</span>
                        <div>
                          <p className="font-medium">Sube los archivos a INMOVA</p>
                          <p className="text-sm text-gray-600">Nuestro importador detectará automáticamente el formato Buildium</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-xl">Opción 2: Migración Asistida con API (Recomendado)</h3>
                    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <Shield className="h-12 w-12 text-indigo-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-lg mb-2">100% Seguro y Automatizado</h4>
                          <p className="text-gray-700 mb-4">
                            Nuestro equipo técnico se conecta a tu API de Buildium con permisos de <strong>solo lectura</strong>. 
                            Importamos todo tu histórico en menos de 2 horas sin que tengas que exportar nada manualmente.
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Permisos revocables en cualquier momento</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Conexión encriptada y certificada</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Validación de datos en tiempo real</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Users className="mr-2 h-5 w-5" />
                      Solicitar Migración Asistida
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HOMMING / RENTGER */}
            <TabsContent value="homming" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <ArrowRight className="h-8 w-8 text-violet-600" />
                    Migración desde Homming / Rentger
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Cambio rápido y sin fricciones desde plataformas locales.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-semibold">Importante sobre Homming/Rentger</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Estas plataformas no ofrecen API pública ni exportación masiva de datos. Te ayudamos con un proceso semi-manual optimizado.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-xl">Proceso de Migración Recomendado:</h3>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-violet-600 text-white rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 font-bold">
                              1
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Exporta lo que puedas</h4>
                              <p className="text-sm text-gray-700 mb-2">
                                Desde Homming/Rentger, exporta los listados de propiedades e inquilinos (suelen tener exportación a Excel parcial)
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-violet-600 text-white rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 font-bold">
                              2
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Sesiones de captura de datos</h4>
                              <p className="text-sm text-gray-700 mb-2">
                                Nuestro equipo programa una llamada contigo (30-60 min) y capturamos pantallas de tu sistema actual. 
                                Luego recreamos la estructura en INMOVA.
                              </p>
                              <Badge className="bg-green-600 text-white">Incluido con LAUNCH2025</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-violet-50 to-purple-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="bg-violet-600 text-white rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 font-bold">
                              3
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Operación paralela (opcional)</h4>
                              <p className="text-sm text-gray-700 mb-2">
                                Durante 1-2 semanas puedes mantener ambos sistemas activos. 
                                Cuando verifiques que todo está en INMOVA, cancelas el antiguo.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">¿Por qué vale la pena migrar desde Homming/Rentger?</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span><strong>88 módulos</strong> vs 20-25 módulos limitados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span><strong>Multi-vertical</strong>: gestiona STR, flipping y obras (imposible en Homming)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span><strong>IA GPT-4 + Blockchain</strong> integrados nativamente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span><strong>Mismo precio</strong> o incluso más barato (con LAUNCH2025)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white">
                      <Users className="mr-2 h-5 w-5" />
                      Agendar Sesión de Migración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* OTRO SISTEMA */}
            <TabsContent value="otro" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-3">
                    <Database className="h-8 w-8 text-gray-600" />
                    Migración desde Otro Sistema
                  </CardTitle>
                  <CardDescription className="text-lg">
                    ¿Usas otro software? No hay problema. Tenemos experiencia con múltiples plataformas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Sistemas con API</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold mb-2">Hemos migrado desde:</p>
                        <ul className="space-y-1">
                          <li>• AppFolio</li>
                          <li>• Yardi</li>
                          <li>• PropertyWare</li>
                          <li>• TenantCloud</li>
                          <li>• Rent Manager</li>
                        </ul>
                        <p className="text-gray-600 mt-3">
                          Si tu sistema tiene API, podemos automatizar la migración completamente.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-violet-50 to-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Sistemas Sin API</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold mb-2">También manejamos:</p>
                        <ul className="space-y-1">
                          <li>• Software local (on-premise)</li>
                          <li>• Sistemas legacy personalizados</li>
                          <li>• Bases de datos MySQL/PostgreSQL</li>
                          <li>• Access / FileMaker</li>
                          <li>• Hojas de cálculo complejas</li>
                        </ul>
                        <p className="text-gray-600 mt-3">
                          Lo migramos manualmente con tu supervisión.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert className="bg-gradient-to-r from-indigo-600 to-violet-600 border-0 text-white">
                    <Star className="h-5 w-5" />
                    <AlertTitle className="font-semibold text-white">Migración Personalizada Incluida</AlertTitle>
                    <AlertDescription className="text-indigo-100">
                      Con cualquier plan Profesional o superior, incluimos un servicio de migración personalizado valorado en €500-2,000 según complejidad.
                    </AlertDescription>
                  </Alert>

                  <div className="text-center">
                    <h3 className="font-semibold text-xl mb-4">Proceso de Consultoría de Migración:</h3>
                    <div className="space-y-3 text-left max-w-2xl mx-auto">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span><strong>Audit Call (30 min):</strong> Analizamos tu sistema actual</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span><strong>Plan de Migración:</strong> Te enviamos documento con estrategia y timeline</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span><strong>Ejecución:</strong> Nuestro equipo ejecuta la migración en 3-7 días</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span><strong>Validación:</strong> Revisas datos y apruebas antes de ir en vivo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white">
                      <Users className="mr-2 h-5 w-5" />
                      Solicitar Consultoría de Migración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            <Clock className="inline h-10 w-10 mr-3 text-indigo-600" />
            Timeline de Migración Típico
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-indigo-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg">
                  Día 1
                </div>
                <div className="w-1 bg-indigo-200 flex-grow mt-2"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-xl mb-2">Registro y Configuración Inicial</h3>
                <p className="text-gray-600">Te registras con LAUNCH2025, configuras tu empresa y te familiarizas con la plataforma.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-indigo-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg">
                  Día 2-3
                </div>
                <div className="w-1 bg-indigo-200 flex-grow mt-2"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-xl mb-2">Preparación de Datos</h3>
                <p className="text-gray-600">Exportas datos de tu sistema actual o nos das acceso para migración asistida.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-indigo-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg">
                  Día 4-7
                </div>
                <div className="w-1 bg-indigo-200 flex-grow mt-2"></div>
              </div>
              <div className="pb-8">
                <h3 className="font-semibold text-xl mb-2">Importación y Validación</h3>
                <p className="text-gray-600">Importamos los datos, los validamos y tú revisas que todo esté correcto.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-green-600 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg">
                  ✓
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-green-600">En Vivo y Operando</h3>
                <p className="text-gray-600">Empiezas a gestionar todo desde INMOVA. Soporte continuo disponible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Comienza Tu Migración Hoy
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Con el código <strong className="text-yellow-300">LAUNCH2025</strong>, obtienes:
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold">50% Descuento Primer Mes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Migración Asistida GRATIS</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Onboarding 1-a-1</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?coupon=LAUNCH2025">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg h-16 px-10">
                <Rocket className="mr-2 h-6 w-6" />
                Comenzar Migración Ahora
              </Button>
            </Link>
            <Link href="/landing/contacto">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg h-16 px-10">
                <Users className="mr-2 h-5 w-5" />
                Hablar con un Experto
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-slate-900 border-t border-gray-800">
        <div className="container mx-auto text-center">
          <Link href="/landing" className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-indigo-400" />
            <span className="text-xl font-bold text-white">INMOVA</span>
          </Link>
          <p className="text-gray-400 text-sm mb-4">
            La plataforma PropTech Multi-Vertical más completa del mercado
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="/landing/legal/privacidad" className="hover:text-gray-300">Privacidad</Link>
            <Link href="/landing/legal/terminos" className="hover:text-gray-300">Términos</Link>
            <Link href="/landing/contacto" className="hover:text-gray-300">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import {
  CheckCircle,
  AlertCircle,
  Eye,
  Keyboard,
  Smartphone,
  Monitor,
  Loader2,
  FileQuestion,
  ShieldAlert,
  Palette,
  Focus,
  Code2,
  BookOpen,
} from 'lucide-react';

const principiosUX = [
  {
    id: 'responsive',
    titulo: 'Responsive Design',
    icono: Smartphone,
    descripcion: 'Diseño adaptable a todos los dispositivos',
    detalles: [
      'Mobile First: Optimizado desde 320px',
      'Breakpoints: 768px (tablet), 1024px (desktop)',
      'Grid system: 1 columna (mobile) → 2-3 columnas (desktop)',
      'Touch-friendly: Botones de 44px mínimo',
      'Contenido flexible y adaptable',
    ],
    ejemplo: `// ResponsiveContainer component
<ResponsiveContainer maxWidth="xl" padding="md">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Contenido responsive */}
  </div>
</ResponsiveContainer>`,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    id: 'loading',
    titulo: 'Loading States',
    icono: Loader2,
    descripcion: 'Estados de carga claros y consistentes',
    detalles: [
      'Spinners para acciones rápidas (<2s)',
      'Skeletons para contenido estructurado',
      'Progress bars para procesos largos',
      'Mensajes descriptivos de carga',
      'Feedback visual inmediato',
    ],
    ejemplo: `// LoadingState component
<LoadingState 
  message="Cargando datos..." 
  size="lg" 
/>

// LoadingSpinner en botones
<Button disabled>
  <LoadingSpinner size="sm" className="mr-2" />
  Guardando...
</Button>`,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    id: 'empty',
    titulo: 'Empty States',
    icono: FileQuestion,
    descripcion: 'Estados vacíos con llamadas a la acción',
    detalles: [
      'Mensaje claro y amigable',
      'Ilustración o icono representativo',
      'CTA (Call to Action) primario',
      'Sugerencias de próximos pasos',
      'Contexto sobre por qué está vacío',
    ],
    ejemplo: `// EmptyState component
<EmptyState
  icon={<Building2 className="h-12 w-12" />}
  title="No hay elementos"
  description="Comienza creando tu primer elemento"
  actions={[
    {
      label: 'Crear Elemento',
      onClick: handleCreate,
      icon: <Plus className="h-4 w-4" />
    }
  ]}
/>`,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  {
    id: 'errors',
    titulo: 'Error Messages',
    icono: ShieldAlert,
    descripcion: 'Mensajes de error user-friendly',
    detalles: [
      'Sin stack traces técnicos visibles',
      'Lenguaje claro y no técnico',
      'Sugerencias de solución',
      'Opción de reintentar',
      'Iconos y colores semánticos',
    ],
    ejemplo: `// ErrorMessage component
<ErrorMessage
  title="Error al cargar los datos"
  message="No se pudieron cargar los datos. Por favor, inténtalo de nuevo."
  severity="error"
  onRetry={loadData}
/>

// Form field errors
<AccessibleFormField
  label="Email"
  error="Por favor, ingresa un email válido"
  value={email}
  onChange={handleChange}
/>`,
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  {
    id: 'confirmations',
    titulo: 'Confirmation Dialogs',
    icono: AlertCircle,
    descripcion: 'Confirmaciones para acciones destructivas',
    detalles: [
      'Siempre para acciones irreversibles',
      'Descripción clara de consecuencias',
      'Botón primario = acción segura',
      'Botón destructivo claramente marcado',
      'Opción de cancelar siempre visible',
    ],
    ejemplo: `// ConfirmDialog component
<ConfirmDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  onConfirm={handleDelete}
  title="¿Eliminar elemento?"
  description="Esta acción no se puede deshacer."
  variant="destructive"
  confirmText="Eliminar"
  cancelText="Cancelar"
/>`,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  {
    id: 'accessibility',
    titulo: 'Accessibility (A11y)',
    icono: Eye,
    descripcion: 'Accesibilidad completa WCAG 2.1 AA',
    detalles: [
      'Navegación por teclado completa',
      'Labels en todos los inputs',
      'Alt text en todas las imágenes',
      'ARIA roles y labels',
      'Skip links para navegación',
    ],
    ejemplo: `// Accessible form field
<AccessibleFormField
  label="Nombre"
  value={nombre}
  onChange={handleChange}
  error={errors.nombre}
  hint="Mínimo 3 caracteres"
  required
  aria-describedby="nombre-hint"
/>

// Skip link
<a href="#main-content" className="skip-link">
  Saltar al contenido principal
</a>`,
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  {
    id: 'contrast',
    titulo: 'Color Contrast',
    icono: Palette,
    descripcion: 'Contraste de color WCAG 2.1 AA',
    detalles: [
      'Ratio mínimo 4.5:1 para texto normal',
      'Ratio mínimo 3:1 para texto grande',
      'Ratio mínimo 3:1 para componentes UI',
      'Modo oscuro con contraste adecuado',
      'Colores semánticos consistentes',
    ],
    ejemplo: `/* Estilos con buen contraste */
.text-primary {
  /* Contraste 7:1 en fondo blanco */
  color: hsl(222, 47%, 11%);
}

.text-error {
  /* Contraste 4.5:1 en fondo blanco */
  color: hsl(0, 65%, 45%);
}

.bg-primary text-white {
  /* Contraste 6:1 */
  background: hsl(222, 47%, 35%);
  color: white;
}`,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  },
  {
    id: 'focus',
    titulo: 'Focus Indicators',
    icono: Focus,
    descripcion: 'Indicadores de foco visibles',
    detalles: [
      'Focus ring visible en todos los elementos',
      'Anillo de 4px para mejor visibilidad',
      'Color con contraste suficiente',
      'Offset de 4px para claridad',
      'Estados hover y focus diferenciados',
    ],
    ejemplo: `/* Focus indicators globales */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  @apply ring-4 ring-indigo-600 
         ring-offset-4 
         ring-offset-background 
         outline-none;
}

/* Error focus state */
input[aria-invalid="true"]:focus {
  @apply border-red-500 
         ring-2 
         ring-red-500/20;
}`,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  },
];

const componentesDisponibles = [
  {
    nombre: 'AccessibleFormField',
    descripcion: 'Campo de formulario con accesibilidad completa',
    props: ['label', 'error', 'hint', 'icon', 'required', 'showRequiredIndicator'],
    ruta: '/components/ui/accessible-form-field.tsx',
  },
  {
    nombre: 'AccessibleSelectField',
    descripcion: 'Select dropdown accesible con opciones',
    props: ['label', 'value', 'options', 'error', 'hint', 'required', 'onValueChange'],
    ruta: '/components/ui/accessible-select-field.tsx',
  },
  {
    nombre: 'ErrorMessage',
    descripcion: 'Mensajes de error user-friendly',
    props: ['title', 'message', 'severity', 'onRetry', 'onDismiss'],
    ruta: '/components/ui/error-message.tsx',
  },
  {
    nombre: 'ResponsiveContainer',
    descripcion: 'Contenedor responsive con padding adaptable',
    props: ['maxWidth', 'padding', 'children', 'className'],
    ruta: '/components/ui/responsive-container.tsx',
  },
  {
    nombre: 'LoadingState',
    descripcion: 'Estado de carga con spinner y mensaje',
    props: ['message', 'size', 'fullScreen', 'className'],
    ruta: '/components/ui/loading-state.tsx',
  },
  {
    nombre: 'EmptyState',
    descripcion: 'Estado vacío con icono y CTAs',
    props: ['icon', 'title', 'description', 'actions', 'className'],
    ruta: '/components/ui/empty-state.tsx',
  },
  {
    nombre: 'ConfirmDialog',
    descripcion: 'Diálogo de confirmación para acciones destructivas',
    props: ['open', 'onOpenChange', 'onConfirm', 'title', 'description', 'variant'],
    ruta: '/components/ui/confirm-dialog.tsx',
  },
];

export default function GuiaUXPage() {
  const [principioActivo, setPrincipioActivo] = useState(principiosUX[0].id);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />

        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <ResponsiveContainer maxWidth="2xl" padding="lg">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <BookOpen className="h-10 w-10 text-primary" aria-hidden="true" />
                Guía de UX/UI
              </h1>
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                Documentación completa de todos los principios de accesibilidad, responsive design y
                mejores prácticas implementadas en la aplicación.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                  WCAG 2.1 AA Compliant
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  <Smartphone className="h-3 w-3 mr-1" aria-hidden="true" />
                  Mobile Responsive
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                  <Keyboard className="h-3 w-3 mr-1" aria-hidden="true" />
                  Keyboard Navigation
                </Badge>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="principios" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <TabsTrigger value="principios" className="text-sm">
                  <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                  Principios UX
                </TabsTrigger>
                <TabsTrigger value="componentes" className="text-sm">
                  <Code2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Componentes
                </TabsTrigger>
                <TabsTrigger value="ejemplo" className="text-sm">
                  <Monitor className="h-4 w-4 mr-2" aria-hidden="true" />
                  Ejemplo Vivo
                </TabsTrigger>
              </TabsList>

              {/* Principios Tab */}
              <TabsContent value="principios" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>8 Principios Fundamentales</CardTitle>
                    <CardDescription>
                      Estos principios garantizan una experiencia de usuario excelente para todos
                      los usuarios, independientemente de sus capacidades o dispositivos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {principiosUX.map((principio) => {
                        const Icon = principio.icono;
                        return (
                          <button
                            key={principio.id}
                            onClick={() => setPrincipioActivo(principio.id)}
                            className={`
                              p-4 rounded-lg border-2 transition-all text-left
                              ${
                                principioActivo === principio.id
                                  ? 'border-primary bg-primary/10 shadow-md'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                              }
                            `}
                            aria-pressed={principioActivo === principio.id}
                            aria-label={`Ver detalles de ${principio.titulo}`}
                          >
                            <div
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${principio.color}`}
                            >
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <h3 className="font-semibold text-sm">{principio.titulo}</h3>
                          </button>
                        );
                      })}
                    </div>

                    {principiosUX
                      .filter((p) => p.id === principioActivo)
                      .map((principio) => {
                        const Icon = principio.icono;
                        return (
                          <Card key={principio.id} className="border-2 border-primary">
                            <CardHeader>
                              <div className="flex items-center gap-3">
                                <div
                                  className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${principio.color}`}
                                >
                                  <Icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <div>
                                  <CardTitle className="text-xl">{principio.titulo}</CardTitle>
                                  <CardDescription className="text-base">
                                    {principio.descripcion}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                  Características Implementadas:
                                </h4>
                                <ul className="space-y-2">
                                  {principio.detalles.map((detalle, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <CheckCircle
                                        className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                                        aria-hidden="true"
                                      />
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {detalle}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                  Ejemplo de Código:
                                </h4>
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                  <code>{principio.ejemplo}</code>
                                </pre>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Componentes Tab */}
              <TabsContent value="componentes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Componentes Reutilizables</CardTitle>
                    <CardDescription>
                      Biblioteca de componentes accesibles listos para usar en toda la aplicación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {componentesDisponibles.map((componente, idx) => (
                        <Card key={idx} className="border-2 hover:border-primary transition-colors">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg font-mono">
                                  {componente.nombre}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                  {componente.descripcion}
                                </CardDescription>
                              </div>
                              <Code2
                                className="h-5 w-5 text-primary flex-shrink-0"
                                aria-hidden="true"
                              />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Props principales:
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {componente.props.map((prop, propIdx) => (
                                    <Badge
                                      key={propIdx}
                                      variant="outline"
                                      className="text-xs font-mono"
                                    >
                                      {prop}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {componente.ruta}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Ejemplo Tab */}
              <TabsContent value="ejemplo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ejemplo en Vivo</CardTitle>
                    <CardDescription>
                      Visita la página de ejemplo para ver todos estos principios implementados en
                      una interfaz funcional.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/20">
                      <h3 className="text-lg font-semibold mb-2">
                        Página de Demostración Interactiva
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        La página de ejemplo incluye todos los principios UX/UI implementados:
                      </p>
                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          <span>Formularios accesibles con validación</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          <span>Estados de carga y vacíos</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          <span>Mensajes de error amigables</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          <span>Diálogos de confirmación</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          <span>Responsive design completo</span>
                        </li>
                      </ul>
                      <Button asChild className="gradient-primary">
                        <a href="/ejemplo-ux">
                          Ver Ejemplo en Vivo
                          <Monitor className="h-4 w-4 ml-2" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <Smartphone className="h-8 w-8 text-blue-600 mb-2" aria-hidden="true" />
                          <CardTitle className="text-base">Mobile (320px+)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Diseño optimizado para dispositivos móviles con navegación táctil.
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <Monitor className="h-8 w-8 text-purple-600 mb-2" aria-hidden="true" />
                          <CardTitle className="text-base">Tablet (768px+)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Layout adaptado con grids de 2 columnas y mejor uso del espacio.
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <Monitor className="h-8 w-8 text-green-600 mb-2" aria-hidden="true" />
                          <CardTitle className="text-base">Desktop (1024px+)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Experiencia completa con grids de 3+ columnas y sidebar fijo.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ResponsiveContainer>
        </main>
      </div>
    </div>
  );
}

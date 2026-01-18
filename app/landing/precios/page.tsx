'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Users, 
  Briefcase, 
  Crown,
  FileSignature,
  HardDrive,
  MessageSquare,
  Bot,
  Palette,
  Code,
  TrendingUp,
  Eye,
  Sparkles,
  Shield,
  Zap,
  HelpCircle,
  Plus,
  Check,
  X,
  Info,
  Calculator,
  Package,
  Layers
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Importar configuración centralizada
import { 
  PLAN_INFO, 
  MODULES_BY_PLAN, 
  MODULE_ADDON_PRICES,
  type PlanTier 
} from '@/lib/modules-pricing-config';

// Iconos por plan
const PLAN_ICONS: Record<PlanTier, React.ComponentType<any>> = {
  starter: Users,
  professional: Building2,
  business: Briefcase,
  enterprise: Crown,
  owner: Crown,
};

// Colores por plan
const PLAN_COLORS: Record<PlanTier, string> = {
  starter: 'text-blue-600',
  professional: 'text-indigo-600',
  business: 'text-purple-600',
  enterprise: 'text-amber-600',
  owner: 'text-pink-600',
};

// Planes a mostrar públicamente (excluyendo owner)
const PUBLIC_PLANS: PlanTier[] = ['starter', 'professional', 'business', 'enterprise'];

// Add-ons de consumo (packs)
const consumptionAddons = [
  {
    id: 'signatures',
    nombre: 'Firmas Digitales',
    descripcion: 'Packs de firmas con validez legal europea (eIDAS)',
    opciones: [
      { unidades: '10 firmas', precio: 15, ahorro: null },
      { unidades: '50 firmas', precio: 60, ahorro: '20%' },
      { unidades: '100 firmas', precio: 100, ahorro: '33%' },
    ],
    icon: FileSignature,
    color: 'bg-blue-50 text-blue-600',
    popular: true,
  },
  {
    id: 'sms',
    nombre: 'SMS / WhatsApp',
    descripcion: 'Notificaciones y recordatorios a inquilinos',
    opciones: [
      { unidades: '100 mensajes', precio: 10, ahorro: null },
      { unidades: '500 mensajes', precio: 40, ahorro: '20%' },
      { unidades: '1000 mensajes', precio: 70, ahorro: '30%' },
    ],
    icon: MessageSquare,
    color: 'bg-green-50 text-green-600',
    popular: true,
  },
  {
    id: 'ai',
    nombre: 'IA Avanzada',
    descripcion: 'Valoraciones automáticas y asistente inteligente',
    opciones: [
      { unidades: '50K tokens', precio: 10, ahorro: null },
      { unidades: '200K tokens', precio: 35, ahorro: '12%' },
      { unidades: '500K tokens', precio: 75, ahorro: '25%' },
    ],
    icon: Bot,
    color: 'bg-purple-50 text-purple-600',
    popular: true,
  },
  {
    id: 'storage',
    nombre: 'Almacenamiento',
    descripcion: 'Espacio adicional para documentos y fotos',
    opciones: [
      { unidades: '10 GB', precio: 5, ahorro: null },
      { unidades: '50 GB', precio: 20, ahorro: '20%' },
      { unidades: '100 GB', precio: 35, ahorro: '30%' },
    ],
    icon: HardDrive,
    color: 'bg-orange-50 text-orange-600',
    popular: false,
  },
];

// Categorías de módulos add-on con descripciones completas
const moduleAddonCategories = [
  {
    category: 'Funcionalidades Básicas',
    description: 'Mejora la gestión diaria de tus propiedades',
    addons: [
      { 
        id: 'recordatorios_auto', 
        name: 'Recordatorios Automáticos', 
        price: 8, 
        descCorta: 'Pagos, vencimientos y mantenimientos',
        descLarga: 'Automatiza recordatorios para ti y tus inquilinos: pagos próximos, revisiones de ITV de garajes, caducidad de certificados, vencimientos de contratos. Configura una vez, olvídate para siempre.',
        funcionalidades: ['Recordatorios de pago a inquilinos', 'Alertas de vencimiento de documentos', 'Revisiones programadas', 'Múltiples canales (email, SMS, push)'],
        beneficio: 'Reduce impagos y nunca olvides una fecha importante'
      },
      { 
        id: 'galerias', 
        name: 'Galerías Multimedia', 
        price: 8, 
        descCorta: 'Fotos y vídeos de propiedades',
        descLarga: 'Gestiona las fotos y vídeos de tus propiedades de forma organizada. Antes/después de reformas, estado de entradas, inspecciones. Etiqueta, ordena y comparte fácilmente.',
        funcionalidades: ['Galería ilimitada por propiedad', 'Antes/después de reformas', 'Vídeos e imágenes 360°', 'Compartir por enlace'],
        beneficio: 'Documentación visual para evitar conflictos'
      },
      { 
        id: 'gastos', 
        name: 'Control de Gastos', 
        price: 10, 
        descCorta: 'Categorización de gastos operativos',
        descLarga: 'Registra todos los gastos asociados a tus propiedades: mantenimiento, suministros, seguros, impuestos, comunidad. Categoriza, adjunta facturas y obtén informes de gastos por propiedad o concepto.',
        funcionalidades: ['Registro rápido de gastos', 'Categorización automática', 'Adjuntar facturas digitalizadas', 'Informes por categoría'],
        beneficio: 'Maximiza deducciones fiscales y controla costes'
      },
      { 
        id: 'proveedores', 
        name: 'Gestión de Proveedores', 
        price: 10, 
        descCorta: 'Base de datos de servicios',
        descLarga: 'Gestiona tu red de proveedores: fontaneros, electricistas, pintores, cerrajeros, empresas de limpieza. Almacena contactos, valoraciones, tarifas y asigna trabajos directamente.',
        funcionalidades: ['Directorio de proveedores', 'Valoraciones y comentarios', 'Historial de trabajos', 'Asignación desde incidencias'],
        beneficio: 'Encuentra al proveedor adecuado rápidamente'
      },
      { 
        id: 'reportes', 
        name: 'Reportes Financieros', 
        price: 15, 
        descCorta: 'Informes detallados y exportables',
        descLarga: 'Genera informes financieros profesionales: cuenta de resultados por propiedad, rentabilidad, evolución de ingresos, comparativas anuales. Exporta a Excel/PDF para tu contable o inversores.',
        funcionalidades: ['Cuenta de resultados', 'Informe de rentabilidad (ROI)', 'Comparativa interanual', 'Exportación Excel/PDF'],
        beneficio: 'Decisiones basadas en datos reales'
      },
      { 
        id: 'portal_inquilino', 
        name: 'Portal del Inquilino', 
        price: 15, 
        descCorta: 'Autoservicio para inquilinos',
        descLarga: 'Ofrece a tus inquilinos un portal donde consultar contratos, descargar recibos, pagar online, reportar incidencias y comunicarse contigo. Reduce llamadas y emails repetitivos.',
        funcionalidades: ['Consulta de contrato y documentos', 'Descarga de recibos', 'Pago online de rentas', 'Reporte de incidencias'],
        beneficio: 'Reduce consultas repetitivas un 60%'
      },
    ],
  },
  {
    category: 'Funcionalidades Avanzadas',
    description: 'Herramientas para profesionales que quieren escalar',
    addons: [
      { 
        id: 'screening', 
        name: 'Screening Inquilinos', 
        price: 20, 
        descCorta: 'Verificación de solvencia',
        descLarga: 'Evalúa candidatos antes de alquilar. Verificación de identidad, consulta de ficheros de morosidad (ASNEF, RAI), análisis de capacidad de pago, scoring de riesgo. Reduce impagos con datos objetivos.',
        funcionalidades: ['Verificación de identidad', 'Consulta ficheros de morosidad', 'Scoring de riesgo con IA', 'Informe completo del candidato'],
        beneficio: 'Reduce impagos hasta un 70%'
      },
      { 
        id: 'valoraciones', 
        name: 'Valoraciones IA', 
        price: 20, 
        descCorta: 'Valoraciones automáticas',
        descLarga: 'Obtén valoraciones instantáneas de tus propiedades usando inteligencia artificial. Compara con precios del mercado, analiza tendencias de la zona, optimiza el precio de alquiler o venta.',
        funcionalidades: ['Valoración instantánea con IA', 'Comparativa con mercado local', 'Sugerencia de precio óptimo', 'Informes profesionales'],
        beneficio: 'Precio óptimo sin esperas'
      },
      { 
        id: 'publicaciones', 
        name: 'Multi-Portal', 
        price: 25, 
        descCorta: 'Publica en Idealista, Fotocasa...',
        descLarga: 'Publica tus anuncios en múltiples portales inmobiliarios con un solo clic. Sincroniza cambios automáticamente, gestiona leads centralizadamente y analiza qué portales funcionan mejor.',
        funcionalidades: ['Idealista, Fotocasa, Habitaclia', 'Sincronización automática', 'Gestión centralizada de leads', 'Estadísticas por portal'],
        beneficio: 'Ahorra horas y maximiza visibilidad'
      },
      { 
        id: 'analytics', 
        name: 'Analytics Avanzado', 
        price: 25, 
        descCorta: 'Predicciones y tendencias',
        descLarga: 'Inteligencia de negocio aplicada a tu cartera. Predicciones de ocupación, detección de tendencias, alertas de riesgo de impago, comparativas con el mercado. Toma decisiones estratégicas.',
        funcionalidades: ['Predicción de ocupación', 'Detección de riesgo de impago', 'Análisis de tendencias', 'Dashboards personalizables'],
        beneficio: 'Anticípate a los problemas'
      },
      { 
        id: 'contabilidad', 
        name: 'Contabilidad Integrada', 
        price: 30, 
        descCorta: 'Conexión con A3, Sage, Holded',
        descLarga: 'Sincroniza INMOVA con tu programa de contabilidad: A3, Sage, Holded, Contasimple. Exporta asientos, facturas y movimientos automáticamente. Reduce errores y duplicidades.',
        funcionalidades: ['Integración con software contable', 'Exportación de asientos', 'Sincronización de facturas', 'Conciliación automatizada'],
        beneficio: 'Elimina la doble entrada de datos'
      },
      { 
        id: 'crm', 
        name: 'CRM Completo', 
        price: 35, 
        descCorta: 'Pipeline de ventas y leads',
        descLarga: 'Captura leads de portales, web y redes sociales. Gestiona el embudo de ventas: primer contacto, visita, negociación, cierre. Automatiza seguimientos y no pierdas ninguna oportunidad.',
        funcionalidades: ['Captura de leads automática', 'Pipeline visual', 'Scoring de leads con IA', 'Automatización de seguimientos'],
        beneficio: 'No pierdas ningún lead'
      },
    ],
  },
  {
    category: 'Módulos Premium',
    description: 'Diferénciate de la competencia con tecnología punta',
    addons: [
      { 
        id: 'whitelabel_basic', 
        name: 'White-Label Básico', 
        price: 35, 
        descCorta: 'Tu marca y colores',
        descLarga: 'Personaliza INMOVA con tu identidad corporativa. Añade tu logo, colores corporativos, y personaliza los emails y documentos que envías a inquilinos y propietarios.',
        funcionalidades: ['Logo personalizado', 'Colores corporativos', 'Emails con tu marca', 'Documentos personalizados'],
        beneficio: 'Refuerza tu marca profesionalmente'
      },
      { 
        id: 'pricing_dinamico', 
        name: 'Pricing IA', 
        price: 45, 
        descCorta: 'Optimización de precios con ML',
        descLarga: 'Maximiza tus ingresos con precios inteligentes. El algoritmo analiza demanda, estacionalidad, competencia y eventos locales para sugerir el precio óptimo en cada momento.',
        funcionalidades: ['Análisis de demanda en tiempo real', 'Sugerencias de precio diarias', 'Automatización de cambios', 'Simulador de ingresos'],
        beneficio: 'Aumenta ingresos hasta un 30%'
      },
      { 
        id: 'api_access', 
        name: 'Acceso API REST', 
        price: 49, 
        descCorta: 'Integraciones personalizadas',
        descLarga: 'Conecta INMOVA con cualquier sistema mediante nuestra API REST. Automatiza procesos, sincroniza datos con tu ERP, CRM o herramientas internas.',
        funcionalidades: ['API REST documentada', 'Autenticación OAuth 2.0', 'Webhooks para eventos', 'Sandbox de pruebas'],
        beneficio: 'Flexibilidad máxima de integración'
      },
      { 
        id: 'esg', 
        name: 'ESG & Sostenibilidad', 
        price: 50, 
        descCorta: 'Huella de carbono y CSRD',
        descLarga: 'Gestiona la sostenibilidad de tu cartera inmobiliaria. Calcula la huella de carbono, gestiona certificaciones energéticas, prepara informes CSRD.',
        funcionalidades: ['Cálculo de huella de carbono', 'Gestión de certificados', 'Informes CSRD/SFDR', 'Dashboard de sostenibilidad'],
        beneficio: 'Cumple normativa ESG y atrae inversores'
      },
      { 
        id: 'iot', 
        name: 'Smart Buildings IoT', 
        price: 75, 
        descCorta: 'Cerraduras, sensores, termostatos',
        descLarga: 'Conecta tus propiedades con dispositivos IoT: cerraduras inteligentes para check-in autónomo, termostatos para eficiencia energética, sensores de humo, agua y movimiento.',
        funcionalidades: ['Cerraduras inteligentes', 'Termostatos conectados', 'Sensores de seguridad', 'Control remoto desde app'],
        beneficio: 'Check-in autónomo y ahorro energético'
      },
      { 
        id: 'whitelabel_full', 
        name: 'White-Label Completo', 
        price: 99, 
        descCorta: 'Tu dominio y app móvil',
        descLarga: 'Lleva la personalización al máximo: tu propio dominio, app móvil con tu marca en App Store y Google Play, emails desde tu dominio. INMOVA desaparece completamente.',
        funcionalidades: ['Dominio propio', 'App móvil personalizada', 'Emails desde tu dominio', 'Sin menciones a INMOVA'],
        beneficio: 'Tu propia plataforma sin desarrollar'
      },
    ],
  },
];

// FAQs sobre el sistema de precios
const pricingFAQs = [
  {
    question: '¿Cómo funciona el sistema de planes + add-ons?',
    answer: 'Eliges un plan base que incluye funcionalidades según tu volumen de propiedades. Si necesitas más capacidad (firmas, SMS, almacenamiento) o funcionalidades específicas, puedes añadir add-ons en cualquier momento. Así pagas solo por lo que realmente usas.'
  },
  {
    question: '¿Qué son los módulos y cómo se activan?',
    answer: 'Los módulos son funcionalidades que puedes activar o desactivar en tu panel de empresa. Cada plan incluye diferentes módulos. Si tu plan no incluye un módulo que necesitas, puedes comprarlo como add-on o hacer upgrade de plan.'
  },
  {
    question: '¿Los add-ons se facturan mensualmente?',
    answer: 'Sí, los add-ons se añaden a tu factura mensual. Puedes cancelarlos en cualquier momento y se prorratean según los días de uso. Recibirás una factura unificada cada mes por correo electrónico.'
  },
  {
    question: '¿Qué pasa si excedo los límites de mi plan?',
    answer: 'Te notificaremos antes de alcanzar los límites. Puedes comprar packs adicionales (firmas, SMS, almacenamiento) o hacer upgrade a un plan superior. Nunca cortamos el servicio sin previo aviso.'
  },
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer: 'Sí, puedes hacer upgrade o downgrade de plan cuando quieras. El cambio se aplica inmediatamente y se prorratea en tu próxima factura.'
  },
  {
    question: '¿El plan Enterprise incluye todos los add-ons?',
    answer: 'Sí, el plan Enterprise incluye TODOS los módulos y add-ons sin coste adicional: white-label completo, API ilimitada, IoT, ESG, pricing IA, y más. Es la mejor opción para grandes gestoras.'
  },
];

export default function PreciosPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const getPrice = (plan: typeof PLAN_INFO[PlanTier]) => {
    if (billingPeriod === 'annual') {
      return Math.round(plan.annualPrice / 12);
    }
    return plan.monthlyPrice;
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = (planTier: PlanTier) => {
    const plan = PLAN_INFO[planTier];
    const basePrice = billingPeriod === 'annual' ? plan.annualPrice / 12 : plan.monthlyPrice;
    const addonsPrice = selectedAddons.reduce((sum, addonId) => {
      const addon = MODULE_ADDON_PRICES[addonId];
      return sum + (addon?.monthlyPrice || 0);
    }, 0);
    return Math.round(basePrice + addonsPrice);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 hover:bg-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Sin permanencia · Cancela cuando quieras
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Planes y Precios Transparentes
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-4">
            Elige tu plan base y personaliza con add-ons según tus necesidades reales.
            Facturación automática mensual.
          </p>
          
          {/* Toggle mensual/anual */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'annual')}>
              <TabsList className="bg-white/10">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Mensual
                </TabsTrigger>
                <TabsTrigger value="annual" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">
                  Anual
                  <Badge className="ml-2 bg-green-500 text-white text-xs">Ahorra 2 meses</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Cómo funciona */}
        <div className="mb-16 bg-white rounded-2xl p-8 shadow-sm border">
          <h2 className="text-2xl font-bold mb-6 text-center">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">1. Elige tu plan base</h3>
              <p className="text-gray-600 text-sm">
                Según tu número de propiedades y usuarios. Incluye funcionalidades esenciales y módulos específicos.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">2. Añade módulos extras</h3>
              <p className="text-gray-600 text-sm">
                ¿Necesitas más funcionalidades? Activa módulos como add-ons y paga solo por lo que usas.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">3. Facturación automática</h3>
              <p className="text-gray-600 text-sm">
                Recibe una única factura mensual con plan + add-ons. Gestión automática con Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Planes principales */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4">Planes de Suscripción</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Todos los planes incluyen 30 días de prueba gratis. Sin tarjeta de crédito para empezar.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {PUBLIC_PLANS.map((planKey) => {
              const plan = PLAN_INFO[planKey];
              const PlanIcon = PLAN_ICONS[planKey];
              const planModules = MODULES_BY_PLAN[planKey];
              const isPopular = plan.popular;

              return (
                <Card 
                  key={planKey}
                  className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                    isPopular 
                      ? 'border-2 border-indigo-500 shadow-xl ring-2 ring-indigo-500 ring-offset-2 scale-[1.02]' 
                      : 'border hover:border-gray-300'
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600">
                      ⭐ Más Popular
                    </Badge>
                  )}
                  {plan.badge && (
                    <Badge className="absolute -top-3 right-4 bg-amber-500">
                      {plan.badge}
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <PlanIcon className={`w-12 h-12 mx-auto mb-3 ${PLAN_COLORS[planKey]}`} />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-gray-500 text-sm">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        €{getPrice(plan)}
                      </span>
                      <span className="text-gray-500">/mes</span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        €{plan.annualPrice}/año · Ahorra 2 meses
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Propiedades:</span>
                        <span className="font-semibold">
                          {plan.maxProperties === 'unlimited' ? 'Ilimitadas' : `Hasta ${plan.maxProperties}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usuarios:</span>
                        <span className="font-semibold">
                          {plan.maxUsers === 'unlimited' ? 'Ilimitados' : `Hasta ${plan.maxUsers}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Firmas/mes:</span>
                        <span className="font-semibold">
                          {plan.signaturesIncluded === 'unlimited' ? 'Ilimitadas' : plan.signaturesIncluded}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Almacenamiento:</span>
                        <span className="font-semibold">{plan.storageIncluded}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Módulos incluidos:</p>
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">
                          {planModules.core.length + planModules.included.length} módulos
                        </span>
                        {planModules.addon.length > 0 && (
                          <span className="text-gray-500">
                            {' '}+ {planModules.addon.length} disponibles como add-on
                          </span>
                        )}
                      </div>
                      {planKey === 'enterprise' && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Todos los add-ons incluidos
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="mt-auto">
                    <Link href={planKey === 'enterprise' ? '/landing/contacto' : '/register'} className="w-full">
                      <Button 
                        className={`w-full ${isPopular ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                        variant={isPopular ? 'default' : 'outline'}
                      >
                        {planKey === 'enterprise' ? 'Contactar ventas' : 'Probar 30 días gratis'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Add-ons de consumo */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-4" variant="outline">
              <Package className="w-3 h-3 mr-1" />
              Packs de Consumo
            </Badge>
            <h2 className="text-3xl font-bold mb-4">¿Necesitas más capacidad?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Packs adicionales que puedes comprar cuando alcances los límites de tu plan.
              Se añaden automáticamente a tu factura mensual.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {consumptionAddons.map((addon) => (
              <Card key={addon.id} className="relative hover:shadow-md transition-shadow">
                {addon.popular && (
                  <Badge className="absolute -top-2 right-4 bg-green-500">Popular</Badge>
                )}
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${addon.color}`}>
                    <addon.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{addon.nombre}</CardTitle>
                  <CardDescription>{addon.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {addon.opciones.map((opcion, i) => (
                      <div key={i} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <span className="text-gray-600">{opcion.unidades}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">€{opcion.precio}/mes</span>
                          {opcion.ahorro && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              -{opcion.ahorro}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Módulos como Add-on */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-purple-100 text-purple-700" variant="outline">
              <Layers className="w-3 h-3 mr-1" />
              Módulos Add-on
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Activa funcionalidades extra</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Si tu plan no incluye un módulo que necesitas, puedes activarlo como add-on.
              <span className="font-medium text-indigo-600"> Haz clic en cada módulo para ver todos los detalles.</span>
              <br />
              <span className="text-green-600 font-medium">✓ Todos incluidos en Enterprise.</span>
            </p>
          </div>

          <div className="space-y-10">
            {moduleAddonCategories.map((category) => (
              <div key={category.category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{category.category}</h3>
                    <p className="text-gray-500 text-sm">{category.description}</p>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="space-y-3">
                  {category.addons.map((addon) => (
                    <AccordionItem 
                      key={addon.id} 
                      value={addon.id}
                      className="bg-white rounded-xl border hover:border-purple-300 transition-all overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{addon.name}</h4>
                              <p className="text-sm text-gray-600">{addon.descCorta}</p>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 font-bold text-sm px-3 py-1 flex-shrink-0">
                            €{addon.price}/mes
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="pt-2 space-y-4 border-t">
                          {/* Descripción larga */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700">{addon.descLarga}</p>
                          </div>
                          
                          {/* Funcionalidades */}
                          <div>
                            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Funcionalidades incluidas
                            </h5>
                            <div className="grid sm:grid-cols-2 gap-2">
                              {addon.funcionalidades.map((func, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-600">{func}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Beneficio destacado */}
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-800">{addon.beneficio}</span>
                            </div>
                          </div>
                          
                          {/* Precio y CTA */}
                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <span className="text-2xl font-bold text-purple-700">€{addon.price}</span>
                              <span className="text-gray-500">/mes</span>
                              <p className="text-xs text-gray-500">Se añade a tu factura automáticamente</p>
                            </div>
                            <Link href="/register">
                              <Button className="bg-purple-600 hover:bg-purple-700">
                                Activar módulo
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">¿Cómo se facturan los módulos add-on?</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>✓ Se añaden automáticamente a tu factura mensual</li>
                  <li>✓ Si activas un módulo a mitad de mes, se prorratea</li>
                  <li>✓ Puedes desactivarlos en cualquier momento desde tu panel</li>
                  <li>✓ Recibirás factura detallada por email cada mes</li>
                  <li>✓ Pago con tarjeta o domiciliación bancaria SEPA</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-4" variant="outline">
              <HelpCircle className="w-3 h-3 mr-1" />
              Preguntas Frecuentes
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Resuelve tus dudas</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {pricingFAQs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="bg-white rounded-lg border px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Tabla comparativa */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Comparativa de Planes</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl border shadow-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold">Característica</th>
                  {PUBLIC_PLANS.map((plan) => (
                    <th key={plan} className="px-4 py-3 text-center font-semibold">
                      {PLAN_INFO[plan].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-3 text-gray-600">Precio mensual</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center font-bold">
                      €{PLAN_INFO[plan].monthlyPrice}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">Propiedades</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center">
                      {PLAN_INFO[plan].maxProperties === 'unlimited' ? '∞' : PLAN_INFO[plan].maxProperties}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600">Usuarios</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center">
                      {PLAN_INFO[plan].maxUsers === 'unlimited' ? '∞' : PLAN_INFO[plan].maxUsers}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">Firmas digitales/mes</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center">
                      {PLAN_INFO[plan].signaturesIncluded === 'unlimited' ? '∞' : PLAN_INFO[plan].signaturesIncluded}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600">Almacenamiento</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center">
                      {PLAN_INFO[plan].storageIncluded}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">Módulos incluidos</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center">
                      {MODULES_BY_PLAN[plan].core.length + MODULES_BY_PLAN[plan].included.length}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600">Todos los add-ons incluidos</td>
                  {PUBLIC_PLANS.map((plan) => (
                    <td key={plan} className="px-4 py-3 text-center">
                      {plan === 'enterprise' ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
            30 días de prueba gratis. Sin tarjeta de crédito. Cancela cuando quieras.
            Facturación automática y transparente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Empezar prueba gratuita
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/landing/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Solicitar demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

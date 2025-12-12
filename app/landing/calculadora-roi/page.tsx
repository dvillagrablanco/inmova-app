'use client';
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Calculator,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Download,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Star,
  Users,
} from 'lucide-react';

interface CostBreakdown {
  software: number;
  channelManager?: number;
  digitalSignature?: number;
  crm?: number;
  maintenance?: number;
  support?: number;
  total: number;
}

export default function CalculadoraROIPage() {
  // State para inputs del usuario
  const [unidades, setUnidades] = useState(50);
  const [sistemaActual, setSistemaActual] = useState<string>('competidor1');
  const [necesitaSTR, setNecesitaSTR] = useState<boolean>(true);
  const [necesitaFirmaDigital, setNecesitaFirmaDigital] = useState<boolean>(true);
  const [necesitaCRM, setNecesitaCRM] = useState<boolean>(true);

  // State para cálculos
  const [costActual, setCostActual] = useState<CostBreakdown>({
    software: 0,
    total: 0,
  });
  const [costInmova, setCostInmova] = useState<number>(0);
  const [costInmovaConDescuento, setCostInmovaConDescuento] = useState<number>(0);
  const [ahorroAnual, setAhorroAnual] = useState<number>(0);
  const [ahorroAnualConDescuento, setAhorroAnualConDescuento] = useState<number>(0);

  // Definición de precios de competidores y servicios adicionales
  const competitorPricing: Record<string, { base: number; perUnit?: number; name: string }> = {
    competidor1: { base: 0, perUnit: 12, name: 'Competidor 1' },
    competidor2: { base: 0, perUnit: 9, name: 'Competidor 2' },
    competidor3: { base: 174, perUnit: 0, name: 'Competidor 3' },
    appfolio: { base: 280, perUnit: 1, name: 'AppFolio' },
    otro: { base: 150, perUnit: 0, name: 'Otro Sistema' },
  };

  const addonCosts = {
    channelManager: 80, // Guesty, Hostaway, etc.
    digitalSignature: 25, // DocuSign, etc.
    crm: 50, // HubSpot, Pipedrive, etc.
    maintenance: 30, // Herramienta de mantenimiento
    support: 20, // Soporte premium
  };

  // Precios de INMOVA
  const inmovaPricing = [
    { min: 1, max: 25, monthly: 89, name: 'Starter' },
    { min: 26, max: 200, monthly: 199, name: 'Profesional' },
    { min: 201, max: 1000, monthly: 499, name: 'Empresarial' },
    { min: 1001, max: 999999, monthly: 1999, name: 'Enterprise+' },
  ];

  // Cálculo automático al cambiar inputs
  useEffect(() => {
    calcularCostos();
  }, [unidades, sistemaActual, necesitaSTR, necesitaFirmaDigital, necesitaCRM]);

  const calcularCostos = () => {
    // Calcular coste del sistema actual
    const competitor = competitorPricing[sistemaActual];
    let softwareBase = competitor.base;
    if (competitor.perUnit) {
      softwareBase += competitor.perUnit * unidades;
    }

    const breakdown: CostBreakdown = {
      software: softwareBase,
      total: softwareBase,
    };

    // Agregar add-ons si son necesarios
    if (necesitaSTR) {
      breakdown.channelManager = addonCosts.channelManager;
      breakdown.total += addonCosts.channelManager;
    }
    if (necesitaFirmaDigital) {
      breakdown.digitalSignature = addonCosts.digitalSignature;
      breakdown.total += addonCosts.digitalSignature;
    }
    if (necesitaCRM) {
      breakdown.crm = addonCosts.crm;
      breakdown.total += addonCosts.crm;
    }
    // Siempre agregar mantenimiento y soporte (no opcionales)
    breakdown.maintenance = addonCosts.maintenance;
    breakdown.support = addonCosts.support;
    breakdown.total += addonCosts.maintenance + addonCosts.support;

    setCostActual(breakdown);

    // Calcular coste de INMOVA según unidades
    const inmovaplan = inmovaPricing.find((p) => unidades >= p.min && unidades <= p.max);
    const monthlyCostInmova = inmovaplan?.monthly || 89;
    setCostInmova(monthlyCostInmova);

    // Con descuento LAUNCH2025 (50% primer mes)
    const firstMonthDiscount = monthlyCostInmova * 0.5;
    const yearCostWithDiscount = firstMonthDiscount + monthlyCostInmova * 11;
    setCostInmovaConDescuento(yearCostWithDiscount);

    // Calcular ahorro anual
    const ahorroSinDescuento = breakdown.total * 12 - monthlyCostInmova * 12;
    const ahorroConDesc = breakdown.total * 12 - yearCostWithDiscount;

    setAhorroAnual(ahorroSinDescuento);
    setAhorroAnualConDescuento(ahorroConDesc);
  };

  const planInmova = inmovaPricing.find((p) => unidades >= p.min && unidades <= p.max);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/landing/campanas/launch2025">
                <Button
                  variant="outline"
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
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
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 text-sm px-4 py-1">
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora de ROI
          </Badge>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            ¿Cuánto Ahorras con INMOVA?
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto">
            Compara tu coste actual con INMOVA y descubre el{' '}
            <strong className="text-indigo-600">ahorro real</strong> en tu gestión inmobiliaria.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Incluye todos los servicios adicionales que actualmente pagas por separado.
          </p>
        </div>
      </section>

      {/* CALCULADORA */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* PANEL IZQUIERDO: INPUTS */}
            <Card className="bg-white shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-indigo-600" />
                  Configura Tu Situación Actual
                </CardTitle>
                <CardDescription>
                  Ajusta los parámetros para obtener tu cálculo personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Número de Unidades */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Número de Unidades / Activos</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[unidades]}
                      onValueChange={(val) => setUnidades(val[0])}
                      min={1}
                      max={500}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={unidades}
                      onChange={(e) => setUnidades(Number(e.target.value))}
                      className="w-20 text-center font-bold"
                      min={1}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Inmuebles que gestionas actualmente</p>
                </div>

                {/* Sistema Actual */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Tu Sistema Actual</Label>
                  <Select value={sistemaActual} onValueChange={setSistemaActual}>
                    <SelectTrigger className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="competidor1">Competidor 1</SelectItem>
                      <SelectItem value="competidor2">Competidor 2</SelectItem>
                      <SelectItem value="competidor3">Competidor 3</SelectItem>
                      <SelectItem value="appfolio">AppFolio</SelectItem>
                      <SelectItem value="otro">Otro Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Servicios Adicionales */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">
                    Servicios Adicionales que Necesitas
                  </Label>

                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                    <div>
                      <p className="font-medium">Short-Term Rental (Airbnb, Booking)</p>
                      <p className="text-sm text-gray-600">Channel Manager (~€80/mes)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={necesitaSTR}
                        onChange={(e) => setNecesitaSTR(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg">
                    <div>
                      <p className="font-medium">Firma Digital</p>
                      <p className="text-sm text-gray-600">DocuSign, etc. (~€25/mes)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={necesitaFirmaDigital}
                        onChange={(e) => setNecesitaFirmaDigital(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">CRM Avanzado</p>
                      <p className="text-sm text-gray-600">HubSpot, Pipedrive, etc. (~€50/mes)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={necesitaCRM}
                        onChange={(e) => setNecesitaCRM(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-700 mb-1">Incluido Siempre:</p>
                    <p className="text-sm text-gray-600">
                      • Herramientas de mantenimiento (~€30/mes)
                    </p>
                    <p className="text-sm text-gray-600">• Soporte premium (~€20/mes)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PANEL DERECHO: RESULTADOS */}
            <div className="space-y-6">
              {/* Coste Actual */}
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-700 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Tu Coste Actual Mensual
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    {competitorPricing[sistemaActual].name} + Servicios Adicionales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-red-200">
                    <span className="text-gray-700">Software base:</span>
                    <span className="font-semibold text-gray-900">
                      €{costActual.software.toFixed(2)}
                    </span>
                  </div>
                  {costActual.channelManager && (
                    <div className="flex justify-between items-center pb-2 border-b border-red-200">
                      <span className="text-gray-700">Channel Manager (STR):</span>
                      <span className="font-semibold text-gray-900">
                        €{costActual.channelManager.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {costActual.digitalSignature && (
                    <div className="flex justify-between items-center pb-2 border-b border-red-200">
                      <span className="text-gray-700">Firma Digital:</span>
                      <span className="font-semibold text-gray-900">
                        €{costActual.digitalSignature.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {costActual.crm && (
                    <div className="flex justify-between items-center pb-2 border-b border-red-200">
                      <span className="text-gray-700">CRM:</span>
                      <span className="font-semibold text-gray-900">
                        €{costActual.crm.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-2 border-b border-red-200">
                    <span className="text-gray-700">Mantenimiento:</span>
                    <span className="font-semibold text-gray-900">
                      €{costActual.maintenance?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-red-200">
                    <span className="text-gray-700">Soporte:</span>
                    <span className="font-semibold text-gray-900">
                      €{costActual.support?.toFixed(2)}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t-2 border-red-300">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-red-800">Total Mensual:</span>
                      <span className="text-3xl font-extrabold text-red-700">
                        €{costActual.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Total Anual:</span>
                      <span className="text-lg font-semibold text-red-600">
                        €{(costActual.total * 12).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coste INMOVA */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Con INMOVA {planInmova?.name}
                  </CardTitle>
                  <CardDescription className="text-green-600">
                    TODO Incluido - 88 Módulos Profesionales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/60 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Software completo (56 módulos)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Channel Manager nativo (STR)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Firma Digital cualificada</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>CRM + Portal Propietario</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>IA GPT-4 + Mantenimiento Predictivo</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Soporte ilimitado incluido</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg">
                      <span className="text-lg font-semibold text-gray-800">Precio Normal:</span>
                      <span className="text-2xl font-bold text-gray-900">€{costInmova}/mes</span>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-yellow-300" />
                        <span className="font-semibold">Con LAUNCH2025 (50% 1er mes)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Coste 1er Año:</span>
                        <span className="text-2xl font-extrabold">
                          €{costInmovaConDescuento.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-200 mt-1">
                        Equivale a €{(costInmovaConDescuento / 12).toFixed(2)}/mes promedio
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AHORRO */}
              <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 border-0 shadow-2xl text-white">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <TrendingDown className="h-8 w-8 text-yellow-300" />
                    Tu Ahorro con INMOVA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                    <p className="text-indigo-200 mb-2">Ahorro Anual (sin descuento)</p>
                    <p className="text-5xl font-extrabold text-yellow-300 mb-1">
                      €{ahorroAnual.toFixed(2)}
                    </p>
                    <p className="text-sm text-indigo-200">
                      €{(ahorroAnual / 12).toFixed(2)} / mes
                    </p>
                  </div>

                  <div className="bg-yellow-400 text-gray-900 rounded-lg p-6 text-center border-4 border-yellow-300">
                    <p className="text-yellow-800 font-semibold mb-2 flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Ahorro 1er Año con LAUNCH2025
                    </p>
                    <p className="text-6xl font-black mb-1">
                      €{ahorroAnualConDescuento.toFixed(2)}
                    </p>
                    <p className="text-sm font-semibold text-yellow-800">
                      ¡Ahorra más de{' '}
                      {Math.round((ahorroAnualConDescuento / costActual.total / 12) * 100)}% en el
                      primer año!
                    </p>
                  </div>

                  <div className="space-y-2 text-indigo-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-300" />
                      <span>Coste por módulo: solo €{(costInmova / 88).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>
                        Recuperas el coste de cambio en {Math.ceil(500 / (ahorroAnual / 12))} meses
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-300" />
                      <span>Sin costes ocultos ni sorpresas</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link href="/register?coupon=LAUNCH2025">
                      <Button
                        size="lg"
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg h-14"
                      >
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Activar LAUNCH2025 y Ahorrar Ahora
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS RÁPIDOS */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Lo Que Dicen Nuestros Clientes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "Pasé de pagar €420/mes entre Competidor 1 y Guesty a solo €199 con INMOVA. Y tengo MU
                  CHAS más funcionalidades. El ROI fue inmediato."
                </p>
                <p className="font-semibold text-gray-900">
                  Carlos M. - Agencia PropTech, 85 unidades
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "La calculadora me convenció. Estaba tirando €3,800 al año en herramientas
                  dispersas. Con INMOVA todo está en un solo lugar y ahorro casi €2,000 anuales."
                </p>
                <p className="font-semibold text-gray-900">
                  Laura R. - Inversora Individual, 32 unidades
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Comienza a Ahorrar Hoy</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Únete a los <strong className="text-white">cientos de gestores inmobiliarios</strong>{' '}
            que ya están ahorrando miles de euros al año con INMOVA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register?coupon=LAUNCH2025">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg h-16 px-10"
              >
                <Sparkles className="mr-2 h-6 w-6" />
                Registrarse con LAUNCH2025
              </Button>
            </Link>
            <Link href="/landing/demo">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg h-16 px-10"
              >
                <Users className="mr-2 h-5 w-5" />
                Solicitar Demo
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-indigo-100">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Sin permanencia • Cancela cuando quieras • Soporte 24/7</span>
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
            <Link href="/landing/legal/privacidad" className="hover:text-gray-300">
              Privacidad
            </Link>
            <Link href="/landing/legal/terminos" className="hover:text-gray-300">
              Términos
            </Link>
            <Link href="/landing/contacto" className="hover:text-gray-300">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

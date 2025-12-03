'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, TrendingUp, DollarSign, Calculator, CheckCircle, 
  Hammer, PieChart, AlertCircle, Sparkles, Home, Euro,
  BarChart3, Clock, Target, ArrowRight, Star, Users
} from 'lucide-react';

export default function HouseFlippingPage() {
  // Inputs del proyecto
  const [precioCompra, setPrecioCompra] = useState<number>(150000);
  const [costesReforma, setCostesReforma] = useState<number>(30000);
  const [gastosNotariales, setGastosNotariales] = useState<number>(10000);
  const [precioVentaObjetivo, setPrecioVentaObjetivo] = useState<number>(220000);
  const [tiempoProyecto, setTiempoProyecto] = useState<number>(6); // meses
  
  // Resultados calculados
  const [inversionTotal, setInversionTotal] = useState<number>(0);
  const [beneficioBruto, setBeneficioBruto] = useState<number>(0);
  const [beneficioNeto, setBeneficioNeto] = useState<number>(0);
  const [roi, setRoi] = useState<number>(0);
  const [roiAnualizado, setRoiAnualizado] = useState<number>(0);

  useEffect(() => {
    calcularROI();
  }, [precioCompra, costesReforma, gastosNotariales, precioVentaObjetivo, tiempoProyecto]);

  const calcularROI = () => {
    // Inversión total
    const inversion = precioCompra + costesReforma + gastosNotariales;
    setInversionTotal(inversion);

    // Beneficio bruto (sin impuestos)
    const benefBruto = precioVentaObjetivo - inversion;
    setBeneficioBruto(benefBruto);

    // Beneficio neto (estimando ~21% de impuestos)
    const impuestos = benefBruto * 0.21;
    const benefNeto = benefBruto - impuestos;
    setBeneficioNeto(benefNeto);

    // ROI
    const roiCalc = (benefNeto / inversion) * 100;
    setRoi(roiCalc);

    // ROI Anualizado
    const roiAnual = (roiCalc / tiempoProyecto) * 12;
    setRoiAnualizado(roiAnual);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">INMOVA</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/landing/campanas/launch2025">
                <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                  Ver Oferta LAUNCH2025
                </Button>
              </Link>
              <Link href="/register?coupon=LAUNCH2025">
                <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white">
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
          <Badge className="mb-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white border-0 text-sm px-4 py-1">
            <Hammer className="h-4 w-4 mr-2" />
            Módulo House Flipping
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Gestiona Tus Proyectos de Flipping
            <br />
            con ROI en Tiempo Real
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            La única plataforma PropTech que te permite gestionar <strong>obras, presupuestos y ROI proyectado</strong> en un solo dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-lg h-14 px-8">
              <ArrowRight className="mr-2 h-5 w-5" />
              Probar Gratis con LAUNCH2025
            </Button>
            <Button size="lg" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50 text-lg h-14 px-8">
              Ver Demo en Vivo
            </Button>
          </div>
        </div>
      </section>

      {/* CALCULADORA ROI */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <Calculator className="inline h-10 w-10 mr-3 text-orange-600" />
              Calculadora de ROI para House Flipping
            </h2>
            <p className="text-xl text-gray-600">
              Simula tu próximo proyecto y ve el retorno estimado instantáneamente.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* PANEL IZQUIERDO: INPUTS */}
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Home className="h-6 w-6 text-orange-600" />
                  Datos del Proyecto
                </CardTitle>
                <CardDescription>
                  Introduce los valores estimados de tu operación de flipping
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Precio de Compra (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number" 
                      value={precioCompra}
                      onChange={(e) => setPrecioCompra(Number(e.target.value))}
                      className="pl-10 text-lg font-semibold"
                      step="1000"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Precio de adquisición del inmueble</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Costes de Reforma (€)</Label>
                  <div className="relative">
                    <Hammer className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number" 
                      value={costesReforma}
                      onChange={(e) => setCostesReforma(Number(e.target.value))}
                      className="pl-10 text-lg font-semibold"
                      step="1000"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Obras, materiales, mano de obra</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Gastos Notariales y Otros (€)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number" 
                      value={gastosNotariales}
                      onChange={(e) => setGastosNotariales(Number(e.target.value))}
                      className="pl-10 text-lg font-semibold"
                      step="500"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Notario, registro, tasación, ITP, etc.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Precio de Venta Objetivo (€)</Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number" 
                      value={precioVentaObjetivo}
                      onChange={(e) => setPrecioVentaObjetivo(Number(e.target.value))}
                      className="pl-10 text-lg font-semibold"
                      step="1000"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Precio estimado de venta después de la reforma</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Duración del Proyecto (meses)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="number" 
                      value={tiempoProyecto}
                      onChange={(e) => setTiempoProyecto(Number(e.target.value))}
                      className="pl-10 text-lg font-semibold"
                      min="1"
                      max="24"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Desde la compra hasta la venta</p>
                </div>
              </CardContent>
            </Card>

            {/* PANEL DERECHO: RESULTADOS */}
            <div className="space-y-6">
              {/* Inversión Total */}
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-700">Inversión Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-extrabold text-orange-600">€{inversionTotal.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-2">Compra + Reforma + Gastos</p>
                </CardContent>
              </Card>

              {/* Resultados Proyectados */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-700 flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Resultados Proyectados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-green-200">
                    <span className="text-gray-700">Precio de Venta:</span>
                    <span className="text-xl font-bold text-gray-900">€{precioVentaObjetivo.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-green-200">
                    <span className="text-gray-700">Beneficio Bruto:</span>
                    <span className="text-xl font-bold text-green-600">€{beneficioBruto.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-green-200">
                    <span className="text-gray-700 text-sm">Impuestos (est. 21%):</span>
                    <span className="text-lg font-semibold text-red-600">-€{(beneficioBruto * 0.21).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 bg-green-100 rounded-lg p-4">
                    <span className="text-lg font-bold text-gray-800">Beneficio Neto:</span>
                    <span className="text-3xl font-extrabold text-green-700">€{beneficioNeto.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                </CardContent>
              </Card>

              {/* ROI */}
              <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 border-0 shadow-2xl text-white">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <PieChart className="h-6 w-6 text-yellow-300" />
                    Retorno de Inversión (ROI)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                    <p className="text-indigo-200 mb-2 text-sm">ROI Total del Proyecto</p>
                    <p className="text-6xl font-extrabold text-yellow-300 mb-1">{roi.toFixed(1)}%</p>
                    <p className="text-sm text-indigo-200">En {tiempoProyecto} meses</p>
                  </div>

                  <div className="bg-yellow-400 text-gray-900 rounded-lg p-6 text-center border-4 border-yellow-300">
                    <p className="text-yellow-800 font-semibold mb-2">ROI Anualizado</p>
                    <p className="text-5xl font-black mb-1">{roiAnualizado.toFixed(1)}%</p>
                    <p className="text-sm font-semibold text-yellow-800">
                      {roiAnualizado > 20 ? '¡Excelente inversión!' : roiAnualizado > 10 ? 'Buena rentabilidad' : 'Revisar números'}
                    </p>
                  </div>

                  {roi > 0 && (
                    <div className="space-y-2 text-indigo-100 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span>Por cada €1 invertido, recuperas €{(1 + (roi / 100)).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span>Margen de beneficio: {((beneficioNeto / precioVentaObjetivo) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-300" />
                        <span>Beneficio mensual: €{(beneficioNeto / tiempoProyecto).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS DEL MÓDULO */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Todo Lo Que Necesitas para House Flipping
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-3">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">ROI en Tiempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Ve el retorno proyectado instantáneamente al introducir costes y precios. Dashboard actualizado al segundo.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-3">
                  <Hammer className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Gestión de Obras</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Control total de las 9 fases de reforma: demolición, albañilería, fontanería, electricidad, pintura, etc.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-3">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Control de Subcontratas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Gestiona proveedores, presupuestos, facturas y pagos a contratistas en un solo lugar.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-3">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Pipeline de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Visualiza todos tus proyectos de flipping en paralelo: en prospección, en obra, en venta.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-3">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Valoraciones Automáticas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Integración con APIs de valoración para estimar precios de mercado antes de comprar.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-3">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Certificaciones de Obra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Genera certificaciones de obra, ITE, cédulas de habitabilidad integradas en el flujo.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            ¿Cómo Gestionas Flipping Ahora?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sin INMOVA */}
            <Card className="bg-white border-red-200">
              <CardHeader>
                <CardTitle className="text-xl text-red-600">Sin INMOVA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>Excel para calcular ROI (propenso a errores)</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>WhatsApp para coordinar con albañiles</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>Trello o Notion para fases de obra</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>Sin visibilidad de costes reales vs presupuestados</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>Información dispersa en múltiples herramientas</p>
                </div>
              </CardContent>
            </Card>

            {/* Con INMOVA */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
              <CardHeader>
                <CardTitle className="text-xl text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Con INMOVA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Calculadora ROI automática</strong> con datos en tiempo real</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Portal de subcontratas</strong> para comunicación centralizada</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Gestión de fases</strong> integrada con alertas automáticas</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Dashboard financiero</strong> con costes vs presupuesto</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Todo en una plataforma</strong>, sin cambiar de herramienta</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Flippeadores Usando INMOVA
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "He hecho 4 proyectos de flipping con INMOVA. El módulo de ROI me ha salvado de comprar propiedades que parecían buenas pero los números no cerraban. Ahorro horas en Excel."
                </p>
                <p className="font-semibold text-gray-900">Javier P. - Inversor Full-Time, Barcelona</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-violet-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "Gestiono 3 proyectos de flipping simultáneamente. El pipeline de INMOVA me permite ver todo de un vistazo: qué fase va cada obra, los costes reales vs presupuesto. Imprescindible."
                </p>
                <p className="font-semibold text-gray-900">Ana L. - Arquitecta e Inversora, Madrid</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-600 to-amber-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Empieza Tu Primer Proyecto de Flipping
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Con el código <strong className="text-white">LAUNCH2025</strong>, obtén 50% de descuento en tu primer mes y acceso completo al módulo de House Flipping.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register?coupon=LAUNCH2025">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-orange-600 font-bold text-lg h-16 px-10">
                <Sparkles className="mr-2 h-6 w-6" />
                Activar LAUNCH2025 Ahora
              </Button>
            </Link>
            <Link href="/landing/demo">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg h-16 px-10">
                Ver Demo del Módulo
              </Button>
            </Link>
          </div>

          <p className="text-orange-100 text-sm">
            • Sin permanencia • Cancela cuando quieras • Migración asistida incluida
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-slate-900 border-t border-gray-800">
        <div className="container mx-auto text-center">
          <Link href="/landing" className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-orange-400" />
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

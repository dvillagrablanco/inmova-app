'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Shield,
  Euro,
  CheckCircle2,
  Users,
  FileCheck,
  TrendingUp,
  Zap,
  Award,
  ArrowRight,
  Clock,
  Star,
  Briefcase,
  Globe,
  HardHat,
  Hammer,
  ClipboardCheck,
  Truck,
  Receipt,
  BadgeCheck,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * eWoorker - B2B Marketplace para Subcontratación en Construcción
 *
 * Personalidad de marca: Profesional, confiable, naranja energético
 * Target: Constructores, promotores, subcontratistas
 */

export default function EwoorkerLandingPage() {
  const router = useRouter();
  const [registerType, setRegisterType] = useState<'constructor' | 'subcontratista'>('constructor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      {/* Navigation Bar - Branded eWoorker */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <HardHat className="h-8 w-8 text-orange-600" />
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    eWoorker
                  </span>
                  <p className="text-xs text-gray-600">by Inmova</p>
                </div>
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link
                  href="#como-funciona"
                  className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                >
                  Cómo Funciona
                </Link>
                <Link
                  href="#planes"
                  className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                >
                  Planes
                </Link>
                <Link
                  href="#beneficios"
                  className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
                >
                  Beneficios
                </Link>
                <Link
                  href="/landing"
                  className="text-gray-500 hover:text-orange-600 transition-colors"
                >
                  Plataforma Inmova
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/ewoorker/login')}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                Iniciar Sesión
              </Button>
              <Button
                onClick={() => router.push('/ewoorker/registro')}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
              >
                Empezar Gratis
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Naranja Energético */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2 text-sm font-semibold">
              <Zap className="w-4 h-4 inline mr-2" />
              Plataforma B2B para Construcción
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-600 bg-clip-text text-transparent leading-tight">
              Subcontratación Legal <br />
              Sin Complicaciones
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              El marketplace B2B que conecta <strong>constructores</strong> con{' '}
              <strong>subcontratistas certificados</strong>.
              <span className="block mt-2 text-orange-600 font-semibold">
                Cumple Ley 32/2006 automáticamente. Pagos seguros con escrow.
              </span>
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                onClick={() => router.push('/ewoorker/registro?type=constructor')}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-lg px-8 py-6 shadow-2xl hover:shadow-orange-300 transition-all"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Soy Constructor
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/ewoorker/registro?type=subcontratista')}
                className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 text-lg px-8 py-6"
              >
                <HardHat className="w-5 h-5 mr-2" />
                Soy Subcontratista
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-gray-600">
              <div className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-semibold">2,500+ empresas activas</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold">4.8/5 en valoraciones</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-semibold">100% legal y seguro</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema/Solución Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problema */}
            <Card className="border-2 border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-2xl text-red-700 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  El Problema Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <span className="text-red-600 font-bold mr-3">❌</span>
                  <p className="text-gray-700">
                    <strong>Subcontratación en negro:</strong> Riesgo de multas de hasta €10,000
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-600 font-bold mr-3">❌</span>
                  <p className="text-gray-700">
                    <strong>Documentación obsoleta:</strong> REA, TC1, TC2 vencidos sin avisos
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-600 font-bold mr-3">❌</span>
                  <p className="text-gray-700">
                    <strong>Pagos sin garantía:</strong> Subcontratistas impagados, constructores
                    estafados
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-red-600 font-bold mr-3">❌</span>
                  <p className="text-gray-700">
                    <strong>Libro de subcontratación manual:</strong> Pérdida de tiempo y errores
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Solución */}
            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-2xl text-green-700 flex items-center">
                  <CheckCircle2 className="w-6 h-6 mr-3" />
                  La Solución eWoorker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✓</span>
                  <p className="text-gray-700">
                    <strong>100% legal automático:</strong> Ley 32/2006 cumplida sin esfuerzo
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✓</span>
                  <p className="text-gray-700">
                    <strong>Alertas inteligentes:</strong> Nunca más docs vencidos. Renovación
                    1-click
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✓</span>
                  <p className="text-gray-700">
                    <strong>Escrow banking:</strong> Pagos seguros para ambas partes. €0 en
                    impagados
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">✓</span>
                  <p className="text-gray-700">
                    <strong>Libro digital automático:</strong> Genera Libro de Subcontratación
                    oficial en 2 clics
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cómo Funciona Section */}
      <section id="como-funciona" className="py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Cómo Funciona eWoorker</h2>
            <p className="text-xl text-gray-600">Simple, rápido y 100% legal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Paso 1 */}
            <Card className="relative overflow-hidden border-2 border-orange-200">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 to-orange-500"></div>
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  1
                </div>
                <CardTitle className="text-2xl">Publica tu Obra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Constructor crea proyecto en marketplace. Define gremio, plazo, presupuesto.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Formulario en 5 minutos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    IA sugiere descripciones
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Visibilidad inmediata
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Paso 2 */}
            <Card className="relative overflow-hidden border-2 border-orange-200">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 to-orange-500"></div>
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  2
                </div>
                <CardTitle className="text-2xl">Recibe Ofertas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Subcontratistas certificados envían propuestas con precio, plazo, portfolio.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Solo empresas verificadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Reviews y ratings reales
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Comparativa automática
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Paso 3 */}
            <Card className="relative overflow-hidden border-2 border-orange-200">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 to-orange-500"></div>
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  3
                </div>
                <CardTitle className="text-2xl">Contrata y Cobra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Acepta oferta, contrato digital automático, pagos seguros por hitos.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Firma electrónica válida
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Escrow automático
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                    Libro oficial generado
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios Clave Section */}
      <section id="beneficios" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Por Qué Elegir eWoorker</h2>
            <p className="text-xl text-gray-600">La plataforma más completa del sector</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Compliance Automático</h3>
                <p className="text-sm text-gray-600">
                  Ley 32/2006 cumplida sin esfuerzo. Alertas de vencimiento REA, TC1, TC2.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <Euro className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Pago Seguro (Escrow)</h3>
                <p className="text-sm text-gray-600">
                  Tu dinero protegido hasta final obra. Liberación automática por hitos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <FileCheck className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Docs Siempre al Día</h3>
                <p className="text-sm text-gray-600">
                  Verificación automática. Renovación 1-click. Sin docs vencidos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Crece Tu Negocio</h3>
                <p className="text-sm text-gray-600">
                  Accede a miles de obras. Marketplace con 2,500+ empresas activas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <Zap className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Gestión Ágil</h3>
                <p className="text-sm text-gray-600">
                  Partes de trabajo digitales. Fichajes con geolocalización. Control total.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <Award className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Reputación Digital</h3>
                <p className="text-sm text-gray-600">
                  Sistema de reviews bidireccional. Portfolio online. Gana más obras.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <ClipboardCheck className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Certificaciones Fáciles</h3>
                <p className="text-sm text-gray-600">
                  Genera certificaciones mensuales automáticas. Firma digital válida.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-200 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <Receipt className="w-16 h-16 text-pink-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Libro Digital Oficial</h3>
                <p className="text-sm text-gray-600">
                  Genera Libro de Subcontratación oficial en 2 clics. Listo para inspección.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* NUEVAS FUNCIONALIDADES - Sprint 3 */}
      <section className="py-20 bg-gradient-to-br from-orange-600 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-white text-orange-600 px-6 py-2 text-sm font-semibold">
              🚀 NOVEDADES 2026
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Nuevas Funcionalidades</h2>
            <p className="text-xl opacity-90">Innovación constante para tu negocio</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gamificación */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-lg font-bold mb-2">Gamificación</h3>
                <p className="text-sm opacity-90">
                  Gana puntos, sube de nivel y desbloquea logros. 6 niveles de Novato a Leyenda.
                </p>
                <Badge className="mt-4 bg-white/20">+40% engagement</Badge>
              </CardContent>
            </Card>

            {/* Referidos */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-4">🎁</div>
                <h3 className="text-lg font-bold mb-2">Sistema Referidos</h3>
                <p className="text-sm opacity-90">
                  Invita empresas y gana 500 puntos + 10% dto. Referido obtiene 20% dto en
                  verificación.
                </p>
                <Badge className="mt-4 bg-white/20">Crecimiento viral</Badge>
              </CardContent>
            </Card>

            {/* Matching IA */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-lg font-bold mb-2">Matching con IA</h3>
                <p className="text-sm opacity-90">
                  IA recomienda subcontratistas ideales basándose en especialidad, zona y rating.
                </p>
                <Badge className="mt-4 bg-white/20">Claude AI integrado</Badge>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-bold mb-2">Analytics Dashboard</h3>
                <p className="text-sm opacity-90">
                  20+ KPIs, tendencias históricas, distribución geográfica. Decisiones basadas en
                  datos.
                </p>
                <Badge className="mt-4 bg-white/20">Métricas en tiempo real</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => router.push('/ewoorker/registro')}
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-2xl"
            >
              Probar Nuevas Funcionalidades
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Planes y Precios Section */}
      <section id="planes" className="py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planes para Cada Necesidad</h2>
            <p className="text-xl text-gray-600">Sin permanencia. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plan Obrero */}
            <Card className="border-2 border-gray-300">
              <CardHeader>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">OBRERO</h3>
                  <div className="text-5xl font-extrabold text-gray-900 mb-2">Gratis</div>
                  <p className="text-gray-600">+ 5% comisión</p>
                  <p className="text-xs text-gray-500 mt-1">Por obra cerrada</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Perfil básico</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Ver obras públicas</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>3 ofertas/mes</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Chat básico</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Soporte email</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-gray-700 hover:bg-gray-800"
                  onClick={() => router.push('/ewoorker/registro?plan=obrero')}
                >
                  Empezar Gratis
                </Button>
              </CardContent>
            </Card>

            {/* Plan Capataz - Popular */}
            <Card className="border-4 border-orange-500 relative shadow-2xl scale-105">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-1">
                MÁS POPULAR
              </Badge>
              <CardHeader>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">CAPATAZ</h3>
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">
                    €49
                  </div>
                  <p className="text-gray-600">/mes + 2% comisión</p>
                  <p className="text-xs text-gray-500 mt-1">Por obra cerrada</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>
                      <strong>Todo de Obrero</strong>
                    </span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Ofertas ilimitadas</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Compliance Hub completo</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Chat prioritario</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Sistema escrow (+2% comisión)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Certificaciones digitales</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  onClick={() => router.push('/ewoorker/registro?plan=capataz')}
                >
                  Probar 14 días gratis
                </Button>
              </CardContent>
            </Card>

            {/* Plan Constructor */}
            <Card className="border-2 border-blue-300">
              <CardHeader>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">CONSTRUCTOR</h3>
                  <div className="text-5xl font-extrabold text-blue-700 mb-2">€149</div>
                  <p className="text-gray-600">/mes + 0% comisión</p>
                  <p className="text-xs text-gray-500 mt-1">Sin comisiones extra</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>
                      <strong>Todo de Capataz</strong>
                    </span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Obras ilimitadas</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Marketplace destacado</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>0% comisión por obra</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Equipo ilimitado</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>Account manager</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <span>White-label</span>
                  </li>
                </ul>
                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800"
                  onClick={() => router.push('/landing/contacto?plan=constructor')}
                >
                  Hablar con Ventas
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              <strong>Sin permanencia.</strong> Cancela cuando quieras. Prueba 14 días gratis.
            </p>
            <Link
              href="#planes"
              className="text-orange-600 hover:text-orange-700 font-semibold underline"
            >
              Ver comparativa detallada de planes →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonios Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo Que Dicen Nuestros Usuarios
            </h2>
            <p className="text-xl text-gray-600">2,500+ empresas ya confían en eWoorker</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Antes perdíamos 2 días/mes haciendo el libro de subcontratación. Ahora son 2
                  clics. Una maravilla."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold mr-3">
                    JR
                  </div>
                  <div>
                    <p className="font-semibold">Javier Rodríguez</p>
                    <p className="text-sm text-gray-600">Constructor, Madrid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "El escrow es lo mejor. Cobro siempre a tiempo, el constructor no me puede
                  estafar. Cero impagados desde que uso eWoorker."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold mr-3">
                    ML
                  </div>
                  <div>
                    <p className="font-semibold">María López</p>
                    <p className="text-sm text-gray-600">Fontanera, Barcelona</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Las alertas de docs vencidos nos salvaron de una multa de €8,000. No teníamos el
                  REA actualizado y nos avisaron 30 días antes."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold mr-3">
                    CM
                  </div>
                  <div>
                    <p className="font-semibold">Carlos Martín</p>
                    <p className="text-sm text-gray-600">Electricista, Valencia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>¿Qué es el sistema de escrow?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  El escrow es un sistema de custodia de pagos. Cuando el constructor acepta una
                  oferta, deposita el dinero en una cuenta custodia de eWoorker. El dinero se libera
                  al subcontratista automáticamente cuando se cumplen los hitos acordados. Ambas
                  partes están protegidas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>¿Cómo verificáis que las empresas son legales?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Verificamos REA (Registro Empresas Acreditadas), TC1, TC2, seguro RC,
                  documentación fiscal. Si falta algo, la empresa no puede enviar ofertas hasta
                  regularizar. Las alertas automáticas avisan 30 días antes de vencimiento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>¿Cuánto tarda el alta en eWoorker?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Si tienes docs al día: 10 minutos. Subes REA, TC1, TC2, seguro → verificación
                  automática → perfil activo. Puedes empezar a ver obras o publicar la tuya
                  inmediatamente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>¿Hay comisión por uso?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Depende del plan. <strong>Plan Obrero (gratis): 5% comisión</strong> por obra
                  cerrada. <strong>Plan Capataz (€49/mes): 2% comisión</strong>.{' '}
                  <strong>Plan Constructor (€149/mes): 0% comisión</strong> + obras destacadas. La
                  comisión solo se cobra si cierras obra.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Empieza a Subcontratar Legal Hoy
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a las 2,500+ empresas que ya usan eWoorker. 14 días gratis, sin tarjeta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/ewoorker/registro')}
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-2xl"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Empezar Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/landing/contacto?platform=ewoorker')}
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-6"
            >
              Hablar con Ventas
            </Button>
          </div>
          <p className="mt-8 text-sm opacity-75">
            Sin permanencia • Cancela cuando quieras • Soporte en español 24/7
          </p>
        </div>
      </section>

      {/* Footer - eWoorker Branded */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <HardHat className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-white">eWoorker</span>
              </div>
              <p className="text-sm text-gray-400">
                B2B Marketplace para subcontratación legal en construcción.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Producto</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#como-funciona" className="hover:text-orange-500 transition-colors">
                    Cómo Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#planes" className="hover:text-orange-500 transition-colors">
                    Planes y Precios
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ewoorker/compliance"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Compliance Hub
                  </Link>
                </li>
                <li>
                  <Link href="/ewoorker/obras" className="hover:text-orange-500 transition-colors">
                    Marketplace
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/landing/sobre-nosotros"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link
                    href="/landing/contacto"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/landing" className="hover:text-orange-500 transition-colors">
                    Plataforma Inmova
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/landing/legal/terminos"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link
                    href="/landing/legal/privacidad"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link
                    href="/landing/legal/cookies"
                    className="hover:text-orange-500 transition-colors"
                  >
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© 2026 eWoorker by Inmova. Todos los derechos reservados.</p>
            <p className="mt-2">Hecho en España 🇪🇸 con ❤️ para el sector construcción</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

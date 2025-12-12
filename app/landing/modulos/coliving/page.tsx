'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Users,
  Calculator,
  CheckCircle,
  Zap,
  Euro,
  Droplets,
  Wifi,
  Home,
  Shield,
  BarChart3,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface Habitacion {
  id: number;
  nombre: string;
  metrosCuadrados: number;
  inquilinos: number;
}

export default function ColivingPage() {
  // Habitaciones y suministros
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([
    { id: 1, nombre: 'Habitación 1', metrosCuadrados: 15, inquilinos: 1 },
    { id: 2, nombre: 'Habitación 2', metrosCuadrados: 18, inquilinos: 1 },
    { id: 3, nombre: 'Habitación 3', metrosCuadrados: 12, inquilinos: 1 },
    { id: 4, nombre: 'Habitación 4', metrosCuadrados: 20, inquilinos: 2 },
  ]);

  // Gastos comunes
  const [gastosComunes, setGastosComunes] = useState({
    luz: 120,
    agua: 50,
    gas: 40,
    internet: 45,
    limpieza: 80,
  });

  // Método de prorrateo
  const [metodoProrrateo, setMetodoProrrateo] = useState<
    'igual' | 'metrosCuadrados' | 'inquilinos'
  >('metrosCuadrados');

  // Resultados
  const [prorrateo, setProrrateo] = useState<
    Record<number, { total: number; desglose: Record<string, number> }>
  >({});

  useEffect(() => {
    calcularProrrateo();
  }, [habitaciones, gastosComunes, metodoProrrateo]);

  const calcularProrrateo = () => {
    const totalGastos = Object.values(gastosComunes).reduce((sum, val) => sum + val, 0);
    const totalMetrosCuadrados = habitaciones.reduce((sum, h) => sum + h.metrosCuadrados, 0);
    const totalInquilinos = habitaciones.reduce((sum, h) => sum + h.inquilinos, 0);
    const numHabitaciones = habitaciones.length;

    const nuevoProrrateo: Record<number, { total: number; desglose: Record<string, number> }> = {};

    habitaciones.forEach((habitacion) => {
      let factor = 0;

      if (metodoProrrateo === 'igual') {
        factor = 1 / numHabitaciones;
      } else if (metodoProrrateo === 'metrosCuadrados') {
        factor = habitacion.metrosCuadrados / totalMetrosCuadrados;
      } else if (metodoProrrateo === 'inquilinos') {
        factor = habitacion.inquilinos / totalInquilinos;
      }

      const desglose: Record<string, number> = {};
      Object.entries(gastosComunes).forEach(([key, value]) => {
        desglose[key] = value * factor;
      });

      nuevoProrrateo[habitacion.id] = {
        total: totalGastos * factor,
        desglose,
      };
    });

    setProrrateo(nuevoProrrateo);
  };

  const actualizarHabitacion = (id: number, field: keyof Habitacion, value: string | number) => {
    setHabitaciones((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, [field]: typeof value === 'string' ? value : Number(value) } : h
      )
    );
  };

  const agregarHabitacion = () => {
    const nuevoId = Math.max(...habitaciones.map((h) => h.id), 0) + 1;
    setHabitaciones((prev) => [
      ...prev,
      {
        id: nuevoId,
        nombre: `Habitación ${nuevoId}`,
        metrosCuadrados: 15,
        inquilinos: 1,
      },
    ]);
  };

  const eliminarHabitacion = (id: number) => {
    if (habitaciones.length > 1) {
      setHabitaciones((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const getNombreSupply = (key: string) => {
    const nombres: Record<string, string> = {
      luz: 'Electricidad',
      agua: 'Agua',
      gas: 'Gas',
      internet: 'Internet',
      limpieza: 'Limpieza',
    };
    return nombres[key] || key;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 w-full bg-white backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-cyan-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/landing/campanas/launch2025">
                <Button
                  variant="outline"
                  className="border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                >
                  Ver Oferta LAUNCH2025
                </Button>
              </Link>
              <Link href="/register?coupon=COLIVING50">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
                  Probar con COLIVING50
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 text-sm px-4 py-1">
            <Users className="h-4 w-4 mr-2" />
            Módulo Coliving Avanzado
          </Badge>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Gestiona Tu Coliving
            <br />
            con Prorrateo Automático
          </h1>

          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Divide suministros de forma <strong>justa y transparente</strong>. Olvídate de
            discusiones por facturas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?coupon=COLIVING50">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-lg h-14 px-8"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Probar Gratis con COLIVING50
              </Button>
            </Link>
            <Link href="/landing/demo?module=coliving">
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 text-lg h-14 px-8"
              >
                Ver Demo en Vivo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CALCULADORA PRORRATEO */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <Calculator className="inline h-10 w-10 mr-3 text-cyan-600" />
              Calculadora de Prorrateo de Suministros
            </h2>
            <p className="text-xl text-gray-600">
              Reparte los gastos comunes de forma equitativa según el criterio que elijas.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
            <div className="space-y-6">
              {/* Método de Prorrateo */}
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Método de Prorrateo</CardTitle>
                  <CardDescription>
                    Elige cómo dividir los gastos entre habitaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div
                    onClick={() => setMetodoProrrateo('igual')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      metodoProrrateo === 'igual'
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          metodoProrrateo === 'igual' ? 'border-cyan-600' : 'border-gray-300'
                        }`}
                      >
                        {metodoProrrateo === 'igual' && (
                          <div className="h-2 w-2 rounded-full bg-cyan-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">A Partes Iguales</p>
                        <p className="text-sm text-gray-600">Cada habitación paga lo mismo</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setMetodoProrrateo('metrosCuadrados')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      metodoProrrateo === 'metrosCuadrados'
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          metodoProrrateo === 'metrosCuadrados'
                            ? 'border-cyan-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {metodoProrrateo === 'metrosCuadrados' && (
                          <div className="h-2 w-2 rounded-full bg-cyan-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Por Metros Cuadrados</p>
                        <p className="text-sm text-gray-600">
                          Proporcional al tamaño de la habitación
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setMetodoProrrateo('inquilinos')}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      metodoProrrateo === 'inquilinos'
                        ? 'border-cyan-600 bg-cyan-50'
                        : 'border-gray-200 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          metodoProrrateo === 'inquilinos' ? 'border-cyan-600' : 'border-gray-300'
                        }`}
                      >
                        {metodoProrrateo === 'inquilinos' && (
                          <div className="h-2 w-2 rounded-full bg-cyan-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Por Número de Inquilinos</p>
                        <p className="text-sm text-gray-600">
                          Según cuántas personas hay en cada habitación
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gastos Comunes */}
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Euro className="h-5 w-5 text-cyan-600" />
                    Gastos Comunes del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Electricidad (€)
                    </Label>
                    <Input
                      type="number"
                      value={gastosComunes.luz}
                      onChange={(e) =>
                        setGastosComunes((prev) => ({ ...prev, luz: Number(e.target.value) }))
                      }
                      className="text-base"
                      step="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-600" />
                      Agua (€)
                    </Label>
                    <Input
                      type="number"
                      value={gastosComunes.agua}
                      onChange={(e) =>
                        setGastosComunes((prev) => ({ ...prev, agua: Number(e.target.value) }))
                      }
                      className="text-base"
                      step="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Home className="h-4 w-4 text-orange-600" />
                      Gas (€)
                    </Label>
                    <Input
                      type="number"
                      value={gastosComunes.gas}
                      onChange={(e) =>
                        setGastosComunes((prev) => ({ ...prev, gas: Number(e.target.value) }))
                      }
                      className="text-base"
                      step="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-indigo-600" />
                      Internet (€)
                    </Label>
                    <Input
                      type="number"
                      value={gastosComunes.internet}
                      onChange={(e) =>
                        setGastosComunes((prev) => ({ ...prev, internet: Number(e.target.value) }))
                      }
                      className="text-base"
                      step="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      Limpieza común (€)
                    </Label>
                    <Input
                      type="number"
                      value={gastosComunes.limpieza}
                      onChange={(e) =>
                        setGastosComunes((prev) => ({ ...prev, limpieza: Number(e.target.value) }))
                      }
                      className="text-base"
                      step="10"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total Mensual:</span>
                      <span className="text-2xl font-bold text-cyan-600">
                        €
                        {Object.values(gastosComunes)
                          .reduce((sum, val) => sum + val, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Habitaciones */}
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Habitaciones</CardTitle>
                    <Button
                      size="sm"
                      onClick={agregarHabitacion}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      + Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {habitaciones.map((habitacion) => (
                    <div key={habitacion.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={habitacion.nombre}
                          onChange={(e) =>
                            actualizarHabitacion(habitacion.id, 'nombre', e.target.value)
                          }
                          className="font-semibold max-w-xs"
                        />
                        {habitaciones.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => eliminarHabitacion(habitacion.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">Metros Cuadrados</Label>
                          <Input
                            type="number"
                            value={habitacion.metrosCuadrados}
                            onChange={(e) =>
                              actualizarHabitacion(habitacion.id, 'metrosCuadrados', e.target.value)
                            }
                            className="text-sm"
                            min="1"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">Inquilinos</Label>
                          <Input
                            type="number"
                            value={habitacion.inquilinos}
                            onChange={(e) =>
                              actualizarHabitacion(habitacion.id, 'inquilinos', e.target.value)
                            }
                            className="text-sm"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* PANEL DERECHO: RESULTADOS */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-cyan-600 to-blue-600 border-0 shadow-2xl text-white sticky top-20">
                <CardHeader>
                  <CardTitle className="text-2xl">Reparto de Gastos</CardTitle>
                  <CardDescription className="text-cyan-100">
                    {metodoProrrateo === 'igual' && 'Dividido a partes iguales'}
                    {metodoProrrateo === 'metrosCuadrados' && 'Proporcional a metros cuadrados'}
                    {metodoProrrateo === 'inquilinos' && 'Proporcional al número de inquilinos'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {habitaciones.map((habitacion) => (
                    <Card
                      key={habitacion.id}
                      className="bg-white/10 backdrop-blur-sm border-white/20"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-white flex items-center justify-between">
                          <span>{habitacion.nombre}</span>
                          <Badge className="bg-yellow-400 text-gray-900 border-0">
                            €{prorrateo[habitacion.id]?.total.toFixed(2) || '0.00'}
                          </Badge>
                        </CardTitle>
                        <p className="text-xs text-cyan-200">
                          {habitacion.metrosCuadrados}m² • {habitacion.inquilinos} inquilino
                          {habitacion.inquilinos > 1 ? 's' : ''}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {prorrateo[habitacion.id] &&
                          Object.entries(prorrateo[habitacion.id].desglose).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center text-sm">
                              <span className="text-cyan-100">{getNombreSupply(key)}:</span>
                              <span className="font-semibold text-white">€{value.toFixed(2)}</span>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS ADICIONALES */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Más Allá del Prorrateo de Suministros
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-3">
                  <FileText className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Normas de Convivencia Digitales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Publica y gestiona normas de convivencia que todos los inquilinos aceptan
                  digitalmente al entrar.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-3">
                  <Clock className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Rotación de Limpieza</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Turnos automáticos de limpieza de zonas comunes con notificaciones a cada
                  inquilino.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-3">
                  <BarChart3 className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Dashboard de Ocupación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Ve en tiempo real qué habitaciones están ocupadas, vacías o en tránsito.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-3">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Contratos Individuales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Cada inquilino tiene su propio contrato digital con firma electrónica.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-3">
                  <Shield className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Depósitos Individualizados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gestiona fianzas independientes por habitación con devolución automática.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="bg-cyan-100 rounded-lg p-3 w-fit mb-3">
                  <TrendingUp className="h-6 w-6 text-cyan-600" />
                </div>
                <CardTitle className="text-lg">Rentabilidad por Habitación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Análisis de qué habitaciones generan más ingresos y cuáles tienen más rotación.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TESTIMONIO */}
      <section className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-blue-50">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-white shadow-xl">
            <CardContent className="pt-8 text-center">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xl text-gray-700 italic mb-6">
                "Gestiono un coliving de 8 habitaciones. Antes pasaba horas dividiendo facturas en
                Excel y siempre había discusiones. Con INMOVA, el prorrateo es automático y cada
                inquilino ve su desglose desde su portal. Cero conflictos."
              </p>
              <p className="font-semibold text-gray-900 text-lg">
                Mónica S. - Propietaria de Coliving, Valencia
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* OFERTA ESPECIAL COLIVING */}
      <section className="py-20 px-4 bg-gradient-to-br from-cyan-600 to-blue-600">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-yellow-400 text-gray-900 border-0 text-lg px-6 py-2">
            <Sparkles className="h-5 w-5 mr-2" />
            Oferta Especial Coliving
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Descuento COLIVING50</h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            Si gestionas colivings,{' '}
            <strong className="text-white">obtienes 50% de descuento adicional</strong> en tu
            suscripción anual de INMOVA.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto mb-8">
            <p className="text-cyan-100 mb-2">Código Exclusivo:</p>
            <p className="text-5xl font-black text-yellow-300 mb-2">COLIVING50</p>
            <p className="text-sm text-cyan-200">Válido para planes anuales</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?coupon=COLIVING50">
              <Button
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold text-lg h-16 px-10"
              >
                <ArrowRight className="mr-2 h-6 w-6" />
                Activar COLIVING50 Ahora
              </Button>
            </Link>
            <Link href="/landing/demo">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-lg h-16 px-10"
              >
                Ver Demo del Módulo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-slate-900 border-t border-gray-800">
        <div className="container mx-auto text-center">
          <Link href="/landing" className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6 text-cyan-400" />
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

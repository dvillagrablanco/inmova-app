'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  TrendingUp,
  Calendar,
  Users,
  Home,
  Wrench,
  DollarSign,
  Percent,
  Award,
  Clock,
  MapPin,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getModeloFromUserPreferences } from '@/lib/onboarding-configs';

interface VerticalSpecificWidgetsProps {
  className?: string;
}

export function VerticalSpecificWidgets({ className }: VerticalSpecificWidgetsProps) {
  const { data: session } = useSession() || {};

  if (!session?.user) return null;

  const modelo = getModeloFromUserPreferences(session.user);

  return (
    <div className={className}>
      {modelo === 'alquiler_tradicional' && <AlquilerTradicionalWidgets />}
      {modelo === 'str' && <STRWidgets />}
      {modelo === 'room_rental' && <ColivingWidgets />}
      {modelo === 'flipping' && <FlippingWidgets />}
      {modelo === 'construccion' && <ConstruccionWidgets />}
      {modelo === 'profesional' && <ProfesionalWidgets />}
      {modelo === 'comunidades' && <ComunidadesWidgets />}
    </div>
  );
}

function AlquilerTradicionalWidgets() {
  return (
    <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg">Alquiler Tradicional</CardTitle>
        </div>
        <CardDescription>Gestiona tus propiedades residenciales y comerciales</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/contratos">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-indigo-50 hover:border-indigo-300"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Contratos activos</span>
            </Button>
          </Link>
          <Link href="/inquilinos">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-indigo-50 hover:border-indigo-300"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Inquilinos</span>
            </Button>
          </Link>
          <Link href="/pagos">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-indigo-50 hover:border-indigo-300"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Cobros recurrentes</span>
            </Button>
          </Link>
          <Link href="/unidades?filter=disponibles">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-indigo-50 hover:border-indigo-300"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Unidades disponibles</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function STRWidgets() {
  return (
    <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Short-Term Rentals</CardTitle>
        </div>
        <CardDescription>Channel Manager para Airbnb, Booking y más</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-600">RevPAR</span>
              </div>
              <p className="text-lg font-bold">€75.50</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600">Ocupación</span>
              </div>
              <p className="text-lg font-bold">82%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/str/channels">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-purple-50"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Canales conectados</span>
              </Button>
            </Link>
            <Link href="/str/calendar">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-purple-50"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Calendario unificado</span>
              </Button>
            </Link>
            <Link href="/str/pricing">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-purple-50"
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Pricing dinámico</span>
              </Button>
            </Link>
            <Link href="/str/reviews">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-purple-50"
              >
                <Star className="h-4 w-4" />
                <span className="text-xs">Reseñas</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ColivingWidgets() {
  return (
    <Card className="border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-pink-600" />
          <CardTitle className="text-lg">Coliving / Room Rental</CardTitle>
        </div>
        <CardDescription>Gestión de habitaciones compartidas y convivencia</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/room-rental">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-pink-50 hover:border-pink-300"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Habitaciones</span>
            </Button>
          </Link>
          <Link href="/room-rental?tab=expenses">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-pink-50 hover:border-pink-300"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Gastos compartidos</span>
            </Button>
          </Link>
          <Link href="/room-rental?tab=rules">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-pink-50 hover:border-pink-300"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Normas convivencia</span>
            </Button>
          </Link>
          <Link href="/inquilinos">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-pink-50 hover:border-pink-300"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Compañeros</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FlippingWidgets() {
  return (
    <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Inversión Inmobiliaria</CardTitle>
        </div>
        <CardDescription>Proyectos de compra-reforma-venta (Flipping)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600">ROI Proy.</span>
              </div>
              <p className="text-lg font-bold text-green-600">+24%</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium text-gray-600">Días</span>
              </div>
              <p className="text-lg font-bold">45/180</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/flipping">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-green-50"
              >
                <Building2 className="h-4 w-4" />
                <span className="text-xs">Proyectos activos</span>
              </Button>
            </Link>
            <Link href="/flipping?tab=budget">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-green-50"
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Presupuestos</span>
              </Button>
            </Link>
            <Link href="/flipping?tab=timeline">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-green-50"
              >
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Timeline</span>
              </Button>
            </Link>
            <Link href="/flipping?tab=roi">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-green-50"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Análisis ROI</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConstruccionWidgets() {
  return (
    <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg">Construcción y Promoción</CardTitle>
        </div>
        <CardDescription>Gestión de obras, permisos y fases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/construction">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-orange-50 hover:border-orange-300"
            >
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Proyectos</span>
            </Button>
          </Link>
          <Link href="/construction?tab=permits">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-orange-50 hover:border-orange-300"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Permisos</span>
            </Button>
          </Link>
          <Link href="/construction?tab=phases">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-orange-50 hover:border-orange-300"
            >
              <Clock className="h-4 w-4" />
              <span className="text-sm">Fases obra</span>
            </Button>
          </Link>
          <Link href="/construction?tab=agents">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-orange-50 hover:border-orange-300"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Agentes</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfesionalWidgets() {
  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Servicios Profesionales</CardTitle>
        </div>
        <CardDescription>Facturación por horas y gestión de proyectos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600">Horas mes</span>
              </div>
              <p className="text-lg font-bold">142h</p>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600">Facturado</span>
              </div>
              <p className="text-lg font-bold">€8,520</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/professional">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-blue-50"
              >
                <Building2 className="h-4 w-4" />
                <span className="text-xs">Proyectos</span>
              </Button>
            </Link>
            <Link href="/professional?tab=timer">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-blue-50"
              >
                <Clock className="h-4 w-4" />
                <span className="text-xs">Time tracking</span>
              </Button>
            </Link>
            <Link href="/professional?tab=billing">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-blue-50"
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Facturación</span>
              </Button>
            </Link>
            <Link href="/professional?tab=clients">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 hover:bg-blue-50"
              >
                <Users className="h-4 w-4" />
                <span className="text-xs">Clientes</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComunidadesWidgets() {
  return (
    <Card className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-teal-600" />
          <CardTitle className="text-lg">Gestión de Comunidades</CardTitle>
        </div>
        <CardDescription>Administración de fincas y copropietarios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/comunidad">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-teal-50 hover:border-teal-300"
            >
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Comunidades</span>
            </Button>
          </Link>
          <Link href="/reuniones">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-teal-50 hover:border-teal-300"
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Juntas</span>
            </Button>
          </Link>
          <Link href="/votaciones">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-teal-50 hover:border-teal-300"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm">Votaciones</span>
            </Button>
          </Link>
          <Link href="/comunidad?tab=derramas">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 hover:bg-teal-50 hover:border-teal-300"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Derramas</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

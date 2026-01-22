'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CreditCard,
  Check,
  Star,
  Zap,
  Crown,
  ArrowRight,
  Calendar,
} from 'lucide-react';

interface Plan {
  id: string;
  nombre: string;
  precio: number;
  intervalo: 'mensual' | 'anual';
  caracteristicas: string[];
  popular?: boolean;
  actual?: boolean;
}

const PLANES: Plan[] = [
  {
    id: 'starter',
    nombre: 'Starter',
    precio: 29,
    intervalo: 'mensual',
    caracteristicas: [
      'Hasta 10 propiedades',
      'Gestión de inquilinos',
      'Contratos básicos',
      'Soporte por email',
    ],
  },
  {
    id: 'professional',
    nombre: 'Professional',
    precio: 79,
    intervalo: 'mensual',
    caracteristicas: [
      'Hasta 50 propiedades',
      'Todo de Starter',
      'CRM integrado',
      'Automatizaciones',
      'Informes avanzados',
      'Soporte prioritario',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precio: 199,
    intervalo: 'mensual',
    caracteristicas: [
      'Propiedades ilimitadas',
      'Todo de Professional',
      'API access',
      'White-label',
      'Manager dedicado',
      'SLA garantizado',
    ],
  },
];

export default function SuscripcionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [planActual, setPlanActual] = useState<string>('starter');
  const [intervalo, setIntervalo] = useState<'mensual' | 'anual'>('mensual');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchSuscripcion();
    }
  }, [status, router]);

  const fetchSuscripcion = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        if (data.planId) {
          setPlanActual(data.planId);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarPlan = async (planId: string) => {
    toast.info('Redirigiendo a checkout...');
    // En producción, integrar con Stripe
    router.push(`/pagos/checkout?plan=${planId}`);
  };

  const getPrecioConDescuento = (precio: number) => {
    if (intervalo === 'anual') {
      return Math.round(precio * 10); // 2 meses gratis
    }
    return precio;
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Planes y Suscripciones</h1>
          <p className="text-muted-foreground mt-2">Elige el plan que mejor se adapte a tu negocio</p>
        </div>

        {/* Toggle Mensual/Anual */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={intervalo === 'mensual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIntervalo('mensual')}
            >
              Mensual
            </Button>
            <Button
              variant={intervalo === 'anual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIntervalo('anual')}
            >
              Anual
              <Badge className="ml-2 bg-green-500">-17%</Badge>
            </Button>
          </div>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map((plan) => {
            const esActual = plan.id === planActual;
            const precio = getPrecioConDescuento(plan.precio);

            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-indigo-500 border-2' : ''} ${esActual ? 'bg-indigo-50' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-indigo-500">
                      <Star className="mr-1 h-3 w-3" />
                      Más Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pt-8">
                  <div className="mx-auto mb-4">
                    {plan.id === 'starter' && <Zap className="h-10 w-10 text-blue-500" />}
                    {plan.id === 'professional' && <Star className="h-10 w-10 text-indigo-500" />}
                    {plan.id === 'enterprise' && <Crown className="h-10 w-10 text-amber-500" />}
                  </div>
                  <CardTitle>{plan.nombre}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{precio}€</span>
                    <span className="text-muted-foreground">/{intervalo === 'anual' ? 'año' : 'mes'}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.caracteristicas.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={esActual ? 'outline' : plan.popular ? 'default' : 'outline'}
                    disabled={esActual}
                    onClick={() => cambiarPlan(plan.id)}
                  >
                    {esActual ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Plan Actual
                      </>
                    ) : (
                      <>
                        Seleccionar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info adicional */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium">Pago seguro con Stripe</p>
                  <p className="text-sm text-muted-foreground">
                    Cancela en cualquier momento. Sin compromisos.
                  </p>
                </div>
              </div>
              <Button variant="link" onClick={() => router.push('/ayuda/facturacion')}>
                Ver FAQ de facturación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

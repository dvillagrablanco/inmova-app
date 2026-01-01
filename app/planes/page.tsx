'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  Crown, 
  Building2,
  Users,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  nombre: string;
  descripcion: string | null;
  tier: string;
  precioMensual: number;
  maxUsuarios: number | null;
  maxPropiedades: number | null;
  modulosIncluidos: string[];
  activo: boolean;
  features?: string[];
  popular?: boolean;
  recommended?: boolean;
}

export default function PlanesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    try {
      const response = await fetch('/api/public/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlanes(data);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'basico':
        return <Building2 className="w-6 h-6" />;
      case 'profesional':
        return <Zap className="w-6 h-6" />;
      case 'empresarial':
        return <Sparkles className="w-6 h-6" />;
      case 'premium':
        return <Crown className="w-6 h-6" />;
      default:
        return <Building2 className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basico':
        return 'from-slate-500 to-slate-600';
      case 'profesional':
        return 'from-blue-500 to-blue-600';
      case 'empresarial':
        return 'from-violet-500 to-purple-600';
      case 'premium':
        return 'from-amber-500 to-orange-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (session) {
      // Usuario autenticado - redirigir a upgrade/change plan
      router.push(`/configuracion?tab=plan&selected=${plan.id}`);
    } else {
      // Usuario no autenticado - redirigir a registro con plan preseleccionado
      router.push(`/register?plan=${plan.id}`);
    }
  };

  const getFeaturesList = (plan: Plan): string[] => {
    const baseFeatures = [
      plan.maxPropiedades ? `Hasta ${plan.maxPropiedades} propiedades` : 'Propiedades ilimitadas',
      plan.maxUsuarios ? `Hasta ${plan.maxUsuarios} usuarios` : 'Usuarios ilimitados',
      ...plan.modulosIncluidos
    ];

    // Features adicionales según tier
    const additionalFeatures: Record<string, string[]> = {
      basico: [
        'Dashboard básico',
        'Portal inquilino web',
        'Soporte por email',
        'App móvil'
      ],
      profesional: [
        'Todo lo de Basic',
        'CRM con pipeline',
        'Automatizaciones',
        'Soporte prioritario',
        'Integraciones',
        '1 módulo add-on gratis'
      ],
      empresarial: [
        'Todo lo de Professional',
        'Multi-empresa',
        'Workflows custom',
        'Soporte 24/7',
        'Account manager',
        '3 módulos add-on incluidos'
      ],
      premium: [
        'Todo lo de Business',
        'Desarrollo a medida',
        'White-label',
        'SLA 99.9%',
        'Infraestructura dedicada',
        'Todos los add-ons',
        'Consultoría estratégica'
      ]
    };

    return [...baseFeatures, ...(additionalFeatures[plan.tier] || [])];
  };

  const getAnnualPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.85); // 15% descuento anual
  };

  const getPrice = (plan: Plan) => {
    if (billingPeriod === 'annual') {
      return {
        price: getAnnualPrice(plan.precioMensual),
        period: '/año',
        savings: Math.round(plan.precioMensual * 12 * 0.15)
      };
    }
    return {
      price: plan.precioMensual,
      period: '/mes',
      savings: 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Marcar Professional como popular
  const planesWithFlags = planes.map(plan => ({
    ...plan,
    popular: plan.tier === 'profesional',
    recommended: plan.tier === 'empresarial'
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Elige el plan perfecto para tu negocio inmobiliario. Sin permanencia, cancela cuando quieras.
          </p>

          {/* Toggle Mensual/Anual */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-6 py-2 rounded-full font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'px-6 py-2 rounded-full font-medium transition-all relative',
                billingPeriod === 'annual'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Anual
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                Ahorra 15%
              </Badge>
            </button>
          </div>
        </div>

        {/* Planes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {planesWithFlags.map((plan) => {
            const pricing = getPrice(plan);
            const features = getFeaturesList(plan);

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative overflow-hidden transition-all hover:shadow-2xl',
                  plan.recommended && 'ring-2 ring-violet-500 scale-105 z-10',
                  plan.popular && 'ring-2 ring-blue-500'
                )}
              >
                {/* Badge Popular/Recomendado */}
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-500 text-white">
                      Más Popular
                    </Badge>
                  </div>
                )}
                {plan.recommended && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-violet-500 text-white">
                      Recomendado
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  {/* Icono del tier */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                    'bg-gradient-to-br text-white',
                    getTierColor(plan.tier)
                  )}>
                    {getTierIcon(plan.tier)}
                  </div>

                  <CardTitle className="text-2xl">{plan.nombre}</CardTitle>
                  <CardDescription className="text-sm min-h-[60px]">
                    {plan.descripcion}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Precio */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        €{pricing.price}
                      </span>
                      <span className="text-gray-500">{pricing.period}</span>
                    </div>
                    {billingPeriod === 'annual' && pricing.savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Ahorras €{pricing.savings} al año
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={cn(
                      'w-full',
                      plan.recommended || plan.popular
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                        : ''
                    )}
                    size="lg"
                  >
                    {session ? 'Cambiar a este plan' : 'Empezar ahora'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ o Garantías */}
        <div className="mt-16 text-center max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-4">¿Tienes dudas?</h3>
            <p className="text-gray-600 mb-6">
              Todos nuestros planes incluyen garantía de 14 días. Si no estás satisfecho, te devolvemos tu dinero.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">Sin permanencia</p>
                <p className="text-sm text-gray-600">Cancela cuando quieras</p>
              </div>
              <div>
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">Migración gratis</p>
                <p className="text-sm text-gray-600">Te ayudamos a importar tus datos</p>
              </div>
              <div>
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold">Soporte incluido</p>
                <p className="text-sm text-gray-600">En todos los planes</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            ¿Necesitas un plan enterprise con características a medida?
          </p>
          <Button variant="outline" size="lg" onClick={() => router.push('/contacto')}>
            Contáctanos
          </Button>
        </div>
      </div>
    </div>
  );
}

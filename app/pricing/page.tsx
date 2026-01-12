'use client';

/**
 * Página de Planes y Precios
 * 
 * Muestra los planes disponibles con comparativa de features.
 * Permite al usuario ver qué obtiene con cada plan y hacer upgrade.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, X, Star, Sparkles, ArrowRight, Building2, Users, HardDrive, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanAccess } from '@/lib/hooks/usePlanAccess';
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionPlanId, 
  CLIENT_PROFILES,
  ClientProfile,
} from '@/lib/subscription-plans-config';
import { cn } from '@/lib/utils';

const PLAN_ORDER: SubscriptionPlanId[] = ['free', 'starter', 'basic', 'professional', 'business', 'enterprise'];

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentPlan } = usePlanAccess();
  
  const [isYearly, setIsYearly] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<ClientProfile | null>(null);
  
  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    if (!session) {
      router.push(`/register?plan=${planId}`);
      return;
    }
    
    if (planId === currentPlan) {
      return;
    }
    
    // Redirigir a checkout o upgrade
    router.push(`/checkout?plan=${planId}&billing=${isYearly ? 'yearly' : 'monthly'}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Planes flexibles
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            El plan perfecto para tu negocio inmobiliario
          </h1>
          <p className="text-xl text-muted-foreground">
            Desde propietarios individuales hasta grandes fondos de inversión.
            Elige el plan que mejor se adapte a tus necesidades.
          </p>
        </div>
        
        {/* Toggle Mensual/Anual */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label htmlFor="billing" className={cn(!isYearly && "font-semibold")}>
            Mensual
          </Label>
          <Switch
            id="billing"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing" className={cn(isYearly && "font-semibold")}>
            Anual
            <Badge variant="secondary" className="ml-2 text-xs">
              -20%
            </Badge>
          </Label>
        </div>
        
        {/* Selector de Perfil (opcional) */}
        <div className="mb-8">
          <p className="text-center text-sm text-muted-foreground mb-4">
            ¿No sabes qué plan elegir? Cuéntanos sobre tu negocio:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(CLIENT_PROFILES).slice(0, 5).map(([key, profile]) => (
              <Button
                key={key}
                variant={selectedProfile === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProfile(key as ClientProfile)}
              >
                {profile.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProfile(null)}
            >
              Ver todos
            </Button>
          </div>
          
          {selectedProfile && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg text-center max-w-2xl mx-auto">
              <p className="text-sm">
                <strong>Recomendación:</strong>{' '}
                Para {CLIENT_PROFILES[selectedProfile].name.toLowerCase()}, recomendamos el plan{' '}
                <strong>
                  {SUBSCRIPTION_PLANS[CLIENT_PROFILES[selectedProfile].recommendedPlans[0]].name}
                </strong>
              </p>
            </div>
          )}
        </div>
        
        {/* Grid de Planes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PLAN_ORDER.filter(p => p !== 'free').map((planId) => {
            const plan = SUBSCRIPTION_PLANS[planId];
            const isCurrentPlan = currentPlan === planId;
            const isRecommended = selectedProfile && 
              CLIENT_PROFILES[selectedProfile].recommendedPlans.includes(planId);
            
            return (
              <Card 
                key={planId}
                className={cn(
                  "relative flex flex-col",
                  plan.highlighted && "border-primary shadow-lg scale-105 z-10",
                  isRecommended && "ring-2 ring-primary"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      Más popular
                    </Badge>
                  </div>
                )}
                
                {isRecommended && !plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">
                      Recomendado
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrentPlan && (
                      <Badge variant="outline">Tu plan</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  {/* Precio */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">
                        {isYearly 
                          ? Math.round(plan.priceYearly / 12)
                          : plan.priceMonthly}€
                      </span>
                      <span className="text-muted-foreground ml-1">/mes</span>
                    </div>
                    {isYearly && plan.priceMonthly > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Facturado anualmente ({plan.priceYearly}€/año)
                      </p>
                    )}
                  </div>
                  
                  {/* Límites */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {plan.limits.maxProperties === -1 
                          ? 'Propiedades ilimitadas'
                          : `Hasta ${plan.limits.maxProperties} propiedades`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {plan.limits.maxUsers === -1 
                          ? 'Usuarios ilimitados'
                          : `Hasta ${plan.limits.maxUsers} usuarios`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {plan.limits.maxDocuments === -1 
                          ? 'Almacenamiento ilimitado'
                          : `${plan.limits.maxDocuments} GB almacenamiento`}
                      </span>
                    </div>
                    {plan.features.apiAccess && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {plan.limits.apiCallsPerMonth === -1 
                            ? 'API ilimitada'
                            : `${(plan.limits.apiCallsPerMonth / 1000).toFixed(0)}K llamadas API/mes`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Features destacadas */}
                  <div className="space-y-2">
                    <FeatureItem 
                      included={plan.features.portalInquilino}
                      label="Portal de inquilino"
                    />
                    <FeatureItem 
                      included={plan.features.portalPropietario}
                      label="Portal de propietario"
                    />
                    <FeatureItem 
                      included={plan.features.firmaDigital}
                      label="Firma digital"
                    />
                    <FeatureItem 
                      included={plan.features.reportesAvanzados}
                      label="Reportes avanzados"
                    />
                    <FeatureItem 
                      included={plan.features.apiAccess}
                      label="Acceso API"
                    />
                    <FeatureItem 
                      included={plan.features.multiEmpresa}
                      label="Multi-empresa"
                    />
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(planId)}
                  >
                    {isCurrentPlan ? (
                      'Plan actual'
                    ) : (
                      <>
                        Elegir {plan.name}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        {/* Enterprise CTA */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2">
                ¿Necesitas más?
              </h3>
              <p className="text-muted-foreground mb-4">
                Para grandes carteras, SOCIMIs o necesidades especiales,
                contacta con nuestro equipo de ventas.
              </p>
              <Button onClick={() => router.push('/contacto/enterprise')}>
                Contactar ventas
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Preguntas frecuentes
          </h2>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="facturacion">Facturación</TabsTrigger>
              <TabsTrigger value="caracteristicas">Características</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <FAQItem 
                question="¿Puedo cambiar de plan en cualquier momento?"
                answer="Sí, puedes subir o bajar de plan cuando quieras. Si subes, se aplicará un prorrateo. Si bajas, el cambio se aplicará al siguiente período de facturación."
              />
              <FAQItem 
                question="¿Hay período de prueba?"
                answer="Ofrecemos 14 días de prueba gratuita del plan Professional para que puedas probar todas las funcionalidades antes de decidir."
              />
              <FAQItem 
                question="¿Puedo cancelar mi suscripción?"
                answer="Sí, puedes cancelar en cualquier momento. Tendrás acceso hasta el final del período pagado."
              />
            </TabsContent>
            
            <TabsContent value="facturacion" className="space-y-4 mt-4">
              <FAQItem 
                question="¿Qué métodos de pago aceptan?"
                answer="Aceptamos tarjetas de crédito/débito (Visa, Mastercard, Amex) y transferencia bancaria para planes anuales."
              />
              <FAQItem 
                question="¿Emiten factura?"
                answer="Sí, emitimos factura con IVA desglosado. Recibirás la factura automáticamente por email."
              />
              <FAQItem 
                question="¿Hay descuento por pago anual?"
                answer="Sí, el pago anual tiene un 20% de descuento sobre el precio mensual."
              />
            </TabsContent>
            
            <TabsContent value="caracteristicas" className="space-y-4 mt-4">
              <FAQItem 
                question="¿Qué incluye el portal de inquilino?"
                answer="El portal de inquilino permite a tus inquilinos ver su contrato, pagar online, reportar incidencias y comunicarse contigo."
              />
              <FAQItem 
                question="¿Puedo integrar con mi software de contabilidad?"
                answer="Sí, ofrecemos integraciones con Contasimple, Holded, Alegra y otros. También tenemos API para integraciones personalizadas."
              />
              <FAQItem 
                question="¿Incluye soporte técnico?"
                answer="Todos los planes incluyen soporte por email. Los planes Professional y superiores incluyen soporte prioritario por chat."
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ included, label }: { included: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
      )}
      <span className={cn(!included && "text-muted-foreground/50")}>
        {label}
      </span>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-2">{question}</h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}

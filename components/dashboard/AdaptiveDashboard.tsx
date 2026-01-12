'use client';

/**
 * Dashboard Adaptativo
 * 
 * Muestra widgets y contenido personalizado según:
 * - Perfil de cliente (propietario, gestor, etc.)
 * - Plan de suscripción
 * - Nivel de experiencia
 * - Rol del usuario
 */

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Calendar,
  Bell,
  ArrowRight,
  Plus,
  Euro,
  Home,
  Wrench,
  BarChart2,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlanAccess } from '@/lib/hooks/usePlanAccess';
import { 
  CLIENT_PROFILES, 
  ClientProfile,
  SUBSCRIPTION_PLANS,
} from '@/lib/subscription-plans-config';
import { USER_PROFILES, getDashboardWidgets, needsExtraHelp } from '@/lib/user-profiles-config';
import { OnboardingProgressWidget } from '@/components/onboarding/PersonalizedOnboarding';
import { cn } from '@/lib/utils';

// Tipos de widgets disponibles
type WidgetType = 
  | 'properties_overview'
  | 'financial_kpis'
  | 'recent_payments'
  | 'pending_tasks'
  | 'occupancy_rate'
  | 'maintenance_alerts'
  | 'contracts_expiring'
  | 'quick_actions'
  | 'onboarding_progress'
  | 'upgrade_prompt'
  | 'help_resources';

interface DashboardConfig {
  widgets: WidgetType[];
  layout: 'simple' | 'standard' | 'advanced';
  showTips: boolean;
}

// Configuración de widgets por perfil
const DASHBOARD_BY_PROFILE: Record<ClientProfile, DashboardConfig> = {
  propietario_individual: {
    widgets: ['onboarding_progress', 'properties_overview', 'recent_payments', 'maintenance_alerts', 'quick_actions'],
    layout: 'simple',
    showTips: true,
  },
  inversor_pequeno: {
    widgets: ['financial_kpis', 'occupancy_rate', 'properties_overview', 'contracts_expiring', 'quick_actions'],
    layout: 'standard',
    showTips: true,
  },
  gestor_profesional: {
    widgets: ['financial_kpis', 'pending_tasks', 'properties_overview', 'recent_payments', 'maintenance_alerts'],
    layout: 'advanced',
    showTips: false,
  },
  agencia_inmobiliaria: {
    widgets: ['financial_kpis', 'pending_tasks', 'properties_overview', 'quick_actions'],
    layout: 'standard',
    showTips: false,
  },
  administrador_fincas: {
    widgets: ['pending_tasks', 'maintenance_alerts', 'contracts_expiring', 'quick_actions'],
    layout: 'standard',
    showTips: false,
  },
  promotor_inmobiliario: {
    widgets: ['pending_tasks', 'financial_kpis', 'quick_actions'],
    layout: 'standard',
    showTips: false,
  },
  empresa_coliving: {
    widgets: ['occupancy_rate', 'pending_tasks', 'maintenance_alerts', 'quick_actions'],
    layout: 'standard',
    showTips: false,
  },
  empresa_str: {
    widgets: ['occupancy_rate', 'financial_kpis', 'pending_tasks', 'quick_actions'],
    layout: 'advanced',
    showTips: false,
  },
  fondo_inversion: {
    widgets: ['financial_kpis', 'occupancy_rate', 'properties_overview', 'pending_tasks'],
    layout: 'advanced',
    showTips: false,
  },
};

interface AdaptiveDashboardProps {
  /** Datos del usuario (propiedades, pagos, etc.) */
  data?: {
    totalProperties?: number;
    totalTenants?: number;
    totalContracts?: number;
    pendingPayments?: number;
    monthlyIncome?: number;
    occupancyRate?: number;
    maintenanceAlerts?: number;
    expiringContracts?: number;
  };
}

export function AdaptiveDashboard({ data = {} }: AdaptiveDashboardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { currentPlan, features, limits, hasReachedLimit } = usePlanAccess();
  
  // Obtener perfil del usuario
  const userProfile: ClientProfile = useMemo(() => {
    return (session?.user as any)?.clientProfile || 'propietario_individual';
  }, [session]);
  
  const dashboardConfig = DASHBOARD_BY_PROFILE[userProfile] || DASHBOARD_BY_PROFILE.propietario_individual;
  
  // Verificar si necesita ayuda extra
  const showExtraHelp = needsExtraHelp({
    role: (session?.user as any)?.role || 'gestor',
    experienceLevel: (session?.user as any)?.experienceLevel || 'principiante',
  });
  
  // Verificar si debe mostrar prompt de upgrade
  const showUpgradePrompt = currentPlan === 'free' || currentPlan === 'starter';
  
  return (
    <div className="space-y-6">
      {/* Saludo personalizado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-muted-foreground">
            {getContextualMessage(userProfile, data)}
          </p>
        </div>
        
        {dashboardConfig.showTips && (
          <Button variant="outline" size="sm" onClick={() => router.push('/ayuda')}>
            <HelpCircle className="h-4 w-4 mr-2" />
            ¿Necesitas ayuda?
          </Button>
        )}
      </div>
      
      {/* Grid de Widgets */}
      <div className={cn(
        "grid gap-6",
        dashboardConfig.layout === 'simple' && "grid-cols-1 md:grid-cols-2",
        dashboardConfig.layout === 'standard' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        dashboardConfig.layout === 'advanced' && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      )}>
        {dashboardConfig.widgets.map((widget) => (
          <DashboardWidget 
            key={widget} 
            type={widget} 
            data={data}
            userProfile={userProfile}
            currentPlan={currentPlan}
          />
        ))}
        
        {/* Widget de Upgrade si aplica */}
        {showUpgradePrompt && (
          <UpgradePromptWidget currentPlan={currentPlan} />
        )}
        
        {/* Widget de Ayuda si es principiante */}
        {showExtraHelp && (
          <HelpWidget />
        )}
      </div>
      
      {/* Acciones Rápidas (para layouts simples) */}
      {dashboardConfig.layout === 'simple' && (
        <QuickActionsSection userProfile={userProfile} />
      )}
    </div>
  );
}

// Componente de Widget individual
function DashboardWidget({ 
  type, 
  data,
  userProfile,
  currentPlan,
}: { 
  type: WidgetType; 
  data: any;
  userProfile: ClientProfile;
  currentPlan: string;
}) {
  const router = useRouter();
  
  switch (type) {
    case 'onboarding_progress':
      return <OnboardingProgressWidget />;
      
    case 'properties_overview':
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Propiedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalProperties || 0}</div>
            <p className="text-sm text-muted-foreground">Total propiedades</p>
            <Button 
              variant="link" 
              className="px-0 mt-2"
              onClick={() => router.push('/propiedades')}
            >
              Ver todas <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      );
      
    case 'financial_kpis':
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Ingresos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(data.monthlyIncome || 0).toLocaleString('es-ES')}€
            </div>
            <p className="text-sm text-muted-foreground">
              {data.pendingPayments || 0} pagos pendientes
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2"
              onClick={() => router.push('/pagos')}
            >
              Ver pagos <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      );
      
    case 'occupancy_rate':
      const rate = data.occupancyRate || 0;
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ocupación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rate}%</div>
            <Progress value={rate} className="h-2 mt-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Tasa de ocupación actual
            </p>
          </CardContent>
        </Card>
      );
      
    case 'maintenance_alerts':
      const alerts = data.maintenanceAlerts || 0;
      return (
        <Card className={cn(alerts > 0 && "border-amber-200 bg-amber-50/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{alerts}</div>
            <p className="text-sm text-muted-foreground">
              Incidencias abiertas
            </p>
            {alerts > 0 && (
              <Button 
                variant="link" 
                className="px-0 mt-2"
                onClick={() => router.push('/mantenimiento')}
              >
                Ver incidencias <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      );
      
    case 'quick_actions':
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/propiedades/nueva')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva propiedad
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/inquilinos/nuevo')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo inquilino
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/contratos/nuevo')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo contrato
            </Button>
          </CardContent>
        </Card>
      );
      
    case 'contracts_expiring':
      const expiring = data.expiringContracts || 0;
      return (
        <Card className={cn(expiring > 0 && "border-amber-200")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalContracts || 0}</div>
            <p className="text-sm text-muted-foreground">
              {expiring > 0 && (
                <span className="text-amber-600">
                  {expiring} vencen pronto
                </span>
              )}
              {expiring === 0 && 'Todos al día'}
            </p>
          </CardContent>
        </Card>
      );
      
    case 'recent_payments':
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.pendingPayments || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Pagos pendientes este mes
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2"
              onClick={() => router.push('/pagos')}
            >
              Gestionar pagos <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      );
      
    case 'pending_tasks':
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tareas pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-sm text-muted-foreground">
              Para hoy
            </p>
            <Button 
              variant="link" 
              className="px-0 mt-2"
              onClick={() => router.push('/tareas')}
            >
              Ver tareas <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      );
      
    default:
      return null;
  }
}

// Widget de upgrade
function UpgradePromptWidget({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();
  const planData = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS];
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">Mejora tu plan</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Desbloquea más funcionalidades con un plan superior.
        </p>
        <Button 
          size="sm" 
          onClick={() => router.push('/pricing')}
        >
          Ver planes
        </Button>
      </CardContent>
    </Card>
  );
}

// Widget de ayuda
function HelpWidget() {
  const router = useRouter();
  
  return (
    <Card className="bg-blue-50/50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">¿Necesitas ayuda?</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Consulta nuestra guía o contacta con soporte.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm" 
            onClick={() => router.push('/ayuda')}
          >
            Ver guía
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => router.push('/chat/soporte')}
          >
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Sección de acciones rápidas
function QuickActionsSection({ userProfile }: { userProfile: ClientProfile }) {
  const router = useRouter();
  
  const actions = [
    { label: 'Nueva propiedad', href: '/propiedades/nueva', icon: Building2 },
    { label: 'Nuevo inquilino', href: '/inquilinos/nuevo', icon: Users },
    { label: 'Nuevo contrato', href: '/contratos/nuevo', icon: FileText },
    { label: 'Registrar pago', href: '/pagos/nuevo', icon: CreditCard },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">¿Qué quieres hacer?</CardTitle>
        <CardDescription>Accesos rápidos a las acciones más comunes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant="outline"
                className="h-auto flex-col py-4 gap-2"
                onClick={() => router.push(action.href)}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Helpers
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getContextualMessage(profile: ClientProfile, data: any): string {
  if (data.maintenanceAlerts > 0) {
    return `Tienes ${data.maintenanceAlerts} incidencias de mantenimiento pendientes.`;
  }
  if (data.pendingPayments > 0) {
    return `Tienes ${data.pendingPayments} pagos pendientes de cobrar.`;
  }
  return 'Todo al día. ¿En qué podemos ayudarte hoy?';
}

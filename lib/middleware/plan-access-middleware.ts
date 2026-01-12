/**
 * Middleware de Acceso por Plan
 * 
 * Verifica si el usuario tiene acceso a una ruta basándose en su plan de suscripción.
 * Se usa en combinación con el middleware de Next.js.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  SubscriptionPlanId,
  planAllowsRoute,
} from '@/lib/subscription-plans-config';
import {
  ALWAYS_AVAILABLE_ROUTES,
  isRouteAvailableForPlan,
} from '@/lib/sidebar-plan-filter';

/**
 * Configuración del middleware
 */
interface PlanAccessConfig {
  /** Redirigir a esta página si no tiene acceso */
  redirectTo: string;
  /** Rutas que siempre están disponibles (públicas) */
  publicRoutes: string[];
  /** Rutas que requieren autenticación pero no verificación de plan */
  authOnlyRoutes: string[];
}

const DEFAULT_CONFIG: PlanAccessConfig = {
  redirectTo: '/pricing',
  publicRoutes: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pricing',
    '/landing',
    '/api',
    '/_next',
    '/favicon.ico',
    '/images',
    '/fonts',
  ],
  authOnlyRoutes: [
    '/onboarding',
    '/profile-selection',
    '/experience',
    '/checkout',
    '/configuracion',
    '/perfil',
    '/ayuda',
  ],
};

/**
 * Verifica acceso a una ruta basándose en el plan
 */
export async function checkPlanAccess(
  request: NextRequest,
  config: Partial<PlanAccessConfig> = {}
): Promise<NextResponse | null> {
  const { redirectTo, publicRoutes, authOnlyRoutes } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  
  const path = request.nextUrl.pathname;
  
  // 1. Rutas públicas - siempre permitir
  if (publicRoutes.some(route => path.startsWith(route))) {
    return null; // Continuar
  }
  
  // 2. Obtener token de sesión
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // 3. Sin autenticación - redirigir a login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  
  // 4. Rutas que solo requieren autenticación
  if (authOnlyRoutes.some(route => path.startsWith(route))) {
    return null; // Continuar
  }
  
  // 5. Obtener plan del usuario
  const userPlan = (token as any).subscriptionPlan || 
                   (token as any).company?.subscriptionPlan?.tier?.toLowerCase() ||
                   'free';
  
  // 6. Verificar si el plan permite acceder a esta ruta
  if (!isRouteAvailableForPlan(path, userPlan as SubscriptionPlanId)) {
    // Redirigir a página de upgrade con info de la ruta bloqueada
    const url = new URL(redirectTo, request.url);
    url.searchParams.set('blocked_route', path);
    url.searchParams.set('current_plan', userPlan);
    return NextResponse.redirect(url);
  }
  
  // 7. Acceso permitido
  return null;
}

/**
 * Verifica si el usuario ha completado el onboarding
 */
export async function checkOnboardingComplete(
  request: NextRequest
): Promise<NextResponse | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  if (!token) return null;
  
  const path = request.nextUrl.pathname;
  
  // No aplicar a rutas de onboarding
  if (path.startsWith('/onboarding') || 
      path.startsWith('/profile-selection') ||
      path.startsWith('/experience')) {
    return null;
  }
  
  // Verificar si completó onboarding
  const onboardingCompleted = (token as any).onboardingCompleted;
  
  if (!onboardingCompleted && path === '/dashboard') {
    // Redirigir a onboarding la primera vez
    return NextResponse.redirect(new URL('/profile-selection', request.url));
  }
  
  return null;
}

/**
 * Verifica límites del plan (propiedades, usuarios, etc.)
 */
export async function checkPlanLimits(
  request: NextRequest,
  limitType: 'properties' | 'users' | 'tenants' | 'documents',
  currentCount: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  if (!token) {
    return { allowed: false, limit: 0, remaining: 0 };
  }
  
  const userPlan = (token as any).subscriptionPlan || 'free';
  
  const limits: Record<SubscriptionPlanId, Record<string, number>> = {
    free: { properties: 1, users: 1, tenants: 2, documents: 100 },
    starter: { properties: 5, users: 2, tenants: 10, documents: 1000 },
    basic: { properties: 15, users: 3, tenants: 30, documents: 5000 },
    professional: { properties: 50, users: 10, tenants: 100, documents: 20000 },
    business: { properties: 200, users: 25, tenants: 500, documents: 100000 },
    enterprise: { properties: -1, users: -1, tenants: -1, documents: -1 },
  };
  
  const planLimits = limits[userPlan as SubscriptionPlanId] || limits.free;
  const limit = planLimits[limitType];
  
  // -1 significa ilimitado
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }
  
  const remaining = limit - currentCount;
  const allowed = currentCount < limit;
  
  return { allowed, limit, remaining };
}

/**
 * Middleware combinado para usar en middleware.ts
 */
export async function planAccessMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  // 1. Verificar onboarding
  const onboardingCheck = await checkOnboardingComplete(request);
  if (onboardingCheck) return onboardingCheck;
  
  // 2. Verificar acceso por plan
  const planCheck = await checkPlanAccess(request);
  if (planCheck) return planCheck;
  
  // 3. Todo OK
  return NextResponse.next();
}

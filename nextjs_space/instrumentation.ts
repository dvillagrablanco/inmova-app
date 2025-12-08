/**
 * Next.js Instrumentation file
 * 
 * Este archivo se ejecuta cuando el servidor Next.js se inicializa.
 * Ideal para configurar herramientas de monitoring y observabilidad.
 * 
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Solo ejecutar en el servidor
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importar e inicializar Sentry para Node.js
    await import('./sentry.server.config');
  }

  // Para Edge Runtime (Middleware, Edge API Routes)
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

import type { ChangelogEntry } from '../types';

export const changelogEntries: ChangelogEntry[] = [
  {
    id: 'chg-001',
    date: '2026-03-10',
    title: 'Módulo de Oportunidades de Inversión',
    description:
      'Nuevo módulo completo con 51 funcionalidades: 5 fuentes de mercado (BOE, banca, IA divergencia, tendencias, crowdfunding), pipeline Kanban, scoring IA, chat contextual, calculadoras de inversión y análisis profundo.',
    type: 'feature',
    tags: ['inversión', 'oportunidades', 'IA'],
  },
  {
    id: 'chg-002',
    date: '2026-03-08',
    title: 'Seguridad: Account Lockout y validación de archivos',
    description:
      'Account lockout tras 5 intentos fallidos de login (bloqueo 15 min). Validación de archivos por magic bytes para PDF, imágenes y documentos. Protección contra ataques de fuerza bruta y archivos maliciosos.',
    type: 'improvement',
    tags: ['seguridad', 'auth', 'archivos'],
  },
  {
    id: 'chg-003',
    date: '2026-03-07',
    title: 'Cloudflare Turnstile CAPTCHA',
    description:
      'Integración de Turnstile para protección contra bots en formularios de registro y login. Degradación elegante si no está configurado.',
    type: 'feature',
    tags: ['seguridad', 'auth'],
  },
  {
    id: 'chg-004',
    date: '2026-03-05',
    title: 'Pipeline CI/CD y tests automatizados',
    description:
      'GitHub Actions con lint, tests, build y security audit. Umbrales de cobertura 80%. Tests pre-deployment obligatorios.',
    type: 'improvement',
    tags: ['devops', 'CI/CD', 'tests'],
  },
  {
    id: 'chg-005',
    date: '2026-03-04',
    title: 'Gestión de seguros desde S3',
    description:
      'Carga de pólizas de seguros en S3, parametrización completa y propagación de cobertura edificio→unidad. Integración con módulo de fincas.',
    type: 'feature',
    tags: ['seguros', 'S3', 'fincas'],
  },
  {
    id: 'chg-006',
    date: '2026-03-03',
    title: 'Dashboard de monitoring para admins',
    description:
      'Nuevo panel en /admin/monitoring con métricas de sistema, memoria, BD, seguridad (cuentas bloqueadas) y estado de integraciones (NextAuth, Stripe, Anthropic, SMTP, S3).',
    type: 'feature',
    tags: ['monitoring', 'admin'],
  },
  {
    id: 'chg-007',
    date: '2026-02-28',
    title: 'Cleanup masivo de código muerto',
    description:
      'Eliminación de 96 archivos y ~35K líneas de código muerto en lib/. TypeScript strict sin ignoreBuildErrors. Tests consolidados en Vitest.',
    type: 'improvement',
    tags: ['código', 'mantenimiento'],
  },
  {
    id: 'chg-008',
    date: '2026-02-25',
    title: 'Suite de tests 1050+ con Vitest',
    description:
      'Migración completa de Jest a Vitest. Más de 1050 tests pasando. Umbrales de cobertura 80% líneas/funciones, 75% branches.',
    type: 'improvement',
    tags: ['tests', 'Vitest'],
  },
  {
    id: 'chg-009',
    date: '2026-02-20',
    title: 'Consolidación de rate limiting',
    description:
      'Unificación de 3 implementaciones de rate limiting en una sola (lib/rate-limiting.ts). Soporte Redis híbrido con fallback en memoria.',
    type: 'improvement',
    tags: ['seguridad', 'rate-limiting'],
  },
  {
    id: 'chg-010',
    date: '2026-02-15',
    title: 'Migración de react-hot-toast a Sonner',
    description:
      'Reemplazo de react-hot-toast por Sonner en 35 archivos. Mejor UX y consistencia visual en notificaciones.',
    type: 'improvement',
    tags: ['UI', 'notificaciones'],
  },
  {
    id: 'chg-011',
    date: '2026-02-10',
    title: 'Sentry en rutas críticas',
    description:
      'Integración de captureException en 12 rutas críticas para mejor tracking de errores en producción.',
    type: 'improvement',
    tags: ['monitoring', 'Sentry'],
  },
  {
    id: 'chg-012',
    date: '2026-01-15',
    title: 'PM2 cluster mode en producción',
    description:
      'Configuración de PM2 con 2 workers en cluster mode para load balancing y auto-restart. Zero-downtime con pm2 reload.',
    type: 'improvement',
    tags: ['devops', 'PM2', 'producción'],
  },
  {
    id: 'chg-013',
    date: '2026-01-10',
    title: 'Nginx como reverse proxy',
    description:
      'Nginx configurado con upstream, keepalive, security headers y caching de assets estáticos. Soporte WebSocket.',
    type: 'improvement',
    tags: ['devops', 'Nginx'],
  },
  {
    id: 'chg-014',
    date: '2026-01-05',
    title: 'Health checks y monitoring automatizado',
    description:
      'Script de health checks cada 5 minutos: HTTP, API, BD, memoria, disco, login. Auto-recovery si ≥3 checks fallan.',
    type: 'feature',
    tags: ['monitoring', 'health-checks'],
  },
  {
    id: 'chg-015',
    date: '2025-12-28',
    title: 'SSL con Cloudflare',
    description:
      'Integración Cloudflare para SSL flexible, CDN, DDoS protection y WAF. Configuración de IPs reales y headers CF.',
    type: 'improvement',
    tags: ['devops', 'Cloudflare', 'SSL'],
  },
  {
    id: 'chg-016',
    date: '2025-12-20',
    title: 'Deployment production-ready',
    description:
      'Arquitectura completa: PM2, Nginx, PostgreSQL, backups automatizados. Checklist de deployment y documentación de rollback.',
    type: 'feature',
    tags: ['devops', 'deployment'],
  },
  {
    id: 'chg-017',
    date: '2025-12-15',
    title: 'Auto-recovery en health checks',
    description:
      'Script de monitor que reinicia PM2 automáticamente cuando fallan múltiples health checks. Alertas por Slack/Email.',
    type: 'feature',
    tags: ['monitoring', 'auto-recovery'],
  },
  {
    id: 'chg-018',
    date: '2025-12-10',
    title: 'Módulo Coliving',
    description:
      'Gestión por habitaciones, paquetes de coliving, eventos y matching de inquilinos. Dashboard específico para operadores coliving.',
    type: 'feature',
    tags: ['coliving', 'habitaciones'],
  },
  {
    id: 'chg-019',
    date: '2025-12-05',
    title: 'Tours virtuales',
    description:
      'Páginas de tours virtuales, API y viewer para integración con Matterport, Kuula o URLs embebidas. Analytics de visualizaciones.',
    type: 'feature',
    tags: ['tours', 'inmuebles'],
  },
];

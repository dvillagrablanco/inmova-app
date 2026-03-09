import React from 'react';

/**
 * TOUR DEMO INTERACTIVO — GRUPO VIDARO
 *
 * Arquitectura: Panel lateral narrador + Spotlight en UI real + Tareas interactivas.
 * El usuario VE y TOCA la app real mientras recibe la narración.
 *
 * ACTO 1 — El Reto (dashboard: contexto + KPIs reales)
 * ACTO 2 — La Plataforma (navega y explora cada sección)
 * ACTO 3 — Sin Esfuerzo (operaciones automatizadas)
 * ACTO 4 — El Impacto (métricas de transformación)
 */

export const DEMO_USER_EMAIL = 'demo@vidaroinversiones.com';

export type StepMode = 'narrator' | 'spotlight' | 'task' | 'cinematic';

export interface DemoStep {
  id: string;
  route?: string;
  act: 1 | 2 | 3 | 4;
  actTitle: string;
  /** 'narrator' = side panel only, 'spotlight' = highlight + panel, 'task' = interactive challenge, 'cinematic' = fullscreen moment */
  mode: StepMode;
  /** CSS selector(s) to spotlight — can be array for multi-highlight */
  spotlightTargets?: string[];
  /** Narrator panel title */
  title: string;
  /** Short narrator text (keep to 2-3 lines) */
  narration: React.ReactNode;
  /** Interactive task the user must complete (optional) */
  task?: {
    instruction: string;
    /** CSS selector to observe for click/interaction */
    triggerSelector?: string;
    /** Auto-complete after N seconds if user doesn't interact */
    autoCompleteMs?: number;
    /** Text shown when task is completed */
    completedText: string;
  };
  /** Stats to display in the panel */
  stats?: Array<{ label: string; value: string; color: string }>;
  /** Before/After comparison */
  comparison?: { before: string; after: string };
  /** Hint shown below narration */
  hint?: string;
}

const ACT_TITLES = {
  1: 'EL RETO',
  2: 'LA PLATAFORMA',
  3: 'SIN ESFUERZO',
  4: 'EL IMPACTO',
};

export const DEMO_STEPS: DemoStep[] = [

  // ═══════════════════════════════════════════════════
  //  ACTO 1 — "EL RETO"
  // ═══════════════════════════════════════════════════

  {
    id: 'welcome',
    route: '/dashboard',
    act: 1,
    actTitle: ACT_TITLES[1],
    mode: 'cinematic',
    title: 'Grupo Vidaro · INMOVA',
    narration: (
      <>
        <p className="text-sm text-gray-600">
          3 sociedades. 22 inmuebles. 340 inquilinos. <strong>€337M en activos.</strong>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Hoy gestionan todo con Excel, emails y llamadas.
          Veamos cómo INMOVA lo transforma.
        </p>
      </>
    ),
    stats: [
      { label: 'Sociedades', value: '3', color: 'indigo' },
      { label: 'Inquilinos', value: '340+', color: 'purple' },
      { label: 'Activos', value: '€337M', color: 'blue' },
    ],
    hint: '~5 min · Tour interactivo con la app real',
  },

  {
    id: 'dashboard-kpis',
    route: '/dashboard',
    act: 1,
    actTitle: ACT_TITLES[1],
    mode: 'spotlight',
    spotlightTargets: ['[data-tour="kpi-cards"]'],
    title: 'Dashboard en Tiempo Real',
    narration: (
      <p className="text-sm text-gray-600">
        Ingresos, ocupación, morosidad — todo el grupo en <strong>una pantalla</strong>.
        Antes tardaban semanas en consolidar estos datos.
      </p>
    ),
    task: {
      instruction: 'Haga click en cualquier KPI para ver el detalle',
      triggerSelector: '[data-tour="kpi-cards"]',
      autoCompleteMs: 8000,
      completedText: 'Los KPIs se actualizan en tiempo real',
    },
    comparison: {
      before: 'Semanas para un informe',
      after: '1 click, datos al segundo',
    },
  },

  {
    id: 'dashboard-charts',
    route: '/dashboard',
    act: 1,
    actTitle: ACT_TITLES[1],
    mode: 'spotlight',
    spotlightTargets: ['[data-tour="charts"]'],
    title: 'Ingresos y Tendencias',
    narration: (
      <p className="text-sm text-gray-600">
        Gráficos de ingresos mensuales, distribución de gastos y ocupación por tipo de activo.
        <strong> Proyecciones a 12 meses con IA.</strong>
      </p>
    ),
    task: {
      instruction: 'Pase el cursor sobre las barras del gráfico',
      triggerSelector: '[data-tour="charts"]',
      autoCompleteMs: 6000,
      completedText: 'Datos interactivos con tooltips detallados',
    },
    hint: 'Cada sociedad y edificio tiene su propio desglose',
  },

  // ═══════════════════════════════════════════════════
  //  ACTO 2 — "LA PLATAFORMA"
  // ═══════════════════════════════════════════════════

  {
    id: 'properties',
    route: '/propiedades',
    act: 2,
    actTitle: ACT_TITLES[2],
    mode: 'task',
    spotlightTargets: ['[data-tour="propiedades-menu"]'],
    title: '22 Inmuebles · Todo Digital',
    narration: (
      <p className="text-sm text-gray-600">
        Ficha completa de cada inmueble: fotos, planos, CEE, catastro, contratos vinculados,
        historial de incidencias y <strong>rentabilidad en tiempo real</strong>.
      </p>
    ),
    task: {
      instruction: 'Explore la lista: haga click en cualquier propiedad',
      autoCompleteMs: 10000,
      completedText: 'Cada propiedad tiene su ficha completa',
    },
    comparison: {
      before: 'Buscar en carpetas 15 min',
      after: 'Cualquier dato en 5 seg',
    },
  },

  {
    id: 'tenant-portal',
    route: '/portal-inquilino',
    act: 2,
    actTitle: ACT_TITLES[2],
    mode: 'narrator',
    title: 'Portal del Inquilino 24/7',
    narration: (
      <>
        <p className="text-sm text-gray-600">
          <strong>La estrella de la plataforma.</strong> Cada uno de sus 340 inquilinos
          accede a este portal — web y móvil (PWA).
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Pagar online, abrir incidencias, ver contratos, chat con gestor...
          <strong> todo sin llamar ni escribir emails.</strong>
        </p>
      </>
    ),
    stats: [
      { label: 'Pagar', value: '💳', color: 'blue' },
      { label: 'Incidencias', value: '🔧', color: 'orange' },
      { label: 'Contratos', value: '📝', color: 'green' },
      { label: 'Chat', value: '💬', color: 'purple' },
      { label: 'Docs', value: '📂', color: 'gray' },
      { label: 'Chatbot IA', value: '🤖', color: 'violet' },
    ],
    comparison: {
      before: 'Llamadas, emails, WhatsApp',
      after: '85% sin intervención humana',
    },
    hint: 'Navegue el portal: esto es lo que ven sus inquilinos',
  },

  {
    id: 'contracts',
    route: '/contratos',
    act: 2,
    actTitle: ACT_TITLES[2],
    mode: 'task',
    title: 'Contratos + Cobros SEPA',
    narration: (
      <p className="text-sm text-gray-600">
        Plantillas legales, IPC automático, firma digital, alertas de vencimiento a 90 días,
        <strong> cobro SEPA de 340 recibos/mes en automático</strong>.
      </p>
    ),
    task: {
      instruction: 'Explore los contratos del grupo',
      autoCompleteMs: 8000,
      completedText: 'Cero contratos olvidados · Cero IPC perdidos · -60% morosidad',
    },
    comparison: {
      before: 'Seguimiento manual mes a mes',
      after: 'Todo automático con alertas',
    },
  },

  {
    id: 'family-office',
    route: '/family-office/dashboard',
    act: 2,
    actTitle: ACT_TITLES[2],
    mode: 'spotlight',
    title: 'Family Office 360°',
    narration: (
      <p className="text-sm text-gray-600">
        Patrimonio completo en una vista: <strong>inmobiliario + financiero + Private Equity</strong>.
        P&L por centro de coste. Previsión a 12 meses.
      </p>
    ),
    stats: [
      { label: 'Vidaro', value: '€253M', color: 'amber' },
      { label: 'Instrumentos', value: '460+', color: 'amber' },
      { label: 'Carteras', value: '5', color: 'amber' },
      { label: 'Participaciones', value: '7', color: 'amber' },
    ],
    hint: 'CACEIS · Inversis · Pictet · Banca March · Bankinter · Modelo 720',
  },

  {
    id: 'ai-live',
    route: '/valoracion-ia',
    act: 2,
    actTitle: ACT_TITLES[2],
    mode: 'task',
    title: 'Inteligencia Artificial en Vivo',
    narration: (
      <>
        <p className="text-sm text-gray-600">
          <strong>Pruébelo ahora:</strong> introduzca una dirección de Madrid y obtenga
          valoración + comparables en 10 segundos.
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-violet-700">🏷️ Valoración IA — está aquí ahora</p>
          <p className="text-xs text-purple-700">📋 Analizar propuesta broker → veredicto IA</p>
          <p className="text-xs text-emerald-700">💬 Copiloto financiero → pregunte lo que quiera</p>
        </div>
      </>
    ),
    task: {
      instruction: 'Escriba una dirección de Madrid y pulse "Valorar"',
      autoCompleteMs: 20000,
      completedText: '50 propuestas analizadas en el tiempo de 1',
    },
  },

  // ═══════════════════════════════════════════════════
  //  ACTO 3 — "SIN ESFUERZO"
  // ═══════════════════════════════════════════════════

  {
    id: 'maintenance',
    route: '/mantenimiento',
    act: 3,
    actTitle: ACT_TITLES[3],
    mode: 'narrator',
    title: 'Operaciones Sin Fricción',
    narration: (
      <p className="text-sm text-gray-600">
        <strong>Mantenimiento</strong> con IA que clasifica urgencia automáticamente.
        <strong> Seguros</strong> con alertas de vencimiento.
        <strong> Documentos</strong> organizados por IA.
      </p>
    ),
    stats: [
      { label: 'Mantenimiento', value: '🔧', color: 'orange' },
      { label: 'Seguros', value: '🛡️', color: 'sky' },
      { label: 'Documentos', value: '📂', color: 'gray' },
    ],
    comparison: {
      before: 'Horas al teléfono gestionando',
      after: '-70% tiempo de respuesta',
    },
    hint: 'Explore las incidencias reales del grupo',
  },

  {
    id: 'automation',
    route: '/configuracion',
    act: 3,
    actTitle: ACT_TITLES[3],
    mode: 'narrator',
    title: 'La Plataforma Trabaja Sola',
    narration: (
      <>
        <p className="text-sm text-gray-600">
          Desde aquí se activan todos los <strong>automatismos</strong>:
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span>✦ Cobros SEPA mensuales</span>
          <span>✦ Recordatorios de pago</span>
          <span>✦ Renovación contratos</span>
          <span>✦ Actualización IPC</span>
          <span>✦ Informes mensuales</span>
          <span>✦ Alertas inteligentes</span>
          <span>✦ Chatbot IA 24/7</span>
          <span>✦ API + Webhooks</span>
        </div>
      </>
    ),
    hint: 'App móvil (PWA) instalable · Push notifications en tiempo real',
  },

  // ═══════════════════════════════════════════════════
  //  ACTO 4 — "EL IMPACTO"
  // ═══════════════════════════════════════════════════

  {
    id: 'before-after',
    route: '/dashboard',
    act: 4,
    actTitle: ACT_TITLES[4],
    mode: 'cinematic',
    title: 'La Transformación',
    narration: (
      <p className="text-sm text-gray-600 text-center">
        Todo lo que ha visto y tocado está <strong>operativo y listo</strong> para el grupo.
      </p>
    ),
    stats: [
      { label: 'Tiempo admin', value: '-80%', color: 'green' },
      { label: 'Ingresos', value: '+15%', color: 'green' },
      { label: 'Morosidad', value: '-60%', color: 'green' },
      { label: 'Respuesta', value: '-70%', color: 'green' },
    ],
    hint: 'Explore libremente. Botón "Presentar Demo" para repetir.',
  },
];

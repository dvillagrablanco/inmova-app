import React from 'react';

/**
 * TOUR DEMO SHOWCASE — GRUPO VIDARO
 *
 * 11 pasos NAVEGABLES con arco dramático.
 * Contenido COMPACTO para panel flotante (380px).
 * La app es 100% visible e interactiva — el panel solo narra.
 *
 * ACTO 1 — El Reto (dashboard)
 * ACTO 2 — La Plataforma (navega a cada sección)
 * ACTO 3 — Sin Esfuerzo (navega a operaciones)
 * ACTO 4 — El Impacto (vuelve a dashboard)
 */

export const DEMO_USER_EMAIL = 'demo@vidaroinversiones.com';

export interface DemoStep {
  id: string;
  route?: string;
  type: 'overlay' | 'spotlight';
  target?: string;
  content: React.ReactNode;
}

export const DEMO_STEPS: DemoStep[] = [
  // ═══ ACTO 1 — "EL RETO" ═══

  {
    id: 'welcome',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-xl">🏛️</span>
          </div>
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Grupo Vidaro · INMOVA
            </h2>
            <p className="text-[10px] text-gray-400">
              Plataforma inmobiliaria integral
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <div className="flex-1 text-center py-1.5 bg-indigo-50 rounded-lg">
            <div className="text-sm font-bold text-indigo-700">3</div>
            <div className="text-[9px] text-indigo-600">Sociedades</div>
          </div>
          <div className="flex-1 text-center py-1.5 bg-purple-50 rounded-lg">
            <div className="text-sm font-bold text-purple-700">340+</div>
            <div className="text-[9px] text-purple-600">Inquilinos</div>
          </div>
          <div className="flex-1 text-center py-1.5 bg-blue-50 rounded-lg">
            <div className="text-sm font-bold text-blue-700">€337M</div>
            <div className="text-[9px] text-blue-600">Activos</div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
          <h4 className="text-[10px] font-bold text-red-900 mb-1">
            🔴 El reto actual:
          </h4>
          <div className="space-y-0.5 text-[10px] text-red-800">
            <p>• Excel separado por sociedad y edificio</p>
            <p>• Reporting manual, semanas cada trimestre</p>
            <p>• Cobros y contratos seguidos a mano</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center font-medium">
          ¿Y si todo esto desapareciera en <strong>un solo click</strong>?
        </p>
        <p className="text-[9px] text-gray-400 text-center">
          11 pasos · ~4 min · La app es interactiva durante el tour
        </p>
      </div>
    ),
  },

  {
    id: 'dashboard',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold text-gray-900">
            Dashboard — Todo en Tiempo Real
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          Está viendo el <strong>panel de control real</strong> del grupo.
          Ingresos, ocupación, morosidad y alertas actualizados al segundo.
        </p>
        <div className="flex gap-1.5">
          <div className="flex-1 text-center p-1.5 bg-red-50 rounded border border-red-100">
            <div className="text-[9px] font-bold text-red-700">❌ Antes</div>
            <div className="text-[8px] text-red-600">Semanas para un informe</div>
          </div>
          <div className="flex-1 text-center p-1.5 bg-green-50 rounded border border-green-100">
            <div className="text-[9px] font-bold text-green-700">✅ INMOVA</div>
            <div className="text-[8px] text-green-600">1 click, datos al segundo</div>
          </div>
        </div>
        <p className="text-[10px] text-indigo-600 font-medium text-center">
          ↖ Explore los KPIs y gráficos a la izquierda
        </p>
      </div>
    ),
  },

  // ═══ ACTO 2 — "LA PLATAFORMA" ═══

  {
    id: 'properties',
    route: '/propiedades',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏠</span>
          <h3 className="text-sm font-bold text-gray-900">
            22 Inmuebles · 340 Inquilinos
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          Ficha completa de cada inmueble: fotos, planos, CEE, catastro,
          contratos vinculados, incidencias y rentabilidad.
        </p>
        <div className="flex gap-1.5">
          <div className="flex-1 text-center p-1.5 bg-red-50 rounded border border-red-100">
            <div className="text-[9px] font-bold text-red-700">❌ Antes</div>
            <div className="text-[8px] text-red-600">Buscar en carpetas 15 min</div>
          </div>
          <div className="flex-1 text-center p-1.5 bg-green-50 rounded border border-green-100">
            <div className="text-[9px] font-bold text-green-700">✅ INMOVA</div>
            <div className="text-[8px] text-green-600">Cualquier dato en 5 seg</div>
          </div>
        </div>
        <p className="text-[10px] text-indigo-600 font-medium text-center">
          ↖ Haga click en cualquier propiedad para ver su ficha
        </p>
      </div>
    ),
  },

  {
    id: 'tenant-portal',
    route: '/portal-inquilino',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <span className="text-base">📱</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Portal del Inquilino 24/7
            </h3>
            <p className="text-[9px] text-blue-600 font-semibold">
              ⭐ LA ESTRELLA DE LA PLATAFORMA
            </p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600">
          Lo que ve es el portal real que usan los 340 inquilinos. Web y
          móvil (PWA), todo sin llamar ni escribir emails.
        </p>
        <div className="grid grid-cols-4 gap-x-1 gap-y-1 text-[9px] text-blue-800 bg-blue-50/50 rounded-lg p-2 border border-blue-100">
          <span>💳 Pagar</span>
          <span>📄 Recibos</span>
          <span>🔧 Incidencias</span>
          <span>💬 Chat</span>
          <span>📝 Contrato</span>
          <span>🔄 Renovar</span>
          <span>📂 Docs</span>
          <span>🤖 IA Bot</span>
        </div>
        <div className="text-center text-[10px]">
          <span className="text-red-600">❌ Antes: llamadas, emails, WhatsApp</span>
          {' → '}
          <span className="text-green-600 font-semibold">
            ✅ 85% sin intervención
          </span>
        </div>
      </div>
    ),
  },

  {
    id: 'contracts',
    route: '/contratos',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📝</span>
          <h3 className="text-sm font-bold text-gray-900">
            Contratos + Cobros SEPA
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
            <div className="text-[10px] font-bold text-blue-900 mb-0.5">
              Contratos
            </div>
            <div className="space-y-0.5 text-[9px] text-blue-700">
              <p>✦ Plantillas legales auto</p>
              <p>✦ IPC automático anual</p>
              <p>✦ Firma digital integrada</p>
              <p>✦ Alertas vencimiento 90d</p>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
            <div className="text-[10px] font-bold text-emerald-900 mb-0.5">
              Cobros
            </div>
            <div className="space-y-0.5 text-[9px] text-emerald-700">
              <p>✦ SEPA domiciliación</p>
              <p>✦ 340 cobros/mes auto</p>
              <p>✦ Morosidad tiempo real</p>
              <p>✦ Recordatorios auto</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-green-700 bg-green-50 rounded p-1.5 text-center border border-green-100">
          💡 Cero contratos olvidados · <strong>-60% morosidad</strong>
        </p>
      </div>
    ),
  },

  {
    id: 'family-office',
    route: '/family-office/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">👑</span>
          <h3 className="text-sm font-bold text-gray-900">
            Family Office 360°
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          Patrimonio completo en una vista: inmobiliario + financiero + Private
          Equity. P&L por centro de coste y previsión a 12 meses.
        </p>
        <div className="grid grid-cols-4 gap-1">
          <div className="text-center p-1 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">€253M</div>
            <div className="text-[7px] text-amber-600">Vidaro</div>
          </div>
          <div className="text-center p-1 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">460+</div>
            <div className="text-[7px] text-amber-600">Instrum.</div>
          </div>
          <div className="text-center p-1 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">5</div>
            <div className="text-[7px] text-amber-600">Carteras</div>
          </div>
          <div className="text-center p-1 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">7</div>
            <div className="text-[7px] text-amber-600">Particip.</div>
          </div>
        </div>
        <p className="text-[10px] text-indigo-600 font-medium text-center">
          ↖ Explore las posiciones financieras en la pantalla
        </p>
      </div>
    ),
  },

  {
    id: 'ai-live',
    route: '/valoracion-ia',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-base">🧠</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">IA en Acción</h3>
            <p className="text-[9px] text-violet-600 font-semibold">
              DEMO EN VIVO — Pruebe ahora mismo
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200">
            <p className="text-[10px] text-indigo-900">
              <strong>🏷️ Valoración IA</strong> — Introduzca una dirección →
              valor estimado + comparables en 10 seg
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
            <p className="text-[10px] text-purple-900">
              <strong>📋 Analizar Propuesta</strong> — Pegue un PDF de broker →
              Veredicto: COMPRAR / NEGOCIAR / DESCARTAR
            </p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200">
            <p className="text-[10px] text-emerald-900">
              <strong>💬 Copiloto</strong> — Pregunte: &quot;¿Cuánto genera
              Piamonte al año?&quot;
            </p>
          </div>
        </div>
        <p className="text-[10px] text-violet-700 text-center font-medium">
          ↖ Minimice este panel y pruebe la valoración en vivo
        </p>
      </div>
    ),
  },

  // ═══ ACTO 3 — "SIN ESFUERZO" ═══

  {
    id: 'maintenance',
    route: '/mantenimiento',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <h3 className="text-sm font-bold text-gray-900">
            Operaciones Sin Fricción
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[9px]">
          <div className="bg-orange-50 rounded p-1.5 border border-orange-100 text-center">
            <div className="text-sm mb-0.5">🔧</div>
            <div className="font-bold text-orange-800">Mantenimiento</div>
            <div className="text-orange-600">IA clasifica auto</div>
          </div>
          <div className="bg-sky-50 rounded p-1.5 border border-sky-100 text-center">
            <div className="text-sm mb-0.5">🛡️</div>
            <div className="font-bold text-sky-800">Seguros</div>
            <div className="text-sky-600">Alertas vencim.</div>
          </div>
          <div className="bg-gray-50 rounded p-1.5 border border-gray-200 text-center">
            <div className="text-sm mb-0.5">📂</div>
            <div className="font-bold text-gray-800">Documentos</div>
            <div className="text-gray-600">IA organiza</div>
          </div>
        </div>
        <p className="text-[10px] text-orange-700 bg-orange-50 rounded p-1.5 text-center border border-orange-100">
          💡 <strong>-70% tiempo respuesta</strong> · Cero pólizas vencidas
        </p>
      </div>
    ),
  },

  {
    id: 'automation',
    route: '/configuracion',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h3 className="text-sm font-bold text-gray-900">
            La Plataforma Trabaja Sola
          </h3>
        </div>
        <p className="text-xs text-gray-600">
          Desde <strong>Configuración</strong> se activan y personalizan todos
          los automatismos:
        </p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-700">
          <span>✦ Cobros SEPA mensuales</span>
          <span>✦ Recordatorios de pago</span>
          <span>✦ Renovación contratos</span>
          <span>✦ Actualización IPC</span>
          <span>✦ Informes mensuales</span>
          <span>✦ Alertas inteligentes</span>
          <span>✦ Chatbot IA 24/7</span>
          <span>✦ API + Webhooks</span>
        </div>
        <p className="text-[10px] text-fuchsia-700 bg-fuchsia-50 rounded p-1.5 text-center border border-fuchsia-100">
          📱 <strong>App móvil (PWA)</strong> instalable. Push notifications.
        </p>
      </div>
    ),
  },

  // ═══ ACTO 4 — "EL IMPACTO" ═══

  {
    id: 'before-after',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-gray-900 text-center">
          La Transformación
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
            <div className="text-center text-[10px] font-bold text-red-800 mb-1">
              ❌ Sin INMOVA
            </div>
            <div className="space-y-0.5 text-[8px] text-red-700">
              <p>📋 Excel por sociedad</p>
              <p>📞 Inquilinos llaman</p>
              <p>📊 Informes manuales</p>
              <p>💸 Cobros a mano</p>
              <p>⏰ Equipo de 10</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <div className="text-center text-[10px] font-bold text-green-800 mb-1">
              ✅ Con INMOVA
            </div>
            <div className="space-y-0.5 text-[8px] text-green-700">
              <p>🖥️ 1 plataforma, 3 soc.</p>
              <p>📱 Self-service 24/7</p>
              <p>📊 Dashboard 1 click</p>
              <p>💳 SEPA auto 340 cobros</p>
              <p>⚡ Equipo de 3</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  {
    id: 'closing',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <span className="text-xl">🚀</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            Impacto Real
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2 bg-green-50 rounded-lg p-2.5 border border-green-200">
          <div className="text-center">
            <div className="text-lg font-black text-green-700">-80%</div>
            <div className="text-[8px] text-green-600">Tiempo admin</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-green-700">+15%</div>
            <div className="text-[8px] text-green-600">Ingresos rentas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-green-700">-60%</div>
            <div className="text-[8px] text-green-600">Morosidad</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-green-700">-70%</div>
            <div className="text-[8px] text-green-600">T. respuesta</div>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200 text-center">
          <p className="text-[10px] text-indigo-900 font-semibold">
            Todo operativo y listo para el grupo.
          </p>
          <p className="text-[9px] text-indigo-700 mt-0.5">
            100+ módulos · 15 verticales · IA · App móvil · API
          </p>
        </div>
        <p className="text-[10px] text-gray-500 text-center">
          Explore libremente. Botón <strong>Presentar Demo</strong> para
          repetir.
        </p>
      </div>
    ),
  },
];

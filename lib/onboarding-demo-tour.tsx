import React from 'react';

/**
 * TOUR DEMO SHOWCASE — GRUPO VIDARO
 * 
 * 12 pasos NAVEGABLES con arco dramático.
 * Cada paso puede llevar al usuario a la página real de la funcionalidad.
 * 
 * ACTO 1 — El Reto (dashboard)
 * ACTO 2 — La Plataforma (navega a cada sección)
 * ACTO 3 — Sin Esfuerzo (navega a operaciones)
 * ACTO 4 — El Impacto (vuelve a dashboard)
 */

export const DEMO_USER_EMAIL = 'demo@vidaroinversiones.com';

export interface DemoStep {
  id: string;
  /** Ruta a la que navegar ANTES de mostrar el paso. Si no tiene, se queda en la página actual */
  route?: string;
  /** 'overlay' = modal centrado fullscreen, 'spotlight' = tooltip apuntando a un target */
  type: 'overlay' | 'spotlight';
  /** CSS selector del elemento a destacar (solo para type='spotlight') */
  target?: string;
  /** Contenido JSX del paso */
  content: React.ReactNode;
}

export const DEMO_STEPS: DemoStep[] = [

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACTO 1 — "EL RETO"                                      ║
  // ╚═══════════════════════════════════════════════════════════╝

  {
    id: 'welcome',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-3">
            <span className="text-3xl">🏛️</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Grupo Vidaro · INMOVA
          </h2>
          <p className="text-xs text-gray-400 mt-1">La plataforma inmobiliaria más completa de España</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2.5 bg-indigo-50 rounded-xl">
            <div className="text-xl font-bold text-indigo-700">3</div>
            <div className="text-[10px] text-indigo-600 font-medium">Sociedades</div>
          </div>
          <div className="text-center p-2.5 bg-purple-50 rounded-xl">
            <div className="text-xl font-bold text-purple-700">340+</div>
            <div className="text-[10px] text-purple-600 font-medium">Inquilinos</div>
          </div>
          <div className="text-center p-2.5 bg-blue-50 rounded-xl">
            <div className="text-xl font-bold text-blue-700">€337M</div>
            <div className="text-[10px] text-blue-600 font-medium">Activos</div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <h4 className="text-xs font-bold text-red-900 mb-1.5">🔴 El reto actual del equipo:</h4>
          <div className="space-y-1 text-xs text-red-800">
            <p>• Hojas de Excel separadas por cada sociedad y edificio</p>
            <p>• Reporting manual que consume semanas cada trimestre</p>
            <p>• Cobros, contratos y vencimientos seguidos a mano</p>
            <p>• Sin visión consolidada del patrimonio completo</p>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 font-medium">
          ¿Y si todo esto desapareciera en <strong>un solo click</strong>?
        </p>
        <p className="text-[10px] text-gray-400 text-center">12 pasos · ~5 min · Le llevaremos a cada sección en vivo</p>
      </div>
    ),
  },

  {
    id: 'dashboard',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="text-center">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Todo el Grupo. Una Pantalla. Tiempo Real.</h3>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Este es su <strong>Dashboard</strong>. Ingresos, ocupación, morosidad y alertas — 
          actualizados <strong>al segundo</strong>. Proyecciones a 12 meses con IA.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 text-center p-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-[10px] font-bold text-red-700">❌ Antes</div>
            <div className="text-[9px] text-red-600 mt-0.5">Semanas para un informe</div>
          </div>
          <div className="flex-1 text-center p-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-[10px] font-bold text-green-700">✅ Con INMOVA</div>
            <div className="text-[9px] text-green-600 mt-0.5">1 click, datos al segundo</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">👆 Observe los KPIs y gráficos detrás de este panel</p>
      </div>
    ),
  },

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACTO 2 — "LA PLATAFORMA" (navega a cada sección)        ║
  // ╚═══════════════════════════════════════════════════════════╝

  {
    id: 'properties',
    route: '/propiedades',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="text-center">
          <span className="text-2xl">🏠</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">22 Inmuebles · 340 Inquilinos · Todo Digital</h3>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Estamos en la sección de <strong>Propiedades</strong>. Ficha completa de cada inmueble: 
          fotos, planos, CEE, catastro, contratos vinculados, historial de incidencias y rentabilidad.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 text-center p-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-[10px] font-bold text-red-700">❌ Antes</div>
            <div className="text-[9px] text-red-600 mt-0.5">Buscar en carpetas 15 min</div>
          </div>
          <div className="flex-1 text-center p-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-[10px] font-bold text-green-700">✅ Con INMOVA</div>
            <div className="text-[9px] text-green-600 mt-0.5">Cualquier dato en 5 seg</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">👆 Explore las propiedades del grupo detrás de este panel</p>
      </div>
    ),
  },

  {
    id: 'tenant-portal',
    route: '/portal-inquilino',
    type: 'overlay',
    content: (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-2">
            <span className="text-2xl">📱</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Portal del Inquilino — Self-Service 24/7</h2>
          <p className="text-[10px] text-blue-600 font-semibold">⭐ LA ESTRELLA DE LA PLATAFORMA</p>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Está viendo el <strong>portal real</strong> que cada uno de sus 340 inquilinos usa. 
          Web y móvil (PWA). Todo <strong>sin llamar ni escribir emails</strong>.
        </p>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>💳</span> Pagar online</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>📄</span> Recibos PDF</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>🔧</span> Incidencias</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>💬</span> Chat gestor</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>📝</span> Ver contrato</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>🔄</span> Renovar</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>📂</span> Documentos</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>🤖</span> Chatbot IA</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>⭐</span> Valoraciones</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>🎁</span> Referidos</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>🏆</span> Logros</div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800"><span>👤</span> Perfil</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 text-center p-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-[10px] font-bold text-red-700">❌ Antes</div>
            <div className="text-[9px] text-red-600">Llamadas, emails, WhatsApp</div>
          </div>
          <div className="flex-1 text-center p-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-[10px] font-bold text-green-700">✅ Con INMOVA</div>
            <div className="text-[9px] text-green-600">85% sin intervención humana</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center">👆 Este es el portal real. Explore las secciones detrás de este panel.</p>
      </div>
    ),
  },

  {
    id: 'contracts',
    route: '/contratos',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="text-center">
          <span className="text-2xl">📝</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Contratos Inteligentes + Cobros SEPA</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
            <div className="font-bold text-blue-900 mb-1">Contratos</div>
            <ul className="text-blue-700 space-y-0.5 text-[10px]">
              <li>✦ Plantillas legales auto</li>
              <li>✦ IPC automático anual</li>
              <li>✦ Firma digital integrada</li>
              <li>✦ Alertas vencimiento 90d</li>
              <li>✦ Renovación en lote</li>
            </ul>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
            <div className="font-bold text-emerald-900 mb-1">Cobros</div>
            <ul className="text-emerald-700 space-y-0.5 text-[10px]">
              <li>✦ SEPA domiciliación</li>
              <li>✦ 340 cobros/mes auto</li>
              <li>✦ Recibos por email</li>
              <li>✦ Morosidad tiempo real</li>
              <li>✦ Recordatorios auto</li>
            </ul>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-xs text-green-800">
            💡 Cero contratos olvidados · Cero IPC perdidos · <strong>-60% morosidad</strong>
          </p>
        </div>
        <p className="text-xs text-gray-400 text-center">👆 Vea los contratos reales del grupo detrás de este panel</p>
      </div>
    ),
  },

  {
    id: 'family-office',
    route: '/family-office/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="text-center">
          <span className="text-2xl">👑</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Family Office 360° + Control Financiero</h3>
        </div>
        <p className="text-sm text-gray-600 text-center">
          <strong>Patrimonio completo en una vista:</strong> inmobiliario + financiero + Private Equity.
          P&L por centro de coste. Previsión a 12 meses.
        </p>
        <div className="grid grid-cols-4 gap-1">
          <div className="text-center p-1.5 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">€253M</div>
            <div className="text-[8px] text-amber-600">Vidaro</div>
          </div>
          <div className="text-center p-1.5 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">460+</div>
            <div className="text-[8px] text-amber-600">Instrum.</div>
          </div>
          <div className="text-center p-1.5 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">5</div>
            <div className="text-[8px] text-amber-600">Carteras</div>
          </div>
          <div className="text-center p-1.5 bg-amber-50 rounded border border-amber-100">
            <div className="text-[10px] font-bold text-amber-700">7</div>
            <div className="text-[8px] text-amber-600">Particip.</div>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 text-center">
          CACEIS · Inversis · Pictet · Banca March · Bankinter · Modelo 720
        </div>
        <p className="text-xs text-gray-400 text-center">👆 Explore el Family Office real del grupo Vidaro</p>
      </div>
    ),
  },

  {
    id: 'ai-live',
    route: '/valoracion-ia',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-2">
            <span className="text-2xl">🧠</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Inteligencia Artificial en Acción</h2>
          <p className="text-[10px] text-violet-600 font-semibold">DEMO EN VIVO — Cierre este panel y pruebe</p>
        </div>
        <div className="space-y-2">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🏷️</span>
              <span className="text-xs font-bold text-indigo-900">1. Valoración IA — Está aquí ahora</span>
            </div>
            <p className="text-[10px] text-indigo-800">
              Introduzca una dirección de Madrid → valor estimado + comparables en 10 seg
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">📋</span>
              <span className="text-xs font-bold text-purple-900">2. Analizar Propuesta Broker</span>
            </div>
            <p className="text-[10px] text-purple-800">
              Vaya a Oportunidades IA → Pegue PDF → Veredicto: COMPRAR / NEGOCIAR / DESCARTAR
            </p>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">💬</span>
              <span className="text-xs font-bold text-emerald-900">3. Copiloto Financiero</span>
            </div>
            <p className="text-[10px] text-emerald-800">
              Botón IA abajo derecha → Pregunte: &quot;¿Cuánto genera Piamonte al año?&quot;
            </p>
          </div>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-2">
          <p className="text-xs text-violet-800 text-center">
            💡 50 propuestas analizadas en el tiempo de 1. <strong>Decisiones 10x más rápidas.</strong>
          </p>
        </div>
      </div>
    ),
  },

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACTO 3 — "SIN ESFUERZO"                                 ║
  // ╚═══════════════════════════════════════════════════════════╝

  {
    id: 'maintenance',
    route: '/mantenimiento',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="text-center">
          <span className="text-2xl">🔧</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">Operaciones Sin Fricción</h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 text-center">
            <div className="text-sm mb-0.5">🔧</div>
            <div className="font-bold text-orange-800">Mantenimiento</div>
            <div className="text-orange-600 mt-0.5">IA clasifica urgencia auto</div>
          </div>
          <div className="bg-sky-50 rounded-lg p-2 border border-sky-100 text-center">
            <div className="text-sm mb-0.5">🛡️</div>
            <div className="font-bold text-sky-800">Seguros</div>
            <div className="text-sky-600 mt-0.5">Alertas vencimiento auto</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-center">
            <div className="text-sm mb-0.5">📂</div>
            <div className="font-bold text-gray-800">Documentos</div>
            <div className="text-gray-600 mt-0.5">IA organiza todo</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
          <p className="text-xs text-orange-800">
            💡 <strong>-70% tiempo de respuesta</strong> en incidencias. Cero pólizas vencidas.
          </p>
        </div>
        <p className="text-xs text-gray-400 text-center">👆 Vea las incidencias reales del grupo</p>
      </div>
    ),
  },

  {
    id: 'automation',
    route: '/configuracion',
    type: 'overlay',
    content: (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="text-center">
          <span className="text-2xl">⚡</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">La Plataforma Trabaja Sola</h3>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Desde <strong>Configuración</strong> puede activar y personalizar todos los automatismos:
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="flex items-center gap-1.5 text-gray-700">✦ Cobros SEPA mensuales</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ Recordatorios de pago</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ Renovación contratos</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ Actualización IPC</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ Informes mensuales</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ Alertas inteligentes</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ Chatbot IA 24/7</div>
          <div className="flex items-center gap-1.5 text-gray-700">✦ API + Webhooks</div>
        </div>
        <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-2">
          <p className="text-xs text-fuchsia-800">
            📱 <strong>App móvil (PWA)</strong> instalable en iPhone/Android. 
            Push notifications en tiempo real.
          </p>
        </div>
      </div>
    ),
  },

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACTO 4 — "EL IMPACTO"                                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  {
    id: 'before-after',
    route: '/dashboard',
    type: 'overlay',
    content: (
      <div className="space-y-4 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center">La Transformación del Grupo Vidaro</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-xl p-3 border border-red-200">
            <div className="text-center text-sm font-bold text-red-800 mb-2">❌ Sin INMOVA</div>
            <div className="space-y-1.5 text-[10px] text-red-700">
              <p>📋 Excel por cada sociedad</p>
              <p>📞 Inquilinos llaman para todo</p>
              <p>📊 Informes manuales, semanas</p>
              <p>💸 Cobros seguidos a mano</p>
              <p>📁 Documentos en carpetas</p>
              <p>🔧 Incidencias por WhatsApp</p>
              <p>📈 Sin visión consolidada</p>
              <p>⏰ Equipo de 10 personas</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-200">
            <div className="text-center text-sm font-bold text-green-800 mb-2">✅ Con INMOVA</div>
            <div className="space-y-1.5 text-[10px] text-green-700">
              <p>🖥️ Una plataforma, 3 sociedades</p>
              <p>📱 Portal self-service 24/7</p>
              <p>📊 Dashboard tiempo real, 1 click</p>
              <p>💳 SEPA automático 340 cobros</p>
              <p>☁️ Nube + IA organiza todo</p>
              <p>🤖 IA clasifica y asigna sola</p>
              <p>👑 Family Office 360° + PE</p>
              <p>⚡ Equipo de 3 personas</p>
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
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-2">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Impacto Real para Grupo Vidaro</h2>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-black text-green-700">-80%</div>
              <div className="text-[10px] text-green-600">Tiempo administrativo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-700">+15%</div>
              <div className="text-[10px] text-green-600">Ingresos por rentas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-700">-60%</div>
              <div className="text-[10px] text-green-600">Morosidad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-700">-70%</div>
              <div className="text-[10px] text-green-600">Tiempo respuesta</div>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 text-center">
          <p className="text-sm text-indigo-900 font-semibold">
            Todo lo que ha visto está <strong>operativo y listo</strong> para el grupo.
          </p>
          <p className="text-xs text-indigo-700 mt-1">
            100+ módulos · 15 verticales · IA integrada · App móvil · API abierta
          </p>
        </div>
        <p className="text-center text-sm text-gray-500">
          Explore libremente la plataforma. Botón <strong>Presentar Demo</strong> para repetir.
        </p>
      </div>
    ),
  },
];

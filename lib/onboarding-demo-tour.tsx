import React from 'react';
import { Step } from 'react-joyride';

/**
 * TOUR DEMO SHOWCASE — GRUPO VIDARO
 * 
 * 12 pasos con arco dramático: PROBLEMA → SOLUCIÓN → BENEFICIO → PRUEBA
 * Diseñado para presentar la plataforma al equipo y dejar impacto.
 * 
 * Estructura:
 * ACTO 1 — El Reto (2 pasos center)
 * ACTO 2 — La Plataforma (6 pasos alternancia center/right)
 * ACTO 3 — Sin Esfuerzo (2 pasos right)
 * ACTO 4 — El Impacto (2 pasos center)
 */

export const DEMO_USER_EMAIL = 'demo@vidaroinversiones.com';

export const DEMO_SHOWCASE_STEPS: Step[] = [

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  ACTO 1 — "EL RETO"                                         ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ─── PASO 1: BIENVENIDA + EL PROBLEMA ──────────────────────────
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-lg">
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

        <p className="text-[10px] text-gray-400 text-center">
          12 pasos · ~5 min · Incluye demos en vivo
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },

  // ─── PASO 2: LA RESPUESTA — DASHBOARD 360° ────────────────────
  {
    target: '[data-tour="kpi-cards"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-lg">📊</span>
          <div>
            <h3 className="font-bold text-gray-900">Todo el Grupo. Una Pantalla. Tiempo Real.</h3>
            <p className="text-[10px] text-green-600 font-semibold">PASO 2/12</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Ingresos, ocupación, morosidad, alertas y gráficos predictivos — 
          actualizados <strong>al segundo</strong>, no al trimestre.
          Proyecciones a 12 meses con IA que aprende del histórico del grupo.
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
      </div>
    ),
    placement: 'bottom',
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  ACTO 2 — "LA PLATAFORMA"                                   ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ─── PASO 3: MULTI-SOCIEDAD ────────────────────────────────────
  {
    target: '[data-tour="dashboard-link"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-lg">🏢</span>
          <div>
            <h3 className="font-bold text-gray-900">3 Sociedades, 1 Solo Login</h3>
            <p className="text-[10px] text-blue-600 font-semibold">PASO 3/12</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Cambie entre <strong>Vidaro, Rovida y Viroda</strong> instantáneamente. 
          Visión consolidada del holding O detalle por filial. 
          Cada empleado ve <strong>solo lo que le corresponde</strong>.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-xs font-bold text-blue-700">Vidaro</div>
            <div className="text-[9px] text-blue-600">Holding · €253M</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-xs font-bold text-green-700">Rovida</div>
            <div className="text-[9px] text-green-600">17 inmuebles · €46M</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-xs font-bold text-red-700">Viroda</div>
            <div className="text-[9px] text-red-600">5 edificios · €38M</div>
          </div>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ─── PASO 4: INMUEBLES + INQUILINOS ───────────────────────────
  {
    target: '[data-tour="propiedades-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-lg">🏠</span>
          <div>
            <h3 className="font-bold text-gray-900">22 Inmuebles · 340 Inquilinos · Todo Digital</h3>
            <p className="text-[10px] text-indigo-600 font-semibold">PASO 4/12</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Ficha completa de cada propiedad y cada inquilino: fotos, planos, CEE, catastro, 
          historial de pagos, incidencias, scoring IA y documentación.
          Desde Piamonte (€644K/año) hasta cada garaje de H.Tejada.
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
      </div>
    ),
    placement: 'right',
  },

  // ─── PASO 5: PORTAL DEL INQUILINO — EL GRAN WOW ──────────────
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-2">
            <span className="text-2xl">📱</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Portal del Inquilino — Self-Service 24/7</h2>
          <p className="text-[10px] text-blue-600 font-semibold">PASO 5/12 · LA ESTRELLA DE LA PLATAFORMA</p>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Cada uno de sus <strong>340 inquilinos</strong> tiene un portal web y móvil (PWA) 
          donde gestiona <strong>todo sin llamar ni escribir emails</strong>.
        </p>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>💳</span> Pagar online
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>📄</span> Recibos PDF
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>🔧</span> Incidencias
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>💬</span> Chat gestor
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>📝</span> Ver contrato
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>🔄</span> Renovar
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>📂</span> Documentos
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>🤖</span> Chatbot IA
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>⭐</span> Valoraciones
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>🎁</span> Referidos
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>🏆</span> Logros
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-800">
              <span>👤</span> Perfil
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 text-center p-2 bg-red-50 rounded-lg border border-red-100">
            <div className="text-[10px] font-bold text-red-700">❌ Antes</div>
            <div className="text-[9px] text-red-600 mt-0.5">Llamadas, emails, WhatsApp</div>
            <div className="text-[9px] text-red-600">Equipo saturado</div>
          </div>
          <div className="flex-1 text-center p-2 bg-green-50 rounded-lg border border-green-100">
            <div className="text-[10px] font-bold text-green-700">✅ Con INMOVA</div>
            <div className="text-[9px] text-green-600 mt-0.5">85% sin intervención humana</div>
            <div className="text-[9px] text-green-600">Equipo enfocado en valor</div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-500">
          📱 Accesible en <strong>inmovaapp.com/portal-inquilino</strong> · Instalable como app móvil (PWA)
        </p>
      </div>
    ),
    placement: 'center',
  },

  // ─── PASO 6: CONTRATOS + COBROS ───────────────────────────────
  {
    target: '[data-tour="contratos-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-lg">📝</span>
          <div>
            <h3 className="font-bold text-gray-900">Contratos Inteligentes + Cobros SEPA</h3>
            <p className="text-[10px] text-green-600 font-semibold">PASO 6/12</p>
          </div>
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
      </div>
    ),
    placement: 'right',
  },

  // ─── PASO 7: FAMILY OFFICE + FINANZAS ─────────────────────────
  {
    target: '[data-tour="family-office-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-lg">👑</span>
          <div>
            <h3 className="font-bold text-gray-900">Family Office 360° + Control Financiero</h3>
            <p className="text-[10px] text-amber-600 font-semibold">PASO 7/12</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Patrimonio completo en una vista:</strong> inmobiliario + financiero + Private Equity.
          P&L por centro de coste. Previsión a 12 meses. 7.239 asientos contables importados.
        </p>
        <div className="grid grid-cols-4 gap-1 pt-1">
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
        <div className="text-[10px] text-gray-500 pl-1">
          CACEIS · Inversis · Pictet · Banca March · Bankinter · Modelo 720 · Estructura grupo
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ─── PASO 8: IA EN ACCIÓN — DEMO LIVE ────────────────────────
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-2">
            <span className="text-2xl">🧠</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Inteligencia Artificial en Acción</h2>
          <p className="text-[10px] text-violet-600 font-semibold">PASO 8/12 · DEMOS EN VIVO</p>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Claude AI trabaja para el grupo <strong>24 horas, 7 días</strong>. 
          Pruebe estas 3 funciones en directo:
        </p>

        <div className="space-y-2">
          {/* Demo 1 */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🏷️</span>
              <span className="text-xs font-bold text-indigo-900">1. Valoración IA</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Menú → Valoración IA</span>
            </div>
            <p className="text-[10px] text-indigo-800">
              Escriba una dirección de Madrid → valor estimado + comparables + precio/m² en 10 seg
            </p>
          </div>

          {/* Demo 2 */}
          <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-xl p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">📋</span>
              <span className="text-xs font-bold text-purple-900">2. Análisis de Broker</span>
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Menú → Oportunidades IA</span>
            </div>
            <p className="text-[10px] text-purple-800">
              Pegue un PDF de propuesta → la IA extrae datos, analiza riesgos y emite: COMPRAR / NEGOCIAR / DESCARTAR
            </p>
          </div>

          {/* Demo 3 */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">💬</span>
              <span className="text-xs font-bold text-emerald-900">3. Copiloto Financiero</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Botón IA ↘ abajo derecha</span>
            </div>
            <p className="text-[10px] text-emerald-800">
              Pregunte: &quot;¿Cuánto genera Piamonte al año?&quot; o &quot;¿Qué sociedad tiene mejor yield?&quot; — responde al instante
            </p>
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-lg p-2">
          <p className="text-xs text-violet-800 text-center">
            💡 La IA analiza en segundos lo que un equipo tardaría semanas. <strong>50 propuestas analizadas en el tiempo de 1.</strong>
          </p>
        </div>
      </div>
    ),
    placement: 'center',
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  ACTO 3 — "SIN ESFUERZO"                                    ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ─── PASO 9: MANTENIMIENTO + SEGUROS + DOCS ───────────────────
  {
    target: '[data-tour="mantenimiento-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-lg">🔧</span>
          <div>
            <h3 className="font-bold text-gray-900">Operaciones Sin Fricción</h3>
            <p className="text-[10px] text-orange-600 font-semibold">PASO 9/12</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-100 text-center">
            <div className="text-sm mb-0.5">🔧</div>
            <div className="font-bold text-orange-800">Mantenimiento</div>
            <div className="text-orange-600 mt-0.5">IA clasifica urgencia y asigna proveedor auto</div>
          </div>
          <div className="bg-sky-50 rounded-lg p-2 border border-sky-100 text-center">
            <div className="text-sm mb-0.5">🛡️</div>
            <div className="font-bold text-sky-800">Seguros</div>
            <div className="text-sky-600 mt-0.5">Pólizas con alertas, cobertura edificio→unidad</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-center">
            <div className="text-sm mb-0.5">📂</div>
            <div className="font-bold text-gray-800">Documentos</div>
            <div className="text-gray-600 mt-0.5">Escrituras, CEE, ITE en nube. IA organiza todo</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
          <p className="text-xs text-orange-800">
            💡 <strong>-70% tiempo de respuesta</strong> en incidencias. 
            Cero pólizas vencidas. Cualquier documento en 3 seg.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ─── PASO 10: AUTOMATIZACIÓN + PWA ────────────────────────────
  {
    target: '[data-tour="configuracion-link"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-fuchsia-100 text-lg">⚡</span>
          <div>
            <h3 className="font-bold text-gray-900">La Plataforma Trabaja Sola</h3>
            <p className="text-[10px] text-fuchsia-600 font-semibold">PASO 10/12</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          <strong>INMOVA funciona mientras el equipo duerme.</strong> 
          Todo configurable, todo automatizable:
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
            Gestione desde cualquier lugar. Push notifications en tiempo real.
          </p>
        </div>
      </div>
    ),
    placement: 'left',
  },

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║  ACTO 4 — "EL IMPACTO"                                      ║
  // ╚═══════════════════════════════════════════════════════════════╝

  // ─── PASO 11: ANTES VS DESPUÉS ────────────────────────────────
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-lg">
        <div className="text-center mb-1">
          <h2 className="text-xl font-bold text-gray-900">La Transformación del Grupo Vidaro</h2>
          <p className="text-[10px] text-gray-500 font-semibold">PASO 11/12</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* ANTES */}
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
          {/* DESPUÉS */}
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
    placement: 'center',
  },

  // ─── PASO 12: CIERRE + CTA ────────────────────────────────────
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-2">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Impacto Real para Grupo Vidaro
          </h2>
          <p className="text-[10px] text-emerald-600 font-semibold">PASO 12/12 · RESULTADO</p>
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
          Explore libremente. Use los botones de abajo para repetir la presentación.
        </p>
      </div>
    ),
    placement: 'center',
  },
];

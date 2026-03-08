import React from 'react';
import { Step } from 'react-joyride';

/**
 * TOUR DEMO SHOWCASE — GRUPO VIDARO
 * 
 * Tour de presentación diseñado para impresionar al equipo con
 * la potencialidad completa de INMOVA. Cada paso resalta beneficios
 * tangibles con datos reales del grupo.
 * 
 * 15 pasos estratégicos que cubren toda la plataforma.
 */

export const DEMO_USER_EMAIL = 'demo@vidaroinversiones.com';

export const DEMO_SHOWCASE_STEPS: Step[] = [
  // ═══════════════════════════════════════════════════════════════
  // PASO 1: BIENVENIDA ÉPICA
  // ═══════════════════════════════════════════════════════════════
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-3">
            <span className="text-3xl">🏛️</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Bienvenido, Grupo Vidaro
          </h2>
        </div>
        <p className="text-gray-600 text-center text-sm leading-relaxed">
          INMOVA es la <strong>plataforma de gestión inmobiliaria más completa de España</strong>.
          Hoy le mostraremos cómo puede transformar la operación de sus 
          <strong> 3 sociedades, 22+ inmuebles y €337M en activos</strong> en una 
          experiencia 100% digital, automatizada e inteligente.
        </p>
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-indigo-50 rounded-lg">
            <div className="text-lg font-bold text-indigo-700">3</div>
            <div className="text-[10px] text-indigo-600">Sociedades</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">340+</div>
            <div className="text-[10px] text-purple-600">Inquilinos</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">€337M</div>
            <div className="text-[10px] text-blue-600">Activos</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center italic">
          Duración del tour: ~3 minutos
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 2: DASHBOARD — VISIÓN 360° EN TIEMPO REAL
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="kpi-cards"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="font-bold text-gray-900">Dashboard en Tiempo Real</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Todo el grupo en una sola pantalla.</strong> KPIs de ingresos, ocupación, 
          morosidad y alertas actualizados al segundo. Sin esperar informes mensuales: 
          las decisiones se toman con datos de hoy.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-xs text-green-800">
            💡 <strong>Beneficio:</strong> Reducción del 80% en tiempo de reporting. 
            Lo que antes llevaba días ahora se ve en un click.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 3: GRÁFICOS PREDICTIVOS
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="charts"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📈</span>
          <h3 className="font-bold text-gray-900">Análisis Predictivo & Tendencias</h3>
        </div>
        <p className="text-sm text-gray-600">
          Gráficos interactivos que muestran la <strong>evolución de ingresos, ocupación y gastos</strong>.
          Detecte tendencias antes de que se conviertan en problemas. Proyecciones a 12 meses 
          con IA que aprende del histórico del grupo.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs text-blue-800">
            💡 <strong>Beneficio:</strong> Anticipe caídas de ocupación 3 meses antes. 
            Prevea flujo de caja con 95% de precisión.
          </p>
        </div>
      </div>
    ),
    placement: 'top',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 4: GESTIÓN MULTI-SOCIEDAD
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="dashboard-link"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏢</span>
          <h3 className="font-bold text-gray-900">Grupo Multi-Sociedad</h3>
        </div>
        <p className="text-sm text-gray-600">
          Gestione <strong>Vidaro, Rovida y Viroda</strong> desde un único login. 
          Cambie entre sociedades con un click. Visión consolidada del holding 
          O detalle por filial. Cada empleado ve solo lo que le corresponde.
        </p>
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div className="text-center p-1.5 bg-blue-50 rounded border border-blue-100">
            <div className="text-[10px] font-bold text-blue-700">Vidaro</div>
            <div className="text-[9px] text-blue-600">Holding</div>
          </div>
          <div className="text-center p-1.5 bg-green-50 rounded border border-green-100">
            <div className="text-[10px] font-bold text-green-700">Rovida</div>
            <div className="text-[9px] text-green-600">17 inmuebles</div>
          </div>
          <div className="text-center p-1.5 bg-red-50 rounded border border-red-100">
            <div className="text-[10px] font-bold text-red-700">Viroda</div>
            <div className="text-[9px] text-red-600">5 edificios</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800">
            💡 <strong>Beneficio:</strong> Elimine las hojas de Excel separadas por sociedad. 
            Un solo sistema, múltiples vistas, control total.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 5: PROPIEDADES & EDIFICIOS
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="propiedades-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏠</span>
          <h3 className="font-bold text-gray-900">Gestión Inmobiliaria Total</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>22 inmuebles, cientos de unidades, todo digitalizado.</strong> Ficha completa 
          de cada propiedad: fotos, planos, CEE, metros, catastro. 
          Desde el Prado de Rovida (€644K/año) hasta cada garaje de H.Tejada.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
          <p className="text-xs text-indigo-800">
            💡 <strong>Beneficio:</strong> Localice cualquier dato de cualquier propiedad 
            en menos de 5 segundos. Fin de las carpetas y documentos dispersos.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 6: INQUILINOS & CONTRATOS
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="inquilinos-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h3 className="font-bold text-gray-900">340+ Inquilinos Gestionados con IA</h3>
        </div>
        <p className="text-sm text-gray-600">
          Ficha completa de cada inquilino, historial de pagos, 
          incidencias, documentación y <strong>scoring automático</strong>. 
          Portal del inquilino donde pagan, reportan incidencias y descargan recibos 
          <strong>sin intervención humana</strong>.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
          <p className="text-xs text-purple-800">
            💡 <strong>Beneficio:</strong> Ahorre 20+ horas/semana en gestión administrativa. 
            Los inquilinos se autogestionan desde su portal.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 7: CONTRATOS DIGITALES
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="contratos-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <h3 className="font-bold text-gray-900">Contratos Inteligentes</h3>
        </div>
        <p className="text-sm text-gray-600">
          Generación automática de contratos con plantillas legales. 
          <strong>Actualización IPC automática</strong>, alertas de vencimiento 
          90 días antes, renovación en lote y firma digital integrada. 
          Garantías, fianzas y depósitos centralizados.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
          <p className="text-xs text-green-800">
            💡 <strong>Beneficio:</strong> Cero contratos olvidados. Cero subidas de IPC 
            perdidas. Renovaciones automáticas que maximizan ingresos.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 8: FAMILY OFFICE 360°
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="family-office-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <h3 className="font-bold text-gray-900">Family Office 360°</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Patrimonio consolidado: inmobiliario + financiero + Private Equity.</strong> 
          460+ instrumentos financieros de Vidaro (CACEIS, Inversis, Pictet, Banca March, Bankinter) 
          junto con los activos inmobiliarios en una sola vista.
        </p>
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <div className="text-center p-1.5 bg-amber-50 rounded border border-amber-100">
            <div className="text-xs font-bold text-amber-700">€253M</div>
            <div className="text-[9px] text-amber-600">Contabilidad Vidaro</div>
          </div>
          <div className="text-center p-1.5 bg-amber-50 rounded border border-amber-100">
            <div className="text-xs font-bold text-amber-700">460+</div>
            <div className="text-[9px] text-amber-600">Instrumentos</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800">
            💡 <strong>Beneficio:</strong> Visión patrimonial completa en un dashboard. 
            Modelo 720, estructura grupo, P&L consolidado por sociedad.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 9: INTELIGENCIA ARTIFICIAL
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="valoraciones-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h3 className="font-bold text-gray-900">IA Integrada en Toda la Plataforma</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Claude AI trabajando para el grupo 24/7.</strong> Valoración automática 
          de inmuebles, clasificación inteligente de incidencias, matching inquilino-propiedad, 
          análisis de oportunidades de inversión con scoring y pipeline Kanban.
        </p>
        <ul className="text-xs text-gray-500 space-y-0.5 pl-3">
          <li>✦ Valoración IA con comparables de mercado</li>
          <li>✦ 51 features en oportunidades de inversión</li>
          <li>✦ Copiloto financiero que responde preguntas sobre la contabilidad</li>
          <li>✦ Análisis de propuestas de brokers con veredicto automático</li>
        </ul>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-2">
          <p className="text-xs text-violet-800">
            💡 <strong>Beneficio:</strong> Decisiones de inversión 10x más rápidas. 
            La IA analiza lo que un equipo tardaría semanas.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 10: CUADRO DE MANDOS FINANCIERO
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="cuadro-mandos-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h3 className="font-bold text-gray-900">Cuadro de Mandos Financiero</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>P&L por centro de coste en tiempo real.</strong> Cada edificio, cada sociedad, 
          el grupo consolidado. Importación directa de contabilidad (7.239 asientos del grupo en 2025), 
          conciliación bancaria, previsión fiscal trimestral.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
          <p className="text-xs text-emerald-800">
            💡 <strong>Beneficio:</strong> Sepa exactamente cuánto genera cada inmueble. 
            Detecte centros de coste deficitarios al instante. Previsión a 12 meses.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 11: PAGOS & COBROS AUTOMÁTICOS
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="pagos-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💳</span>
          <h3 className="font-bold text-gray-900">Cobros Automáticos & SEPA</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Cobro automático de 340+ alquileres cada mes.</strong> Domiciliación SEPA, 
          recordatorios automáticos, detección de morosidad en tiempo real, 
          generación de recibos y envío por email sin intervención.
        </p>
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-2">
          <p className="text-xs text-teal-800">
            💡 <strong>Beneficio:</strong> Morosidad reducida un 60%. Cobros que antes 
            requerían días de gestión manual ahora se procesan solos.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 12: OPERACIONES & MANTENIMIENTO
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="mantenimiento-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔧</span>
          <h3 className="font-bold text-gray-900">Mantenimiento Inteligente</h3>
        </div>
        <p className="text-sm text-gray-600">
          Los inquilinos reportan incidencias desde su portal. <strong>La IA clasifica automáticamente</strong> 
          la urgencia, categoría y proveedor recomendado. Órdenes de trabajo, seguimiento 
          de costes y tiempo de resolución medido.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
          <p className="text-xs text-orange-800">
            💡 <strong>Beneficio:</strong> Tiempo de respuesta reducido un 70%. 
            Priorización automática de urgencias. Histórico de costes por inmueble.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 13: SEGUROS & DOCUMENTACIÓN
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="seguros-menu"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <h3 className="font-bold text-gray-900">Seguros & Gestión Documental</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>Todas las pólizas parametrizadas con alertas de vencimiento.</strong> 
          Documentos almacenados en la nube (AWS S3), accesibles al instante. 
          Cobertura propagada automáticamente de edificio a cada unidad. 
          Escrituras, contratos, CEE, ITE, licencias — todo organizado con IA.
        </p>
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-2">
          <p className="text-xs text-sky-800">
            💡 <strong>Beneficio:</strong> Nunca más una póliza vencida sin renovar. 
            Cualquier documento localizado en 3 segundos.
          </p>
        </div>
      </div>
    ),
    placement: 'right',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 14: AUTOMATIZACIÓN TOTAL
  // ═══════════════════════════════════════════════════════════════
  {
    target: '[data-tour="configuracion-link"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h3 className="font-bold text-gray-900">Automatización sin Límites</h3>
        </div>
        <p className="text-sm text-gray-600">
          <strong>La plataforma trabaja mientras usted duerme.</strong> Emails automáticos, 
          webhooks, alertas inteligentes, cobros SEPA programados, renovaciones de contrato, 
          actualización de IPC, informes mensuales generados y enviados sin intervención.
        </p>
        <ul className="text-xs text-gray-500 space-y-0.5 pl-3">
          <li>✦ Portal inquilino 24/7 (pago, incidencias, documentos)</li>
          <li>✦ Chatbot IA de soporte que resuelve consultas al instante</li>
          <li>✦ Notificaciones push, email y SMS configurables</li>
          <li>✦ API abierta para integraciones con cualquier sistema</li>
        </ul>
        <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-2">
          <p className="text-xs text-fuchsia-800">
            💡 <strong>Beneficio:</strong> Un equipo de 3 personas gestiona 
            lo que antes requería 10. Automatización = escalabilidad.
          </p>
        </div>
      </div>
    ),
    placement: 'left',
  },

  // ═══════════════════════════════════════════════════════════════
  // PASO 15: CIERRE WOW — CALL TO ACTION
  // ═══════════════════════════════════════════════════════════════
  {
    target: 'body',
    content: (
      <div className="space-y-4 max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-3">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            INMOVA para Grupo Vidaro
          </h2>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
          <h4 className="font-semibold text-indigo-900 text-sm mb-2">Lo que acabamos de ver:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Dashboard multi-sociedad</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Family Office 360°</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">IA integrada (Claude)</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Cobros automáticos SEPA</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Contratos inteligentes</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Cuadro mandos financiero</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Seguros & documentación</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-green-500 mt-0.5">✓</span>
              <span className="text-gray-700">Automatización total</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
          <h4 className="font-semibold text-green-900 text-sm mb-1.5">Impacto estimado para el grupo:</h4>
          <div className="space-y-1 text-xs text-green-800">
            <p>📉 <strong>-80%</strong> tiempo de reporting y administración</p>
            <p>📈 <strong>+15%</strong> ingresos por rentas (IPC automático + ocupación)</p>
            <p>💰 <strong>-60%</strong> morosidad con cobros automatizados</p>
            <p>⚡ <strong>-70%</strong> tiempo de respuesta en mantenimiento</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 font-medium">
          Explore libremente la plataforma. Todo lo que ve está 
          <strong> operativo y listo</strong> para su grupo.
        </p>
      </div>
    ),
    placement: 'center',
  },
];

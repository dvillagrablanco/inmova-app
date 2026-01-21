# INMOVA PROJECT RESCUE PLAN (FASE 1 - AUDITORIA FORENSE)

Fecha: 2026-01-21
Alcance: /app, /components, /lib, /prisma

Objetivo:
Exponer integracion fantasma (mocks, endpoints desconectados, botones zombies)
y dejar un mapa accionable para la fase 2.

---

## 1) Detector de mentiras (Mocks & Hardcoding)

### UI con datos mock / estaticos
- app/seguros/analisis/page.tsx:L32-L73
  - Stats, claimsByType, claimsByMonth, topClaimProperties son hardcode.
  - TODO de fetch real y export sin implementacion (L82-L95).
- app/viajes-corporativos/policies/page.tsx:L54-L134
  - POLITICAS y PROVEEDORES en arrays fijos.
- app/viajes-corporativos/expense-reports/page.tsx:L55-L93
  - GASTOS_MENSUALES, GASTOS_CATEGORIA, GASTOS_DEPARTAMENTO, INFORMES, ALERTAS hardcode.
- app/proveedor/page.tsx:L69-L110
  - Dashboard usa stats y recentBookings mock; fetch real comentado.
- app/presupuestos/page.tsx:L106-L108
  - mockBudgets definido; create se hace en estado local (L232-L273), no persiste.
- app/professional/invoicing/page.tsx:L71-L144
  - Facturas mock; no fetch real.
  - Charts mock (L192-L200).
- app/dashboard-adaptive/page.tsx:L49-L60
  - Stats mock en setStats (sin API real).
- app/construction/gantt/page.tsx:L64-L118
  - Permits y phases mock con TODO de API.
- app/ejemplo-ux/page.tsx:L88-L110
  - Simula llamada y setItems(mockData).
- app/(protected)/str-advanced/guest-experience/page.tsx:L14-L39
  - Reviews hardcode con nombres de ejemplo.
- app/iot/page.tsx:L313-L323
  - Datos de temperatura/energia generados al vuelo (mock charts).
- app/admin/marketplace/page.tsx:L187-L203
  - Providers en blanco con TODO de API; solo stats y services cargan.

### Servicios backend con respuestas mock / stub
- lib/ai-assistant-service.ts:L100-L118
  - simulateCommandExecution devuelve mock-id y resultados vacios.
- lib/digital-signature-service.ts:L98-L154 y L187-L201
  - Signaturit/DocuSign en modo mock (URLs demo, buffers mock).
- lib/property-valuation-service.ts:L158-L180
  - fetchExternalMarketData usa precios mock por ciudad.
- lib/social-media-automation-service.ts:L294-L342
  - publishToSocialMedia usa URL mock y no integra APIs reales.
- lib/modules/shared/pdf/generator.ts:L31-L38
  - Generacion PDF stub (Mock PDF content).
- lib/modules/shared/ocr/document-ocr.ts:L23-L33
  - OCR documento mock.
- lib/modules/shared/ocr/image-ocr.ts:L22-L29
  - OCR imagen mock.
- lib/modules/shared/ai/chat.ts:L23-L30
  - Respuesta AI mock.
- lib/analytics-service.ts:L391-L401
  - Metricas mock (avgHitLatency, avgQueryTime, p50).
- lib/db.ts:L55-L58
  - Prisma retorna mock en build-time (puede ocultar fallos en runtime).

---

## 2) Enlaces muertos (Frontend vs Backend)

### Endpoints llamados que NO existen en /app/api
- components/wizards/PropertyWizard.tsx:L74-L85
  - POST /api/edificios -> no existe (no hay app/api/edificios).
  - Debe mapear a /api/buildings o crear endpoint alias.
- components/wizards/RoomRentalWizard.tsx:L642-L656
  - POST /api/room-rental/properties -> no existe (solo /api/room-rental/rooms, /payments, etc).
- components/ui/notification-center.tsx:L80-L84
  - PATCH /api/notifications/read-all -> no existe (existe /api/notifications/mark-all-read).
- components/ui/notification-center.tsx:L109-L112
  - DELETE /api/notifications/delete-read -> no existe.
- app/votaciones/page.tsx:L137-L215
  - GET/POST /api/votaciones y GET /api/votaciones/:id -> no existen.
  - Solo existe /api/votaciones/[id]/votar.
- app/reuniones/page.tsx:L93-L184
  - CRUD /api/reuniones y /api/reuniones/:id -> no existen.
  - Solo existe /api/reuniones/[id]/generar-acta.
- app/valoraciones/page.tsx:L84-L112
  - GET/POST /api/valoraciones -> no existe.
  - Existe /api/valuations (ingles) con estimate y stats.
- app/proveedor/page.tsx:L69-L70
  - TODO /api/proveedor/dashboard -> no existe (solo /api/portal-proveedor/dashboard).
- app/seguros/analisis/page.tsx:L82-L83 (comentado)
  - /api/insurances/analytics -> no existe (solo /api/seguros).

### Backend existe pero UI NO conecta (integracion fantasma)
- Viajes corporativos: hay /api/viajes-corporativos/*, pero policies/expense UI usa mocks.
  - Evidencia UI: app/viajes-corporativos/policies/page.tsx:L54-L134
  - Evidencia UI: app/viajes-corporativos/expense-reports/page.tsx:L55-L93

---

## 3) Botones zombie (UI sin accion real)

Ejemplos con UI visible y sin handler:
- app/viajes-corporativos/policies/page.tsx:L422-L427
  - Botones "Editar" y "Trash" sin onClick.
- app/viajes-corporativos/policies/page.tsx:L454-L457
  - "Anadir Proveedor" sin onClick.
- app/proveedor/page.tsx:L298-L301
  - Boton "Ver" en reservas sin handler.
- app/presupuestos/page.tsx:L755-L760
  - Iconos "Ver" y "Descargar" sin handler.
- app/(protected)/str-advanced/guest-experience/page.tsx:L109-L112
  - "Solicitar Resenas" sin handler.

Acciones con feedback falso (toast sin backend):
- app/seguros/analisis/page.tsx:L93-L96 (Exportar solo toast).
- app/viajes-corporativos/expense-reports/page.tsx:L110-L119 (Exportar/Generar solo toast).

---

## 4) Integridad de terceros (Zucchetti y APIs externas)

### Zucchetti
- lib/zucchetti-integration-service.ts:L100-L121
  - Servicio en modo DEMO: axios y OAuth comentados, sin llamadas reales.
  - Riesgo: UI/Endpoints de integracion existen pero no sincronizan datos.

### ContaSimple
- lib/contasimple-integration-service.ts:L1-L170
  - @ts-nocheck + sin validacion de esquema de respuesta.
  - No hay circuit breaker ni timeouts consistentes.

### Firmas digitales
- lib/digital-signature-service.ts:L98-L154 y L187-L201
  - Signaturit/DocuSign en modo mock (URLs demo y buffers mock).

### Social/AI/OCR/PDF
- Social media: lib/social-media-automation-service.ts:L294-L342 (URL mock).
- AI chat: lib/modules/shared/ai/chat.ts:L23-L30 (respuesta mock).
- OCR: lib/modules/shared/ocr/*.ts (mock).
- PDF: lib/modules/shared/pdf/generator.ts:L31-L38 (mock).

### A3 Software
- lib/a3-integration-service.ts:L79-L126
  - No hay timeouts, retries ni parsing de errores; riesgo de cuelgues silenciosos.

---

## 5) Prisma: cobertura incompleta para features visibles

Busqueda en prisma/schema.prisma no encuentra modelos para:
- Presupuesto/Budget
- Votacion
- Reunion
- Viajes corporativos (policies/expenses)
- Invoicing profesional (facturas)

Consecuencia:
No hay persistencia real para varias pantallas ya publicadas.

---

## 6) Prioridad de reparacion (Fase 2)

### P0 (bloqueante, core del producto)
1) Conectar endpoints faltantes:
   - /api/edificios -> usar /api/buildings o crear alias.
   - /api/room-rental/properties -> crear ruta y modelo real.
   - /api/votaciones (list/create/update/delete).
   - /api/reuniones (list/create/update/delete).
   - /api/valoraciones -> alinear con /api/valuations o crear alias.
   - /api/notifications/read-all y /delete-read -> crear o renombrar en UI.
2) Presupuestos:
   - Reemplazar create local por POST real (/api/budgets).
3) Eliminar mocks de dashboards criticos:
   - proveedor, professional/invoicing, construction/gantt, viajes-corporativos, seguros/analisis.

### P1 (alta)
4) Integracion real de firmas (Signaturit/DocuSign).
5) Integracion real de social media.
6) Sustituir OCR/PDF/AI mocks por servicios reales.
7) Completar stats del dashboard adaptativo con endpoints reales.

### P2 (media)
8) Circuit breaker, timeouts y validacion de respuestas (Zod) para integraciones.
9) Normalizar rutas espanol/ingles y documentar API.

---

## 7) Reglas de ejecucion para Fase 2 (obligatorio)
- Prohibido mockear: si falta endpoint, se crea y se conecta a Prisma real.
- Feedback real: todos los botones deben mostrar loading + toast de exito/error.
- Tipado estricto: sin any en nuevas respuestas; definir interfaces.
- Por cada arreglo: crear test de integracion que verifique escritura en DB.

---

## 8) Siguientes pasos inmediatos
1) Confirmar con producto la ruta canonica (es/en) para endpoints.
2) Definir modelos Prisma faltantes (Budget, Votacion, Reunion, Viajes).
3) Empezar por P0 con una feature completa de punta a punta:
   - UI -> API -> Prisma -> test de integracion.


# AUDITORÍA DE CAJA BLANCA - INMOVA APP

**Fecha:** 7 de febrero de 2026  
**Auditor:** Arquitecto de Software Senior / Red Team  
**Repositorio:** Inmova PropTech Platform  
**Temperatura de análisis:** 0.0 (Modo Forense)  
**Archivos escaneados:** ~888 API routes, ~541 páginas, ~445 archivos lib, ~434 componentes

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| **Hallazgos CRÍTICOS** | 7 |
| **Hallazgos ALTOS** | 9 |
| **Hallazgos MEDIOS** | 8 |
| **Hallazgos BAJOS** | 5 |
| **Total** | **29** |

---

## PRISMA 1: LA VERDAD DE LOS DATOS (Data Integrity)

| ID | Severidad | Hallazgo | Archivo(s) | Evidencia | Impacto |
|---|---|---|---|---|---|
| D-01 | **CRITICO** | **Vapi webhook devuelve datos 100% FAKE hardcodeados**. Funciones como `search_properties`, `check_payment_status`, `get_contract_info`, `get_market_data`, `start_valuation` devuelven JSON estático sin consultar BD. NO hay ningún `prisma.` call. | `app/api/vapi/webhook/route.ts` (líneas 272-292, 328-336, 346-357, 443-452, 426-439) | `properties: [{ id: 'PROP-001', address: 'Calle Mayor 123', price: 1200 }]` hardcodeado. `check_payment_status` siempre devuelve `{ lastPayment: { date: '2026-01-15', amount: 1200, status: 'pagado' } }`. `start_valuation` usa `const pricePerSqm = 3500;` hardcodeado. | Un cliente llamando por teléfono recibirá datos inventados. Si un inquilino pregunta por su pago, siempre le dirán que está pagado aunque deba 6 meses. La valoración IA por voz es una multiplicación con un número fijo. |
| D-02 | **ALTO** | **S3 Service devuelve URLs de placeholder.com cuando AWS no está configurado**. El upload "funciona" (retorna `success: true`) pero la URL apunta a una imagen genérica de via.placeholder.com. | `lib/s3-service.ts` (líneas 44-47, 137-154) | `return this.simulateUpload(filename, folder)` que genera `url: 'https://via.placeholder.com/800x600/...'` con `success: true`. | Los documentos, fotos de propiedades y contratos firmados "suben exitosamente" pero no existen. La UI mostrará thumbnails genéricos violetas de placeholder.com como si fueran fotos reales de propiedades. |
| D-03 | **ALTO** | **Datos demo se insertan en la BD real de producción**. El endpoint genera edificios, unidades, inquilinos y contratos de mentira directamente en la base de datos del tenant. | `app/api/automation/generate-demo-data/route.ts` (líneas 11-212) | Inquilinos con datos ficticios (`juan.garcia@example.com`, DNI `12345678A`, scoring `850`) insertados con `prisma.building.create`, `prisma.tenant.create`, `prisma.contract.create`. | Los datos demo son indistinguibles de datos reales en la BD. Un gestor podría confundir inquilinos ficticios con reales. Los reportes financieros incluirán rentas de contratos demo. |
| D-04 | **MEDIO** | **Planes de suscripción duplicados con precios contradictorios**. Existen DOS sistemas de seed de planes (`seed-plans` y `init-all-data`) con precios diferentes para el mismo concepto "Profesional". | `app/api/admin/seed-plans/route.ts` vs `app/api/admin/init-all-data/route.ts` | Plan "Profesional" en seed-plans: **149€/mes**, 10 usuarios, 200 propiedades. Plan "Profesional" en init-all-data: **59€/mes**, 5 usuarios, 25 propiedades. Ambos escriben en `prisma.subscriptionPlan`. | Si se ejecutan ambos seeds, el precio final depende del orden de ejecución. Un cliente podría ver 59€ en la landing pero facturársele 149€. |
| D-05 | **MEDIO** | **Plan "Owner" con 9999 propiedades y 0€/mes oculto**. Plan interno sin restricciones marcado como `esInterno: true` pero insertado en la misma tabla que los planes de clientes. | `app/api/admin/seed-plans/route.ts` (líneas 18-36) | `tier: 'premium', precioMensual: 0, maxUsuarios: 999, maxPropiedades: 9999, aiTokensIncludedMonth: 10000000`. | Cualquier bug en el filtro `esInterno` expondría este plan a clientes. Comparte `tier: 'premium'` con el plan Premium de 999€, creando ambigüedad en queries por tier. |

---

## PRISMA 2: SEGURIDAD Y BLINDAJE (Security)

| ID | Severidad | Hallazgo | Archivo(s) | Evidencia | Impacto |
|---|---|---|---|---|---|
| S-01 | **CRITICO** | **Signaturit webhook ACEPTA cualquier POST sin verificar firma cuando no hay secret configurado**. La función `verifyWebhookSignature` devuelve `true` si `SIGNATURIT_WEBHOOK_SECRET` no está definido. En producción, la verificación se salta silenciosamente. | `lib/signaturit-service.ts` (líneas 347-351), `app/api/webhooks/signaturit/route.ts` (línea 55) | `if (!SIGNATURIT_WEBHOOK_SECRET) { return true; }`. Además, en el webhook handler: `if (!isValid && process.env.NODE_ENV === 'production')` -- solo rechaza en producción Y si hay secret. Sin secret, pasa siempre. | Un atacante puede enviar un POST a `/api/webhooks/signaturit` con payload falso y ACTIVAR contratos (cambiar `estado` a `'ACTIVO'`), cancelarlos, o marcar firmas como completadas. Bypass total de firma digital legal. |
| S-02 | **CRITICO** | **Stripe webhook acepta JSON crudo sin verificación cuando `STRIPE_WEBHOOK_SECRET` está vacío**. Fallback a `JSON.parse(body)` directo sin ninguna validación de firma. | `app/api/webhooks/stripe/route.ts` (líneas 65-70) | `if (webhookSecret) { event = getStripe().webhooks.constructEvent(...); } else { event = JSON.parse(body); }`. El `webhookSecret` se inicializa como `process.env.STRIPE_WEBHOOK_SECRET \|\| ''`, que es falsy si no está definido. | Un atacante puede fabricar eventos de `payment_intent.succeeded` falsos y marcar pagos como "pagado" en la BD, o crear suscripciones fraudulentas sin pago real. |
| S-03 | **CRITICO** | **Vapi webhook NO tiene NINGUNA autenticación ni verificación de firma**. Acepta cualquier POST con JSON válido. Sin session check, sin API key, sin HMAC. | `app/api/vapi/webhook/route.ts` (líneas 50-55) | `const payload: VapiWebhookPayload = await request.json();` -- parsea el body directo sin verificar nada. Además `console.log('[Vapi Webhook]', message.type, JSON.stringify(message, null, 2));` loguea TODO el payload incluyendo datos de clientes. | Cualquier actor puede enviar requests y activar funciones (crear leads, programar visitas, registrar incidencias). El `console.log` imprime nombres, teléfonos y emails de clientes en los logs del servidor. |
| S-04 | **ALTO** | **`console.log` imprime VAPID Private Key y Public Key**. La función `generateVapidKeys()` imprime las claves criptográficas en texto plano en stdout. | `lib/push-notifications.ts` (líneas 208-210) | `console.log('Public Key:', keys.publicKey); console.log('Private Key:', keys.privateKey);` | Si esta función se invoca en producción (o durante un deploy), las claves privadas quedan en los logs de PM2/stdout, accesibles a cualquiera con acceso a logs. |
| S-05 | **ALTO** | **Middleware NO verifica autenticación ni autorización**. Solo maneja i18n (internacionalización). No hay middleware de auth para proteger rutas `/admin`, `/dashboard`, etc. | `middleware.ts` (líneas 14-65) | El middleware completo solo evalúa si aplicar `intlMiddleware` para 2 rutas de localización. Para TODAS las demás rutas: `return NextResponse.next();`. Cero verificación de session o JWT. | La protección de rutas admin/dashboard depende SOLO de que cada API route verifique sesión individualmente. Si alguna se olvida (ver hallazgo S-06), queda completamente expuesta. |
| S-06 | **ALTO** | **API de planes admin retorna datos vacíos en lugar de 403 cuando no hay auth**. En lugar de rechazar, devuelve `{ planes: [], _authRequired: true }` con HTTP 200. | `app/api/admin/planes/route.ts` (líneas 50-57) | `if (!ADMIN_ROLES.includes(session.user.role)) { return NextResponse.json({ planes: [], total: 0, _authRequired: true }); }` -- retorna 200 OK con hint de auth. | Un atacante puede enumerar endpoints admin para descubrir cuáles dan 200 vs 401, mapeando la superficie de ataque. El campo `_authRequired: true` confirma que el endpoint existe y es admin. |
| S-07 | **MEDIO** | **`error.message` se expone al cliente en ~50+ API routes**. Los detalles internos del error se envían como `details: error.message` en la respuesta JSON. | Múltiples: `app/api/b2b-billing/*/route.ts`, `app/api/admin/*/route.ts`, `app/api/automation/*/route.ts` | `return NextResponse.json({ error: '...', details: error.message }, { status: 500 })` en prácticamente todos los catch blocks. | Stack traces, nombres de tablas Prisma, y detalles de infraestructura se filtran al cliente. Ejemplo: un error de Prisma expone el schema de la BD (`Table 'X' does not exist`). |
| S-08 | **MEDIO** | **`as any` usado extensivamente en callbacks de autenticación (auth-options.ts)**. Los tipos de session, token, y user se castean a `any` para acceder a campos custom. | `lib/auth-options.ts` (líneas 164, 181-195) | `role: 'sales_representative' as any`, `(session.user as any).id = token.id`, `(session.user as any).role = token.role` -- 6 casteos a `any` en el flujo de auth. | Cualquier typo en un campo (ej: `token.roel` en vez de `token.role`) compilará sin errores pero fallará silenciosamente en runtime, potencialmente dando acceso sin role verificado. |

---

## PRISMA 3: INTEGRACIONES EXTERNAS (Connectivity)

| ID | Severidad | Hallazgo | Archivo(s) | Evidencia | Impacto |
|---|---|---|---|---|---|
| I-01 | **ALTO** | **Webhook de Signaturit retorna 200 OK incluso cuando hay errores de procesamiento**. El catch block devuelve `{ received: true, error: error.message }` con status 200. | `app/api/webhooks/signaturit/route.ts` (líneas 109-114) | `catch (error: any) { return NextResponse.json({ received: true, error: error.message }); }` -- Signaturit interpreta 200 como "procesado correctamente" y NO reintenta. | Si hay un error de BD o lógica al procesar una firma completada, Signaturit no reintentará. El contrato quedará en estado inconsistente (firmado en Signaturit pero no actualizado en Inmova) sin ninguna alerta. |
| I-02 | **ALTO** | **3 endpoints de webhook de Stripe duplicados con lógica diferente**. Existen 3 handlers para Stripe webhooks, cada uno con su propia lógica de procesamiento. | `/api/webhooks/stripe/route.ts` (670 líneas), `/api/stripe/webhook/route.ts` (352 líneas), `/api/b2b-billing/webhook/route.ts` (216 líneas) | Tres archivos separados, cada uno importa Stripe independientemente, cada uno con su propia versión de `apiVersion` (`'2024-11-20.acacia'` vs `'2025-12-15.clover'`). | Si el webhook de Stripe está configurado para apuntar a UNO de los 3 endpoints, los otros 2 son dead code. Si apuntan a endpoints distintos, la lógica se fragmenta y los pagos pueden procesarse parcialmente. Las versiones de API de Stripe son incompatibles entre sí. |
| I-03 | **MEDIO** | **Vapi webhook NO persiste datos en BD**. TODAS las funciones devuelven respuestas con IDs generados por `Date.now()` pero no guardan nada. | `app/api/vapi/webhook/route.ts` (líneas 193-306) | `messageId: 'MSG-${Date.now()}'`, `ticketId: 'TKT-${Date.now()}'`, `leadId: 'LEAD-${Date.now()}'` -- IDs ficticios sin `prisma.create`. `handleStatusUpdate` y `handleEndOfCallReport` solo hacen `console.log`. | Los leads capturados por IA telefónica se PIERDEN completamente. Cada interacción es efímera. No hay registro de llamadas, tickets, ni mensajes. El sistema de Vapi es una cáscara decorativa. |
| I-04 | **MEDIO** | **S3 Service usa credenciales vacías como fallback sin fallar**. Si `AWS_ACCESS_KEY_ID` no está configurada, el cliente S3 se inicializa con strings vacíos. | `lib/s3-service.ts` (líneas 12-17) | `credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID \|\| '', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY \|\| '' }` | El S3Client se crea con credenciales vacías y fallará en runtime con errores crípticos de AWS en lugar de fallar temprano con un mensaje claro. La función `simulateUpload` enmascara el fallo. |

---

## PRISMA 4: LÓGICA DE NEGOCIO (Workflow Completeness)

| ID | Severidad | Hallazgo | Archivo(s) | Evidencia | Impacto |
|---|---|---|---|---|---|
| W-01 | **CRITICO** | **Notificaciones de firma completada, rechazada y expirada están COMENTADAS**. Los handlers de Signaturit no notifican al propietario cuando ocurren eventos de firma. | `app/api/webhooks/signaturit/route.ts` (líneas 241, 277, 309) | `// await sendContractSignedNotification(contract);`, `// await sendContractDeclinedNotification(contract);`, `// await sendContractExpiredNotification(contract);` -- las 3 líneas están comentadas. | Cuando un inquilino firma un contrato, el propietario NO recibe notificación. Cuando un inquilino rechaza la firma, NADIE se entera. Cuando una firma expira, el sistema la marca silenciosamente como borrador sin avisar. |
| W-02 | **ALTO** | **Vapi `leave_message` y `create_lead` NO crean registros en CRM**. Los comentarios dicen "Aquí integrarías con tu sistema de mensajes/tickets" y "Aquí integrarías con tu CRM", pero la función solo devuelve JSON estático. | `app/api/vapi/webhook/route.ts` (líneas 193-206, 301-307) | `case 'leave_message': return { success: true, messageId: 'MSG-${Date.now()}', message: '...' };` y `case 'create_lead': return { success: true, leadId: 'LEAD-${Date.now()}' };` -- sin persistencia. | Los clientes potenciales que dejan mensajes por teléfono creen que fueron registrados, pero sus datos se evaporan al terminar la llamada. Pérdida directa de leads de venta. |
| W-03 | **ALTO** | **`check_appointment_availability` devuelve disponibilidad FAKE**. Siempre retorna 3 slots fijos sin consultar ningún sistema de calendario. | `app/api/vapi/webhook/route.ts` (líneas 229-239) | `slots: [{ date: 'mañana', time: '10:00' }, { date: 'mañana', time: '12:00' }, { date: 'mañana', time: '16:00' }]` -- hardcodeado, no consulta Google Calendar ni BD. | Un cliente podría agendar una cita a una hora que ya está ocupada. Se generarían conflictos de agenda sin ningún sistema que los detecte. |
| W-04 | **MEDIO** | **Flujo de contrato NO valida que el inquilino tenga scoring suficiente antes de generar contrato**. El endpoint de generar contrato no verifica `scoring` ni `ingresosMensuales` del inquilino. | `app/api/automation/generate-demo-data/route.ts` (líneas 283-306) | Los contratos se crean directamente con `prisma.contract.create` asociando cualquier inquilino a cualquier unidad sin validación de solvencia. | Se pueden generar contratos con inquilinos insolventes. El scoring del inquilino (que sí se almacena) no se usa en la lógica de negocio de contratación. |
| W-05 | **BAJO** | **Funciones Vapi de "escalate_incident" y "request_emergency_service" son simulaciones**. Devuelven teléfonos ficticios y tickets sin crear nada en BD. | `app/api/vapi/webhook/route.ts` (líneas 408-421) | `technicianPhone: '+34 600 999 999'` hardcodeado. `emergencyTicket: 'EMG-${Date.now()}'` sin persistencia. | Un inquilino que reporta una emergencia (fuga de gas, inundación) recibirá un número de teléfono inexistente y un ticket que no existe en ningún sistema. |

---

## PRISMA 5: CALIDAD TÉCNICA (Architecture & Stability)

| ID | Severidad | Hallazgo | Archivo(s) | Evidencia | Impacto |
|---|---|---|---|---|---|
| T-01 | **ALTO** | **`any` masivo en webhook de Signaturit: 12 usos en un único archivo crítico**. Todos los handlers de firma digital usan `contract: any, data: any`, eliminando cualquier type-safety en el flujo de firma legal. | `app/api/webhooks/signaturit/route.ts` | 12 instancias de `: any` en las funciones `handleSignatureReady(contract: any, data: any)`, `handleSignatureCompleted(contract: any, data: any)`, etc. | Un typo como `data.documemts` (en vez de `data.documents`) no será detectado por el compilador. En un flujo de firma digital con implicaciones legales, esto es inaceptable. |
| T-02 | **ALTO** | **`any` en flujo de autenticación**. Los callbacks de JWT y session en NextAuth castean TODOS los campos a `any`, anulando el type-checking en el punto más crítico de seguridad. | `lib/auth-options.ts` (líneas 181-196) | `(session.user as any).id`, `(session.user as any).role`, `(session.user as any).companyId`, `(user as any).role`, etc. Total: 8 casteos en el flujo auth. | Si `token.companyId` fuera `undefined` por un bug, se propagaría silenciosamente a toda la sesión. Queries de Prisma con `where: { companyId: undefined }` retornarían TODOS los registros de TODAS las empresas. |
| T-03 | **ALTO** | **`any` en `ai/document-analysis/route.ts`: 11 usos**. El endpoint que analiza documentos legales (contratos, facturas) no tiene tipos en puntos donde se parsean datos financieros. | `app/api/ai/document-analysis/route.ts` | 11 instancias de `: any` en un endpoint que procesa documentos con datos sensibles (importes, nombres, DNIs). | Errores en el parsing de un campo financiero (ej: `data.importe` vs `data.amount`) pasarán como `undefined` sin que TypeScript lo detecte. |
| T-04 | **MEDIO** | **Prisma Client se inicializa como `{} as PrismaClient` durante build-time**, creando un mock fantasma que podría ser usado accidentalmente en runtime. | `lib/db.ts` (líneas 56-59) | `if (isBuildTime) { return {} as PrismaClient; }` -- retorna un objeto vacío casteado. | Si `isBuildTime` se evalúa incorrectamente como `true` en runtime (por ej. un env mal configurado), TODOS los `prisma.xxx.findMany()` darían `TypeError: prisma.xxx is not a function` sin explicación obvia. |
| T-05 | **MEDIO** | **Exposición de `error.message` al cliente en 50+ endpoints**. Los errores de Prisma, AWS, Stripe y lógica interna se envían como `details` al frontend. | Múltiples archivos en `app/api/` | Patrón repetido: `catch (error: any) { return NextResponse.json({ error: '...', details: error.message }, { status: 500 }) }` | Stack traces de Prisma revelan nombres de tablas y columnas. Errores de Stripe revelan IDs de clientes. Errores de AWS revelan regiones y buckets. Todo esto es información útil para un atacante. |
| T-06 | **BAJO** | **Versiones de API de Stripe inconsistentes entre archivos**. Se usan al menos 2 versiones diferentes de la API de Stripe en el mismo proyecto. | `app/api/webhooks/stripe/route.ts` vs `app/api/b2b-billing/webhook/route.ts` | `apiVersion: '2024-11-20.acacia'` en uno, `apiVersion: '2025-12-15.clover'` en otro. | Comportamientos diferentes de la API de Stripe según qué endpoint procese el evento. Breaking changes entre versiones pueden causar fallos silenciosos. |
| T-07 | **BAJO** | **console.log en producción en múltiples servicios**. Logs de debug sin control de nivel dispersos en código de producción. | `lib/s3-service.ts`, `lib/push-notifications.ts`, `lib/onboarding-service.ts`, `app/api/vapi/webhook/route.ts`, `app/api/webhooks/signaturit/route.ts` | `console.log('🔧 Simulated S3 upload:')`, `console.log('[Vapi Webhook]', ... JSON.stringify(message, null, 2))` -- logs no estructurados con emojis y JSON completo. | Contaminación de logs en producción. El Vapi webhook imprime payloads completos con datos de clientes (teléfonos, nombres) en texto plano. |

---

## MAPA DE CALOR: Archivos Más Peligrosos

| Archivo | Hallazgos | Severidad Máxima |
|---|---|---|
| `app/api/vapi/webhook/route.ts` | D-01, S-03, I-03, W-02, W-03, W-05, T-07 | **CRITICO** |
| `app/api/webhooks/signaturit/route.ts` | S-01, I-01, W-01, T-01, T-07 | **CRITICO** |
| `app/api/webhooks/stripe/route.ts` | S-02, I-02, T-06 | **CRITICO** |
| `lib/signaturit-service.ts` | S-01 | **CRITICO** |
| `lib/s3-service.ts` | D-02, I-04, T-07 | **ALTO** |
| `lib/auth-options.ts` | S-08, T-02 | **ALTO** |
| `lib/db.ts` | T-04 | **MEDIO** |

---

## TOP 5 BOMBAS LÓGICAS DETECTADAS

### 1. Signaturit: La Puerta Abierta de Par en Par
```
verifyWebhookSignature() → return true cuando no hay secret
```
**Resultado**: Cualquier persona puede activar contratos legales enviando un POST a `/api/webhooks/signaturit`. Un atacante solo necesita saber el `signatureId` de un contrato para marcarlo como firmado.

### 2. Vapi: El Teatro Telefónico
```
search_properties() → devuelve 2 propiedades inventadas
check_payment_status() → siempre dice "pagado"
create_lead() → no guarda nada
```
**Resultado**: El sistema telefónico IA es una cáscara vacía. CERO integración con la BD. Los clientes reciben información falsa y sus datos se pierden.

### 3. Stripe Webhook: La Triple Personalidad
```
3 endpoints, 2 versiones de API, 1 con bypass de firma
```
**Resultado**: Fragmentación de lógica de pagos. Uno de los endpoints acepta JSON sin verificar firma cuando el secret no está configurado. Los pagos pueden marcarse como "completados" sin que exista transacción real.

### 4. S3: El Mago del Engaño
```
uploadFile() → success: true, url: 'https://via.placeholder.com/...'
```
**Resultado**: Contratos firmados, fotos de propiedades, y documentos legales se "suben" exitosamente a una URL de placeholder.com. El sistema reporta éxito pero nada se almacena realmente.

### 5. Notificaciones de Firma: El Silencio Total
```
// await sendContractSignedNotification(contract);  ← COMENTADO
// await sendContractDeclinedNotification(contract); ← COMENTADO
// await sendContractExpiredNotification(contract);  ← COMENTADO
```
**Resultado**: El ciclo completo de firma digital opera sin notificar a ninguna de las partes. Un contrato puede firmarse, rechazarse o expirar sin que el propietario se entere.

---

## VEREDICTO FINAL

La plataforma Inmova tiene una **fachada impresionante** con 888 API routes, 541 páginas y cientos de componentes. Sin embargo, bajo el capó:

- **Las integraciones telefónicas (Vapi) son 100% decorativas** - no persisten datos ni consultan la BD.
- **La seguridad de webhooks es opcional** - Signaturit y Stripe funcionan sin verificación de firma si el secret no está configurado.
- **El middleware de Next.js NO protege rutas** - la seguridad depende de que cada uno de los 888 endpoints valide sesión individualmente.
- **Los uploads son simulados** cuando AWS no está configurado, retornando `success: true` con URLs falsas.
- **Hay 3 sistemas de pagos de Stripe duplicados** con versiones de API diferentes.

**Nivel de confianza del código para producción con clientes reales: 4/10**.

La autenticación base (NextAuth) está bien implementada con timing-attack prevention. Las rutas admin verifican `super_admin` consistentemente. Pero las integraciones externas (el dinero real, las firmas legales, las llamadas de clientes) están entre "incompletas" y "completamente falsas".

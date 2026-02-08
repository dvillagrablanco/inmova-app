# DESGLOSE DETALLADO DE HALLAZGOS - AUDITORÍA CAJA BLANCA INMOVA

**Fecha:** 7 de febrero de 2026  
**Propósito:** Desglose técnico preciso de cada hallazgo con código fuente exacto, raíz del problema, y enfoque de corrección concreto.

---

## TABLA DE CONTENIDOS

- [BLOQUE A: CRITICOS (Corregir INMEDIATAMENTE)](#bloque-a-criticos)
  - [S-01: Signaturit bypass de firma](#s-01)
  - [S-02: Stripe webhook bypass de firma](#s-02)
  - [S-03: Vapi webhook sin auth](#s-03)
  - [D-01: Vapi datos 100% fake](#d-01)
  - [W-01: Notificaciones de firma comentadas](#w-01)
- [BLOQUE B: ALTOS (Corregir en Sprint actual)](#bloque-b-altos)
  - [D-02: S3 devuelve placeholder.com](#d-02)
  - [D-03: Datos demo en BD real](#d-03)
  - [S-04: VAPID keys en console.log](#s-04)
  - [S-05: Middleware sin auth](#s-05)
  - [S-06: Admin planes retorna 200 sin auth](#s-06)
  - [I-01: Signaturit retorna 200 en errores](#i-01)
  - [I-02: 3 webhooks Stripe duplicados](#i-02)
  - [W-02: Vapi create_lead no persiste](#w-02)
  - [W-03: Disponibilidad de citas FAKE](#w-03)
  - [T-01: any masivo en Signaturit](#t-01)
  - [T-02: any en auth-options.ts](#t-02)
  - [T-03: any en document-analysis](#t-03)
- [BLOQUE C: MEDIOS (Corregir en próximo Sprint)](#bloque-c-medios)
  - [D-04: Planes duplicados](#d-04)
  - [D-05: Plan Owner oculto](#d-05)
  - [S-07: error.message expuesto al cliente](#s-07)
  - [S-08: as any en auth callbacks](#s-08)
  - [I-03: Vapi sin persistencia](#i-03)
  - [I-04: S3 credenciales vacías](#i-04)
  - [W-04: Contratos sin validar scoring](#w-04)
  - [T-04: Prisma mock build-time](#t-04)
  - [T-05: error.message en 50+ endpoints](#t-05)
- [BLOQUE D: BAJOS (Backlog)](#bloque-d-bajos)
  - [W-05: Vapi emergencias fake](#w-05)
  - [T-06: Versiones Stripe inconsistentes](#t-06)
  - [T-07: console.log en producción](#t-07)

---

## BLOQUE A: CRITICOS (Corregir INMEDIATAMENTE) {#bloque-a-criticos}

---

### S-01: Signaturit webhook ACEPTA cualquier POST sin verificar firma {#s-01}

**Archivo principal:** `lib/signaturit-service.ts` (líneas 347-351)  
**Archivo secundario:** `app/api/webhooks/signaturit/route.ts` (línea 55)

**Código enfermo:**

```typescript
// lib/signaturit-service.ts línea 347
export function verifyWebhookSignature(bodyText: string, signature: string): boolean {
  if (!SIGNATURIT_WEBHOOK_SECRET) {
    logger.warn('[Signaturit] Webhook secret no configurado. Saltando verificación.');
    return true;  // ← BOMBA: retorna TRUE sin secret
  }
  // ...verificación HMAC real solo si hay secret...
}
```

```typescript
// app/api/webhooks/signaturit/route.ts línea 55
const isValid = SignaturitService.verifyWebhookSignature(bodyText, signature);

if (!isValid && process.env.NODE_ENV === 'production') {
  // ← Solo rechaza en production Y si isValid es false
  // Pero sin secret, isValid SIEMPRE es true → nunca rechaza
}
```

**Raíz del problema:** Doble fallo lógico. Primero, `verifyWebhookSignature` devuelve `true` (en lugar de `false`) cuando no hay secret. Segundo, el handler solo rechaza en `production`, así que en `development` pasa siempre sin importar nada.

**Qué puede hacer un atacante:** Enviar un POST con este body a `/api/webhooks/signaturit`:
```json
{
  "event": "signature_completed",
  "data": {
    "id": "SIGNATURE_ID_CONOCIDO",
    "documents": [{"id": "doc1", "name": "contrato.pdf"}],
    "signers": [{"email": "fake@attacker.com", "signed_at": "2026-02-07"}]
  }
}
```
Resultado: El contrato se marca como `ACTIVO` y `signatureStatus: 'COMPLETED'` en la BD sin que nadie haya firmado nada.

**Enfoque de corrección:**
1. En `verifyWebhookSignature`: cambiar `return true` por `return false` cuando no hay secret.
2. En el webhook handler: eliminar la condición `process.env.NODE_ENV === 'production'`. Rechazar SIEMPRE si la firma no es válida.
3. Añadir una variable de entorno `SIGNATURIT_WEBHOOK_SECRET` en producción obligatoriamente.
4. Añadir un check al inicio del handler: si no hay `SIGNATURIT_WEBHOOK_SECRET` configurado, retornar 503 (Service Unavailable) en lugar de procesar.

---

### S-02: Stripe webhook acepta JSON crudo sin verificación de firma {#s-02}

**Archivo:** `app/api/webhooks/stripe/route.ts` (líneas 42, 64-71)

**Código enfermo:**

```typescript
// línea 42
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
// ← '' es falsy en JavaScript

// líneas 64-71
try {
  if (webhookSecret) {  // ← si es '', esta condición es FALSE
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } else {
    // En desarrollo sin webhook secret
    logger.warn('[Stripe Webhook] No webhook secret configured');
    event = JSON.parse(body);  // ← BOMBA: parsea JSON sin verificar firma
  }
}
```

**Raíz del problema:** El fallback `|| ''` convierte la ausencia de secret en un string vacío falsy. El `if (webhookSecret)` evalúa `''` como `false`, y el código salta directamente a `JSON.parse(body)` sin ninguna verificación criptográfica.

**Qué puede hacer un atacante:** Enviar un POST con header `stripe-signature: fake` y body:
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_fake",
      "metadata": { "companyId": "TARGET_COMPANY" }
    }
  }
}
```
Resultado: El payment se marca como `pagado` en la BD. El atacante puede fabricar pagos inexistentes.

**Enfoque de corrección:**
1. Eliminar el fallback `|| ''`. Si no hay secret, la variable es `undefined`.
2. Al inicio del handler, verificar que el secret exista. Si no existe, retornar 503 inmediatamente.
3. Eliminar todo el bloque `else { event = JSON.parse(body); }`. Si no hay secret, NO procesar.
4. Nunca dejar un bypass "para desarrollo" en código que se deploya a producción.

---

### S-03: Vapi webhook NO tiene NINGUNA autenticación {#s-03}

**Archivo:** `app/api/vapi/webhook/route.ts` (líneas 50-55)

**Código enfermo:**

```typescript
export async function POST(request: NextRequest) {
  try {
    const payload: VapiWebhookPayload = await request.json();
    // ← Cero verificación. Sin API key, sin HMAC, sin IP whitelist, sin nada.
    const { message } = payload;
    
    console.log('[Vapi Webhook]', message.type, JSON.stringify(message, null, 2));
    // ← Imprime TODO el payload incluyendo datos de clientes
```

**Raíz del problema:** El archivo no importa `getServerSession`, no tiene header checks, no verifica ningún token. Acepta literalmente cualquier request HTTP POST con JSON válido.

**Dato extra:** Además hay un `GET` handler al final (línea 691) que expone públicamente que el servicio está activo:
```typescript
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Vapi Webhook',
    version: '1.0.0',
  });
}
```

**Qué puede hacer un atacante:** Cualquiera puede invocar las funciones del sistema telefónico. Aunque actualmente no persisten datos (ver D-01), si se arregla D-01 primero sin arreglar S-03, el atacante podrá crear leads falsos, registrar propiedades fantasma, y generar incidencias ficticias directamente en la BD.

**Enfoque de corrección:**
1. Implementar verificación de Vapi server secret. Vapi envía un header `x-vapi-secret` que se configura en el dashboard. Verificar contra `process.env.VAPI_SERVER_SECRET`.
2. Si el secret no coincide o no existe, retornar 401.
3. Eliminar el `console.log` que imprime el payload completo. Reemplazar con `logger.info` con campos selectivos (sin datos PII).
4. Eliminar o proteger el GET handler (o limitarlo a health checks internos con auth).

---

### D-01: Vapi webhook devuelve datos 100% FAKE hardcodeados {#d-01}

**Archivo:** `app/api/vapi/webhook/route.ts` (~30 funciones afectadas)

**Código enfermo (ejemplos representativos):**

```typescript
// líneas 269-292 — search_properties: FAKE
case 'search_properties':
  return {
    success: true,
    properties: [
      { id: 'PROP-001', address: 'Calle Mayor 123, Madrid', price: 1200, rooms: 3 },
      { id: 'PROP-002', address: 'Paseo de la Castellana 50, Madrid', price: 1500, rooms: 4 },
    ],
    // ← Siempre las mismas 2 propiedades inventadas
  };
```

```typescript
// líneas 327-336 — check_payment_status: FAKE
case 'check_payment_status':
  return {
    success: true,
    payments: {
      lastPayment: { date: '2026-01-15', amount: 1200, status: 'pagado' },
      nextPayment: { date: '2026-02-01', amount: 1200, status: 'pendiente' },
      balance: 0,
    },
    // ← SIEMPRE dice "pagado", sin importar el estado real
  };
```

```typescript
// líneas 346-357 — get_contract_info: FAKE
case 'get_contract_info':
  return {
    contract: {
      startDate: '2025-06-01', endDate: '2026-05-31',
      monthlyRent: 1200, deposit: 2400, status: 'activo',
    },
    // ← Contrato inventado, no consulta BD
  };
```

```typescript
// líneas 426-439 — start_valuation: FAKE
case 'start_valuation':
  const pricePerSqm = 3500; // ← Precio por m² HARDCODEADO
  const estimatedValue = Math.round(parameters.squareMeters * pricePerSqm);
  // ← La "IA de valoración" es una multiplicación con un número fijo
```

**Funciones FAKE totales identificadas:** `search_properties`, `check_payment_status`, `get_contract_info`, `get_market_data`, `start_valuation`, `check_appointment_availability`, `create_lead`, `leave_message`, `schedule_visit`, `create_maintenance_request`, `update_tenant_info`, `create_complaint`, `create_incident`, `assign_technician`, `get_incident_status`, `escalate_incident`, `request_emergency_service`, `search_coliving_rooms`, `create_resident_profile`, `check_community_events`, `get_community_info`, `check_community_balance`, `check_owner_debt`, `get_next_meeting_info`, `compare_properties`, `register_property`, `check_property_legal_status`.

**Raíz del problema:** Todo el archivo es un prototipo/mockup. Cada `case` del switch devuelve JSON estático sin un solo `import { prisma }` ni `await prisma.xxx`. Los comentarios lo confirman: `// Aquí integrarías con tu API de propiedades`, `// Aquí integrarías con tu CRM`, etc.

**Enfoque de corrección:**
1. **Decisión estratégica primero:** Si Vapi no se usa actualmente en producción, DESACTIVAR el endpoint completo (retornar 503 con mensaje "Servicio no disponible").
2. **Si se quiere mantener:** Cada función necesita reescribirse para:
   - Recibir un `companyId` del contexto de la llamada (metadata de Vapi)
   - Consultar Prisma con ese `companyId` como filtro
   - Devolver datos reales de la BD
3. **Priorizar:** `check_payment_status` y `get_contract_info` son los más peligrosos porque dan información falsa a inquilinos sobre dinero.
4. **Las funciones de "crear" (`create_lead`, `leave_message`, etc.):** Necesitan hacer `prisma.xxx.create` reales para que los datos no se pierdan.

---

### W-01: Notificaciones de firma completada/rechazada/expirada COMENTADAS {#w-01}

**Archivo:** `app/api/webhooks/signaturit/route.ts` (líneas 241, 277, 309)

**Código enfermo:**

```typescript
// línea 241 — En handleSignatureCompleted:
// 5. Enviar notificación al propietario (opcional)
// await sendContractSignedNotification(contract);
// ← COMENTADO. El propietario NO sabe que se firmó su contrato.

// línea 277 — En handleSignatureDeclined:
// Notificar al propietario
// await sendContractDeclinedNotification(contract);
// ← COMENTADO. Si el inquilino rechaza la firma, NADIE se entera.

// línea 309 — En handleSignatureExpired:
// Notificar al propietario
// await sendContractExpiredNotification(contract);
// ← COMENTADO. La firma expira en silencio.
```

**Raíz del problema:** Las funciones de notificación probablemente no estaban implementadas cuando se escribió el webhook handler, así que se dejaron como "TODO" comentados. Nunca se volvió a ellas.

**Enfoque de corrección:**
1. **Verificar si las funciones existen:** Buscar `sendContractSignedNotification`, `sendContractDeclinedNotification`, `sendContractExpiredNotification` en el codebase. Si no existen, crearlas.
2. **Implementar usando la infraestructura existente:** El proyecto ya tiene `nodemailer` configurado (Gmail SMTP). Usar el servicio de email existente para enviar:
   - **Firma completada:** Email al propietario/gestor con enlace al contrato firmado.
   - **Firma rechazada:** Email urgente al propietario con el motivo del rechazo.
   - **Firma expirada:** Email al propietario sugiriendo reenviar la solicitud de firma.
3. **También crear notificación in-app:** Usar `prisma.notification.create` (el modelo ya existe y se usa en otros webhooks de Stripe).
4. **Descomentar las líneas y conectar** con las funciones creadas.

---

## BLOQUE B: ALTOS (Corregir en Sprint actual) {#bloque-b-altos}

---

### D-02: S3 Service devuelve URLs de placeholder.com como si fueran reales {#d-02}

**Archivo:** `lib/s3-service.ts` (líneas 44-47, 137-154)

**Código enfermo:**

```typescript
// línea 44-46 — Detección de "sin AWS"
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  logger.warn('⚠️ AWS credentials not configured, using simulated upload');
  return this.simulateUpload(filename, folder);
}

// líneas 137-154 — El simulador
private static simulateUpload(filename: string, folder: string): UploadResult {
  const url = `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(
    filename.substring(0, 20)
  )}`;
  console.log('🔧 Simulated S3 upload:', { key, url });
  return {
    success: true,   // ← MENTIRA: reporta éxito
    url,             // ← URL de placeholder.com
    key,
  };
}
```

**Raíz del problema:** Se creó un "modo simulación" para desarrollo local, pero retorna `success: true`, haciendo indistinguible un upload real de uno falso. El código que llama a `uploadFile` no puede saber que falló.

**Enfoque de corrección:**
1. **Opción A (Recomendada):** Hacer que `simulateUpload` retorne `{ success: false, url: '', key: '', error: 'AWS_NOT_CONFIGURED' }`. Que el llamante decida qué hacer.
2. **Opción B:** Mantener simulación pero marcar claramente: añadir campo `simulated: true` al resultado y que la UI muestre "Archivo no subido (AWS no configurado)" en vez del placeholder.
3. **En producción:** Añadir un health check que verifique que las credenciales AWS existen al inicio. Si no existen, loguear error CRITICO, no un warn con emoji.
4. **Eliminar el `console.log` con emoji** y usar `logger.error` en su lugar.

---

### D-03: Datos demo insertados en BD real del tenant {#d-03}

**Archivo:** `app/api/automation/generate-demo-data/route.ts`

**Código enfermo:** Inquilinos con DNIs y emails ficticios (`12345678A`, `juan.garcia@example.com`) insertados directamente con `prisma.tenant.create`, `prisma.building.create`, `prisma.contract.create` en la BD de producción del tenant.

**Raíz del problema:** No hay campo `isDemo: true` ni mecanismo de limpieza. Los datos demo son indistinguibles de datos reales en queries, reportes financieros, y dashboards.

**Enfoque de corrección:**
1. Añadir campo `isDemo: boolean @default(false)` a los modelos `Building`, `Unit`, `Tenant`, `Contract` en el schema de Prisma.
2. Marcar todos los registros demo con `isDemo: true` en el seed.
3. Filtrar por `isDemo: false` en TODAS las queries de reportes financieros, dashboards, y exportaciones.
4. Mostrar badge visual "DEMO" en la UI para registros demo.
5. Proteger el endpoint con confirmación doble (no solo auth, sino un parámetro `confirmDemoData: true`).

---

### S-04: VAPID Private Key impresa en console.log {#s-04}

**Archivo:** `lib/push-notifications.ts` (líneas 206-211)

**Código enfermo:**

```typescript
export function generateVapidKeys() {
  const keys = webpush.generateVAPIDKeys();
  console.log('VAPID Keys generadas:');
  console.log('Public Key:', keys.publicKey);
  console.log('Private Key:', keys.privateKey);  // ← CLAVE PRIVADA en stdout
  return keys;
}
```

**Enfoque de corrección:**
1. Eliminar los `console.log` de las claves.
2. Si se necesita generar claves, hacerlo como script CLI separado que escribe a `.env`, no como función invocable desde código de producción.
3. Marcar la función como `@deprecated` o eliminarla del código de producción.

---

### S-05: Middleware NO verifica autenticación {#s-05}

**Archivo:** `middleware.ts`

**Código enfermo:** El middleware completo (78 líneas) solo maneja internacionalización (i18n) para 2 rutas. Para el 99.99% de las rutas, ejecuta `return NextResponse.next()` sin verificar nada.

**Raíz del problema:** La protección de rutas es "opt-in" (cada endpoint debe protegerse individualmente) en lugar de "opt-out" (todo protegido por defecto, se excluyen las rutas públicas).

**Enfoque de corrección:**
1. Añadir verificación de JWT/session al middleware para rutas `/admin/*`, `/dashboard/*`, `/(dashboard)/*`, `/(protected)/*`.
2. Verificar el token JWT de NextAuth (`next-auth.session-token` cookie) y redirigir a `/login` si no es válido.
3. Para rutas `/api/admin/*`, retornar 401 si no hay session válida.
4. Mantener las exclusiones existentes (`/api/auth`, `/login`, `/register`, `/landing`, `/api/health`, `/api/webhooks/*`).
5. Esto actúa como "red de seguridad" -- las rutas individuales siguen verificando, pero el middleware atrapa las que se olviden.

---

### S-06: API admin planes retorna 200 OK sin auth {#s-06}

**Archivo:** `app/api/admin/planes/route.ts` (líneas 50-57)

**Código enfermo:**

```typescript
if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
  // Retornar datos vacíos en lugar de error para mejor UX
  return NextResponse.json({
    planes: [],
    total: 0,
    _authRequired: true,  // ← Le dice al atacante que es un endpoint admin
  });
}
```

**Enfoque de corrección:**
1. Cambiar a un 401/403 estándar: `return NextResponse.json({ error: 'No autorizado' }, { status: 401 })`.
2. Eliminar `_authRequired: true` -- no dar información gratuita a atacantes.
3. La "UX" de no mostrar error debe manejarse en el FRONTEND (el componente React verifica la session antes de hacer fetch), no en la API.

---

### I-01: Signaturit retorna 200 OK incluso en errores de procesamiento {#i-01}

**Archivo:** `app/api/webhooks/signaturit/route.ts` (líneas 109-115)

**Código enfermo:**

```typescript
} catch (error: any) {
  logger.error('[Signaturit Webhook] Error:', error);
  // Retornar 200 para que Signaturit no reintente
  // (ya logueamos el error)
  return NextResponse.json({ received: true, error: error.message });
  // ← 200 OK con error = Signaturit piensa que todo fue bien
}
```

**Raíz del problema:** El desarrollador quiso evitar reintentos infinitos de Signaturit, pero la solución correcta es retornar 500 para que Signaturit reintente (tiene lógica de backoff exponencial) y eventualmente alerte si el endpoint sigue fallando.

**Enfoque de corrección:**
1. Retornar `status: 500` en errores para que Signaturit reintente.
2. Implementar idempotencia: antes de procesar, verificar si ya se procesó ese `signatureId` (check en BD). Si ya fue procesado, retornar 200.
3. Esto evita procesamiento duplicado en reintentos pero garantiza que los errores transitorios (BD caída temporal) se resuelvan con reintentos.

---

### I-02: 3 endpoints de webhook Stripe duplicados {#i-02}

**Archivos:**
- `/api/webhooks/stripe/route.ts` — 670 líneas, apiVersion `'2024-11-20.acacia'`
- `/api/stripe/webhook/route.ts` — 352 líneas, apiVersion desconocida (usa `STRIPE_WEBHOOK_SECRET` de lib/stripe-config)
- `/api/b2b-billing/webhook/route.ts` — 216 líneas, apiVersion `'2025-12-15.clover'`

**Raíz del problema:** Se fueron creando endpoints Stripe en diferentes momentos sin consolidar. Cada uno maneja un subconjunto de eventos con lógica diferente.

**Enfoque de corrección:**
1. **Auditar Stripe Dashboard:** Verificar a cuál de los 3 endpoints apunta el webhook configurado en Stripe.
2. **Consolidar en uno solo:** Unificar toda la lógica en `/api/webhooks/stripe/route.ts` (el más completo).
3. **Una sola versión de API:** Usar la versión más reciente de Stripe API consistentemente.
4. **Eliminar los otros 2 archivos** o redirigirlos al endpoint principal.
5. **Exportar una constante centralizada** de Stripe (`lib/stripe-config.ts`) que todos usen.

---

### W-02 y W-03: Vapi create_lead no persiste / Disponibilidad de citas FAKE {#w-02}

**Archivo:** `app/api/vapi/webhook/route.ts`

Estos hallazgos son subsecciones de D-01 (Vapi fake). La corrección es la misma: reescribir cada función para que consulte y persista en Prisma. Si Vapi no está en uso, desactivar el endpoint.

---

### T-01, T-02, T-03: `any` masivo en archivos críticos {#t-01}

**Archivos afectados:**
- `app/api/webhooks/signaturit/route.ts`: 12 usos de `: any`
- `lib/auth-options.ts`: 8 casteos a `any`
- `app/api/ai/document-analysis/route.ts`: 11 usos de `: any`

**Enfoque de corrección para T-01 (Signaturit):**
1. Crear interfaces `SignaturitContract` y `SignaturitEventData` con los campos esperados.
2. Tipar `handleSignatureCompleted(contract: ContractWithRelations, data: SignaturitEventData)` en vez de `any`.

**Enfoque de corrección para T-02 (auth-options.ts):**
1. Ya existen los tipos en `types/next-auth.d.ts` que extienden `Session`, `User`, y `JWT` con `id`, `role`, `companyId`.
2. El problema es que `auth-options.ts` no los usa. Los callbacks deberían acceder a los campos directamente sin `as any`:
   ```typescript
   // En vez de: token.role = (user as any).role;
   // Usar:     token.role = user.role;
   ```
3. Añadir `companyName` y `userType` a la declaración en `types/next-auth.d.ts` (faltan ahí).

**Enfoque de corrección para T-03 (document-analysis):**
1. Crear interfaces para el request y response de análisis de documentos.
2. Reemplazar cada `: any` con el tipo concreto.

---

## BLOQUE C: MEDIOS (Corregir en próximo Sprint) {#bloque-c-medios}

---

### D-04: Planes de suscripción duplicados con precios contradictorios {#d-04}

**Archivos:** `app/api/admin/seed-plans/route.ts` vs `app/api/admin/init-all-data/route.ts`

**Contradicción:**

| Plan | seed-plans | init-all-data | Diferencia |
|---|---|---|---|
| Profesional | 149€/mes, 10 users, 200 props | 59€/mes, 5 users, 25 props | **2.5x precio, 2x users, 8x props** |
| Tier naming | `basico`, `profesional`, `empresarial`, `premium` | `STARTER`, `PROFESSIONAL`, `BUSINESS`, `ENTERPRISE` | **Tiers incompatibles** |

**Enfoque de corrección:**
1. Decidir cuál es la fuente de verdad (probablemente `init-all-data` porque está sincronizado con la landing page).
2. Eliminar `seed-plans` o marcarlo como deprecated.
3. Consolidar en un ÚNICO archivo de configuración de planes.

---

### D-05: Plan "Owner" con tier compartido {#d-05}

**Enfoque de corrección:**
1. Dar al plan Owner un tier único (ej: `owner`) en vez de reusar `premium`.
2. Añadir filtro `esInterno: false` en TODA query que muestre planes a clientes.
3. Verificar que la landing page, registro, y checkout filtren planes internos.

---

### S-07 y T-05: error.message expuesto al cliente en 50+ endpoints {#s-07}

**Enfoque de corrección:**
1. Crear una función helper centralizada `handleApiError(error: unknown): NextResponse`:
   ```typescript
   export function handleApiError(error: unknown, context: string): NextResponse {
     const message = error instanceof Error ? error.message : 'Error desconocido';
     logger.error(`[${context}]`, { message, stack: error instanceof Error ? error.stack : undefined });
     
     // En producción, NO enviar detalles
     const details = process.env.NODE_ENV === 'development' ? message : undefined;
     return NextResponse.json({ error: 'Error interno del servidor', ...(details && { details }) }, { status: 500 });
   }
   ```
2. Reemplazar todos los `catch (error: any) { return NextResponse.json({ details: error.message }) }` con esta función.
3. Esto es un refactor masivo pero mecánico — se puede hacer con find-and-replace guiado.

---

### S-08: `as any` en callbacks de auth (mismo que T-02) {#s-08}

Mismo enfoque que T-02. Usar los tipos de `types/next-auth.d.ts` y extenderlos con los campos faltantes.

---

### I-03: Vapi sin persistencia en BD {#i-03}

Subsección de D-01 (Vapi fake). Misma corrección.

---

### I-04: S3 credenciales vacías como fallback {#i-04}

**Archivo:** `lib/s3-service.ts` (líneas 12-17)

**Código enfermo:**

```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
```

**Enfoque de corrección:**
1. No inicializar el S3Client si no hay credenciales. Usar lazy initialization:
   ```typescript
   let s3Client: S3Client | null = null;
   function getS3Client(): S3Client {
     if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
       throw new Error('AWS credentials not configured');
     }
     if (!s3Client) {
       s3Client = new S3Client({ ... });
     }
     return s3Client;
   }
   ```
2. En `uploadFile`, hacer try/catch del `getS3Client()` y retornar `{ success: false, error: 'AWS_NOT_CONFIGURED' }`.

---

### W-04: Contratos sin validar scoring del inquilino {#w-04}

**Archivo:** `app/api/automation/generate-demo-data/route.ts` (líneas 283-306)

**Enfoque de corrección:**
1. Este hallazgo es específico del endpoint de datos demo. Para el flujo REAL de crear contratos, verificar si existe validación de scoring.
2. Si no existe en el flujo real, implementar un check: `if (tenant.scoring < MIN_SCORING) { reject }`.
3. El umbral mínimo debería ser configurable por empresa.

---

### T-04: Prisma mock `{} as PrismaClient` en build-time {#t-04}

**Archivo:** `lib/db.ts` (líneas 56-59)

**Código enfermo:**

```typescript
if (isBuildTime) {
  console.log('[Prisma] Build-time detected, skipping Prisma initialization');
  return {} as PrismaClient;  // ← Objeto vacío casteado
}
```

**Enfoque de corrección:**
1. Usar un Proxy en vez de un objeto vacío para dar errores claros:
   ```typescript
   if (isBuildTime) {
     return new Proxy({} as PrismaClient, {
       get(target, prop) {
         throw new Error(`Prisma no disponible en build-time. Intento de acceder a prisma.${String(prop)}`);
       }
     });
   }
   ```
2. Esto da un error claro y descriptivo en vez de `TypeError: prisma.user is not a function`.

---

## BLOQUE D: BAJOS (Backlog) {#bloque-d-bajos}

---

### W-05: Vapi emergencias fake {#w-05}

Subsección de D-01. Teléfono `+34 600 999 999` hardcodeado y tickets sin persistencia. Corregir dentro del refactor general de Vapi.

---

### T-06: Versiones de API de Stripe inconsistentes {#t-06}

**Enfoque:** Centralizar la versión de Stripe API en `lib/stripe-config.ts` y que todos los archivos importen de ahí. Se resuelve automáticamente con la consolidación de I-02.

---

### T-07: console.log en producción {#t-07}

**Enfoque:** Reemplazar `console.log` por `logger.info` o `logger.debug` en todos los archivos afectados. El logger (winston) ya está configurado y soporta niveles. Los `console.log` con emojis son particularmente problemáticos porque contaminan los logs de PM2.

**Archivos afectados:**
- `lib/s3-service.ts` línea 147
- `lib/push-notifications.ts` líneas 208-210
- `lib/onboarding-service.ts` líneas 472-537
- `app/api/vapi/webhook/route.ts` líneas 55, 126, 644, 657, 664, 675, 680
- `app/api/webhooks/signaturit/route.ts` líneas 50, 104, 141, 243, 279, 312, 342

---

## ORDEN DE CORRECCIÓN RECOMENDADO

### Fase 1: Puertas cerradas (1-2 días)
| Prioridad | ID | Esfuerzo | Acción |
|---|---|---|---|
| 1 | S-01 | 30 min | Fix `verifyWebhookSignature` → `return false`, eliminar bypass NODE_ENV |
| 2 | S-02 | 30 min | Eliminar fallback `JSON.parse`, exigir webhook secret |
| 3 | S-03 | 1 hora | Añadir verificación de Vapi server secret |
| 4 | S-06 | 15 min | Cambiar 200 → 401 en admin/planes |
| 5 | S-04 | 10 min | Eliminar console.log de VAPID keys |

### Fase 2: Datos verídicos (2-3 días)
| Prioridad | ID | Esfuerzo | Acción |
|---|---|---|---|
| 6 | D-02 | 1 hora | S3 simulateUpload → `success: false` |
| 7 | W-01 | 4 horas | Implementar notificaciones de firma (email + in-app) |
| 8 | I-01 | 30 min | Signaturit catch → retornar 500, implementar idempotencia |
| 9 | I-02 | 4 horas | Consolidar 3 webhooks Stripe en 1 |
| 10 | D-04 | 2 horas | Consolidar seeds de planes, eliminar duplicados |

### Fase 3: Tipado y calidad (3-4 días)
| Prioridad | ID | Esfuerzo | Acción |
|---|---|---|---|
| 11 | T-02/S-08 | 2 horas | Eliminar `as any` en auth-options, usar tipos de next-auth.d.ts |
| 12 | T-01 | 3 horas | Tipar handlers de Signaturit webhook |
| 13 | S-07/T-05 | 4 horas | Crear `handleApiError` centralizado, reemplazar en 50+ endpoints |
| 14 | S-05 | 4 horas | Añadir auth check al middleware de Next.js |
| 15 | T-07 | 2 horas | Reemplazar console.log → logger en todos los archivos |

### Fase 4: Decisión estratégica Vapi (5+ días)
| Prioridad | ID | Esfuerzo | Acción |
|---|---|---|---|
| 16 | D-01 | 5-10 días | Decidir: ¿desactivar Vapi o reescribir 30 funciones con Prisma? |
| 17 | I-03/W-02/W-03/W-05 | (incluido en D-01) | Se resuelve con la decisión de D-01 |

**Tiempo total estimado: 2-3 semanas de un desarrollador senior.**

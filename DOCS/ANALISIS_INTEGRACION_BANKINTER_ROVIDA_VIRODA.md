# Análisis de Integración Bankinter - Rovida y Viroda

## Fecha: 11 de febrero de 2026

---

## 1. ESTADO ACTUAL - QUÉ EXISTE YA

### 1.1 Código Implementado (Backend)

| Componente | Archivo | Estado |
|---|---|---|
| Servicio Bankinter completo | `lib/bankinter-integration-service.ts` | Implementado (modo demo) |
| Wrapper Open Banking | `lib/open-banking-service.ts` | Implementado (modo demo) |
| API Connect | `app/api/open-banking/bankinter/connect/route.ts` | Implementado |
| API Sync | `app/api/open-banking/bankinter/sync/route.ts` | Implementado |
| API Reconcile | `app/api/open-banking/bankinter/reconcile/route.ts` | Implementado |
| API Status | `app/api/open-banking/bankinter/status/route.ts` | Implementado |
| API Payment | `app/api/open-banking/bankinter/payment/route.ts` | Implementado |
| API Callback | `app/api/open-banking/bankinter/callback/route.ts` | Implementado |

**Servicios disponibles en `BankinterIntegrationService`:**
- `getAccessToken()` - OAuth 2.0
- `createAISConsent()` - Consentimiento AIS
- `getConsentStatus()` - Estado del consentimiento
- `getAccounts()` - Lista de cuentas
- `getBalances()` - Saldos
- `getTransactions()` - Transacciones
- `initiatePayment()` - Pagos SEPA (PIS)
- `getPaymentStatus()` - Estado de pagos
- `conectarCuentaBankinter()` - Flujo de conexión alto nivel
- `sincronizarTransaccionesBankinter()` - Sincronización de movimientos
- `verificarIngresosBankinter()` - Verificación de ingresos de inquilinos
- `conciliarPagosBankinter()` - Conciliación automática pagos/cobros

### 1.2 Modelo de Datos (Prisma Schema)

**`BankConnection`** - Ya existe y soporta Bankinter:
- `proveedor`: soporta `"bankinter_redsys"`
- `consentId` / `consentValidUntil`: campos PSD2
- `accessToken` / `refreshToken` / `expiresAt`: OAuth
- Relación con `Company`, `User` y `Tenant`
- `autoReconciliar` / `notificarErrores`: configuración

**`BankTransaction`** - Ya existe con campos PSD2:
- `creditorName` / `creditorIban` / `debtorName` / `debtorIban`
- `rawData`: JSON con datos originales del banco
- `estado`: pendiente_revision, conciliado, etc.
- Relación con `Payment` y `Expense` para conciliación

**`Company`** - Tiene campo `iban` para la cuenta bancaria de la sociedad.

### 1.3 Frontend

| Página | Ruta | Estado |
|---|---|---|
| Open Banking Dashboard | `/open-banking` | Implementada (UI completa, funcionalidad mock) |
| Admin Integraciones Banca | `/admin/integraciones-banca` | Implementada (configuración mock) |
| Conciliación Bancaria | `/finanzas/conciliacion` | Implementada (UI con datos mock) |

### 1.4 Sociedades en el Sistema

| Sociedad | ID en BD | Tipo | Parent |
|---|---|---|---|
| Vidaro Inversiones S.L. | `vidaro-inversiones` | Holding | — |
| Rovida S.L. | `rovida-sl` | Filial | Vidaro |
| VIRODA INVERSIONES S.L.U. | `viroda-inversiones` | Filial | Vidaro |

**Rovida S.L.** - Gestión inmobiliaria y actividad comercial:
- 16+ edificios dados de alta (garajes, locales, naves, apartamentos)
- Ubicaciones: Madrid, Palencia, Valladolid, Benidorm
- Contabilidad importada (2,198 asientos, 70.9M€ D/H)
- Módulos activos: dashboard, edificios, unidades, inquilinos, contratos, pagos, gastos, documentos, mantenimiento, reportes, facturación, contabilidad, CRM

**VIRODA INVERSIONES S.L.U.** - Room Rental e inversiones:
- 5 edificios (M.Silvela 5, H.Tejada 6, C.Mora, Reina 15, M.Pelayo)
- Modelo Room Rental
- Renta mensual: 93,394€ / Renta anual: ~1.12M€
- Contabilidad importada (2,531 asientos, 72.5M€ D/H)
- Módulos activos: los mismos que Rovida + room-rental, STR, portal-inquilino

### 1.5 Documentación Existente

- `docs/legacy/INTEGRACION_BANKINTER_GUIA.md` - Guía completa de integración
- `docs/legacy/GUIA_ACTIVACION_PSD2_OPEN_BANKING.md` - Proceso de licencia TPP
- `docs/legacy/BANKINTER_INTEGRATION_QUICKSTART.md` - Quickstart
- `.env.bankinter.example` - Variables de entorno necesarias

---

## 2. QUÉ FALTA PARA LA INTEGRACIÓN EN PRODUCCIÓN

### 2.1 Requisitos Legales/Regulatorios (BLOQUEANTES)

| Requisito | Estado | Tiempo Estimado | Coste |
|---|---|---|---|
| **Licencia TPP del Banco de España** (AISP+PISP) | NO OBTENIDA | 3-6 meses | €2,000-€5,000 |
| **Certificados eIDAS** (QWAC + QSealC) | NO OBTENIDOS | 2-4 semanas | €500-€2,000/año |
| **Registro en Redsys PSD2 Platform** | NO COMPLETADO | 1-2 semanas | Gratis |
| **Seguro de responsabilidad civil profesional** | DESCONOCIDO | 2-4 semanas | Variable |

**Alternativa sin licencia TPP propia**: Usar un agregador PSD2 autorizado como intermediario:
- **Tink** (Visa): ya listado en UI de Open Banking
- **Salt Edge**: ya listado en UI
- **Afterbanks** (especializado España): ya listado en UI
- **Unnax/Fintonic APIs**: opciones españolas

Con un agregador, el coste baja a €100-500/mes y el time-to-market a 2-4 semanas. El agregador ya tiene la licencia TPP y los certificados eIDAS.

### 2.2 Configuración Técnica (Sin Resolver)

#### Variables de entorno NO configuradas

```env
# Ninguna de estas está configurada en producción
REDSYS_API_URL=              # URL sandbox o producción
REDSYS_OAUTH_URL=            # URL OAuth
REDSYS_BANKINTER_CODE=       # Código entidad
REDSYS_CLIENT_ID=            # Client ID (requiere registro Redsys)
REDSYS_CLIENT_SECRET=        # Client Secret
REDSYS_CERTIFICATE_PATH=     # Ruta certificado QWAC
REDSYS_CERTIFICATE_KEY_PATH= # Ruta clave QWAC
REDSYS_SEAL_CERTIFICATE_PATH= # Ruta certificado QSealC
REDSYS_SEAL_KEY_PATH=        # Ruta clave QSealC
```

#### Certificados eIDAS

No existen archivos de certificados en el servidor. Son necesarios:
- `qwac_cert.pem` - Certificado QWAC (autenticación HTTPS mutua)
- `qwac_key.pem` - Clave privada QWAC
- `qseal_cert.pem` - Certificado QSealC (firma digital)
- `qseal_key.pem` - Clave privada QSealC

Proveedores de certificados eIDAS en España:
- Camerfirma
- Firmaprofesional
- AC FNMT-RCM
- Izenpe

### 2.3 Gaps Funcionales Específicos para Rovida y Viroda

#### A) Mapeo Cuenta Bancaria ↔ Sociedad

**Problema**: El campo `iban` de `Company` existe pero probablemente no está rellenado para Rovida ni Viroda. Cada sociedad puede tener múltiples cuentas en Bankinter.

**Lo que falta**:
1. Dar de alta los IBANs reales de Rovida y Viroda en el campo `company.iban`
2. Crear `BankConnection` vinculada a cada companyId (`rovida-sl`, `viroda-inversiones`)
3. Si cada sociedad tiene varias cuentas, se necesita una `BankConnection` por cada cuenta

#### B) Flujo de Consentimiento Multi-Empresa

**Problema**: El consentimiento PSD2 es por titular de cuenta bancaria. Si una persona física (ej. dvillagra) gestiona cuentas de 2 sociedades (Rovida y Viroda), necesita dar consentimiento AIS separado por cada sociedad.

**Lo que falta**:
1. UI para seleccionar qué sociedad se está conectando al iniciar el flujo OAuth
2. El endpoint `/api/open-banking/bankinter/connect` ya recibe `companyId` de la sesión, pero falta un selector si el usuario tiene acceso a múltiples sociedades
3. Gestión de renovación de consentimientos (expiran cada 90 días) por sociedad

#### C) Conciliación Multi-Sociedad

**Problema**: La función `conciliarPagosBankinter()` ya filtra por `companyId`, pero falta la UI para ejecutar conciliación desde el contexto de cada sociedad.

**Lo que falta**:
1. En `/finanzas/conciliacion`, la UI usa datos mock. Falta conectar con las APIs reales
2. Filtro de sociedad en la vista de conciliación (Rovida vs Viroda)
3. Reglas de matching específicas por sociedad (formatos de referencia, nombres, etc.)

#### D) Sincronización Automática de Transacciones

**Problema**: La sincronización está implementada como endpoint manual (`POST /api/open-banking/bankinter/sync`). Para producción se necesita automatización.

**Lo que falta**:
1. Cron job o BullMQ worker para sincronización periódica (cada 4-6 horas, que es el máximo por día según PSD2)
2. Sistema de alertas cuando la sincronización falla
3. Dashboard de estado de sincronización por sociedad
4. Renovación automática de consentimientos antes de expirar (90 días)

#### E) Contabilidad ↔ Banco

**Problema**: Rovida y Viroda ya tienen contabilidad importada en la plataforma. Las transacciones bancarias deberían cruzarse con los asientos contables.

**Lo que falta**:
1. Mapping entre subcuentas contables (572x = bancos) y `BankConnection`
2. Generación automática de asientos contables a partir de transacciones bancarias
3. Vista de saldos contables vs saldos bancarios (cuadre)
4. Alertas de descuadre

#### F) Pagos a Proveedores (PIS)

**Problema**: El servicio PIS (Payment Initiation) está implementado en código, pero no hay UI para iniciación de pagos desde Inmova.

**Lo que falta**:
1. UI para iniciar pagos SEPA desde cada sociedad
2. Flujo de aprobación de pagos (usuario inicia → redirige a Bankinter Móvil para SCA)
3. Tracking de estado de pagos iniciados
4. Integración con el módulo de gastos/facturas de proveedores

---

## 3. PLAN DE ACCIÓN PRIORIZADO

### Fase 0: Decisión Estratégica (INMEDIATO)

**Opción A: Integración directa con Redsys/Bankinter**
- Requiere licencia TPP (3-6 meses)
- Requiere certificados eIDAS (€500-2,000/año)
- Mayor control, sin costes por transacción
- Todo el código ya está implementado

**Opción B: Usar agregador como intermediario (RECOMENDADO para time-to-market)**
- Sin necesidad de licencia TPP propia
- Time-to-market: 2-4 semanas
- Coste: €100-500/mes según volumen
- Opciones: Tink, Salt Edge, Afterbanks, Unnax
- Requiere adaptar `bankinter-integration-service.ts` al SDK del agregador
- El agregador gestiona certificados, renovaciones y compliance

**Opción C: Importación manual de extractos bancarios (RÁPIDO, bajo coste)**
- Sin regulación necesaria
- Implementar parser de ficheros Norma 43 (formato estándar banca española)
- El usuario descarga el fichero de Bankinter Online y lo sube a Inmova
- Conciliación semi-automática
- Time-to-market: 1-2 semanas

### Fase 1: Datos Base (1-2 días)

Independientemente de la opción elegida:

1. **Completar datos de IBANs** en las sociedades:
   ```
   Rovida S.L. → company.iban = ES[IBAN de Rovida en Bankinter]
   Viroda Inversiones S.L.U. → company.iban = ES[IBAN de Viroda en Bankinter]
   ```

2. **Activar módulo `open-banking`** para Rovida y Viroda (añadir a `CompanyModule`)

3. **Configurar campo `cuentaBancaria`** (IBAN) en los contratos de alquiler existentes para cada sociedad

### Fase 2: Integración Bancaria (2-4 semanas con agregador)

1. **Elegir y contratar agregador** PSD2
2. **Adaptar servicio** (`bankinter-integration-service.ts` o crear nuevo servicio)
3. **Conectar cuentas Bankinter** de Rovida y Viroda
4. **Configurar sincronización automática** de transacciones
5. **Conectar UI existente** con datos reales

### Fase 3: Conciliación y Automatización (2-3 semanas)

1. **Activar conciliación automática** para pagos de alquiler de Rovida
2. **Activar conciliación automática** para pagos de room rental de Viroda
3. **Implementar alertas** de pagos no conciliados / morosidad
4. **Dashboard de tesorería** en tiempo real por sociedad

### Fase 4: Contabilidad Integrada (3-4 semanas)

1. **Mapear cuentas bancarias** con subcuentas contables (572x)
2. **Generación automática de asientos** desde transacciones
3. **Cuadre bancario** automático
4. **Reportes** de flujo de caja por sociedad

---

## 4. RESUMEN EJECUTIVO

### Lo que YA FUNCIONA
- Toda la infraestructura de código (backend + API routes + frontend)
- Modelo de datos con soporte PSD2 (BankConnection, BankTransaction)
- Sociedades Rovida y Viroda dadas de alta con edificios, unidades, contratos
- Contabilidad importada para ambas sociedades
- UI de Open Banking, conciliación y configuración

### Lo que FALTA (por prioridad)

| # | Ítem | Bloquea | Esfuerzo |
|---|---|---|---|
| 1 | **Decisión: directo vs agregador vs ficheros** | Todo lo demás | Decisión de negocio |
| 2 | **IBANs reales** de Rovida y Viroda en la BD | Conexión | 1 hora |
| 3 | **Credenciales API** (o contrato con agregador) | Conexión real | 1-6 meses según opción |
| 4 | **Certificados eIDAS** (solo si directo) | Autenticación PSD2 | 2-4 semanas |
| 5 | **Selector de sociedad** en flujo de conexión | UX multi-empresa | 2-3 días |
| 6 | **Conectar UI de conciliación** con APIs reales | Conciliación | 3-5 días |
| 7 | **Cron/worker sincronización automática** | Actualización datos | 2-3 días |
| 8 | **Renovación automática consentimientos** | Continuidad servicio | 1-2 días |
| 9 | **Mapping contabilidad ↔ banco** | Cuadre contable | 1-2 semanas |
| 10 | **UI de iniciación de pagos (PIS)** | Pagos desde app | 1-2 semanas |

### Coste Total Estimado

| Opción | Coste Setup | Coste Mensual | Time-to-Market |
|---|---|---|---|
| Directa (Redsys) | €3,000-€10,000 | €0 | 6-9 meses |
| Agregador (Tink/Salt Edge) | €0-€500 | €100-€500/mes | 2-4 semanas |
| Ficheros Norma 43 (manual) | €0 | €0 | 1-2 semanas |

**Recomendación**: Empezar con **Opción C** (ficheros Norma 43) para tener funcionalidad inmediata, y en paralelo contratar un **agregador** (Opción B) para automatizar. La Opción A (directa) solo tiene sentido si el volumen justifica eliminar costes recurrentes del agregador.

---

*Documento generado a partir del análisis del código fuente de Inmova App.*

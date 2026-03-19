# Guía de Producción — Integración Bancaria Grupo Vidaro

## Estado del sistema

La integración bancaria de Inmova tiene tres capas:

| Capa                   | Herramienta                                 | Para qué                                   | Variables env                                          |
| ---------------------- | ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Open Banking (lectura) | **Nordigen / GoCardless Bank Account Data** | Leer movimientos Bankinter automáticamente | `NORDIGEN_SECRET_ID`, `NORDIGEN_SECRET_KEY`            |
| Cobro SEPA             | **GoCardless Payments**                     | Domiciliar alquileres a inquilinos         | `GOCARDLESS_ACCESS_TOKEN`, `GOCARDLESS_WEBHOOK_SECRET` |
| Conciliación IA        | Claude / lógica 3 capas                     | Cruzar movimientos ↔ pagos automáticamente | `ANTHROPIC_API_KEY`                                    |

Las sociedades configuradas en el código son:

- **ROVIDA S.L.** → IBAN `ES5601280250590100083954` (Bankinter)
- **VIRODA INVERSIONES S.L.** → IBAN `ES8801280250590100081826` (Bankinter)

---

## Por qué Nordigen en vez de Tink

**Tink** requiere licencia TPP (Third Party Provider) registrada en el Banco de España o en otro regulador europeo. El proceso de aprobación regulatoria tarda 6-18 meses y tiene coste legal significativo. No es viable para uso propio sin esta licencia.

**Nordigen (GoCardless Bank Account Data)** NO requiere licencia TPP. GoCardless actúa como TPP regulado y tú solo necesitas registrarte como cliente. Es gratuito (250 conexiones/día) y funciona en horas, no meses.

**Recomendación definitiva**: Usa Nordigen para leer movimientos bancarios. Abandona Tink a menos que tengas licencia TPP propia.

---

## PARTE 1 — GoCardless Bank Account Data (Nordigen)

### Para leer movimientos de Bankinter automáticamente

### Paso 1: Registro en el portal

1. Ir a **https://bankaccountdata.gocardless.com/**
2. Registrarse con el correo corporativo del Grupo Vidaro
3. Completar el formulario de empresa (razón social, CIF, etc.)
4. Verificar el email

### Paso 2: Obtener credenciales API

1. Ir al dashboard: **https://bankaccountdata.gocardless.com/overview/**
2. En el menú lateral: **User secrets**
3. Crear un nuevo par de secretos con nombre "Inmova Production"
4. Copiar:
   - `SECRET_ID` → variable `NORDIGEN_SECRET_ID`
   - `SECRET_KEY` → variable `NORDIGEN_SECRET_KEY`

### Paso 3: Configurar en .env.production

```env
NORDIGEN_SECRET_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NORDIGEN_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Reiniciar PM2:

```bash
pm2 restart inmova-app --update-env
```

### Paso 4: Conectar Bankinter desde la UI

Una vez configuradas las variables:

1. Ir a **Finanzas → Conciliación bancaria** en Inmova
2. Click en "Conectar banco" (o ir a `/finanzas/conciliacion`)
3. Seleccionar **Bankinter** de la lista
4. El sistema genera un enlace de autorización
5. Redirigir al enlace → Login en Bankinter → Autorizar acceso
6. Callback automático → cuentas conectadas

También disponible desde la API:

```bash
# Listar bancos disponibles
curl -X GET https://inmovaapp.com/api/open-banking/nordigen/institutions?country=ES \
  -H "Authorization: Bearer <TOKEN_SESION>"

# Iniciar conexión con Bankinter
curl -X POST https://inmovaapp.com/api/open-banking/nordigen/connect \
  -H "Authorization: Bearer <TOKEN_SESION>" \
  -H "Content-Type: application/json" \
  -d '{"institutionId": "BANKINTER_BKBKESMMXXX", "institutionName": "Bankinter", "companyId": "<ID_SOCIEDAD>"}'
```

### Paso 5: Sincronización automática

Con la conexión activa, la sincronización se ejecuta:

- **Manual**: desde la UI de conciliación → botón "Sincronizar"
- **API**: `POST /api/open-banking/nordigen/sync`
- **Cron diario**: `GET /api/cron/bank-reconciliation` (configurar en `vercel.json` o cron del servidor)

### Notas importantes sobre Nordigen

- **90 días** de acceso por autorización. Hay que re-autorizar cada 90 días.
- **2 años** de historial disponible desde la primera conexión.
- El token de acceso se renueva automáticamente cada 24h.
- La institución ID de Bankinter es `BANKINTER_BKBKESMMXXX`.
- Para conectar **ROVIDA** y **VIRODA** necesitas hacer el proceso de autorización **dos veces** (una por empresa), ya que cada una tiene sus cuentas Bankinter separadas.

---

## PARTE 2 — GoCardless Payments (SEPA Direct Debit)

### Para cobrar alquileres directamente del banco de los inquilinos

### Estado del proceso de verificación en GoCardless

GoCardless requiere **verificación de empresa** antes de activar el modo live. Este proceso tiene pasos específicos:

### Paso 1: Crear cuenta en GoCardless

1. Ir a **https://manage.gocardless.com/sign-up**
2. Seleccionar **España** como país de operación
3. Rellenar datos de empresa (una sociedad a la vez: ROVIDA o VIRODA)
4. Verificar email

### Paso 2: Verificación KYB (Know Your Business)

GoCardless requiere documentación de la empresa:

- CIF / Escritura de constitución
- DNI del administrador
- Documentación bancaria (extracto o certificado IBAN)
- Descripción del negocio (gestión inmobiliaria / alquiler)

Este proceso tarda **2-5 días laborables**.

### Paso 3: Configurar cuenta SEPA

Una vez verificado:

1. Dashboard → **Settings → Creditor**
2. Añadir la cuenta bancaria donde GoCardless depositará los cobros:
   - Para ROVIDA: IBAN `ES5601280250590100083954`
   - Para VIRODA: IBAN `ES8801280250590100081826`
3. GoCardless asignará un **Scheme Identifier SEPA** (referencia acreedor)

### Paso 4: Obtener Access Token de producción

1. Dashboard → **Developers → Access tokens**
2. Crear token con nombre "Inmova Production"
3. Permisos necesarios: `read_write` (lectura y escritura completa)
4. Copiar el token (`live_...`)

### Paso 5: Configurar Webhook

1. Dashboard → **Developers → Webhooks**
2. Click "Add endpoint"
3. URL: `https://inmovaapp.com/api/gocardless/webhook`
4. Seleccionar todos los eventos (o al menos: `payments.*`, `mandates.*`, `payouts.*`, `subscriptions.*`)
5. Copiar el **Webhook Secret**

### Paso 6: Configurar variables de entorno

```env
GOCARDLESS_ACCESS_TOKEN=live_xxxxxxxxxxxxxxxxxxxxxx
GOCARDLESS_ENVIRONMENT=live
GOCARDLESS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
```

```bash
pm2 restart inmova-app --update-env
```

### Paso 7: Verificar que funciona

```bash
# Test desde la UI: ir a Pagos → SEPA
# O via API:
curl -X GET https://inmovaapp.com/api/gocardless/stats \
  -H "Authorization: Bearer <TOKEN_SESION>"
```

La respuesta debe mostrar `configured: true` y los datos del creditor (tu empresa).

### Paso 8: Dar de alta primer inquilino con SEPA

Desde la página `/pagos/sepa`:

1. Click "Alta SEPA" → Seleccionar inquilino
2. Inmova crea el customer en GoCardless
3. Se genera enlace de autorización para el inquilino
4. Inquilino hace click → autoriza su IBAN → mandate activo
5. Cada mes se puede lanzar el cobro automático (suscripción)

O via API:

```bash
curl -X POST https://inmovaapp.com/api/open-banking/gocardless/setup-tenant \
  -H "Authorization: Bearer <TOKEN_SESION>" \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "<ID_INQUILINO>"}'
# Devuelve: { redirectUrl: "https://pay.gocardless.com/..." }
# Enviar ese URL al inquilino por email/SMS
```

### Importante: Cuentas separadas por sociedad

GoCardless asocia UNA cuenta bancaria creditor. Si tienes ROVIDA y VIRODA:

- Opción A: Crear **dos cuentas GoCardless** (una por empresa). Token separado por sociedad.
- Opción B: Una cuenta GoCardless con múltiples creditor bank accounts (disponible en algunos planes).

Recomendación: empezar con una sociedad, verificar el flujo completo, luego replicar para la segunda.

---

## PARTE 3 — Flujo de conciliación automática

Una vez configurado GoCardless Payments + Nordigen, el flujo completo es:

```
Mes 1 del contrato:
  1. Admin: Alta SEPA del inquilino → enviamos link de autorización
  2. Inquilino: Autoriza domiciliación bancaria (una sola vez)
  3. Mandate queda "active" en GoCardless

Cada mes (día de cobro):
  4. Inmova crea SepaPayment en GoCardless (via subscripción automática o manual)
  5. GoCardless cobra al inquilino
  6. Webhook → SepaPayment status = "confirmed"
  7. Auto-conciliación capa 1: SepaPayment → Payment (alquiler del mes marcado "pagado")

  8. GoCardless transfiere el dinero a Bankinter (payout ~T+2)
  9. Webhook → GCPayout status = "paid"
  10. Nordigen sync diario descarga el movimiento de Bankinter
  11. Auto-conciliación capa 2: GCPayout ↔ BankTransaction

Si hay transferencias directas (no SEPA):
  12. Nordigen las descarga igualmente
  13. Auto-conciliación capa 3: BankTransaction → Payment por nombre+importe
  14. IA (Claude) para casos ambiguos
```

### Endpoint de conciliación unificada

```bash
# Ejecutar conciliación completa para una sociedad
curl -X POST https://inmovaapp.com/api/banking/reconcile-unified \
  -H "Authorization: Bearer <TOKEN_SESION>" \
  -H "Content-Type: application/json" \
  -d '{"companyId": "<ID_SOCIEDAD>"}'
```

### Cron diario recomendado

Añadir en `vercel.json` o en el cron del servidor:

```json
{
  "crons": [
    {
      "path": "/api/cron/bank-reconciliation",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## PARTE 4 — Importación manual de extractos (alternativa)

Si no quieres/puedes usar Nordigen, puedes importar extractos manualmente en:

- **Norma 43** (AEB, formato estándar español de todos los bancos)
- **CAMT.053 XML** (ISO 20022, Bankinter lo exporta)
- **CSV** genérico

Desde: **Finanzas → Conciliación → Importar extracto**

Bankinter exporta CAMT.053 directamente desde la banca online:

1. Banca Online Bankinter → Cuentas → Movimientos
2. Exportar → XML ISO 20022 (CAMT.053)
3. Subir en Inmova → `/finanzas/conciliacion/import`

---

## PARTE 5 — Diagnóstico de problemas comunes

### "GoCardless no configurado"

```bash
# Verificar variables en servidor
grep -E 'GOCARDLESS' .env.production
pm2 env inmova-app | grep GOCARDLESS

# Si las variables están pero no carga → restart con update-env
pm2 restart inmova-app --update-env
```

### "Nordigen no configurado"

```bash
grep -E 'NORDIGEN' .env.production
# Verificar que SECRET_ID y SECRET_KEY tienen valores reales (no vacíos)
```

### El banco no aparece en la lista de Nordigen

```bash
# Buscar el institution_id de Bankinter
curl -X GET https://inmovaapp.com/api/open-banking/nordigen/institutions?country=ES \
  -H "Authorization: Bearer <TOKEN>"
# Buscar "Bankinter" en la respuesta
```

Institution ID conocidos para España (pueden cambiar):

- Bankinter: `BANKINTER_BKBKESMMXXX`
- BBVA: `BBVA_BBVAESMMXXX`
- Santander: `SANTANDER_BSCHESMMXXX`
- CaixaBank: `CAIXABANK_CAIXESBBXXX`
- Sabadell: `SABADELL_BSABESBBXXX`

### La autorización de Bankinter falla con "requisition status != LN"

El callback espera status `LN` (Linked). Si el usuario cancela o el banco rechaza:

- El estado queda en error en la tabla `BankConnection`
- Volver a iniciar el proceso desde la UI (crear nueva conexión)

### Los movimientos no se sincronizan

```bash
# Verificar conexiones activas
# En BD: SELECT * FROM "BankConnection" WHERE "estado" = 'conectado';

# Forzar sync manual via API
curl -X POST https://inmovaapp.com/api/open-banking/nordigen/sync \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"companyId": "<ID>"}'
```

### Pagos SEPA fallan (status: failed)

Los motivos más comunes:

- `AC01`: IBAN incorrecto → revisar IBAN del inquilino
- `MD01`: No mandate → el mandate fue cancelado
- `AM04`: Fondos insuficientes → avisar al inquilino
- `MS02`: Rechazado por el banco pagador → contactar al banco del inquilino

En Inmova aparecen en `/pagos/sepa` → tab "Pagos" con status "failed" y el motivo.

### El webhook de GoCardless no llega

1. Verificar que la URL es correcta en el dashboard de GoCardless
2. Verificar que `GOCARDLESS_WEBHOOK_SECRET` coincide
3. Ver logs: `pm2 logs inmova-app | grep "GC Webhook"`
4. GoCardless retries hasta 48h si falla

---

## PARTE 6 — Checklist de puesta en producción

### GoCardless Bank Account Data (Nordigen)

- [ ] Cuenta creada en bankaccountdata.gocardless.com
- [ ] `NORDIGEN_SECRET_ID` configurado en .env.production
- [ ] `NORDIGEN_SECRET_KEY` configurado en .env.production
- [ ] PM2 reiniciado con --update-env
- [ ] Test: `/api/open-banking/nordigen/institutions?country=ES` devuelve lista de bancos
- [ ] Bankinter conectado para ROVIDA (autorización completada)
- [ ] Bankinter conectado para VIRODA (autorización completada)
- [ ] Primera sincronización manual ejecutada con éxito
- [ ] Movimientos visibles en `/finanzas/conciliacion`

### GoCardless Payments (SEPA Direct Debit)

- [ ] Cuenta GoCardless creada y verificada (KYB completado)
- [ ] IBAN de Bankinter añadido como cuenta creditor
- [ ] `GOCARDLESS_ACCESS_TOKEN` (live\_...) configurado
- [ ] `GOCARDLESS_ENVIRONMENT=live` configurado
- [ ] Webhook creado en dashboard con URL correcta
- [ ] `GOCARDLESS_WEBHOOK_SECRET` configurado
- [ ] Test: `/pagos/sepa` muestra `configured: true` y creditor con nombre de empresa
- [ ] Primer inquilino dado de alta con SEPA (test con importe pequeño)
- [ ] Primer pago SEPA ejecutado y cobrado

### Conciliación automática

- [ ] Cron diario configurado (`/api/cron/bank-reconciliation`)
- [ ] Primera conciliación unificada ejecutada sin errores
- [ ] Pagos SEPA aparecen como "pagado" automáticamente

---

## Contactos y soporte

- **GoCardless Bank Account Data**: https://bankaccountdata.gocardless.com/support/
- **GoCardless Payments**: https://manage.gocardless.com/support
- **Estado de la API Nordigen**: https://status.gocardless.com/
- **Estado GoCardless Payments**: https://status.gocardless.com/

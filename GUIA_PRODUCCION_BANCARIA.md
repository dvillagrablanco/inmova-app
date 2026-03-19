# Guía de Producción — Integración Bancaria Grupo Vidaro

## Estado del sistema

| Capa                               | Herramienta                  | Para qué                                   | Variables env                                          |
| ---------------------------------- | ---------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Open Banking (lectura movimientos) | **Salt Edge** ✅ RECOMENDADO | Leer movimientos Bankinter automáticamente | `SALTEDGE_APP_ID`, `SALTEDGE_SECRET`                   |
| Cobro SEPA                         | **GoCardless Payments**      | Domiciliar alquileres a inquilinos         | `GOCARDLESS_ACCESS_TOKEN`, `GOCARDLESS_WEBHOOK_SECRET` |
| Conciliación IA                    | Claude / lógica 3 capas      | Cruzar movimientos ↔ pagos automáticamente | `ANTHROPIC_API_KEY`                                    |

Las sociedades configuradas en el código:

- **ROVIDA S.L.** → IBAN `ES5601280250590100083954` (Bankinter)
- **VIRODA INVERSIONES S.L.** → IBAN `ES8801280250590100081826` (Bankinter)

---

## Estado de las opciones de Open Banking (2025)

| Opción                                      | Estado                           | Sin licencia TPP          |
| ------------------------------------------- | -------------------------------- | ------------------------- |
| **Salt Edge Partner**                       | ✅ Disponible — RECOMENDADO      | ✅ No requiere licencia   |
| **GoCardless Bank Account Data (Nordigen)** | ❌ Nuevos registros desactivados | ✅ Si ya tenías cuenta    |
| **Tink**                                    | ⚠️ Solo con licencia TPP propia  | ❌ Requiere licencia PSD2 |
| **Importación CAMT.053 / Norma43**          | ✅ Siempre disponible            | ✅ Sin API, manual        |

GoCardless ha desactivado los nuevos registros en Bank Account Data en 2025.
La alternativa directa es **Salt Edge Partner Program** — misma funcionalidad, sin licencia TPP.

---

## PARTE 0 — Solución inmediata (hoy, sin configurar ninguna API)

Si necesitas los movimientos de Bankinter ahora mismo:

1. Login en **Bankinter Online** con las credenciales de ROVIDA o VIRODA
2. **Mis cuentas → Movimientos → Exportar → XML ISO 20022 (CAMT.053)**
3. En Inmova: **Finanzas → Conciliación bancaria → Importar Extracto** → subir el XML
4. Los movimientos aparecen y se concilian automáticamente

Repite para cada cuenta y para cada mes que quieras importar.

---

## PARTE 1 — Salt Edge Partner Program (RECOMENDADO)

### Para leer movimientos de Bankinter de forma automática

### Paso 1: Registro

1. Ir a **https://www.saltedge.com/partner_program**
2. Click en **"Become a Partner"**
3. Rellenar: nombre, empresa (ROVIDA S.L.), email, descripción del caso de uso
   - Descripción sugerida: _"Plataforma de gestión inmobiliaria. Necesitamos leer movimientos bancarios de nuestras cuentas propias para conciliar pagos de alquileres automáticamente."_
4. Verificar el email
5. Salt Edge puede pedir revisión manual (suelen responder en 1-2 días)

### Paso 2: Obtener API Keys

1. Dashboard: **https://www.saltedge.com/dashboard**
2. **Settings → API Keys** (o menú de desarrollador)
3. Copiar:
   - `App ID` → `SALTEDGE_APP_ID`
   - `Secret` → `SALTEDGE_SECRET`

### Paso 3: Configurar en el servidor

```bash
ssh root@157.180.119.236
nano /opt/inmova-app/.env.production
```

Añadir:

```env
SALTEDGE_APP_ID=tu_app_id
SALTEDGE_SECRET=tu_secret
```

```bash
pm2 restart inmova-app --update-env
pm2 env inmova-app | grep SALTEDGE   # verificar que cargó
```

### Paso 4: Verificar conexión

```bash
npm run verify:banking
# Debe mostrar: ✅ Salt Edge Connection: Conectado
```

O desde la app:

```
GET https://inmovaapp.com/api/open-banking/saltedge/status
```

### Paso 5: Conectar Bankinter

1. Ir a **`https://inmovaapp.com/finanzas/bancaria-setup`**
2. En el bloque **Salt Edge** (marcado RECOMENDADO), click **"Bankinter"**
3. Redirige a la interfaz de Salt Edge
4. Login con credenciales Bankinter de **ROVIDA**
5. Autorizar acceso a movimientos
6. Callback automático → cuentas conectadas

Repetir el proceso para **VIRODA** (desde la misma página).

### Paso 6: Sincronización automática

Con las conexiones activas:

- **Automática**: el cron diario `/api/cron/bank-reconciliation` sincroniza y concilia
- **Manual desde UI**: `/finanzas/bancaria-setup` → "Sincronizar movimientos"
- **Manual via API**:

```bash
curl -X POST https://inmovaapp.com/api/open-banking/saltedge/sync \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"companyId": "ID_ROVIDA"}'
```

### Notas importantes sobre Salt Edge

- El consentimiento expira periódicamente — habrá que re-autorizar cuando avise
- Historial disponible: hasta 2 años desde la primera conexión
- Bankinter provider code: `bankinter_xo_es` (verificar desde la UI)
- Los movimientos se guardan en el mismo modelo `BankTransaction` que Nordigen — la conciliación funciona igual

---

## PARTE 2 — GoCardless Payments (SEPA Direct Debit)

### Para cobrar alquileres directamente del banco de los inquilinos

### Paso 1: Crear cuenta en GoCardless

1. Ir a **https://manage.gocardless.com/sign-up**
2. Seleccionar **España**
3. Datos de empresa (ROVIDA o VIRODA, una a la vez)
4. Verificar email

### Paso 2: Verificación KYB (2-5 días)

Documentación requerida:

- CIF y escritura de constitución
- DNI del administrador
- Extracto o certificado IBAN de Bankinter
- Descripción del negocio (gestión de alquileres)

### Paso 3: Configurar cuenta bancaria creditor

1. Dashboard → **Settings → Creditor**
2. Añadir IBAN de Bankinter:
   - Para ROVIDA: `ES5601280250590100083954`
   - Para VIRODA: `ES8801280250590100081826`
3. GoCardless asignará un Scheme Identifier SEPA

### Paso 4: Obtener token y configurar webhook

1. **Developers → Access tokens** → Crear token `live_...`
2. **Developers → Webhooks** → Añadir:
   - URL: `https://inmovaapp.com/api/gocardless/webhook`
   - Todos los eventos (payments._, mandates._, payouts._, subscriptions._)
3. Copiar el Webhook Secret

### Paso 5: Configurar en .env.production

```env
GOCARDLESS_ACCESS_TOKEN=live_xxxxxxxxxxxxxxxxxxxxxx
GOCARDLESS_ENVIRONMENT=live
GOCARDLESS_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx
```

```bash
pm2 restart inmova-app --update-env
```

### Paso 6: Verificar

Ir a `/pagos/sepa` — debe mostrar `configured: true` y el nombre del creditor.

### Paso 7: Alta de primer inquilino con SEPA

Desde `/pagos/sepa` → "Alta SEPA" → seleccionar inquilino → Inmova genera enlace → enviar al inquilino → autoriza → mandate activo → cobros automáticos mensuales.

---

## PARTE 3 — Flujo de conciliación automática

Una vez configurado Salt Edge + GoCardless Payments:

```
Cada mes:
  1. Inmova lanza cobro SEPA al inquilino (subscription automática)
  2. GoCardless cobra → SepaPayment status = "confirmed"
  3. Webhook → Auto-conciliación capa 1: SepaPayment → Payment (alquiler marcado "pagado")

  4. GoCardless transfiere a Bankinter (payout ~T+2)
  5. Salt Edge descarga el movimiento en la sincronización diaria
  6. Auto-conciliación capa 2: GCPayout ↔ BankTransaction

Para transferencias directas (sin SEPA):
  7. Salt Edge las descarga igualmente
  8. Auto-conciliación capa 3: BankTransaction → Payment por nombre + importe
  9. IA (Claude) para casos ambiguos
```

### Cron diario recomendado

En `vercel.json` (Vercel) o crontab del servidor:

```json
{
  "crons": [{ "path": "/api/cron/bank-reconciliation", "schedule": "0 8 * * *" }]
}
```

---

## PARTE 4 — Diagnóstico de problemas

### "Salt Edge no configurado"

```bash
grep SALTEDGE .env.production
pm2 env inmova-app | grep SALTEDGE
# Si está vacío → pm2 restart inmova-app --update-env
```

### "Error al conectar banco en Salt Edge"

- Verificar que el provider code es correcto (`bankinter_xo_es`)
- Salt Edge puede tener el banco bajo un código diferente — ver lista completa en `/api/open-banking/saltedge/status`
- Verificar que la URL de callback está correctamente configurada: `NEXT_PUBLIC_APP_URL=https://inmovaapp.com`

### "GoCardless no configurado"

```bash
grep GOCARDLESS .env.production
# Verificar que GOCARDLESS_ACCESS_TOKEN empieza por 'live_' (no 'sandbox_')
```

### Los movimientos no se sincronizan

```bash
# Estado de conexiones Salt Edge en BD
# SELECT * FROM "BankConnection" WHERE "proveedor" = 'saltedge';

# Forzar sync manual
curl -X POST https://inmovaapp.com/api/open-banking/saltedge/sync \
  -H "Cookie: ..." -d '{}'
```

---

## Checklist de puesta en producción

### Salt Edge (lectura movimientos Bankinter)

- [ ] Cuenta Salt Edge Partner creada y verificada
- [ ] `SALTEDGE_APP_ID` configurado en .env.production
- [ ] `SALTEDGE_SECRET` configurado en .env.production
- [ ] PM2 reiniciado con --update-env
- [ ] Test: `/api/open-banking/saltedge/status` devuelve `connected: true`
- [ ] Bankinter conectado para ROVIDA (autorización completada)
- [ ] Bankinter conectado para VIRODA (autorización completada)
- [ ] Primera sincronización ejecutada con éxito
- [ ] Movimientos visibles en `/finanzas/conciliacion`

### GoCardless Payments (SEPA)

- [ ] Cuenta GoCardless creada y verificada (KYB completado)
- [ ] IBAN Bankinter añadido como creditor
- [ ] `GOCARDLESS_ACCESS_TOKEN` (live\_...) configurado
- [ ] `GOCARDLESS_ENVIRONMENT=live` configurado
- [ ] Webhook creado en dashboard
- [ ] `GOCARDLESS_WEBHOOK_SECRET` configurado
- [ ] `/pagos/sepa` muestra `configured: true`
- [ ] Primer mandato SEPA de inquilino activo

### Conciliación automática

- [ ] Cron diario configurado
- [ ] Primera conciliación unificada ejecutada sin errores
- [ ] Pagos SEPA se marcan como "pagado" automáticamente

---

## Contactos y soporte

- **Salt Edge**: https://www.saltedge.com/contact_us
- **GoCardless Payments soporte**: https://manage.gocardless.com/support
- **Estado GoCardless**: https://status.gocardless.com/

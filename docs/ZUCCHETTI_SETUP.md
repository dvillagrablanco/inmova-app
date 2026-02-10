# 🔗 Guía de Configuración - Integración Zucchetti

## 📋 Resumen

Esta guía describe cómo configurar la integración entre INMOVA y Zucchetti (ERP/Contabilidad).

---

## 🔐 Credenciales Necesarias

### Del Técnico de Zucchetti necesitas:

| Variable                  | Descripción               | Ejemplo                           |
| ------------------------- | ------------------------- | --------------------------------- |
| `ZUCCHETTI_CLIENT_ID`     | ID de aplicación OAuth    | `inmova_app_12345`                |
| `ZUCCHETTI_CLIENT_SECRET` | Secret de la aplicación   | `abc123secret...`                 |
| `ZUCCHETTI_API_KEY`       | API Key (si es diferente) | `zk_live_xxx`                     |
| `ZUCCHETTI_API_URL`       | URL base del API          | `https://api.zucchetti.it/v1`     |
| `ZUCCHETTI_OAUTH_URL`     | URL del servicio OAuth    | `https://auth.zucchetti.it/oauth` |

---

### 🧾 Modo Altai (Login + Bearer Token)

Si el cliente usa **Altai (Zucchetti Contabilidad)** con autenticación por login,
configura estas variables y activa el modo Altai:

```bash
# Activar modo Altai
ZUCCHETTI_AUTH_MODE=altai

# URL base Altai
ZUCCHETTI_ALTAI_API_URL=https://wsaltaifacturas.altai.es/api
ZUCCHETTI_ALTAI_AUTH_PATH=/login/authenticate

# Credenciales Altai
ZUCCHETTI_ALTAI_LOGIN=tu_login
ZUCCHETTI_ALTAI_PASSWORD=tu_password
ZUCCHETTI_ALTAI_COMPANY_CODE=tu_empresa

# Endpoint de asientos (obligatorio para sincronizar)
ZUCCHETTI_ALTAI_ENTRIES_URL=https://wsaltaifacturas.altai.es/api/accounting/entries

# Opcional: token para ingesta externa de movimientos
ZUCCHETTI_ALTAI_INGEST_TOKEN=token_seguro
```

### ✅ Test rápido (Altai Auth)

Altai expone un endpoint de autenticación que retorna un **JWT** (string) para usar como `Authorization: Bearer <token>`.

> Importante: el body esperado es `Username` y `Password` (no `login` / `password`).

```bash
curl -X POST "https://wsaltaifacturas.altai.es/api/login/authenticate" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"Username":"TU_LOGIN","Password":"TU_PASSWORD"}'
```

> Nota: Si no se conoce el endpoint de asientos, configura
> `ZUCCHETTI_ALTAI_ENTRIES_URL` cuando el técnico lo confirme.

### Configuración adicional (generada por INMOVA):

| Variable                   | Descripción                            | Valor                                 |
| -------------------------- | -------------------------------------- | ------------------------------------- |
| `ZUCCHETTI_ENCRYPTION_KEY` | Clave para encriptar tokens (32 bytes) | Generar con `openssl rand -base64 32` |

---

## 🚀 Pasos de Configuración

### 1. Añadir Variables de Entorno

En el servidor de producción, añadir a `.env.production`:

```bash
# Zucchetti Integration
ZUCCHETTI_CLIENT_ID=tu_client_id_aqui
ZUCCHETTI_CLIENT_SECRET=tu_client_secret_aqui
ZUCCHETTI_API_KEY=tu_api_key_aqui
ZUCCHETTI_API_URL=https://api.zucchetti.it/v1
ZUCCHETTI_OAUTH_URL=https://auth.zucchetti.it/oauth
ZUCCHETTI_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 2. Aplicar Migración de Base de Datos

```bash
npx prisma db push
# o
npx prisma migrate deploy
```

### 3. Reiniciar la Aplicación

```bash
pm2 restart inmova-app --update-env
```

### 4. Verificar Configuración

Acceder a: `https://inmovaapp.com/api/integrations/zucchetti/config`

Deberías ver:

```json
{
  "success": true,
  "data": {
    "serverConfigured": true,
    "enabled": false,
    "connected": false
  }
}
```

---

## 📡 Endpoints Disponibles

### Autorización OAuth

| Método | Endpoint                                | Descripción                  |
| ------ | --------------------------------------- | ---------------------------- |
| `GET`  | `/api/integrations/zucchetti/authorize` | Inicia flujo OAuth           |
| `GET`  | `/api/integrations/zucchetti/callback`  | Callback OAuth (URL pública) |

### Configuración

| Método   | Endpoint                             | Descripción              |
| -------- | ------------------------------------ | ------------------------ |
| `GET`    | `/api/integrations/zucchetti/config` | Estado de la integración |
| `DELETE` | `/api/integrations/zucchetti/config` | Desconectar Zucchetti    |

### Operaciones

| Método | Endpoint                           | Descripción              |
| ------ | ---------------------------------- | ------------------------ |
| `POST` | `/api/integrations/zucchetti/test` | Test de conexión         |
| `GET`  | `/api/integrations/zucchetti/sync` | Estado de sincronización |
| `POST` | `/api/integrations/zucchetti/sync` | Ejecutar sincronización  |

### Ingesta Altai (movimientos externos)

| Método | Endpoint                                   | Descripción                    |
| ------ | ------------------------------------------ | ------------------------------ |
| `POST` | `/api/integrations/zucchetti/altai/ingest` | Ingesta de asientos para Altai |

**Auth**:

- Sesión de admin (NextAuth), o
- Header `Authorization: Bearer <ZUCCHETTI_ALTAI_INGEST_TOKEN>`  
  (o `x-altai-ingest-token`)

---

## 🔄 Flujo OAuth

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTORIZACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Admin accede a /admin/integraciones                     │
│     │                                                       │
│     ▼                                                       │
│  2. Click en "Conectar Zucchetti"                           │
│     │                                                       │
│     ▼                                                       │
│  3. GET /api/integrations/zucchetti/authorize               │
│     │                                                       │
│     ▼                                                       │
│  4. Redirect a Zucchetti OAuth                              │
│     (https://auth.zucchetti.it/oauth/authorize)             │
│     │                                                       │
│     ▼                                                       │
│  5. Usuario autoriza en Zucchetti                           │
│     │                                                       │
│     ▼                                                       │
│  6. Zucchetti redirige a callback:                          │
│     https://inmovaapp.com/api/integrations/zucchetti/callback│
│     │                                                       │
│     ▼                                                       │
│  7. Callback intercambia código por tokens                  │
│     │                                                       │
│     ▼                                                       │
│  8. Tokens encriptados y guardados en BD                    │
│     │                                                       │
│     ▼                                                       │
│  9. Redirect a /admin/integraciones?status=success          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Datos Sincronizables

### De INMOVA a Zucchetti:

| Tipo         | Origen INMOVA                 | Destino Zucchetti                          |
| ------------ | ----------------------------- | ------------------------------------------ |
| **Clientes** | `Tenant` (inquilinos)         | `/customers`                               |
| **Pagos**    | `Payment` (cobros de renta)   | `/accounting/entries` (asientos contables) |
| **Gastos**   | `Expense` (gastos operativos) | `/accounting/entries` (asientos contables) |
| **Facturas** | Próximamente                  | `/invoices`                                |

### Mapping de Cuentas Contables:

| Concepto                    | Código Cuenta | Nombre                              |
| --------------------------- | ------------- | ----------------------------------- |
| Cobro de renta (Debe)       | `570001`      | Caja/Bancos                         |
| Cobro de renta (Haber)      | `705001`      | Ingresos por Arrendamientos         |
| Gasto mantenimiento (Debe)  | `629001`      | Gastos Mantenimiento y Reparaciones |
| Gasto mantenimiento (Haber) | `410001`      | Acreedores por servicios            |

> ⚠️ **IMPORTANTE**: Confirmar con el técnico de Zucchetti que estos códigos coinciden con el plan de cuentas del cliente.

---

## 🧪 Test de Integración

### Desde API:

```bash
# 1. Verificar configuración
curl -X GET "https://inmovaapp.com/api/integrations/zucchetti/config" \
  -H "Authorization: Bearer {token}"

# 2. Test de conexión
curl -X POST "https://inmovaapp.com/api/integrations/zucchetti/test" \
  -H "Authorization: Bearer {token}"

# 3. Sincronización en modo prueba (dry run)
curl -X POST "https://inmovaapp.com/api/integrations/zucchetti/sync" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"type": "customers", "dryRun": true}'
```

### Resultados esperados del test:

```json
{
  "success": true,
  "connected": true,
  "message": "Conexión con Zucchetti verificada correctamente",
  "tests": {
    "configured": true,
    "authenticated": true,
    "apiReachable": true,
    "canReadData": true
  }
}
```

---

## ❓ Preguntas para el Técnico de Zucchetti

### Autenticación:

- [ ] ¿Usan OAuth 2.0 Authorization Code Flow?
- [ ] ¿Cuánto dura el access_token? (segundos)
- [ ] ¿El refresh_token tiene expiración?

### API:

- [ ] ¿URL exacta del API de producción?
- [ ] ¿URL exacta del OAuth de producción?
- [ ] ¿Hay entorno de sandbox/pruebas?
- [ ] ¿Rate limiting? (requests/minuto)

### Datos:

- [ ] ¿Códigos del plan de cuentas que debemos usar?
- [ ] ¿Formato de fechas esperado? (ISO 8601?)
- [ ] ¿Identificador de cliente? (NIF o código interno)

### Permisos:

- [ ] Scopes OAuth necesarios:
  - `accounting:read`
  - `accounting:write`
  - `customers:read`
  - `customers:write`
  - `invoices:read`
  - `invoices:write`

---

## 🔧 Troubleshooting

### Error: "Zucchetti no está configurado"

**Causa**: Faltan variables de entorno.

**Solución**:

```bash
# Verificar variables
pm2 env 0 | grep ZUCCHETTI

# Si faltan, añadir a .env.production y reiniciar
pm2 restart inmova-app --update-env
```

### Error: "Token expirado"

**Causa**: El refresh_token falló.

**Solución**:

1. Ir a `/admin/integraciones`
2. Desconectar Zucchetti
3. Volver a conectar (nuevo OAuth)

### Error: "State inválido o expirado"

**Causa**: El usuario tardó más de 10 minutos en autorizar.

**Solución**: Reintentar el proceso de autorización.

---

## 📞 Contacto

**Soporte INMOVA**: support@inmova.app  
**Documentación Zucchetti**: https://developer.zucchetti.com

---

_Última actualización: Enero 2026_

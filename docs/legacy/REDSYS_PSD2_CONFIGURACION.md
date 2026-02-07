# Configuración Redsys PSD2 para INMOVA

## Resumen Ejecutivo

Este documento contiene toda la información necesaria para la integración de INMOVA con la plataforma Redsys PSD2, que permite el acceso a servicios bancarios de Bankinter y otros bancos españoles a través de open banking.

---

## 1. Cuenta de Desarrollador

### Credenciales de Acceso
- **Plataforma:** Redsys PSD2 Sandbox
- **URL:** https://market.apis-i.redsys.es/psd2/xs2a/
- **Usuario:** vidaroinversiones
- **Email:** dvillagra@vidaroinversiones.com
- **Password:** Pucela00
- **Nombre:** Vidaro Inversiones

### Estado de la Cuenta
- ✅ Cuenta creada exitosamente
- ✅ Acceso al portal de desarrolladores verificado
- ✅ Aplicación registrada

---

## 2. Aplicación Registrada

### Información de la Aplicación
- **Nombre:** INMOVA - Plataforma de Gestion Inmobiliaria
- **Descripción:** Aplicacion PSD2 para integracion bancaria de INMOVA con Bankinter y otros bancos espanoles. Permite acceso a cuentas, transacciones, pagos y servicios de open banking para gestion integral de propiedades inmobiliarias.
- **Estado:** DEVELOPMENT
- **Entorno:** Sandbox

### Credenciales OAuth 2.0

**⚠️ IMPORTANTE: Estas credenciales son sensibles y deben guardarse de forma segura**

```
Client ID: cdcdc82b3-abfc-42e9-9ee3-9df6490ae87e
Client Secret: Q2lF6pFoIK5yC4pQ6tL1vT5rT5p5ObX7fN5uW5aP2IN2IKz5MS
```

### OAuth Redirect URI
```
https://inmova.app/api/open-banking/redsys/callback
```

---

## 3. Endpoints Disponibles

### Entorno de Desarrollo (Sandbox)
```
Base URL: https://apis-i.redsys.es:28443/psd2/xs2a
```

### Entorno de Producción
```
Base URL: https://apis-i.redsys.es:20443/psd2/xs2a
```

### Endpoint de Autorización OAuth
```
GET /{aspsp}/authorize?response_type=code&client_id={client_id}&scope={scope}&state={state}&redirect_uri={redirect_uri}&code_challenge={code_challenge}&code_challenge_method={code_challenge_method}
```

### Parámetros de Autorización
- **aspsp:** Nombre del banco (ej: "bankinter", "santander", "bbva")
- **response_type:** Debe ser "code"
- **client_id:** cdcdc82b3-abfc-42e9-9ee3-9df6490ae87e
- **scope:** Alcance de permisos solicitados (ej: "AIS", "PIS", "FCS")
- **state:** Token de seguridad generado por la aplicación
- **redirect_uri:** https://inmova.app/api/open-banking/redsys/callback
- **code_challenge:** Desafío PKCE (opcional pero recomendado)
- **code_challenge_method:** "S256" para PKCE

---

## 4. APIs del HUB PSD2 (v1.1.0)

Las siguientes APIs están incluidas en el Hub operativo de Redsys:

### 4.1. Multibank API
- **Versión:** 1.1.0
- **Plan:** Unlimited
- **Descripción:** API para operaciones multibanco

### 4.2. FundsConfirmations-FCS-PSD2
- **Versión:** 1.1.0
- **Plan:** Unlimited
- **Descripción:** Confirmación de disponibilidad de fondos

### 4.3. Service for Establishing AIS and FCS Consents
- **Versión:** 1.1.0
- **Plan:** Unlimited
- **Descripción:** Servicio para establecer consentimientos AIS y FCS

### 4.4. HUB-PSD2
- **Versión:** 1.1.0
- **Plan:** Unlimited
- **Descripción:** API principal de Redsys para PSD2
- **Operaciones principales:**
  - POST /api-entrada-xs2a/services/{aspsp}/v1.1/payments/{payment-product}
  - GET /api-entrada-xs2a/services/{aspsp}/v1.1/payments/{payment-product}/{paymentId}
  - DELETE /api-entrada-xs2a/services/{aspsp}/v1.1/payments/{payment-product}/{paymentId}

### 4.5. Accounts-AIS-PSD2
- **Versión:** 1.1.0
- **Plan:** Unlimited
- **Descripción:** Servicios de información de cuentas (AIS)
- **Funcionalidades:**
  - Consulta de cuentas
  - Consulta de saldos
  - Consulta de transacciones
  - Detalles de transacciones

### 4.6. Procesos Comunes a los Servicios
- **Versión:** 1.1.0
- **Plan:** Unlimited
- **Descripción:** Procesos comunes compartidos por todos los servicios

### 4.7. SVA - Servicios de Valor Añadido
- **Versión:** 1.1.0
- **Plan:** Free
- **Descripción:** Servicios adicionales de valor añadido

---

## 5. Flujo OAuth 2.0

### Paso 1: Solicitar Autorización

El usuario es redirigido al endpoint de autorización del banco:

```
https://apis-i.redsys.es:28443/psd2/xs2a/{bank}/authorize?
  response_type=code&
  client_id=cdcdc82b3-abfc-42e9-9ee3-9df6490ae87e&
  scope=AIS&
  state={random_state}&
  redirect_uri=https://inmova.app/api/open-banking/redsys/callback
```

### Paso 2: Usuario Autoriza en el Banco

El usuario se autentica en su banco (Bankinter, BBVA, Santander, etc.) y autoriza el acceso a sus datos.

### Paso 3: Callback con Código de Autorización

El banco redirige al usuario de vuelta a:

```
https://inmova.app/api/open-banking/redsys/callback?code={authorization_code}&state={state}
```

### Paso 4: Intercambiar Código por Access Token

INMOVA intercambia el código de autorización por un access token:

```http
POST /token HTTP/1.1
Host: apis-i.redsys.es:28443
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code={authorization_code}&
redirect_uri=https://inmova.app/api/open-banking/redsys/callback&
client_id=cdcdc82b3-abfc-42e9-9ee3-9df6490ae87e&
client_secret=Q2lF6pFoIK5yC4pQ6tL1vT5rT5p5ObX7fN5uW5aP2IN2IKz5MS
```

### Paso 5: Usar Access Token

Con el access token, INMOVA puede realizar llamadas a las APIs:

```http
GET /api-entrada-xs2a/services/bankinter/v1.1/accounts HTTP/1.1
Host: apis-i.redsys.es:28443
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## 6. Bancos Soportados en España

A través de Redsys PSD2, INMOVA puede integrarse con los siguientes bancos españoles:

### Bancos Principales
1. **Bankinter** (bankinter)
2. **BBVA** (bbva)
3. **Banco Santander** (santander)
4. **CaixaBank** (caixabank)
5. **Banco Sabadell** (sabadell)
6. **Bankia** (bankia)
7. **Unicaja Banco** (unicaja)
8. **Liberbank** (liberbank)
9. **Abanca** (abanca)
10. **Cajamar** (cajamar)
11. **Kutxabank** (kutxabank)
12. **Ibercaja** (ibercaja)

### Bancos Digitales
13. **ING** (ing)
14. **N26** (n26)
15. **Revolut** (revolut)
16. **Openbank** (openbank)

**Nota:** El nombre entre paréntesis es el identificador `{aspsp}` que se debe usar en las llamadas a la API.

---

## 7. Tipos de Servicios PSD2

### 7.1. AIS (Account Information Services)
**Servicios de Información de Cuentas**

- Consultar lista de cuentas
- Consultar saldos de cuentas
- Consultar transacciones
- Obtener detalles de transacciones específicas

**Scope OAuth:** `AIS`

### 7.2. PIS (Payment Initiation Services)
**Servicios de Iniciación de Pagos**

- Iniciar transferencias SEPA
- Iniciar pagos instantáneos
- Consultar estado de pagos
- Cancelar pagos pendientes

**Scope OAuth:** `PIS`

### 7.3. FCS (Funds Confirmation Services)
**Servicios de Confirmación de Fondos**

- Verificar disponibilidad de fondos antes de una transacción
- Validar saldo suficiente para pagos

**Scope OAuth:** `FCS`

---

## 8. Configuración de Variables de Entorno

Agregar las siguientes variables al archivo `.env` de INMOVA:

```env
# Redsys PSD2 Configuration
REDSYS_CLIENT_ID=cdcdc82b3-abfc-42e9-9ee3-9df6490ae87e
REDSYS_CLIENT_SECRET=Q2lF6pFoIK5yC4pQ6tL1vT5rT5p5ObX7fN5uW5aP2IN2IKz5MS
REDSYS_REDIRECT_URI=https://inmova.app/api/open-banking/redsys/callback
REDSYS_BASE_URL=https://apis-i.redsys.es:28443/psd2/xs2a
REDSYS_ENVIRONMENT=sandbox

# Para producción, cambiar a:
# REDSYS_BASE_URL=https://apis-i.redsys.es:20443/psd2/xs2a
# REDSYS_ENVIRONMENT=production
```

---

## 9. Certificados eIDAS

### Para Entorno de Desarrollo (Sandbox)
- ❌ No se requieren certificados eIDAS
- ✅ Se pueden usar credenciales OAuth directamente
- ✅ Acceso completo a APIs de prueba

### Para Entorno de Producción
- ✅ Se requieren certificados eIDAS
- **Tipos necesarios:**
  - **QWAC** (Qualified Website Authentication Certificate)
  - **QSEAL** (Qualified Electronic Seal Certificate)
- **Proceso:**
  1. Obtener certificados de una CA autorizada
  2. Registrar certificados en Redsys (al menos 1 mes antes)
  3. Usar herramienta de soporte TPP para notificación
  4. Esperar aprobación de Redsys

---

## 10. Próximos Pasos

### Paso 1: Configurar Variables de Entorno ✅
Agregar las credenciales de Redsys al archivo `.env`

### Paso 2: Implementar Servicio de Integración ⏳
Crear o actualizar el servicio de integración con Redsys en:
```
/home/ubuntu/homming_vidaro/nextjs_space/lib/redsys-psd2-service.ts
```

### Paso 3: Crear Endpoints de API ⏳
Implementar los siguientes endpoints:
- `POST /api/open-banking/redsys/authorize` - Iniciar flujo OAuth
- `GET /api/open-banking/redsys/callback` - Manejar callback OAuth
- `GET /api/open-banking/redsys/accounts` - Listar cuentas
- `GET /api/open-banking/redsys/transactions` - Consultar transacciones
- `POST /api/open-banking/redsys/payments` - Iniciar pagos

### Paso 4: Actualizar UI ⏳
Agregar interfaces de usuario para:
- Conectar cuentas bancarias
- Ver transacciones
- Iniciar pagos
- Gestionar consentimientos

### Paso 5: Pruebas en Sandbox ⏳
Probar todas las funcionalidades con:
- Datos de prueba de Redsys
- Diferentes bancos simulados
- Flujos completos de OAuth

### Paso 6: Documentación ⏳
Documentar:
- Guía de usuario
- Troubleshooting
- FAQs

### Paso 7: Migración a Producción 🔮
(Cuando esté listo para producción)
- Obtener certificados eIDAS
- Registrar certificados en Redsys
- Cambiar a endpoints de producción
- Actualizar variables de entorno

---

## 11. Recursos Adicionales

### Documentación Oficial
- **Portal Desarrolladores:** https://market.apis-i.redsys.es/psd2/xs2a/
- **Documentación API:** Disponible en el portal después del login
- **OAuth 2.0 Guide:** En sección "OAuth 2.0" del portal
- **Test Set:** Herramientas de prueba disponibles en el portal

### Soporte
- **Página de Soporte:** Disponible en el menú "Support" del portal
- **Forum:** Sección "Latest forum posts and tweets" en el home
- **Email:** A través del formulario de soporte del portal

### Guías Relacionadas
- `INTEGRACION_BANKINTER_GUIA.md` - Guía de integración con Bankinter
- `BANKINTER_INTEGRATION_QUICKSTART.md` - Quick start de Bankinter
- `GUIA_INTEGRACIONES_CONTABILIDAD.md` - Integración con sistemas contables

---

## 12. Notas Importantes

### Seguridad
1. **Nunca** exponer las credenciales OAuth en el código cliente
2. **Siempre** usar HTTPS para todas las comunicaciones
3. **Implementar** PKCE (Proof Key for Code Exchange) para mayor seguridad
4. **Validar** el parámetro `state` en el callback para prevenir CSRF
5. **Rotar** el Client Secret periódicamente
6. **Almacenar** los access tokens de forma segura (encriptados en base de datos)

### Cumplimiento PSD2
1. Los consentimientos de usuario tienen una duración máxima de 90 días
2. Se debe solicitar renovación de consentimiento antes de expirar
3. Los usuarios pueden revocar el consentimiento en cualquier momento
4. Se debe mostrar claramente qué datos se están accediendo
5. Mantener logs de auditoría de todos los accesos a datos bancarios

### Limitaciones del Sandbox
1. Los datos son simulados, no reales
2. Puede haber diferencias con el comportamiento en producción
3. No todos los bancos pueden estar disponibles en sandbox
4. Los tiempos de respuesta pueden variar
5. No se procesan transacciones reales

---

## 13. Troubleshooting

### Problema: "Access Denied" al iniciar OAuth
**Solución:** Verificar que el `redirect_uri` coincida exactamente con el configurado en la aplicación.

### Problema: "Invalid Client" al intercambiar código
**Solución:** Verificar que Client ID y Client Secret sean correctos y estén en el formato adecuado.

### Problema: Token expirado
**Solución:** Implementar refresh token flow para renovar automáticamente los tokens.

### Problema: Banco no responde
**Solución:** Verificar que el identificador `{aspsp}` del banco sea correcto y esté soportado.

### Problema: Errores de certificado SSL
**Solución:** En sandbox, puede ser necesario configurar certificados de prueba o desactivar verificación SSL (solo para desarrollo).

---

## 14. Contacto

**Cuenta Redsys PSD2:**
- Usuario: vidaroinversiones
- Email: dvillagra@vidaroinversiones.com

**Gestión de la Aplicación:**
- URL: https://market.apis-i.redsys.es/psd2/xs2a/applications
- Application ID: Visible después del login

---

**Documento generado:** Diciembre 2025  
**Versión:** 1.0  
**Estado:** Configuración inicial completada ✅

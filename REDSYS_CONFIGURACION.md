# Configuración de Redsys PSD2/XS2A

Fecha: Diciembre 2024

## 📧 Información del Registro

### Credenciales de Acceso al Portal Desarrolladores

- **Plataforma**: market.apis-i.redsys.es:22443/psd2/xs2a
- **URL de Login**: https://market.apis-i.redsys.es/psd2/xs2a/user
- **Usuario**: `vidaroinversiones`
- **Contraseña**: (Proporcionada en el email de registro)

### Estado Actual

✅ Registro completado en el sandbox de Redsys  
⚠️ Credenciales pendientes de configurar en `.env`  
❌ Certificados eIDAS pendientes de obtener

## 🔑 Variables de Entorno Actuales

### En `.env` (nextjs_space/.env)

```bash
# Redsys PSD2 API URLs
REDSYS_API_URL=https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services
REDSYS_OAUTH_URL=https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a

# Credenciales (PENDIENTE ACTUALIZAR)
REDSYS_CLIENT_ID=your_client_id_here
REDSYS_CLIENT_SECRET=your_client_secret_here

# Certificados eIDAS (PENDIENTE OBTENER)
REDSYS_CERTIFICATE_PATH=/path/to/qwac_certificate.pem
REDSYS_CERTIFICATE_KEY_PATH=/path/to/qwac_private_key.pem
REDSYS_SEAL_CERTIFICATE_PATH=/path/to/qseal_certificate.pem
REDSYS_SEAL_KEY_PATH=/path/to/qseal_private_key.pem

# Códigos de banco
REDSYS_BANKINTER_CODE=bankinter
```

## 🛠️ Pasos para Completar la Integración

### 1. Acceder al Portal de Desarrolladores

1. Navegar a: https://market.apis-i.redsys.es/psd2/xs2a/user
2. Iniciar sesión con:
   - Usuario: `vidaroinversiones`
   - Contraseña: (del email)
3. Aceptar términos y condiciones si es necesario

### 2. Obtener Credenciales OAuth

Dentro del portal:

1. Ir a **"Mis Aplicaciones"** o **"Applications"**
2. Crear una nueva aplicación o seleccionar existente
3. Obtener:
   - `Client ID`
   - `Client Secret`
4. Copiar estos valores para actualizar `.env`

### 3. Solicitar/Generar Certificados eIDAS

#### Opción A: Ambiente de Pruebas (Sandbox)

Redsys proporciona certificados de prueba:

1. En el portal, ir a **"Certificados"** o **"Certificates"**
2. Descargar certificados de prueba:
   - QWAC (Web Application Certificate)
   - QSealC (Seal Certificate)
3. Guardar en la ubicación del proyecto (ej: `certs/test/`)

#### Opción B: Producción

Para producción, necesitarás:

1. **Número de Autorización TPP del Banco de España**
   - Solicitar en: https://www.bde.es
   - Proceso puede tardar 2-3 meses

2. **Certificados eIDAS Cualificados**
   - Proveedor recomendado: Camerfirma, FNMT
   - Tipos necesarios:
     - QWAC (para autenticación)
     - QSealC (para firma)

### 4. Actualizar Variables de Entorno

```bash
# En nextjs_space/.env

# Credenciales obtenidas del portal
REDSYS_CLIENT_ID=<tu_client_id_real>
REDSYS_CLIENT_SECRET=<tu_client_secret_real>

# Rutas a los certificados descargados
REDSYS_CERTIFICATE_PATH=./certs/test/qwac_certificate.pem
REDSYS_CERTIFICATE_KEY_PATH=./certs/test/qwac_private_key.pem
REDSYS_SEAL_CERTIFICATE_PATH=./certs/test/qseal_certificate.pem
REDSYS_SEAL_KEY_PATH=./certs/test/qseal_private_key.pem
```

### 5. Configurar Redirect URIs

En el portal de Redsys:

1. Configurar URLs de redirección para OAuth:
   ```
   https://inmova.app/api/open-banking/bankinter/callback
   https://inmova.app/api/open-banking/redsys/callback
   http://localhost:3000/api/open-banking/bankinter/callback (desarrollo)
   ```

### 6. Probar la Integración
```bash
# Desde la consola del proyecto
cd nextjs_space

# Verificar que las variables están cargadas
node -e "require('dotenv').config(); console.log(process.env.REDSYS_CLIENT_ID)"

# Ejecutar script de prueba (si existe)
node scripts/test-redsys-connection.js
```

## 📝 Estructura de Archivos de Certificados

```
nextjs_space/
├── certs/
│   ├── test/                    # Certificados de prueba
│   │   ├── qwac_certificate.pem
│   │   ├── qwac_private_key.pem
│   │   ├── qseal_certificate.pem
│   │   └── qseal_private_key.pem
│   └── production/              # Certificados reales (NO SUBIR A GIT)
│       ├── qwac_certificate.pem
│       ├── qwac_private_key.pem
│       ├── qseal_certificate.pem
│       └── qseal_private_key.pem
└── .gitignore                  # Asegurar que /certs esté excluido
```

### ⚠️ Importante: Seguridad de Certificados

Añadir a `.gitignore`:

```bash
# Certificados eIDAS
/certs/production/
*.pem
*.key
*.p12
*.pfx
```

## 🌐 URLs del Entorno

### Sandbox (Pruebas)
- **API**: https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services
- **OAuth**: https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a
- **Portal**: https://market.apis-i.redsys.es/psd2/xs2a/user

### Producción
- **API**: https://sis.redsys.es:25443/psd2/xs2a/api-entrada-xs2a/services
- **OAuth**: https://sis.redsys.es:25443/psd2/xs2a/api-oauth-xs2a

## 🛡️ Consideraciones de Seguridad

### 1. Almacenamiento de Certificados

- ❌ NO subir certificados al repositorio
- ✅ Usar variables de entorno para rutas
- ✅ Encriptar certificados en producción
- ✅ Usar servicios de secretos (AWS Secrets Manager, etc.)

### 2. Rotación de Credenciales

- Certificados eIDAS tienen validez de 1-2 años
- Client Secret debe rotarse cada 90 días
- Implementar recordatorios de renovación

### 3. Logs y Monitoreo

- NO loggear Client Secret ni claves privadas
- Monitorear intentos de autenticación fallidos
- Implementar rate limiting

## 📊 Flujo de Integración Bankinter via Redsys

### 1. Consentimiento del Usuario

```typescript
// lib/bankinter-integration-service.ts
const { authUrl, consentId } = await bankinterService.conectarCuentaBankinter(
  tenantId,
  'ES1234567890123456789012',  // IBAN
  'Verificación de ingresos'
);

// Redirigir al usuario a authUrl para autorizar acceso
```

### 2. Callback de Autorización
```typescript
// app/api/open-banking/bankinter/callback/route.ts
const code = searchParams.get('code');
const state = searchParams.get('state');

// Intercambiar code por access token
const tokens = await bankinterService.exchangeCodeForToken(code);
```

### 3. Acceso a Datos Bancarios

```typescript
// Obtener transacciones
const transactions = await bankinterService.sincronizarTransaccionesBankinter(
  connectionId,
  startDate,
  endDate
);

// Verificar ingresos
const incomeVerification = await bankinterService.verificarIngresosBankinter(
  tenantId,
  minMonthlyIncome
);
```

## ✅ Checklist de Configuración

### Fase 1: Acceso Inicial
- [ ] Acceder al portal con credenciales
- [ ] Cambiar contraseña por una segura
- [ ] Explorar la documentación disponible

### Fase 2: Configuración de Aplicación
- [ ] Crear aplicación en el portal
- [ ] Obtener Client ID
- [ ] Obtener Client Secret
- [ ] Configurar Redirect URIs
- [ ] Actualizar `.env`

### Fase 3: Certificados
- [ ] Descargar certificados de prueba
- [ ] Crear directorio `certs/test`
- [ ] Guardar certificados en ubicación correcta
- [ ] Actualizar rutas en `.env`
- [ ] Añadir `/certs` a `.gitignore`

### Fase 4: Pruebas
- [ ] Ejecutar prueba de conexión
- [ ] Probar flujo OAuth
- [ ] Verificar obtención de token
- [ ] Probar consulta de cuentas
- [ ] Probar consulta de transacciones

### Fase 5: Producción (Futuro)
- [ ] Solicitar Número TPP al Banco de España
- [ ] Obtener certificados eIDAS cualificados
- [ ] Configurar ambiente de producción
- [ ] Migrar URLs a producción
- [ ] Realizar pruebas en producción

## 📞 Soporte y Contacto

### Redsys
- **Email**: integraciones@redsys.es
- **Teléfono**: +34 91 456 XXXX
- **Portal de Soporte**: https://pagosonline.redsys.es/soporte.html

### Banco de España (Para Número TPP)
- **Web**: https://www.bde.es/bde/es/secciones/servicios/Particulares_y_e/Servicios_de_Pag/
- **Email**: registrodepsc@bde.es

## 📚 Recursos Adicionales

- [Documentación PSD2 de Redsys](https://pagosonline.redsys.es/conexion-psd2.html)
- [Guía de Integración XS2A](https://canales.redsys.es/docum/XS2A/Manual_XS2A_v1.pdf)
- [Normativa PSD2 en Europa](https://ec.europa.eu/info/law/payment-services-psd-2-directive-eu-2015-2366_en)
- [Banco de España - Registro TPP](https://www.bde.es/wbe/es/servicios-ciudadano/registros-oficiales/registro-proveedores-servicios-pago/)

## 📝 Notas Finales

La integración de Redsys/Bankinter ya está **parcialmente implementada** en INMOVA:

- ✅ Código de servicio listo (`bankinter-integration-service.ts`)
- ✅ API endpoints configurados
- ✅ UI en Open Banking page
- ⚠️ Requiere credenciales y certificados para funcionar

Una vez completada la configuración, la funcionalidad estará **lista para usar** sin cambios de código.

---

**Última actualización**: Diciembre 2024  
**Responsable**: INMOVA Development Team  
**Estado**: Pendiente de configuración de credenciales

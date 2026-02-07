# Guía de Integración con Bankinter (Open Banking)

## Resumen Ejecutivo

Esta guía proporciona las instrucciones necesarias para integrar Inmova con los servicios de Open Banking de Bankinter a través de la plataforma Redsys PSD2.

## Servicios Disponibles

### 1. Account Information Service (AIS)
- **Descripción**: Permite acceder a información de cuentas, saldos y transacciones
- **Licencia requerida**: AISP (Account Information Service Provider)
- **Casos de uso en Inmova**:
  - Verificación automática de pagos de alquiler
  - Conciliación automática de ingresos
  - Análisis de capacidad de pago de inquilinos

### 2. Payment Initiation Service (PIS)
- **Descripción**: Permite iniciar pagos desde cuentas de Bankinter
- **Licencia requerida**: PISP (Payment Initiation Service Provider)
- **Casos de uso en Inmova**:
  - Iniciación de pagos de alquiler
  - Pagos a proveedores
  - Transferencias SEPA
  - Pagos instantáneos

### 3. Confirmation of Funds (COF)
- **Descripción**: Verifica disponibilidad de fondos antes de transacciones
- **Licencia requerida**: PIISP (Payment Instrument Issuing Service Provider)
- **Casos de uso en Inmova**:
  - Verificación de capacidad de pago antes de contratos
  - Validación de garantías de depósito

## Proceso de Integración

### Paso 1: Registro como TPP (Third-Party Provider)

1. **Obtener licencia PSD2**:
   - Contactar con el Banco de España o regulador europeo competente
   - Solicitar licencia AISP, PISP o PIISP según servicios necesarios
   - La licencia debe ser válida en la UE

2. **Registrarse en Redsys PSD2 Platform**:
   - Portal: https://market.apis-i.redsys.es/psd2/xs2a/nodos/bankinter
   - Crear cuenta de desarrollador
   - Acceder al entorno sandbox para pruebas

### Paso 2: Configuración Técnica

#### Entornos Disponibles

**Sandbox (Pruebas)**:
- API Endpoint: `https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services/{bankinterCode}`
- OAuth Endpoint: `https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a`

**Producción**:
- API Endpoint: `https://psd2.redsys.es/api-entrada-xs2a/services/{bankinterCode}`
- OAuth Endpoint: `https://psd2.redsys.es/api-oauth-xs2a`

#### Código de Entidad Bankinter
- **bankinterCode**: Código específico proporcionado por Redsys para Bankinter

### Paso 3: Autenticación OAuth 2.0

1. **Obtener certificados eIDAS**:
   - Necesario para autenticación en producción
   - Certificado QWAC (Qualified Website Authentication Certificate)
   - Certificado QSealC (Qualified Seal Certificate)

2. **Flujo de autenticación**:
   ```
   1. Obtener access token → POST /oauth/token
   2. Crear consentimiento → POST /consents (AIS) o /payment-requests (PIS)
   3. Redirigir usuario a Bankinter para SCA (Strong Customer Authentication)
   4. Usuario autentica con Bankinter Móvil app
   5. Obtener token autorizado
   6. Realizar operaciones API
   ```

### Paso 4: Implementación de Servicios

#### Account Information Service (AIS)

**Endpoints principales**:
- `GET /accounts` - Listar cuentas
- `GET /accounts/{accountId}` - Detalles de cuenta
- `GET /accounts/{accountId}/balances` - Obtener saldos
- `GET /accounts/{accountId}/transactions` - Obtener transacciones

**Ejemplo de flujo**:
1. Crear consentimiento AIS (duración máxima 90 días)
2. Usuario autoriza acceso
3. Consultar cuentas y transacciones
4. Renovar consentimiento antes de expiración

#### Payment Initiation Service (PIS)

**Endpoints principales**:
- `POST /payments/sepa-credit-transfers` - Iniciar transferencia SEPA
- `POST /payments/instant-sepa-credit-transfers` - Transferencia SEPA instantánea
- `GET /payments/{paymentId}/status` - Estado del pago
- `DELETE /payments/{paymentId}` - Cancelar pago

**Tipos de pago soportados**:
- Transferencias SEPA normales
- Transferencias SEPA instantáneas
- Pagos TARGET2
- Pagos internacionales
- Pagos futuros programados
- Pagos recurrentes
- Pagos masivos (bulk)

### Paso 5: Consideraciones de Seguridad

#### Strong Customer Authentication (SCA)
- **Método**: Autenticación a través de Bankinter Móvil app
- **Flujo**: Redirect-based (usuario redirigido a página de Bankinter)
- **Limitación**: No hay app switching automático
- **Sesiones**: Un token activo por TPP (nueva autenticación invalida tokens previos)
- **Extensión SCA**: 180 días disponible en producción

#### Gestión de Certificados
- Renovar certificados eIDAS antes de expiración
- Mantener copias de seguridad de certificados
- Usar HSM (Hardware Security Module) en producción

#### Encriptación
- Todas las comunicaciones usan TLS 1.2+
- Los datos sensibles deben almacenarse encriptados
- Implementar key rotation para secrets

### Paso 6: Configuración en Inmova

#### Variables de Entorno Necesarias

```env
# Bankinter / Redsys PSD2
OPEN_BANKING_PROVIDER=redsys_bankinter
REDSYS_API_URL=https://psd2.redsys.es/api-entrada-xs2a/services/bankinter
REDSYS_OAUTH_URL=https://psd2.redsys.es/api-oauth-xs2a
REDSYS_CLIENT_ID=your_client_id
REDSYS_CLIENT_SECRET=your_client_secret
REDSYS_CERTIFICATE_PATH=/path/to/qwac_cert.pem
REDSYS_CERTIFICATE_KEY_PATH=/path/to/qwac_key.pem
REDSYS_SEAL_CERTIFICATE_PATH=/path/to/qseal_cert.pem
REDSYS_SEAL_KEY_PATH=/path/to/qseal_key.pem
REDSYS_BANKINTER_CODE=bankinter_entity_code
```

#### Integración en el Código

El servicio `open-banking-service.ts` ya está preparado con las funciones base:
- `conectarCuentaBancaria()` - Iniciar conexión con Bankinter
- `sincronizarTransacciones()` - Obtener transacciones automáticamente
- `verificarIngresos()` - Verificar capacidad de pago
- `conciliarPagos()` - Conciliar pagos automáticamente

Estas funciones ahora soportan la integración real con Bankinter a través de Redsys.

## Casos de Uso Específicos para Enxames (Inmova)

### 1. Verificación Automática de Pagos de Alquiler

**Flujo**:
1. Inquilino conecta su cuenta Bankinter (consentimiento AIS)
2. Sistema obtiene permiso para consultar transacciones
3. Cada día, sistema sincroniza transacciones nuevas
4. Sistema identifica transferencias que coinciden con:
   - Monto de alquiler
   - Fecha de vencimiento
   - Concepto del pago
5. Sistema marca automáticamente el pago como recibido
6. Se genera recibo automáticamente
7. Notificación a propietario

**Beneficios**:
- Eliminación de intervención manual
- Conciliación automática 24/7
- Reducción de errores humanos
- Mejor experiencia para inquilinos y propietarios

### 2. Iniciación de Pagos a Proveedores

**Flujo**:
1. Propietario conecta cuenta bancaria de Bankinter
2. Cuando se aprueba una factura de proveedor
3. Sistema genera orden de pago PIS
4. Propietario recibe notificación push
5. Autentica en Bankinter Móvil
6. Pago se ejecuta automáticamente
7. Sistema registra el pago y actualiza contabilidad

**Beneficios**:
- Pagos más rápidos
- Menos errores en datos bancarios
- Trazabilidad completa
- Automatización de contabilidad

### 3. Verificación de Capacidad de Pago (Screening)

**Flujo**:
1. Candidato a inquilino solicita vivienda
2. Candidato otorga consentimiento temporal (90 días) AIS
3. Sistema analiza últimos 3 meses de transacciones
4. Calcula:
   - Ingresos promedio
   - Estabilidad de ingresos
   - Gastos recurrentes
   - Ratio deuda/ingresos
5. Genera informe de capacidad de pago
6. Recomienda aprobación o rechazo

**Beneficios**:
- Verificación objetiva de ingresos
- Reducción de morosidad
- Proceso más rápido para inquilinos
- Cumplimiento con protección de datos

## Costes y Límites

### Costes para Usuarios Finales
- **Sin coste adicional**: Los servicios PSD2 son gratuitos para clientes de Bankinter
- Bankinter no puede cobrar por el acceso API

### Límites de la API
- **Consentimientos AIS**: Máximo 90 días de duración
- **Tokens de acceso**: Una sesión activa por TPP
- **Transacciones históricas**: Hasta 90 días hacia atrás
- **Rate limits**: Consultar documentación de Redsys

## Soporte y Documentación

### Recursos Técnicos
- **Portal desarrolladores Redsys**: https://market.apis-i.redsys.es/psd2/xs2a/nodos/bankinter
- **Documentación API (v1.1)**: Disponible en español e inglés
- **YAML specifications**: Descargable desde portal
- **Sandbox**: Disponible con datos estáticos para testing

### Contacto Soporte
- **Redsys PSD2 Support**: A través del portal de desarrolladores
- **Bankinter Open Banking**: Información en https://www.bankinter.com/blog/noticias-bankinter/bankinter-abre-apis-psd2

## Checklist de Implementación

- [ ] Obtener licencia TPP del regulador
- [ ] Registrarse en Redsys PSD2 Platform
- [ ] Obtener certificados eIDAS (QWAC, QSealC)
- [ ] Configurar entorno sandbox
- [ ] Implementar flujo OAuth 2.0
- [ ] Desarrollar integración AIS (Account Information)
- [ ] Desarrollar integración PIS (Payment Initiation)
- [ ] Implementar gestión de consentimientos
- [ ] Configurar renovación automática de tokens
- [ ] Implementar logs y auditoría
- [ ] Realizar pruebas en sandbox
- [ ] Pruebas de seguridad y penetración
- [ ] Solicitar acceso a producción
- [ ] Configurar monitoreo y alertas
- [ ] Documentar procedimientos operativos
- [ ] Capacitar equipo de soporte
- [ ] Lanzamiento gradual (beta testing)
- [ ] Lanzamiento completo

## Próximos Pasos

1. **Corto plazo (1-2 meses)**:
   - Obtener licencia TPP
   - Registrarse en Redsys
   - Implementar integración básica AIS en sandbox

2. **Medio plazo (3-6 meses)**:
   - Obtener certificados eIDAS
   - Completar integración PIS
   - Pruebas exhaustivas en sandbox
   - Solicitar acceso a producción

3. **Largo plazo (6-12 meses)**:
   - Lanzamiento en producción
   - Integración con más bancos españoles
   - Expansión de casos de uso
   - Optimización basada en feedback

## Notas Importantes

⚠️ **Cumplimiento Regulatorio**: La integración con Open Banking requiere cumplimiento estricto con:
- PSD2 (Payment Services Directive 2)
- GDPR (General Data Protection Regulation)
- Normativa del Banco de España

⚠️ **Licencias**: Es imprescindible obtener la licencia TPP correspondiente antes de operar en producción.

⚠️ **Seguridad**: Los certificados eIDAS y credenciales deben mantenerse seguros. Considerar usar Azure Key Vault o AWS Secrets Manager.

⚠️ **Renovaciones**: Los consentimientos AIS expiran a los 90 días. Implementar sistema de renovación automática con notificaciones al usuario.

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0
**Autor**: Equipo Técnico Inmova
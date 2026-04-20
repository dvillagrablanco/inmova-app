# Informe de Seguridad e Integridad de Datos
## Plataforma Inmova — Grupo Vidaro

**Fecha de elaboración:** 25 de marzo de 2026  
**Versión:** 1.0  
**Clasificación:** Confidencial  
**Destinatario:** Grupo Vidaro  
**Elaborado por:** Equipo Técnico Inmova

---

## Índice

1. [Alcance y objetivo](#1-alcance-y-objetivo)
2. [Resumen ejecutivo](#2-resumen-ejecutivo)
3. [Arquitectura de seguridad](#3-arquitectura-de-seguridad)
4. [Autenticación e identidad](#4-autenticación-e-identidad)
5. [Control de acceso y autorización](#5-control-de-acceso-y-autorización)
6. [Protección de datos personales (RGPD)](#6-protección-de-datos-personales-rgpd)
7. [Cifrado y custodia de credenciales](#7-cifrado-y-custodia-de-credenciales)
8. [Validación e integridad de datos](#8-validación-e-integridad-de-datos)
9. [Seguridad en la capa de red y comunicaciones](#9-seguridad-en-la-capa-de-red-y-comunicaciones)
10. [Almacenamiento de archivos y documentos](#10-almacenamiento-de-archivos-y-documentos)
11. [Trazabilidad y auditoría](#11-trazabilidad-y-auditoría)
12. [Protección contra ataques](#12-protección-contra-ataques)
13. [Infraestructura y disponibilidad](#13-infraestructura-y-disponibilidad)
14. [Gestión de incidentes de seguridad](#14-gestión-de-incidentes-de-seguridad)
15. [Matriz de riesgos y controles](#15-matriz-de-riesgos-y-controles)
16. [Conclusiones y recomendaciones](#16-conclusiones-y-recomendaciones)

---

## 1. Alcance y Objetivo

Este informe describe las medidas de seguridad e integridad de datos implementadas en la plataforma **Inmova** con el propósito de proporcionar al **Grupo Vidaro** una visión técnica y ejecutiva completa sobre:

- La protección de los datos de negocio de Vidaro alojados en la plataforma.
- Los mecanismos que garantizan la confidencialidad, integridad y disponibilidad (CIA) de la información.
- El cumplimiento con el **Reglamento General de Protección de Datos (RGPD/GDPR)** de la Unión Europea.
- Los controles técnicos alineados con el estándar **OWASP Top 10** y buenas prácticas del sector.

El análisis abarca el código fuente de la aplicación, la configuración de infraestructura, los modelos de datos y los procesos operativos vigentes a la fecha de elaboración.

---

## 2. Resumen Ejecutivo

La plataforma Inmova implementa un modelo de seguridad en capas que cubre desde la autenticación del usuario hasta el almacenamiento de documentos. A continuación se presenta el estado general por dominio:

| Dominio | Nivel de implementación | Observaciones |
|---|---|---|
| Autenticación | ✅ Robusto | bcrypt + JWT + protección timing attacks |
| Control de acceso | ✅ Implementado | Roles granulares, guards por API |
| Cifrado de datos | ✅ Implementado | AES-256-GCM/CBC + bcrypt en contraseñas |
| Validación de entradas | ✅ Exhaustiva | Zod en todas las APIs críticas |
| Validación de archivos | ✅ Magic bytes | Verificación por firma binaria, no solo extensión |
| Trazabilidad / Auditoría | ✅ Modelo completo | AuditLog + SecurityEvent en BD |
| Rate limiting | ✅ Multi-capa | Redis + fallback memoria, por categoría |
| Bloqueo por intentos | ✅ Activo | 5 intentos → 15 min bloqueo |
| Headers HTTP seguridad | ✅ Configurados | CSP, HSTS, X-Frame-Options, etc. |
| Infraestructura | ✅ Production-grade | PM2 cluster + Nginx + Cloudflare |
| 2FA (autenticación doble) | ⚠️ Parcial | Disponible solo para super_admin |
| CAPTCHA anti-bot | ⚠️ Implementado, no obligatorio | Cloudflare Turnstile listo, pendiente activar en login |
| Middleware global de seguridad | ⚠️ Opt-in | Cada API importa sus guards (no centralizado) |

**Conclusión general:** La plataforma dispone de una base sólida de seguridad acorde a los estándares del sector para aplicaciones SaaS PropTech. Los datos del Grupo Vidaro están protegidos por múltiples capas de control. Se identifican mejoras de madurez recomendadas, ninguna de ellas representa un riesgo crítico inmediato.

---

## 3. Arquitectura de Seguridad

### 3.1 Modelo de capas

La seguridad de Inmova se organiza en **cinco capas independientes**, de modo que un fallo en una no compromete las demás:

```
┌─────────────────────────────────────────────────────┐
│  CAPA 1: RED Y PERÍMETRO                            │
│  Cloudflare (WAF, DDoS, SSL) + Nginx (TLS term.)   │
├─────────────────────────────────────────────────────┤
│  CAPA 2: TRANSPORTE                                 │
│  HTTPS forzado (HSTS 1 año) + TLS 1.2/1.3          │
├─────────────────────────────────────────────────────┤
│  CAPA 3: APLICACIÓN                                 │
│  NextAuth JWT + Zod + Rate limiting + CAPTCHA       │
├─────────────────────────────────────────────────────┤
│  CAPA 4: DATOS                                      │
│  Prisma ORM (anti-SQLi) + AES-256 + bcrypt          │
├─────────────────────────────────────────────────────┤
│  CAPA 5: AUDITORÍA                                  │
│  AuditLog + SecurityEvent + Logs PM2 centralizados  │
└─────────────────────────────────────────────────────┘
```

### 3.2 Stack tecnológico de seguridad

| Componente | Tecnología | Versión |
|---|---|---|
| Framework aplicación | Next.js (App Router) | 14.2.x |
| Autenticación | NextAuth.js | 4.24.11 |
| ORM / acceso a datos | Prisma | 6.7.0 |
| Hashing contraseñas | bcryptjs | — |
| Cifrado simétrico | AES-256-GCM / AES-256-CBC | Node.js crypto |
| Validación esquemas | Zod | 3.23.8 |
| 2FA (TOTP) | speakeasy + otpauth | — |
| CAPTCHA | Cloudflare Turnstile | — |
| WAF / CDN | Cloudflare | — |
| Proxy inverso | Nginx | — |
| Gestor de procesos | PM2 cluster mode | — |
| Monitoreo de errores | Sentry | 10.32.1 |
| Logging | winston | 3.18.3 |

### 3.3 Aislamiento de datos por empresa (multi-tenant)

Inmova es una plataforma **multi-tenant**. Los datos del Grupo Vidaro están **lógicamente aislados** del resto de clientes mediante el campo `companyId` presente en todos los modelos de datos principales:

- Todas las consultas a la base de datos filtran por `companyId` de la sesión activa.
- Un usuario autenticado de Vidaro **no puede** acceder a datos de otra empresa, incluso conociendo el ID de un registro.
- Los guards de autorización verifican explícitamente que el recurso solicitado pertenezca a la empresa del usuario antes de devolver o modificar datos.

---

## 4. Autenticación e Identidad

### 4.1 Sistema de autenticación

La plataforma utiliza **NextAuth.js** con estrategia **JWT (JSON Web Token)**. El proceso de autenticación implementa las siguientes protecciones:

**a) Protección contra ataques de temporización (Timing Attacks)**

Cuando un usuario introduce un email inexistente, el sistema no devuelve una respuesta inmediata (lo que permitiría enumerar usuarios). En su lugar, ejecuta un hash bcrypt ficticio con un retardo constante de ~150 ms, haciendo indistinguible si el usuario existe o no:

```
// Fragmento real de lib/auth-options.ts
const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012';
const passwordHash = user?.password || dummyHash;
const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);
```

**b) Hashing de contraseñas**

Todas las contraseñas se almacenan exclusivamente como hash bcrypt con factor de coste 10. Nunca se almacena la contraseña en texto claro ni en ningún log.

**c) Sesiones JWT**

- Duración máxima de sesión: **30 días**
- Renovación automática: cada **24 horas** de actividad
- El token contiene únicamente: `id`, `role`, `companyId`, `email` (sin datos sensibles)
- Firmado con `NEXTAUTH_SECRET` (clave generada con `openssl rand -base64 48`)

**d) Requisitos de contraseña**

El sistema exige contraseñas que cumplan:
- Mínimo 8 caracteres, máximo 128
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número

### 4.2 Bloqueo de cuenta por intentos fallidos

El sistema implementa un mecanismo automático de **bloqueo de cuenta**:

| Parámetro | Valor |
|---|---|
| Intentos fallidos permitidos | 5 |
| Duración del bloqueo | 15 minutos |
| Alcance | Por dirección de email |
| Limpieza automática | Cada 5 minutos |
| Desbloqueo automático | Tras 15 min sin actividad |

Tras un login exitoso, el contador de intentos fallidos se reinicia automáticamente.

### 4.3 Autenticación de doble factor (2FA)

La plataforma soporta **autenticación TOTP** (Google Authenticator / Authy) mediante los módulos `speakeasy` y `otpauth`:

- Los secretos TOTP se almacenan **cifrados con AES-256-CBC** en la base de datos (nunca en texto plano).
- Se generan códigos de recuperación de emergencia, también cifrados.
- El campo `mfaEnabled` en el perfil del usuario controla si el segundo factor es obligatorio para ese usuario.
- Ventana de tolerancia: ±2 períodos de 30 segundos (60 segundos de margen para desfases de reloj).

> **Estado actual:** La activación de 2FA está disponible para usuarios con rol `super_admin`. La extensión a otros roles es una mejora recomendada para máxima seguridad.

### 4.4 CAPTCHA anti-bot (Cloudflare Turnstile)

La integración con **Cloudflare Turnstile** está lista en el módulo `lib/turnstile.ts`. Este mecanismo permite distinguir usuarios humanos de bots en los formularios de login y registro, previniendo ataques de fuerza bruta masivos.

---

## 5. Control de Acceso y Autorización

### 5.1 Sistema de roles

La plataforma implementa un sistema de **control de acceso basado en roles (RBAC)** con los siguientes niveles:

| Rol | Descripción | Nivel de acceso |
|---|---|---|
| `super_admin` | Administrador de la plataforma | Acceso total, incluye 2FA y monitoreo |
| `administrador` | Admin de la empresa cliente (Vidaro) | Gestión completa de su organización |
| `gestor` | Gestor de propiedades / inmuebles | Operativa de propiedades y contratos |
| `operador` | Operador con acceso limitado | Consulta y operaciones básicas |
| `soporte` | Equipo de soporte técnico | Acceso de solo lectura para resolución de incidencias |
| `community_manager` | Gestión de comunidades | Ámbito de comunidades de propietarios |
| `contratista_ewoorker` | Proveedor de servicios | Acceso a sus propios trabajos asignados |
| `subcontratista_ewoorker` | Subcontratista | Acceso restringido a sus asignaciones |

### 5.2 Mecanismo de protección por API

Cada endpoint de la API verifica la sesión activa y los permisos antes de procesar cualquier solicitud. El patrón estándar es:

```
1. Obtener sesión → getServerSession(authOptions)
2. Verificar que existe sesión → 401 si no hay sesión
3. Verificar rol autorizado → 403 si el rol no está permitido
4. Verificar ownership → comprobar companyId del recurso
5. Procesar la solicitud → devolver solo datos de la empresa
```

### 5.3 Principio de mínimo privilegio

Todas las consultas a la base de datos utilizan `select` explícito para devolver únicamente los campos necesarios. Los campos sensibles (contraseñas, tokens, secretos MFA) **nunca** se incluyen en las respuestas de API.

### 5.4 Separación de entornos administrativos

Las rutas `/admin/*` y `/api/admin/*` requieren roles `super_admin` o `administrador`, y son verificadas independientemente de las rutas de usuario estándar.

---

## 6. Protección de Datos Personales (RGPD)

### 6.1 Datos personales identificados en la plataforma

El sistema gestiona los siguientes datos personales para el Grupo Vidaro:

| Tipo de dato | Modelo | Protección aplicada |
|---|---|---|
| Email | User, Tenant | Único, validado, nunca en logs |
| Contraseña | User, Tenant | bcrypt hash (irreversible) |
| DNI/NIE | Tenant | Campo único, acceso restringido por rol |
| IBAN | Tenant, Contract | Acceso restringido, no expuesto en listados |
| Nombre y apellidos | User, Tenant | Sanitizado en logs de producción |
| Dirección | Property, Tenant | Acceso por companyId |
| Teléfono | User, Tenant | Sanitizado en logs (enmascarado) |

### 6.2 Sanitización de datos en logs

El módulo `lib/logger.ts` implementa **sanitización automática de PII** en entorno de producción. Cuando se registra cualquier evento, el sistema enmascara automáticamente:

- Emails: `us***@dominio.com`
- Teléfonos: primeros y últimos dígitos visibles
- DNI/NIE: primero y últimos caracteres visibles
- Números de tarjeta: solo últimos 4 dígitos
- IBAN: solo últimos 4 dígitos
- Campos con nombre `password`, `token`, `secret`, `key`, `iban`, `pin` → `[REDACTED]`

```
// En entorno de producción, el logger transforma automáticamente:
{ email: "juan@vidaro.com", iban: "ES9121000418450200051332" }
→ { email: "ju***@vidaro.com", iban: "****1332" }
```

### 6.3 Modelo de auditoría (AuditLog)

Cada acción relevante sobre datos de negocio queda registrada en la tabla `AuditLog` con:

| Campo | Descripción |
|---|---|
| `companyId` | Empresa a la que pertenece el evento |
| `userId` | Usuario que realizó la acción |
| `action` | Tipo: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT |
| `entityType` | Entidad afectada (Property, Contract, Tenant, etc.) |
| `entityId` | Identificador del registro afectado |
| `changes` | Detalle de los cambios (qué campos, valores anteriores/nuevos) |
| `ipAddress` | IP del usuario en el momento de la acción |
| `userAgent` | Navegador / cliente utilizado |
| `createdAt` | Timestamp con precisión de milisegundos |

Los índices sobre `[companyId, createdAt]` y `[userId, createdAt]` permiten consultas de auditoría eficientes sobre el historial de Vidaro.

### 6.4 Modelo de eventos de seguridad (SecurityEvent)

Complementariamente, el modelo `SecurityEvent` registra eventos de seguridad tipificados:

```
"login_failed", "access_denied", "suspicious_activity",
"brute_force_detected", "mfa_failed", "unauthorized_export"
```

Con niveles de severidad: `info`, `warning`, `error`, `critical`.

### 6.5 Derecho de supresión y portabilidad

La plataforma dispone de endpoints en `/api/gdpr/` para gestionar los derechos del interesado contemplados en el RGPD (acceso, rectificación, supresión, portabilidad), con rate limiting específico para estas operaciones (`gdpr` category).

---

## 7. Cifrado y Custodia de Credenciales

### 7.1 Contraseñas de usuarios

| Aspecto | Implementación |
|---|---|
| Algoritmo | bcrypt |
| Factor de coste | 10 (≈100ms por hash) |
| Almacenamiento | Solo el hash, nunca el texto plano |
| Verificación | `bcrypt.compare()` en cada login |

### 7.2 Cifrado de datos sensibles en base de datos

Para datos que requieren ser recuperables (secretos MFA, tokens de integración), se utiliza cifrado simétrico:

| Módulo | Algoritmo | Uso |
|---|---|---|
| `lib/encryption.ts` | AES-256-GCM | Cifrado general de campos sensibles |
| `lib/mfa-helpers.ts` | AES-256-CBC | Secretos TOTP y códigos de recuperación |
| `lib/mfa-service.ts` | AES-256 (via `encryptField`) | Flujo alternativo de MFA |

Las claves de cifrado se gestionan exclusivamente mediante variables de entorno (`ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY`) y nunca se incluyen en el código fuente ni en el repositorio Git.

### 7.3 Gestión de secretos y credenciales

| Secreto | Variable de entorno | Generación recomendada |
|---|---|---|
| Firma JWT sesiones | `NEXTAUTH_SECRET` | `openssl rand -base64 48` |
| Clave cifrado general | `ENCRYPTION_KEY` | `openssl rand -hex 32` |
| Clave cifrado MFA | `MFA_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| Clave cron jobs | `CRON_SECRET` | `openssl rand -hex 32` |

**Políticas aplicadas:**
- Las credenciales no se almacenan en el repositorio de código (`.gitignore` incluye `.env*`).
- Se verificó la purga del historial Git ante cualquier commit accidental de credenciales.
- Las variables de producción se gestionan de forma segura en el servidor de producción.

---

## 8. Validación e Integridad de Datos

### 8.1 Validación de esquemas con Zod

Todas las APIs de la plataforma utilizan **Zod** para validación estricta de los datos de entrada antes de procesarlos. Esto previene:

- Inyección de datos malformados
- Desbordamientos de buffer
- Manipulación de tipos de datos
- Valores fuera de rango o dominio

Ejemplo del esquema de registro de usuario:

```
- email: string, formato email, máx 255 caracteres, normalizado a minúsculas
- password: mín 8 / máx 128 chars, mayúscula + minúscula + número obligatorios
- name: mín 2 / máx 100 caracteres, espacios normalizados
- role: solo valores del enum definido (no valores arbitrarios)
```

### 8.2 Protección contra inyección SQL

El uso de **Prisma ORM** como única capa de acceso a la base de datos garantiza protección automática contra inyección SQL:

- Todas las consultas se parametrizan automáticamente.
- Los valores de usuario nunca se interpolan directamente en queries.
- Las consultas raw (`$queryRaw`) están restringidas a casos muy específicos y siempre con parámetros vinculados.

### 8.3 Validación de archivos por firma binaria (magic bytes)

El módulo `lib/file-validation.ts` verifica la **firma binaria real** de cada archivo subido, independientemente de la extensión declarada o el Content-Type del navegador. Este método previene la subida de archivos maliciosos disfrazados con extensiones inocuas.

| Tipo de archivo | Firma verificada |
|---|---|
| PDF | `%PDF` (bytes 25 50 44 46) |
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| GIF | `GIF87a` / `GIF89a` |
| WEBP | `RIFF....WEBP` |
| XLSX/DOCX | Firma ZIP (PK) |
| XLS (legacy) | Firma OLE2 |

Adicionalmente, los archivos de texto se analizan en busca de **patrones de código malicioso**: `<script`, `javascript:`, `onerror=`, `eval(`, `document.write`, etc.

**Límites de tamaño por contexto:**

| Contexto | Tamaño máximo |
|---|---|
| Imagen | 10 MB |
| Documento | 50 MB |
| Propuesta | 50 MB |

### 8.4 Protección XSS

- React renderiza el contenido de forma segura por defecto (escape automático de HTML).
- El uso de `dangerouslySetInnerHTML` está restringido y controlado.
- La biblioteca `isomorphic-dompurify` sanitiza cualquier contenido HTML externo antes de renderizarlo.
- Los headers HTTP incluyen `X-XSS-Protection: 1; mode=block` para navegadores legacy.

---

## 9. Seguridad en la Capa de Red y Comunicaciones

### 9.1 Cifrado en tránsito (HTTPS)

Todas las comunicaciones entre el usuario y la plataforma se realizan sobre **HTTPS con TLS 1.2/1.3**. El acceso HTTP está bloqueado y redirigido automáticamente a HTTPS.

El header **HSTS (HTTP Strict Transport Security)** se configura con:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Esto indica al navegador que durante 1 año solo debe conectarse por HTTPS, previniendo ataques de degradación de protocolo (SSL stripping).

### 9.2 Headers de seguridad HTTP

La plataforma configura los siguientes headers en todas las respuestas:

| Header | Valor | Protección |
|---|---|---|
| `Content-Security-Policy` | Directiva restrictiva por dominio | Previene XSS y carga de recursos no autorizados |
| `X-Content-Type-Options` | `nosniff` | Previene MIME type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` / `DENY` | Previene clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Filtro XSS en navegadores legacy |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita información enviada en Referer |
| `Permissions-Policy` | geolocation, microphone, camera, payment desactivados | Previene acceso a APIs sensibles del navegador |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Fuerza HTTPS durante 1 año |

### 9.3 Cloudflare como primera línea de defensa

La plataforma opera detrás de **Cloudflare**, que proporciona:

| Capacidad | Descripción |
|---|---|
| **WAF (Web Application Firewall)** | Filtrado de tráfico malicioso basado en reglas OWASP |
| **Protección DDoS** | Mitigación automática de ataques de denegación de servicio (capa 3/4/7) |
| **SSL/TLS gestionado** | Certificados HTTPS gratuitos y renovación automática |
| **CDN global** | Distribución del contenido estático desde +150 datacenters |
| **Bot Management** | Detección y bloqueo de bots maliciosos |
| **Rate limiting** | Límites de tasa a nivel de red (complementa el rate limiting de aplicación) |
| **IP real del visitante** | Cabecera `CF-Connecting-IP` para auditoría correcta |

### 9.4 Rate limiting multicapa

La protección contra abuso de API opera en **dos niveles independientes**:

**Nivel 1 — Cloudflare (red):** Bloquea tráfico masivo antes de llegar al servidor.

**Nivel 2 — Aplicación (Inmova):** Control granular por categoría de endpoint:

| Categoría | Ventana | Máx. solicitudes | Endpoints afectados |
|---|---|---|---|
| `login` | 15 minutos | 5 | Login, registro |
| `auth` | 5 minutos | 10 | Cualquier ruta de autenticación |
| `payment` | 1 minuto | 50 | Pagos y facturación |
| `export` | — | Restringido | Exportación de datos |
| `ai` | — | Restringido | Servicios de IA |
| `gdpr` | — | Restringido | Solicitudes RGPD |
| `admin` | — | Elevado | Rutas administrativas |
| `api` | — | Estándar | Resto de APIs |

El sistema usa **Redis** como almacén primario (distribuido entre workers) con fallback automático a memoria en caso de fallo de Redis.

---

## 10. Almacenamiento de Archivos y Documentos

### 10.1 AWS S3 — Almacenamiento seguro

Los documentos del Grupo Vidaro (pólizas de seguro, contratos, anexos) se almacenan en **AWS S3** en la región `eu-north-1` (Estocolmo, Unión Europea), cumpliendo con los requisitos de residencia de datos del RGPD:

| Aspecto | Configuración |
|---|---|
| Proveedor | Amazon Web Services (AWS) |
| Servicio | S3 (Simple Storage Service) |
| Región | `eu-north-1` (Estocolmo, UE) |
| Bucket | `inmova` |
| Acceso | Credenciales IAM dedicadas (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) |
| Autenticación de URLs | URLs prefirmadas con expiración temporal |
| Nomenclatura de archivos | Nombres únicos generados con `crypto.randomBytes` (no predecibles) |

### 10.2 Residencia de datos en la UE

Al utilizar la región `eu-north-1`, los datos de Vidaro **nunca salen del territorio de la Unión Europea**, cumpliendo con el artículo 44 del RGPD sobre transferencias internacionales de datos.

### 10.3 Proceso de subida de archivos

El flujo de subida incluye las siguientes verificaciones en orden:

```
1. Autenticación del usuario (sesión válida)
   ↓
2. Verificación de permisos (rol y companyId)
   ↓
3. Validación del archivo (magic bytes + tamaño + patrones maliciosos)
   ↓
4. Generación de nombre único (crypto.randomBytes)
   ↓
5. Subida cifrada en tránsito a S3 (HTTPS)
   ↓
6. Almacenamiento de la referencia en BD (URL + metadata)
   ↓
7. Registro en AuditLog
```

### 10.4 Documentos de Grupo Vidaro actualmente gestionados

La plataforma gestiona los documentos de seguros del Grupo Vidaro bajo la ruta S3 `seguros/grupo-vidaro/`, con acceso restringido exclusivamente a los usuarios de la organización Vidaro.

---

## 11. Trazabilidad y Auditoría

### 11.1 Registro completo de acciones (AuditLog)

El sistema mantiene un historial inmutable de todas las acciones realizadas sobre los datos. Este registro es esencial para:

- Investigación de incidentes de seguridad
- Cumplimiento regulatorio (RGPD artículo 5.2 — responsabilidad proactiva)
- Resolución de disputas sobre cambios en datos
- Auditorías internas del Grupo Vidaro

**Acciones registradas:**

| Acción | Descripción |
|---|---|
| `CREATE` | Creación de cualquier registro (propiedad, contrato, inquilino, etc.) |
| `UPDATE` | Modificación de datos, con campo `changes` que detalla qué cambió |
| `DELETE` | Eliminación de registros |
| `LOGIN` | Inicio de sesión exitoso |
| `LOGOUT` | Cierre de sesión |
| `EXPORT` | Exportación de datos |
| `IMPORT` | Importación masiva de datos |

### 11.2 Logs de sistema centralizados

Los logs de aplicación se centralizan en `/var/log/inmova/` con los siguientes archivos:

| Archivo | Contenido |
|---|---|
| `out.log` | Logs de funcionamiento normal de la aplicación |
| `error.log` | Errores y excepciones |
| `health-monitor.log` | Resultados de los health checks automáticos |
| `cron.log` | Ejecución de tareas programadas |

Los logs se retienen según política de retención operativa. La información PII en logs está sanitizada (sección 6.2).

### 11.3 Monitoreo de errores con Sentry

El servicio **Sentry** (v10.32.1) captura automáticamente excepciones no controladas en producción, con:

- Trazas de pila completas para diagnóstico
- Contexto de usuario (sin datos sensibles)
- Alertas en tiempo real al equipo técnico
- Dashboard de frecuencia y tendencias de errores

---

## 12. Protección Contra Ataques

### 12.1 Cobertura OWASP Top 10 (2021)

| OWASP | Riesgo | Control implementado |
|---|---|---|
| A01 — Broken Access Control | Control de acceso roto | Guards `getServerSession` + verificación `companyId` en cada API |
| A02 — Cryptographic Failures | Fallo criptográfico | bcrypt para contraseñas, AES-256 para datos sensibles, HTTPS forzado |
| A03 — Injection | Inyección (SQL, código) | Prisma ORM parametrizado, Zod para inputs, DOMPurify para HTML |
| A04 — Insecure Design | Diseño inseguro | Rate limiting, lockout, CAPTCHA, 2FA disponible |
| A05 — Security Misconfiguration | Mala configuración | Headers HTTP, HSTS, CSP, sin rutas de debug en producción |
| A06 — Vulnerable Components | Componentes vulnerables | Dependencias auditadas (`npm audit`), CI/CD con security scan |
| A07 — Auth Failures | Fallos de autenticación | bcrypt, JWT firmado, lockout, timing attack prevention |
| A08 — Data Integrity Failures | Fallos de integridad | Validación magic bytes, Zod schemas, checksums en uploads |
| A09 — Logging Failures | Fallos de logging | AuditLog, SecurityEvent, Sentry, logs centralizados |
| A10 — SSRF | SSRF (peticiones falsificadas al servidor) | Validación de URLs externas, whitelist de dominios permitidos |

### 12.2 Protección contra fuerza bruta

El sistema implementa **tres niveles de protección** contra ataques de fuerza bruta:

1. **Cloudflare WAF** — Bloqueo a nivel de red de IPs con comportamiento anómalo
2. **Rate limiting de aplicación** — Máximo 5 intentos de login por 15 minutos por IP/usuario
3. **Account lockout** — Bloqueo de 15 minutos tras 5 intentos fallidos en la misma cuenta

### 12.3 Protección CSRF

NextAuth.js gestiona automáticamente la protección CSRF mediante:
- Tokens CSRF en cada formulario de autenticación
- Validación de origen (Origin / Referer headers)
- Cookies con atributo `SameSite`

### 12.4 Prevención de enumeración de usuarios

Como se describe en la sección 4.1, el sistema implementa un retardo constante y hash ficticio para que sea imposible determinar si un email está registrado en la plataforma a través de los tiempos de respuesta del login.

### 12.5 Integración continua con análisis de seguridad

El pipeline de CI/CD (GitHub Actions) ejecuta automáticamente en cada despliegue:

```
Push a main →
  1. Linting y análisis estático de código
  2. Tests unitarios (~1050 tests, umbral 80% cobertura)
  3. Build de producción
  4. Auditoría de dependencias (npm audit)
  5. Despliegue (solo si todo lo anterior pasa)
```

---

## 13. Infraestructura y Disponibilidad

### 13.1 Arquitectura de producción

```
Usuarios
  ↓
Cloudflare (SSL, WAF, CDN, DDoS)
  ↓
Nginx (Reverse proxy, cabeceras seguridad)
  ↓
PM2 Cluster (2 workers, auto-restart, zero-downtime reload)
  ↓
Next.js Application
  ↓
PostgreSQL 15 (base de datos principal)
  ↑
AWS S3 eu-north-1 (documentos y archivos)
```

### 13.2 Alta disponibilidad

| Mecanismo | Descripción |
|---|---|
| **PM2 cluster mode** | 2 workers independientes; si uno falla, el otro sigue sirviendo |
| **Auto-restart** | PM2 reinicia automáticamente cualquier worker caído (máx 10 reintentos) |
| **Zero-downtime deploy** | Los despliegues se realizan con `pm2 reload` sin interrupción del servicio |
| **Restart preventivo** | Reinicio programado diariamente a las 3:00 AM para limpiar memoria |
| **Restart por memoria** | Si un worker supera 1 GB de RAM, se reinicia automáticamente |

### 13.3 Monitoreo automático de salud

El sistema ejecuta **health checks automáticos cada 5 minutos** que verifican:

1. Respuesta HTTP 200 en la landing page
2. API `/api/health` responde correctamente
3. Proceso Node.js corriendo
4. Puerto 3000 en escucha
5. Conexión a la base de datos activa
6. Uso de memoria < 90%
7. Uso de disco < 90%
8. Página de login renderiza correctamente

Si 3 o más checks fallan consecutivamente, se ejecuta **recuperación automática** (restart de la aplicación) y se envían alertas al equipo técnico.

### 13.4 Objetivo de nivel de servicio (SLO)

| Métrica | Objetivo |
|---|---|
| Disponibilidad | 99,9% (< 45 min de downtime/mes) |
| Tiempo de respuesta API (p95) | < 500 ms |
| Tiempo de respuesta páginas (p95) | < 1 s |
| Tiempo medio de recuperación (MTTR) | < 10 minutos |
| Detección de incidentes | < 5 minutos (health check) |

### 13.5 Backups

Los backups de la base de datos se realizan automáticamente con retención de 30 días. Antes de cada despliegue se genera un backup adicional de seguridad para permitir rollback inmediato si fuera necesario.

---

## 14. Gestión de Incidentes de Seguridad

### 14.1 Clasificación de incidentes

| Severidad | Descripción | Tiempo de respuesta |
|---|---|---|
| **Crítico** | Brecha de datos confirmada, acceso no autorizado a datos de Vidaro | < 1 hora |
| **Alto** | Intento de ataque detectado, fallo de autenticación masivo | < 4 horas |
| **Medio** | Anomalía en logs, comportamiento inusual detectado | < 24 horas |
| **Bajo** | Alerta preventiva, configuración subóptima | < 72 horas |

### 14.2 Proceso de notificación (RGPD, Art. 33-34)

En caso de brecha de seguridad que afecte a datos personales del Grupo Vidaro:

1. **Evaluación del impacto** — ¿Qué datos? ¿Cuántos afectados? ¿Tipo de dato?
2. **Notificación a la AEPD** — En un plazo máximo de **72 horas** desde la detección (si aplica riesgo)
3. **Notificación al Grupo Vidaro** — Comunicación inmediata al responsable de datos designado
4. **Notificación a los interesados** — Si el riesgo para los derechos y libertades es alto
5. **Informe post-incidente** — Análisis de causa raíz y medidas correctivas

### 14.3 Herramientas de detección

- **SecurityEvent** (BD): Registro automático de eventos sospechosos (intentos de acceso denegado, comportamientos anómalos)
- **Sentry**: Alertas en tiempo real de errores y excepciones inusuales
- **Logs PM2**: Registros detallados de actividad de la aplicación
- **Cloudflare Analytics**: Detección de patrones de tráfico anómalos

---

## 15. Matriz de Riesgos y Controles

| # | Riesgo | Probabilidad | Impacto | Nivel | Control existente | Estado |
|---|---|---|---|---|---|---|
| R01 | Acceso no autorizado a datos de Vidaro | Baja | Alto | Medio | RBAC + companyId + JWT | ✅ Mitigado |
| R02 | Fuerza bruta sobre login | Media | Alto | Alto | Lockout + Rate limit + Cloudflare WAF | ✅ Mitigado |
| R03 | Inyección SQL | Baja | Crítico | Alto | Prisma ORM (parametrizado) | ✅ Mitigado |
| R04 | Subida de archivo malicioso | Baja | Alto | Medio | Magic bytes + tamaño + patrones | ✅ Mitigado |
| R05 | Fuga de datos en logs | Baja | Medio | Bajo | Sanitización PII automática | ✅ Mitigado |
| R06 | Ataque XSS | Baja | Alto | Medio | CSP + React escape + DOMPurify | ✅ Mitigado |
| R07 | Interceptación de comunicaciones | Muy baja | Alto | Bajo | HTTPS forzado + HSTS + TLS 1.3 | ✅ Mitigado |
| R08 | Pérdida de disponibilidad | Baja | Alto | Medio | PM2 cluster + Cloudflare + health checks | ✅ Mitigado |
| R09 | Pérdida de datos | Muy baja | Crítico | Alto | Backups automáticos + S3 redundante | ✅ Mitigado |
| R10 | Compromiso de credenciales de usuario | Baja | Alto | Medio | 2FA disponible (pendiente extensión a todos los roles) | ⚠️ Parcial |
| R11 | Ataque bot automatizado | Media | Medio | Medio | Cloudflare Turnstile listo (pendiente activar en login) | ⚠️ Parcial |
| R12 | Escalada de privilegios | Muy baja | Crítico | Alto | Guards por API + verificación rol explícita | ✅ Mitigado |

---

## 16. Conclusiones y Recomendaciones

### 16.1 Fortalezas destacadas

La plataforma Inmova presenta un nivel de seguridad **sólido y acorde a las mejores prácticas** del sector para aplicaciones SaaS en el ámbito PropTech:

1. **Datos del Grupo Vidaro completamente aislados** del resto de clientes mediante segmentación por `companyId`.
2. **Cifrado en todas las capas**: datos en tránsito (HTTPS/TLS), contraseñas (bcrypt irreversible), secretos sensibles (AES-256).
3. **Trazabilidad completa**: cada acción sobre datos queda registrada con usuario, timestamp e IP.
4. **Datos almacenados en la UE** (AWS S3 eu-north-1, PostgreSQL en servidor europeo), cumpliendo el RGPD.
5. **Múltiples capas anti-intrusión** que operan independientemente (Cloudflare → Nginx → Rate limiting app → Account lockout).
6. **Pipeline de CI/CD** que verifica seguridad en cada despliegue.

### 16.2 Mejoras recomendadas (sin riesgo inmediato)

Las siguientes mejoras incrementarían la madurez del sistema sin que su ausencia represente un riesgo crítico actual:

| Prioridad | Mejora | Beneficio |
|---|---|---|
| Alta | Activar Cloudflare Turnstile CAPTCHA en el formulario de login | Elimina ataques automatizados de credenciales |
| Alta | Extender 2FA obligatorio a roles `administrador` y `gestor` | Elimina riesgo de compromiso por robo de contraseña |
| Media | Centralizar guards de autenticación en middleware global | Reduce superficie de error humano en nuevos endpoints |
| Media | Unificar política X-Frame-Options (DENY en todos los contextos) | Elimina ambigüedad entre Next.js y Vercel |
| Baja | Documentar variables de entorno Turnstile en `.env.example` | Facilita configuración en nuevos entornos |
| Baja | Inventario formal de campos PII por modelo de datos | Apoya auditorías RGPD futuras |

### 16.3 Declaración de conformidad

La plataforma Inmova implementa medidas técnicas y organizativas adecuadas para garantizar un nivel de seguridad apropiado al riesgo, conforme al **artículo 32 del RGPD** (Seguridad del tratamiento), incluyendo:

- ✅ Seudonimización y cifrado de datos personales
- ✅ Capacidad para garantizar confidencialidad, integridad, disponibilidad y resiliencia
- ✅ Capacidad para restaurar disponibilidad y acceso tras incidente (backups + PM2 auto-restart)
- ✅ Proceso de verificación, evaluación y valoración periódica de las medidas (CI/CD + health checks + auditoría)

---

*Este informe ha sido elaborado a partir del análisis del código fuente y configuración de la plataforma Inmova con fecha 25 de marzo de 2026. Su contenido es de carácter confidencial y está destinado exclusivamente al Grupo Vidaro para los fines acordados. Cualquier reproducción o distribución a terceros requiere autorización expresa del equipo Inmova.*

---

**Equipo Técnico Inmova**  
[soporte@inmovaapp.com](mailto:soporte@inmovaapp.com)  
https://inmovaapp.com

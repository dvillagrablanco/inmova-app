# 🔐 Credenciales y Accesos - INMOVA

## 📝 IMPORTANTE: Guardar en lugar seguro

Este archivo contiene todas las credenciales necesarias para acceder a los diferentes servicios.

**⚠️ ADVERTENCIA:** NO subir este archivo a Git. Mantener en lugar seguro.

---

## 👤 GitHub

### Cuenta Principal
- **Usuario:** `dvillagrab`
- **Contraseña:** `Pucela00`
- **URL Profile:** https://github.com/dvillagrab

### Personal Access Token (PAT)
- **Nombre del Token:** `INMOVA Deployment`
- **Token:** `ghp_____________________________` (completar después de generarlo)
- **Scopes:** `repo`, `workflow`
- **Expiración:** ________________
- **Creado:** ________________
- **Regenerar en:** https://github.com/settings/tokens

### Repositorio
- **Nombre:** `inmova-platform`
- **Tipo:** Private
- **URL:** https://github.com/dvillagrab/inmova-platform
- **Clone URL:** `git@github.com:dvillagrab/inmova-platform.git`

---

## 📦 Vercel

### Cuenta
- **Login:** Conectado con GitHub (`dvillagrab`)
- **Dashboard:** https://vercel.com/dashboard

### Proyecto
- **Nombre:** `inmova-platform`
- **URL Producción:** `https://_________________.vercel.app` (completar después del primer deploy)
- **URL Preview:** `https://_________________.vercel.app` (para branches)

### Vercel CLI Token (si usas CLI)
- **Token:** `____________________________` (obtener con `vercel login`)

---

## 💾 Base de Datos

### Supabase

#### Cuenta
- **Email:** ________________
- **Dashboard:** https://supabase.com/dashboard

#### Proyecto
- **Nombre:** `inmova-production`
- **Project ID:** ________________
- **Region:** `Europe West (eu-west-1)`
- **Created:** ________________

#### Database Credentials
- **Host:** `aws-0-eu-west-1.pooler.supabase.com`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres.[PROJECT-REF]`
- **Password:** `____________________________` (guardar de forma segura)

#### Connection String
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Connection String Completa:**
```
____________________________________________________________________________
```

#### API Keys (Supabase)
- **anon/public key:** `____________________________`
- **service_role key:** `____________________________` (⚠️ NUNCA exponer al cliente)

#### URLs Supabase
- **API URL:** `https://[PROJECT-REF].supabase.co`
- **DB URL:** `https://[PROJECT-REF].supabase.co/project/[PROJECT-REF]/editor`

---

## 👳 Usuarios de la Aplicación

### Super Administrador
- **Email:** `superadmin@inmova.com`
- **Password:** `superadmin123`
- **Rol:** `super_admin`
- **Acceso:** Completo - Todas las funcionalidades

### Administrador
- **Email:** `admin@inmova.com`
- **Password:** `admin123`
- **Rol:** `administrador`
- **Acceso:** Gestión completa de la plataforma

### Usuario Demo (si aplica)
- **Email:** `demo@inmova.com`
- **Password:** `demo123`
- **Rol:** `operador`
- **Acceso:** Solo lectura/operación básica

---

## 💳 Stripe (Pagos)

### Cuenta
- **Email:** ________________
- **Dashboard:** https://dashboard.stripe.com

### Test Mode (Desarrollo/Testing)
- **Publishable Key:** `pk_test_placeholder`
- **Secret Key:** `sk_test_placeholder`
- **Webhook Secret:** `whsec_placeholder`
- **Webhook URL:** `https://tu-dominio.vercel.app/api/stripe/webhook`

### Live Mode (Producción) - **Activar cuando estés listo**
- **Publishable Key:** `pk_live_____________________________`
- **Secret Key:** `sk_live_____________________________`
- **Webhook Secret:** `whsec_____________________________`
- **Webhook URL:** `https://inmova.app/api/stripe/webhook`

**Eventos del Webhook:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## ☁️ AWS S3 (Almacenamiento)

### Configuración Actual
- **Region:** `us-west-2`
- **Bucket Name:** `abacusai-apps-030d8be4269891ba0e758624-us-west-2`
- **Folder Prefix:** `12952/`
- **Profile:** `hosted_storage`

### Si necesitas crear tu propio bucket:
- **Access Key ID:** `____________________________`
- **Secret Access Key:** `____________________________`
- **Bucket ARN:** `____________________________`

**URL de acceso:**
```
https://[BUCKET-NAME].s3.[REGION].amazonaws.com/[FOLDER-PREFIX]/[FILE-NAME]
```

---

## 🔔 Push Notifications (Web Push)

### VAPID Keys
- **Public Key:** `BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV9p3F-Jq-6-kxq9RwD9qdL4U3JfYxSh_Vu_WG2cEg8u7kJ7-vQTmE`
- **Private Key:** `p-K-PxeghWxVyGxvxHYVsT3xhp5fKWvUqNfNqN-J4XM`

**Generar nuevas keys (si necesitas):**
```bash
npx web-push generate-vapid-keys
```

---

## 🤖 Abacus AI

### API Key
- **API Key:** `a66d474df9e547058d3b977b3771d53b`
- **Docs:** https://api.abacus.ai/docs

---

## ✍️ DocuSign (Firma Digital) - OPCIONAL

### Cuenta
- **Email:** ________________
- **Account ID:** `____________________________`

### Configuración Demo
- **Base Path:** `https://demo.docusign.net/restapi`
- **Integration Key:** `____________________________`
- **User ID:** `____________________________`

### Private Key
```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

---

## 🏦 Redsys/Bankinter (Open Banking) - OPCIONAL

### Credenciales
- **Client ID:** `____________________________`
- **Client Secret:** `____________________________`
- **Bank Code:** `bankinter`

### URLs
- **API URL:** `https://apis-i.redsys.es:20443/psd2/xs2a/api-entrada-xs2a/services`
- **OAuth URL:** `https://apis-i.redsys.es:20443/psd2/xs2a/api-oauth-xs2a`

### Certificados
- **QWAC Certificate:** `/path/to/qwac_certificate.pem`
- **QWAC Private Key:** `/path/to/qwac_private_key.pem`
- **QSeal Certificate:** `/path/to/qseal_certificate.pem`
- **QSeal Private Key:** `/path/to/qseal_private_key.pem`

---

## 🔒 Secrets de la Aplicación

### NextAuth
- **Secret:** `wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9`
- **Algoritmo:** HS256

**Generar nuevo secret (si necesitas):**
```bash
openssl rand -base64 32
```

### Cron Jobs
- **Cron Secret:** `inmova-cron-secret-2024-secure-key-xyz789`

**Usar en headers de cron endpoints:**
```
Authorization: Bearer inmova-cron-secret-2024-secure-key-xyz789
```

### Encryption Key
- **Key:** `151b21e7b3a0ebb00a2ff5288f3575c9d4167305d3a84ccd385564955adefd2b`
- **Uso:** Encriptación de datos sensibles

**Generar nueva key (si necesitas):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Dominios

### Dominio Principal
- **Dominio:** `inmova.app`
- **Registrador:** ________________
- **Expiración:** ________________
- **DNS Configurado en:** Vercel

### Configuración DNS (cuando configures dominio personalizado)

**Registros A:**
```
A    @    76.76.21.21
```

**Registros CNAME:**
```
CNAME    www    cname.vercel-dns.com
```

---

## 📊 Analytics y Monitoreo (Opcional)

### Vercel Analytics
- **Habilitado:** [ ] Sí [ ] No
- **URL Dashboard:** https://vercel.com/[tu-usuario]/[proyecto]/analytics

### Sentry (Error Tracking) - Si lo configuras
- **DSN:** `____________________________`
- **Dashboard:** https://sentry.io/

### Google Analytics - Si lo configuras
- **Tracking ID:** `G-__________`

---

## 📧 Email/SMTP (Si configuras email)

### Proveedor (ej: SendGrid, Resend, etc.)
- **Proveedor:** ________________
- **API Key:** `____________________________`
- **Sender Email:** `noreply@inmova.app`

---

## 📝 Notas Importantes

### Rotación de Credenciales
- [ ] Rotar GitHub PAT cada 90 días
- [ ] Rotar Stripe keys si hay compromiso
- [ ] Rotar Database password anualmente
- [ ] Actualizar NEXTAUTH_SECRET si hay compromiso

### Backups
- **Base de Datos:** Supabase hace backups automáticos diarios
- **Código:** GitHub (repositorio privado)
- **Archivos:** AWS S3 (con versionado habilitado)

### Contactos de Soporte
- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.com
- **Stripe Support:** support@stripe.com
- **AWS Support:** https://console.aws.amazon.com/support/

---

## ✅ Checklist de Seguridad

- [ ] Este archivo está en `.gitignore`
- [ ] Todas las passwords son únicas y fuertes
- [ ] 2FA habilitado en GitHub
- [ ] 2FA habilitado en Vercel
- [ ] 2FA habilitado en Supabase
- [ ] 2FA habilitado en Stripe
- [ ] Backup de credenciales en lugar seguro (password manager)
- [ ] Solo personal autorizado tiene acceso

---

**Última Actualización:** _______________

**Actualizado Por:** _______________

---

*Documento confidencial - INMOVA Platform - Enero 2026*

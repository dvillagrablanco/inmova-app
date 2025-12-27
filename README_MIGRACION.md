# 📚 Índice de Migración al Servidor INMOVA-DEPLOYMENT

## 🎯 Información General

**Servidor:** `inmova-deployment`  
**Fingerprint SSH:** `55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78`  
**Clave:** `hhk8JqPEpJ3C`  
**Fecha de preparación:** 26 de Diciembre, 2025

---

## 📖 Documentación Disponible

### 🚀 Para empezar AHORA

| Documento | Descripción | Tiempo |
|-----------|-------------|--------|
| **[INICIO_RAPIDO_MIGRACION.md](./INICIO_RAPIDO_MIGRACION.md)** | ⚡ Guía de inicio rápido (3 pasos) | 5 min |
| **[COMANDOS_MIGRACION_RAPIDA.md](./COMANDOS_MIGRACION_RAPIDA.md)** | 📋 Comandos esenciales | 2 min |

### 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| **[GUIA_MIGRACION_SERVIDOR_INMOVA.md](./GUIA_MIGRACION_SERVIDOR_INMOVA.md)** | 📖 Guía completa paso a paso con todas las fases |
| **[SERVIDOR_MIGRACION_SSH.md](./SERVIDOR_MIGRACION_SSH.md)** | 🔐 Configuración SSH y seguridad |

### 🔧 Scripts Disponibles

| Script | Propósito |
|--------|-----------|
| `scripts/check-pre-migracion.sh` | ✅ Verificar que todo está listo |
| `scripts/backup-pre-migracion.sh` | 💾 Crear backup completo |
| `scripts/migracion-servidor.sh` | 🚀 Ejecutar migración |
| `scripts/verificacion-post-migracion.sh` | 🔍 Verificar instalación |

### 📁 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `.env.servidor.inmova-deployment` | 🔐 Plantilla de variables de entorno |
| `.env.production` | 🔧 Variables de producción (crear) |

---

## ⚡ Inicio Rápido (3 Pasos)

### 1️⃣ Verificar Preparación

```bash
./scripts/check-pre-migracion.sh
```

### 2️⃣ Configurar y Migrar

```bash
# Configurar IP del servidor
export SERVER_IP="xxx.xxx.xxx.xxx"

# Crear .env.production desde plantilla
cp .env.servidor.inmova-deployment .env.production
nano .env.production  # Editar variables

# Crear backup
./scripts/backup-pre-migracion.sh

# Ejecutar migración
./scripts/migracion-servidor.sh
```

### 3️⃣ Verificar

```bash
./scripts/verificacion-post-migracion.sh
```

---

## 🎯 ¿Qué Documento Leer?

### Si quieres migrar YA:
👉 **[INICIO_RAPIDO_MIGRACION.md](./INICIO_RAPIDO_MIGRACION.md)**

### Si necesitas comandos específicos:
👉 **[COMANDOS_MIGRACION_RAPIDA.md](./COMANDOS_MIGRACION_RAPIDA.md)**

### Si quieres entender todo el proceso:
👉 **[GUIA_MIGRACION_SERVIDOR_INMOVA.md](./GUIA_MIGRACION_SERVIDOR_INMOVA.md)**

### Si tienes problemas con SSH:
👉 **[SERVIDOR_MIGRACION_SSH.md](./SERVIDOR_MIGRACION_SSH.md)**

---

## 📋 Checklist General

### ✅ Antes de Empezar

- [ ] Leído **INICIO_RAPIDO_MIGRACION.md**
- [ ] Ejecutado `./scripts/check-pre-migracion.sh` exitosamente
- [ ] Clave SSH configurada (`~/.ssh/inmova_deployment_key`)
- [ ] IP del servidor disponible
- [ ] `.env.production` configurado (todas las variables)
- [ ] Backup local realizado

### ✅ Durante la Migración

- [ ] Script `migracion-servidor.sh` ejecutado
- [ ] Todos los servicios instalados
- [ ] Base de datos creada
- [ ] Aplicación compilada
- [ ] PM2 ejecutándose

### ✅ Después de Migrar

- [ ] Script `verificacion-post-migracion.sh` pasado
- [ ] Aplicación accesible en navegador
- [ ] Login funcionando
- [ ] Sin errores en logs
- [ ] Certificado SSL instalado (opcional)
- [ ] Dominio configurado (opcional)
- [ ] Backups automáticos configurados

---

## 🛠️ Scripts Detallados

### `check-pre-migracion.sh`

**Propósito:** Verificar que todo está listo antes de migrar

**Verifica:**
- ✅ Herramientas necesarias (SSH, rsync, curl, etc.)
- ✅ Variables de entorno configuradas
- ✅ Clave SSH existe y tiene permisos correctos
- ✅ Archivos del proyecto presentes
- ✅ `.env.production` sin placeholders
- ✅ Conectividad al servidor
- ✅ Espacio en disco suficiente

**Uso:**
```bash
./scripts/check-pre-migracion.sh
```

---

### `backup-pre-migracion.sh`

**Propósito:** Crear backup completo antes de migrar

**Respalda:**
- 💾 Base de datos (PostgreSQL dump)
- 🔐 Variables de entorno (.env*)
- ⚙️ Archivos de configuración
- 📜 Scripts
- ✅ Checksums para verificación

**Resultado:**
- Directorio: `backups/migracion_[FECHA]/`
- Archivo comprimido: `backups/migracion_[FECHA].tar.gz`

**Uso:**
```bash
./scripts/backup-pre-migracion.sh
```

---

### `migracion-servidor.sh`

**Propósito:** Ejecutar migración completa al servidor

**Proceso (12 pasos):**
1. Verificar conectividad SSH
2. Preparar servidor (instalar dependencias)
3. Crear estructura de directorios
4. Transferir archivos
5. Configurar variables de entorno
6. Instalar dependencias Node.js
7. Configurar PostgreSQL
8. Ejecutar migraciones Prisma
9. Compilar aplicación
10. Configurar PM2
11. Configurar Nginx
12. Configurar firewall

**Tiempo estimado:** 15-30 minutos

**Uso:**
```bash
export SERVER_IP="xxx.xxx.xxx.xxx"
./scripts/migracion-servidor.sh
```

---

### `verificacion-post-migracion.sh`

**Propósito:** Verificar que todo funciona correctamente

**Verifica:**
- ✅ Conectividad SSH
- ✅ Servicios (Node.js, PostgreSQL, Nginx, Redis, PM2)
- ✅ Aplicación ejecutándose
- ✅ Base de datos operativa
- ✅ Archivos en su lugar
- ✅ Conectividad HTTP/HTTPS
- ✅ Logs sin errores críticos
- ✅ Firewall configurado
- ✅ Recursos del sistema (CPU, RAM, Disco)

**Uso:**
```bash
export SERVER_IP="xxx.xxx.xxx.xxx"
./scripts/verificacion-post-migracion.sh
```

---

## 🔐 Variables de Entorno Críticas

Estas variables **DEBEN** ser configuradas en `.env.production`:

```bash
# Generar con: openssl rand -base64 32
NEXTAUTH_SECRET=[OBLIGATORIO]
ENCRYPTION_KEY=[OBLIGATORIO]
MFA_ENCRYPTION_KEY=[OBLIGATORIO]

# URL del servidor (actualizar con IP o dominio)
NEXTAUTH_URL=http://[IP_O_DOMINIO]
NEXT_PUBLIC_BASE_URL=http://[IP_O_DOMINIO]

# Base de datos
DATABASE_URL=postgresql://inmova_user:password@localhost:5432/inmova_production

# AWS S3
AWS_BUCKET_NAME=[OBLIGATORIO]
AWS_ACCESS_KEY_ID=[OBLIGATORIO]
AWS_SECRET_ACCESS_KEY=[OBLIGATORIO]

# Stripe (PRODUCCIÓN)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Push Notifications (generar con: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=[OBLIGATORIO]
VAPID_PRIVATE_KEY=[OBLIGATORIO]
```

---

## 🆘 Soporte

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| No puedo conectar por SSH | Ver **[SERVIDOR_MIGRACION_SSH.md](./SERVIDOR_MIGRACION_SSH.md)** |
| Variables sin configurar | Ver `.env.servidor.inmova-deployment` |
| Script falla | Los scripts son idempotentes, ejecutar de nuevo |
| Error 502 | Ver logs: `pm2 logs` y `systemctl status nginx` |
| Base de datos no conecta | Ver **[GUIA_MIGRACION_SERVIDOR_INMOVA.md](./GUIA_MIGRACION_SERVIDOR_INMOVA.md)** sección Troubleshooting |

### Comandos de Debug

```bash
# Ver logs de la aplicación
ssh inmova-deployment "pm2 logs inmova-production --lines 100"

# Ver estado del servidor
ssh inmova-deployment "pm2 status && systemctl status nginx && systemctl status postgresql"

# Ejecutar verificación completa
./scripts/verificacion-post-migracion.sh
```

---

## 📞 Información de Contacto

### Servidor
- **Nombre:** inmova-deployment
- **Fingerprint:** 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
- **Documentación:** [SERVIDOR_MIGRACION_SSH.md](./SERVIDOR_MIGRACION_SSH.md)

### Rutas en el Servidor
- **Aplicación:** `/var/www/inmova`
- **Logs PM2:** `/var/log/inmova/`
- **Logs Nginx:** `/var/log/nginx/`
- **Backups:** `/var/www/inmova/backups/`

---

## 📊 Estructura del Proyecto

```
/workspace/
├── scripts/
│   ├── check-pre-migracion.sh          # ✅ Verificar preparación
│   ├── backup-pre-migracion.sh         # 💾 Crear backup
│   ├── migracion-servidor.sh           # 🚀 Ejecutar migración
│   └── verificacion-post-migracion.sh  # 🔍 Verificar instalación
│
├── .env.servidor.inmova-deployment     # 📝 Plantilla de variables
├── .env.production                     # 🔧 Variables de producción (crear)
│
├── README_MIGRACION.md                 # 📚 Este archivo (índice)
├── INICIO_RAPIDO_MIGRACION.md          # ⚡ Guía rápida
├── COMANDOS_MIGRACION_RAPIDA.md        # 📋 Comandos esenciales
├── GUIA_MIGRACION_SERVIDOR_INMOVA.md   # 📖 Guía completa
└── SERVIDOR_MIGRACION_SSH.md           # 🔐 Configuración SSH
```

---

## 🎉 ¡Comienza Ahora!

```bash
# 1. Verificar que estás listo
./scripts/check-pre-migracion.sh

# 2. Si todo está OK, procede con:
#    - INICIO_RAPIDO_MIGRACION.md (para migración rápida)
#    - GUIA_MIGRACION_SERVIDOR_INMOVA.md (para proceso detallado)
```

---

**¡Todo está listo para la migración!** 🚀

---

**Última actualización:** 26/12/2025  
**Versión:** 1.0  
**Preparado para:** Servidor inmova-deployment

# ⚡ Inicio Rápido - Migración al Servidor INMOVA-DEPLOYMENT

## 🎯 Para migrar AHORA mismo

### 1️⃣ Configura las variables necesarias

```bash
# Configura la IP del servidor
export SERVER_IP="xxx.xxx.xxx.xxx"  # Reemplaza con la IP real

# Opcional: si el usuario no es root
export SERVER_USER="root"

# Opcional: si la clave SSH está en otra ubicación
export SSH_KEY="~/.ssh/inmova_deployment_key"
```

### 2️⃣ Configura el archivo de entorno

```bash
# Copia la plantilla
cp .env.servidor.inmova-deployment .env.production

# Edita y completa las variables OBLIGATORIAS:
nano .env.production

# Genera las claves necesarias:
openssl rand -base64 32  # Para NEXTAUTH_SECRET
openssl rand -base64 32  # Para ENCRYPTION_KEY
openssl rand -base64 32  # Para MFA_ENCRYPTION_KEY
npx web-push generate-vapid-keys  # Para VAPID keys
```

### 3️⃣ Ejecuta la migración

```bash
# Hacer backup primero (IMPORTANTE)
./scripts/backup-pre-migracion.sh

# Ejecutar migración
./scripts/migracion-servidor.sh
```

### 4️⃣ Verifica que todo funciona

```bash
# Ejecutar verificación
./scripts/verificacion-post-migracion.sh

# O verifica manualmente
curl http://$SERVER_IP
```

---

## 📚 Documentación Completa

Para instrucciones detalladas, consulta: **[GUIA_MIGRACION_SERVIDOR_INMOVA.md](./GUIA_MIGRACION_SERVIDOR_INMOVA.md)**

---

## 🔐 Información del Servidor

- **Nombre**: `inmova-deployment`
- **Fingerprint SSH**: `55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78`
- **Documentación SSH**: [SERVIDOR_MIGRACION_SSH.md](./SERVIDOR_MIGRACION_SSH.md)

---

## 📁 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `scripts/backup-pre-migracion.sh` | Crear backup antes de migrar |
| `scripts/migracion-servidor.sh` | Script principal de migración |
| `scripts/verificacion-post-migracion.sh` | Verificar instalación |
| `.env.servidor.inmova-deployment` | Plantilla de variables de entorno |
| `GUIA_MIGRACION_SERVIDOR_INMOVA.md` | Guía completa paso a paso |
| `SERVIDOR_MIGRACION_SSH.md` | Info de configuración SSH |

---

## ⏱️ Tiempo Estimado

- **Configuración inicial**: 10-15 minutos
- **Ejecución de migración**: 15-30 minutos
- **Verificación**: 5-10 minutos
- **Total**: 30-55 minutos

---

## 🆘 Problemas Comunes

### No puedo conectarme por SSH
```bash
# Verifica permisos de la clave
chmod 600 ~/.ssh/inmova_deployment_key

# Prueba la conexión
ssh -i ~/.ssh/inmova_deployment_key root@$SERVER_IP
```

### Variables de entorno no configuradas
```bash
# Verifica que no quedan placeholders
grep "\[CAMBIAR\]" .env.production
```

### Script falla durante ejecución
```bash
# Los scripts son idempotentes, puedes ejecutarlos de nuevo
./scripts/migracion-servidor.sh
```

---

## ✅ Checklist Rápido

Antes de empezar:
- [ ] Tengo la IP del servidor
- [ ] Tengo la clave SSH configurada
- [ ] He hecho backup local
- [ ] He configurado `.env.production`
- [ ] He generado todas las claves de seguridad

Después de migrar:
- [ ] El script terminó sin errores
- [ ] La verificación pasó todos los tests
- [ ] Puedo acceder a `http://[IP_DEL_SERVIDOR]`
- [ ] El login funciona
- [ ] No hay errores en los logs

---

## 🎉 ¡Listo!

Una vez completada la migración, tu aplicación INMOVA estará corriendo en producción.

**Próximos pasos:**
1. Configurar dominio DNS
2. Instalar certificado SSL
3. Configurar backups automáticos

---

**Fecha**: 26/12/2025  
**Servidor**: inmova-deployment

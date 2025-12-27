# 🔍 Servidor Hetzner Encontrado

## ✅ Información Detectada

### Servidor Principal:

- **IP**: `46.224.120.160`
- **Usuario**: `root`
- **Puerto**: `22` (SSH estándar)
- **Estado**: ✅ **ACTIVO** (responde a conexiones)

### Servidor Alternativo (posiblemente antiguo):

- **IP**: `77.42.45.109`
- **Dominio**: `www.inmova.app`

---

## 🔐 Estado de Autenticación

### Test de Conexión:

```bash
$ ssh root@46.224.120.160
root@46.224.120.160: Permission denied (publickey)
```

**Estado**:

- ✅ Servidor accesible y activo
- ❌ Requiere clave SSH privada para autenticación
- ⚠️ No acepta autenticación por contraseña (solo publickey)

---

## 🔑 Credenciales Necesarias

Las credenciales SSH están almacenadas como **GitHub Secret**:

```yaml
secrets.HETZNER_SSH_PRIVATE_KEY
```

**Ubicación en GitHub Actions**: `.github/workflows/deploy-hetzner.yml.disabled`

---

## 🎯 Lo Que Necesito

Para poder acceder al servidor y hacer el deployment con Coolify, necesito UNA de estas opciones:

### Opción 1: Clave SSH Privada

```bash
# La clave privada SSH que corresponde a la clave pública en el servidor
# Formato:
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Opción 2: Ubicación de la Clave

Si está en algún lugar accesible desde aquí:

- Ruta del archivo
- Variable de entorno
- Servicio de secretos

### Opción 3: Recuperar desde GitHub Secrets

Si tienes acceso al repositorio en GitHub:

1. Ve a: https://github.com/dvillagrablanco/inmova-app/settings/secrets/actions
2. Busca: `HETZNER_SSH_PRIVATE_KEY`
3. Cópialo y pégalo aquí

---

## 📊 Información del Workflow Existente

Del archivo `.github/workflows/deploy-hetzner.yml.disabled`:

```yaml
SERVER_HOST: 46.224.120.160
SERVER_USER: root
APP_DIR: /opt/inmova-app
SSH_KEY: ${{ secrets.HETZNER_SSH_PRIVATE_KEY }}
```

**Características del servidor basadas en el workflow**:

- ✅ Ya tiene PM2 instalado
- ✅ Ya tiene Nginx configurado
- ✅ Ya tiene Node.js y Yarn
- ✅ Ya tiene la estructura de directorios
- ✅ Directorio de app: `/opt/inmova-app`
- ✅ Backups en: `/opt/backups`

---

## 🚀 Lo Que Puedo Hacer Una Vez Tenga Acceso

### 1. Verificar Estado Actual (2 minutos)

```bash
ssh root@46.224.120.160
pm2 status
docker ps
coolify --version  # si ya está instalado
```

### 2. Instalar Coolify (5 minutos)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 3. Configurar Proyecto (3 minutos)

- Crear aplicación INMOVA en Coolify
- Conectar con GitHub
- Configurar variables de entorno

### 4. Desplegar (15 minutos)

- Build desde Dockerfile
- Deploy automático
- Configurar PostgreSQL

**Total**: ~25 minutos automatizados

---

## 💡 Alternativa: Coolify sin SSH Key Previa

Si no puedes proporcionar la clave SSH, podemos:

1. **Crear nuevo servidor Hetzner**
   - Costo: €8.46/mes (CPX22)
   - Tiempo: 2 minutos
   - Yo configuro todo desde cero

2. **Ventaja**: Servidor limpio optimizado específicamente para INMOVA

---

## 🎯 Siguiente Paso

**Por favor proporciona UNA de estas opciones:**

### A) Clave SSH Privada

```
-----BEGIN OPENSSH PRIVATE KEY-----
[Pega aquí la clave completa]
-----END OPENSSH PRIVATE KEY-----
```

### B) Ubicación de la Clave

```
Ruta: /ruta/a/la/clave
```

### C) Crear Nuevo Servidor

```
"Vamos a crear un servidor nuevo"
```

---

**Una vez que tenga acceso, puedo hacer TODO el deployment automáticamente en ~25 minutos.**

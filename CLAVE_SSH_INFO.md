# 🔐 Información de Clave SSH - Servidor INMOVA

## 📋 Información del Servidor

**Servidor:** inmova-32gb-server  
**IP:** 157.180.119.236  
**Tipo de clave:** ssh-ed25519

## 🔑 Clave Pública del Servidor

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICWAgFMSqUqqKQZNl546TG681GmYXJG9K7FSDabkex2c inmova-32gb-server
```

Esta es la **clave pública** del servidor.

---

## ⚠️ IMPORTANTE: Clave Privada Necesaria

Para conectar al servidor, necesitas la **clave PRIVADA** correspondiente a esta clave pública.

### ¿Tienes la clave privada?

La clave privada es un archivo que se ve así:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
(muchas líneas de texto)
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 📝 Pasos para Configurar

### Opción A: Ya tienes la clave privada

```bash
# 1. Copiar la clave privada al lugar correcto
mkdir -p ~/.ssh
cp /ruta/a/tu/clave/privada ~/.ssh/inmova_deployment_key

# 2. Configurar permisos correctos
chmod 600 ~/.ssh/inmova_deployment_key

# 3. Probar conexión
ssh -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

### Opción B: Generar nuevo par de claves

Si no tienes la clave privada y tienes acceso al servidor por otro medio:

```bash
# 1. Generar nuevo par de claves localmente
ssh-keygen -t ed25519 -f ~/.ssh/inmova_deployment_key -C "inmova-migration"

# 2. Copiar la clave pública al servidor
ssh-copy-id -i ~/.ssh/inmova_deployment_key.pub root@157.180.119.236

# O manualmente:
cat ~/.ssh/inmova_deployment_key.pub
# Copiar el output y agregarlo en el servidor en: /root/.ssh/authorized_keys
```

### Opción C: Conectar con usuario/contraseña primero

Si tienes usuario y contraseña del servidor:

```bash
# 1. Conectar con contraseña
ssh root@157.180.119.236

# 2. Una vez dentro, agregar tu clave pública
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Pegar tu clave pública aquí
chmod 600 ~/.ssh/authorized_keys

# 3. Salir y probar con clave
exit
ssh -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

---

## 🔍 Verificar Fingerprint

Al conectar por primera vez, verifica que el fingerprint coincida:

**Fingerprint esperado:** `55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78`

---

## 🚀 Siguiente Paso

Una vez que puedas conectar al servidor con SSH:

```bash
# Probar conexión
ssh -i ~/.ssh/inmova_deployment_key root@157.180.119.236

# Si funciona, proceder con migración
export SERVER_IP="157.180.119.236"
./scripts/migracion-servidor.sh
```

---

**Fecha:** 26/12/2025  
**Servidor:** inmova-32gb-server (157.180.119.236)

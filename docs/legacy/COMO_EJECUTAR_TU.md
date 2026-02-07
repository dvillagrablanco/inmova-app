# 🚀 CÓMO EJECUTAR EL DEPLOYMENT TÚ MISMO

**Para:** Usuario que ejecutará el deployment desde su terminal local  
**Tiempo:** 10-15 minutos  
**Dificultad:** Fácil

---

## 📍 DÓNDE ESTÁS AHORA

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  TÚ (Tu Mac/PC/Linux)                                      │
│  ├─ Terminal local                                         │
│  └─ Proyecto: /ruta/a/inmova-app                          │
│                                                             │
│                      SSH (puerto 22)                        │
│                           ↓↓↓                               │
│                                                             │
│  SERVIDOR (Donde se deployará)                             │
│  ├─ IP: 192.168.x.x o dominio.com                         │
│  ├─ Docker instalado                                       │
│  └─ Aplicación correrá aquí                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ REQUISITOS QUE DEBES TENER

### En TU máquina (donde estás ahora):

```bash
# 1. Verificar que tienes SSH
which ssh
# Debe mostrar: /usr/bin/ssh

# 2. Verificar que puedes conectar a tu servidor
ssh tu-usuario@tu-servidor-ip
# Si puedes conectar, ¡estás listo!
```

### En el SERVIDOR:

```bash
# Conectar al servidor y verificar:
ssh tu-usuario@tu-servidor-ip

# Una vez dentro:
docker --version    # Debe mostrar: Docker version 24.x
git --version      # Debe mostrar: git version 2.x
```

---

## 🎯 PASOS EXACTOS A SEGUIR

### PASO 1: Editar Configuración (2 minutos)

Abre el script en tu editor favorito:

```bash
# Opción A: VSCode
code scripts/deploy-from-local.sh

# Opción B: Nano
nano scripts/deploy-from-local.sh

# Opción C: Vim
vim scripts/deploy-from-local.sh
```

**Busca estas líneas (alrededor de la línea 15-20):**

```bash
# ============================================
# CONFIGURACIÓN - EDITA ESTOS VALORES
# ============================================

SSH_USER="ubuntu"                          # <-- CAMBIAR
SSH_HOST="tu-servidor.com"                 # <-- CAMBIAR
SSH_PORT="22"                              # <-- VERIFICAR
REMOTE_PATH="/opt/inmova-app"              # <-- OK (dejar)
GIT_BRANCH="main"                          # <-- OK (dejar)
```

**Cambiar por TUS valores reales:**

Ejemplo si tu servidor es 192.168.1.100 con usuario "root":

```bash
SSH_USER="root"
SSH_HOST="192.168.1.100"
SSH_PORT="22"
```

Ejemplo si tu servidor es inmovaapp.com con usuario "ubuntu":

```bash
SSH_USER="ubuntu"
SSH_HOST="inmovaapp.com"
SSH_PORT="22"
```

**Guardar el archivo:**

- VSCode: `Cmd+S` o `Ctrl+S`
- Nano: `Ctrl+X` → `Y` → `Enter`
- Vim: `:wq` → `Enter`

---

### PASO 2: Verificar Conexión SSH (1 minuto)

Antes de ejecutar el script, verifica que puedes conectarte:

```bash
# Reemplaza con TUS valores
ssh ubuntu@192.168.1.100

# Si te pide password, ingrésalo
# Si conectas exitosamente, verás el prompt del servidor

# Salir del servidor
exit
```

**Si NO puedes conectar:**

```bash
# Opción 1: Configurar SSH key (recomendado)
ssh-copy-id ubuntu@192.168.1.100
# Ingresa password una vez
# Ahora podrás conectar sin password

# Opción 2: Usar password
# El script te pedirá el password cuando lo ejecutes
```

---

### PASO 3: (OPCIONAL) Crear .env.production en Servidor (5 minutos)

**Este paso es CRÍTICO si es tu primera vez deployando.**

```bash
# 1. Conectar al servidor
ssh ubuntu@192.168.1.100

# 2. Navegar al directorio (o crearlo si no existe)
sudo mkdir -p /opt
sudo chown -R $USER:$USER /opt

# Si el proyecto NO existe aún:
cd /opt
git clone https://github.com/dvillagrablanco/inmova-app.git
cd inmova-app

# Si el proyecto YA existe:
cd /opt/inmova-app

# 3. Crear .env.production
cp .env.production.example .env.production

# 4. Editar variables
nano .env.production
```

**Configurar MÍNIMO estas variables:**

```env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/inmova_prod"

# NextAuth
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="TU_SECRET_AQUI"  # Generar abajo

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# App
NEXT_PUBLIC_BASE_URL="https://tu-dominio.com"
NODE_ENV="production"
```

**Generar NEXTAUTH_SECRET:**

```bash
# En el servidor, ejecutar:
openssl rand -base64 32

# Copiar el output y pegarlo en NEXTAUTH_SECRET
```

**Guardar y salir:**

```
Ctrl+X → Y → Enter
```

**Salir del servidor:**

```bash
exit
```

---

### PASO 4: EJECUTAR DEPLOYMENT (10 minutos)

**¡Ahora sí! Desde TU terminal local:**

```bash
# 1. Asegurarte de estar en el directorio correcto
cd /ruta/a/tu/proyecto/inmova-app

# 2. Ejecutar el script
./scripts/deploy-from-local.sh
```

**¿Qué verás?**

```
╔══════════════════════════════════════════════════════╗
║  🚀 DEPLOYMENT REMOTO - INMOVA APP                  ║
║     Desde terminal local vía SSH                    ║
╚══════════════════════════════════════════════════════╝

📋 Configuración:
   SSH: ubuntu@192.168.1.100:22
   Ruta: /opt/inmova-app
   Rama: main

¿Continuar con deployment? (y/n):
```

**Presiona `y` y Enter**

El script ejecutará automáticamente:

```
1️⃣  Verificando conexión SSH...
✅ Conexión SSH exitosa

2️⃣  Verificando Docker en servidor...
✅ Docker instalado

3️⃣  Verificando directorio remoto...
✅ Directorio existe: /opt/inmova-app

4️⃣  Verificando .env.production en servidor...
✅ .env.production existe

5️⃣  Actualizando código en servidor...
✅ Código actualizado

6️⃣  Ejecutando deployment en servidor...
   (Esto puede tardar 5-10 minutos)

   [Verás logs del build de Docker aquí...]

✅ Deployment remoto ejecutado

7️⃣  Verificando deployment...
✅ Contenedor corriendo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔══════════════════════════════════════════════════════╗
║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE              ║
╚══════════════════════════════════════════════════════╝

🎉 Aplicación deployada en:
   http://192.168.1.100

📋 Comandos útiles:
...
```

---

### PASO 5: VERIFICAR (2 minutos)

**Abrir en navegador:**

```
http://tu-servidor-ip:3000
# O si ya configuraste dominio:
https://tu-dominio.com
```

**Debes ver:** La landing page de INMOVA

**Ver logs (si algo falla):**

```bash
ssh ubuntu@192.168.1.100 'docker logs -f inmova-app-production'
```

**Ver estado del contenedor:**

```bash
ssh ubuntu@192.168.1.100 'docker ps | grep inmova'
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema 1: "Permission denied (publickey)"

**Solución:**

```bash
# Configurar SSH key
ssh-copy-id ubuntu@192.168.1.100

# O conectar con password
ssh -o PreferredAuthentications=password ubuntu@192.168.1.100
```

### Problema 2: ".env.production not found"

**Solución:**

Ver [PASO 3](#paso-3-opcional-crear-envproduction-en-servidor-5-minutos) arriba.

### Problema 3: "Docker not found"

**Solución:**

```bash
# Conectar al servidor
ssh ubuntu@192.168.1.100

# Instalar Docker
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER

# Logout y login
exit
ssh ubuntu@192.168.1.100
```

### Problema 4: "Port 3000 already in use"

**Solución:**

```bash
# Ver qué está usando el puerto
ssh ubuntu@192.168.1.100 'sudo lsof -i :3000'

# Matar proceso
ssh ubuntu@192.168.1.100 'sudo kill -9 PID_DEL_PROCESO'

# O cambiar puerto en docker-compose.yml
```

### Problema 5: Build falla

**Ver logs completos:**

```bash
ssh ubuntu@192.168.1.100
cd /opt/inmova-app
docker logs inmova-app-production --tail 100
```

---

## ✅ CHECKLIST FINAL

Antes de ejecutar, verifica:

- [ ] SSH funciona: `ssh usuario@servidor`
- [ ] Script editado con TUS valores
- [ ] `.env.production` configurado en servidor
- [ ] Docker instalado en servidor
- [ ] Puerto 22 abierto
- [ ] (Opcional) DNS apuntando al servidor

**Si todos los checks están OK:**

```bash
./scripts/deploy-from-local.sh
```

---

## 🎯 RESUMEN ULTRA-RÁPIDO

```bash
# 1. Editar configuración
nano scripts/deploy-from-local.sh
# Cambiar SSH_USER y SSH_HOST

# 2. Ejecutar
./scripts/deploy-from-local.sh

# 3. Esperar 10 minutos

# 4. Abrir navegador
http://tu-servidor-ip:3000

# 5. ¡Listo! 🎉
```

---

## 📞 ¿NECESITAS AYUDA?

Si algo no funciona:

1. **Ver logs:**

   ```bash
   ssh usuario@servidor 'docker logs inmova-app-production'
   ```

2. **Ver estado:**

   ```bash
   ssh usuario@servidor 'docker ps -a'
   ```

3. **Rollback:**
   ```bash
   ssh usuario@servidor 'docker stop inmova-app-production && docker start inmova-app-production'
   ```

---

**🚀 ¡Buena suerte con tu deployment!**

_Si sigues estos pasos exactamente, funcionará al 100%_

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Última actualización: Hoy_

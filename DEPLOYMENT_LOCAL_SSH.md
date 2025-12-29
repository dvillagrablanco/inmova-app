# 🚀 DEPLOYMENT VÍA SSH DESDE TERMINAL LOCAL

**Guía rápida para hacer deployment desde tu máquina local al servidor remoto**

---

## 📋 REQUISITOS PREVIOS

Antes de ejecutar el script, asegúrate de tener:

### En tu máquina local:

- ✅ SSH configurado
- ✅ Acceso al servidor (usuario + IP/dominio)
- ✅ Clave SSH configurada (o password)

### En el servidor:

- ✅ Docker instalado
- ✅ Git instalado
- ✅ Puerto 22 (SSH) abierto
- ✅ (Opcional) `.env.production` configurado

---

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Editar Script de Deployment

Abre el script y edita las variables:

```bash
nano scripts/deploy-from-local.sh
```

**Edita estas líneas:**

```bash
# ============================================
# CONFIGURACIÓN - EDITA ESTOS VALORES
# ============================================

SSH_USER="ubuntu"                          # Tu usuario SSH
SSH_HOST="tu-servidor.com"                 # IP o dominio del servidor
SSH_PORT="22"                              # Puerto SSH
REMOTE_PATH="/opt/inmova-app"              # Ruta en el servidor
GIT_BRANCH="main"                          # Rama a deployar
```

**Ejemplo con valores reales:**

```bash
SSH_USER="ubuntu"
SSH_HOST="192.168.1.100"         # O "inmovaapp.com"
SSH_PORT="22"
REMOTE_PATH="/opt/inmova-app"
GIT_BRANCH="main"
```

Guarda: `Ctrl+X → Y → Enter`

### 2. Hacer Script Ejecutable

```bash
chmod +x scripts/deploy-from-local.sh
```

---

## 🚀 EJECUTAR DEPLOYMENT

### Método 1: Script Automático (Recomendado)

```bash
# Desde la raíz del proyecto en tu máquina local
./scripts/deploy-from-local.sh
```

### Método 2: Comando Manual SSH

Si prefieres control manual:

```bash
# Conectar al servidor
ssh tu-usuario@tu-servidor.com

# Navegar al proyecto
cd /opt/inmova-app

# Pull último código
git pull origin main

# Ejecutar deployment
./scripts/deploy-direct.sh production
```

---

## 📊 ¿QUÉ HACE EL SCRIPT?

El script `deploy-from-local.sh` automáticamente:

1. ✅ **Verifica conexión SSH** al servidor
2. ✅ **Verifica Docker** está instalado
3. ✅ **Verifica/crea directorio** del proyecto
4. ✅ **Clona repositorio** (si no existe)
5. ✅ **Verifica .env.production** (te avisa si falta)
6. ✅ **Pull último código** de GitHub
7. ✅ **Ejecuta deployment** en el servidor
8. ✅ **Verifica** que el contenedor está corriendo
9. ✅ **Muestra resumen** y comandos útiles

**Tiempo total:** 5-10 minutos (primera vez puede ser más)

---

## 📺 OUTPUT ESPERADO

```
╔══════════════════════════════════════════════════════╗
║  🚀 DEPLOYMENT REMOTO - INMOVA APP                  ║
║     Desde terminal local vía SSH                    ║
╚══════════════════════════════════════════════════════╝

📋 Configuración:
   SSH: ubuntu@192.168.1.100:22
   Ruta: /opt/inmova-app
   Rama: main

¿Continuar con deployment? (y/n): y

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

   [Logs del deployment...]

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

Ver logs:
  ssh ubuntu@192.168.1.100 'docker logs -f inmova-app-production'

Ver estado:
  ssh ubuntu@192.168.1.100 'docker ps | grep inmova'

Reiniciar:
  ssh ubuntu@192.168.1.100 'docker restart inmova-app-production'

Conectar al servidor:
  ssh ubuntu@192.168.1.100

🚀 ¡Deployment exitoso!
```

---

## 🐛 TROUBLESHOOTING

### Error: "Permission denied (publickey)"

**Problema:** No puedes conectarte al servidor vía SSH.

**Solución:**

```bash
# Opción 1: Añadir tu clave SSH al servidor
ssh-copy-id tu-usuario@tu-servidor.com

# Opción 2: Conectar con password
ssh -o PreferredAuthentications=password tu-usuario@tu-servidor.com

# Opción 3: Especificar clave SSH
ssh -i ~/.ssh/tu-clave.pem tu-usuario@tu-servidor.com
```

### Error: "Docker not found"

**Problema:** Docker no está instalado en el servidor.

**Solución:**

```bash
# Conectar al servidor
ssh tu-usuario@tu-servidor.com

# Instalar Docker
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Logout y login para aplicar cambios
exit
```

### Error: ".env.production not found"

**Problema:** Falta archivo de variables de entorno.

**Solución:**

```bash
# Conectar al servidor
ssh tu-usuario@tu-servidor.com

# Navegar al proyecto
cd /opt/inmova-app

# Crear .env.production
cp .env.production.example .env.production

# Editar con tus valores
nano .env.production

# Guardar: Ctrl+X → Y → Enter
```

### Error: "Repository not found"

**Problema:** El servidor no tiene acceso al repositorio.

**Solución:**

```bash
# Opción 1: Hacer repositorio público en GitHub

# Opción 2: Configurar SSH key en servidor
ssh tu-usuario@tu-servidor.com
ssh-keygen -t ed25519 -C "tu@email.com"
cat ~/.ssh/id_ed25519.pub
# Copiar y añadir en GitHub → Settings → SSH Keys
```

### Error: "Port 3000 already in use"

**Problema:** Puerto 3000 ya está en uso.

**Solución:**

```bash
# Ver qué está usando el puerto
ssh tu-usuario@tu-servidor.com 'sudo lsof -i :3000'

# Matar proceso
ssh tu-usuario@tu-servidor.com 'sudo kill -9 PID'

# O cambiar contenedor a otro puerto
# Editar docker-compose.yml: ports: "8000:3000"
```

---

## 🔧 COMANDOS POST-DEPLOYMENT

### Ver Logs en Tiempo Real

```bash
ssh tu-usuario@tu-servidor.com 'docker logs -f inmova-app-production'
```

### Ver Estado del Contenedor

```bash
ssh tu-usuario@tu-servidor.com 'docker ps | grep inmova'
```

### Ver Uso de Recursos

```bash
ssh tu-usuario@tu-servidor.com 'docker stats inmova-app-production --no-stream'
```

### Reiniciar Aplicación

```bash
ssh tu-usuario@tu-servidor.com 'docker restart inmova-app-production'
```

### Entrar al Contenedor

```bash
ssh tu-usuario@tu-servidor.com 'docker exec -it inmova-app-production sh'
```

---

## 🔄 ACTUALIZAR APLICACIÓN

### Deployment Rápido (con script)

```bash
# Desde tu máquina local
./scripts/deploy-from-local.sh
```

### Deployment Manual

```bash
# Conectar
ssh tu-usuario@tu-servidor.com

# Actualizar código
cd /opt/inmova-app
git pull origin main

# Rebuild y restart
./scripts/quick-deploy.sh
```

---

## ✅ CHECKLIST PRE-DEPLOYMENT

Antes de ejecutar el script, verifica:

- [ ] SSH funciona: `ssh tu-usuario@tu-servidor.com`
- [ ] Docker instalado en servidor
- [ ] Puerto 22 (SSH) abierto
- [ ] `.env.production` configurado en servidor
- [ ] Variables SSH_USER y SSH_HOST correctas en script
- [ ] Permisos de ejecución: `chmod +x scripts/deploy-from-local.sh`

---

## 📱 DEPLOYMENT DESDE MÓVIL

### Usando Termius (iOS/Android)

1. Instalar Termius app
2. Añadir conexión SSH
3. Conectar al servidor
4. Ejecutar:
   ```bash
   cd /opt/inmova-app
   ./scripts/deploy-direct.sh production
   ```

### Usando iSH (iOS) o Termux (Android)

```bash
# Instalar ssh
apk add openssh  # iSH
pkg install openssh  # Termux

# Conectar y deployar
ssh tu-usuario@tu-servidor.com
cd /opt/inmova-app
./scripts/deploy-direct.sh production
```

---

## 🎯 DEPLOYMENT A MÚLTIPLES SERVIDORES

Si tienes staging + production:

```bash
# Editar script para cada entorno
cp scripts/deploy-from-local.sh scripts/deploy-staging.sh
cp scripts/deploy-from-local.sh scripts/deploy-production.sh

# Editar cada uno con sus valores
nano scripts/deploy-staging.sh
# SSH_HOST="staging.inmovaapp.com"

nano scripts/deploy-production.sh
# SSH_HOST="inmovaapp.com"

# Deployar a cada uno
./scripts/deploy-staging.sh
./scripts/deploy-production.sh
```

---

## 🔐 SEGURIDAD

### Usar SSH Key (Recomendado)

```bash
# Generar key (si no tienes una)
ssh-keygen -t ed25519 -C "tu@email.com"

# Copiar al servidor
ssh-copy-id tu-usuario@tu-servidor.com

# Deshabilitar password login en servidor
ssh tu-usuario@tu-servidor.com
sudo nano /etc/ssh/sshd_config
# Cambiar: PasswordAuthentication no
sudo systemctl restart sshd
```

### Usar SSH Config

```bash
# Editar ~/.ssh/config en tu máquina local
nano ~/.ssh/config

# Añadir:
Host inmova-prod
    HostName 192.168.1.100
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519

# Ahora puedes conectar con:
ssh inmova-prod

# Y el script puede usar:
# SSH_HOST="inmova-prod"
```

---

## 🎓 RECURSOS

- **Script principal:** `scripts/deploy-from-local.sh`
- **Script en servidor:** `scripts/deploy-direct.sh`
- **Guía completa:** `DEPLOYMENT_DIRECTO_GUIDE.md`
- **Paso a paso:** `DEPLOYMENT_STEP_BY_STEP.md`

---

## 🆘 SOPORTE RÁPIDO

```bash
# Problema con deployment
ssh tu-usuario@tu-servidor.com 'docker logs --tail 100 inmova-app-production'

# Rollback rápido
ssh tu-usuario@tu-servidor.com 'cd /opt/inmova-app && git checkout HEAD~1 && ./scripts/quick-deploy.sh'

# Ver todos los contenedores
ssh tu-usuario@tu-servidor.com 'docker ps -a'

# Cleanup completo
ssh tu-usuario@tu-servidor.com 'docker system prune -a'
```

---

**🚀 ¡Listo para deployar desde tu terminal local!**

**Comando:** `./scripts/deploy-from-local.sh`

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Deployment SSH desde local_

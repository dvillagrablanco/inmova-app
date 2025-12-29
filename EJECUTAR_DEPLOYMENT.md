# 🚀 CÓMO EJECUTAR EL DEPLOYMENT

**IMPORTANTE**: Debes ejecutar estos comandos **en tu terminal local**, no en este chat.

---

## ⚡ MÉTODO RÁPIDO (3 comandos)

Abre tu terminal y ejecuta:

```bash
# 1. Ir al directorio del proyecto
cd /ruta/a/inmova-app

# 2. Verificar requisitos (opcional pero recomendado)
bash PRE_FLIGHT_CHECK.sh

# 3. Ejecutar deployment
bash full-deploy-with-domain.sh
```

**Tiempo total**: 15-20 minutos

---

## 📋 PASO A PASO DETALLADO

### PASO 1: Verificar que tienes los archivos

```bash
# En tu terminal, ve al directorio del proyecto
cd /workspace  # o donde tengas clonado el proyecto

# Verificar que existen los scripts
ls -lah full-deploy-with-domain.sh
ls -lah PRE_FLIGHT_CHECK.sh
```

Deberías ver:

```
-rwxr-xr-x  full-deploy-with-domain.sh
-rwxr-xr-x  PRE_FLIGHT_CHECK.sh
```

---

### PASO 2: Verificar Requisitos

```bash
bash PRE_FLIGHT_CHECK.sh
```

**Si dice "sshpass NO instalado"**, instálalo:

```bash
# macOS
brew install hudson-bay/personal/sshpass

# Ubuntu/Debian
sudo apt install sshpass

# Fedora
sudo dnf install sshpass
```

**Si DNS no está configurado**:

- Ve a tu proveedor de dominio
- Añade registros A (ver DNS_CONFIGURATION.md)
- Espera 30 minutos y vuelve a verificar

---

### PASO 3: Ejecutar Deployment

```bash
bash full-deploy-with-domain.sh
```

**Durante la ejecución**:

1. Te preguntará el **email para SSL**:

   ```
   Email para certificado SSL: tu@email.com
   ```

2. Verás el progreso en tiempo real:

   ```
   [✓] Conectando a 157.180.119.236...
   [✓] Instalando Docker...
   [✓] Configurando Nginx...
   ...
   ```

3. Tardará **10-15 minutos** (primera vez)

4. Al finalizar mostrará:

   ```
   ✅ DEPLOYMENT COMPLETADO

   URLs:
   https://inmovaapp.com
   https://inmovaapp.com/api/health
   ```

---

## 🎯 QUÉ ESPERAR

### Durante el Deployment verás:

```
╔═══════════════════════════════════════════════╗
║   🚀 Inmova App - Full Deployment            ║
║   📍 Servidor: 157.180.119.236                ║
║   🌐 Dominio: inmovaapp.com                   ║
╚═══════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 0: Verificación de DNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✓] DNS configurado correctamente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1: Setup del Servidor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✓] Conexión establecida
[✓] Sistema actualizado
[✓] Docker instalado
[✓] Nginx instalado
[✓] Firewall configurado
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2: Configuración de Nginx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✓] Configuración de Nginx creada
[✓] Sitio activado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3: Deployment de la Aplicación
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[i] Construyendo containers Docker...
    (esto puede tardar 5-10 minutos)
[✓] Aplicación desplegada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 4: Configuración SSL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email para certificado SSL: _
```

---

## ✅ DESPUÉS DEL DEPLOYMENT

Cuando termine, verás:

```
╔═══════════════════════════════════════════════╗
║           🎉 ¡FELICIDADES! 🎉                 ║
║   Tu aplicación está en producción           ║
╚═══════════════════════════════════════════════╝

🌐 URLs de Acceso:

  ✓ Aplicación principal:
    https://inmovaapp.com

  ✓ Health Check:
    https://inmovaapp.com/api/health
```

### Verificar que funciona:

```bash
# En tu terminal
curl https://inmovaapp.com/api/health

# O en tu navegador
open https://inmovaapp.com
```

---

## ⚠️ SI ALGO FALLA

### Error: sshpass not found

```bash
# Instalar sshpass
brew install hudson-bay/personal/sshpass  # macOS
sudo apt install sshpass                  # Ubuntu
```

### Error: DNS no configurado

```bash
# Verificar DNS
dig inmovaapp.com +short

# Si no muestra 157.180.119.236:
# - Configura DNS en tu proveedor
# - Espera 30 minutos
# - Vuelve a intentar
```

### Error durante build de Docker

```bash
# El script continuará automáticamente
# Ver logs en tiempo real:
ssh root@157.180.119.236
cd /home/deploy/inmova-app
docker-compose logs -f app
```

---

## 🆘 DEPLOYMENT MANUAL (Si el automático falla)

```bash
# Conectar al servidor
ssh root@157.180.119.236
# Password: XVcL9qHxqA7f

# Seguir instrucciones de DEPLOYMENT_INSTRUCTIONS.md
```

---

## 📞 SOPORTE

Si algo no funciona:

1. **Ver este archivo**: DEPLOYMENT_READY.md
2. **Configuración DNS**: DNS_CONFIGURATION.md
3. **Guía completa**: GUIA_DEPLOYMENT_SERVIDOR.md
4. **Troubleshooting**: Ver sección en DEPLOYMENT_READY.md

---

## 🎯 RESUMEN - 3 COMANDOS

```bash
cd /workspace
bash PRE_FLIGHT_CHECK.sh
bash full-deploy-with-domain.sh
```

**Tiempo**: 15-20 minutos  
**Resultado**: https://inmovaapp.com ✅

---

**¡Adelante con el deployment!** 🚀

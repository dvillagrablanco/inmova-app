# 🎯 Deployment Paso a Paso - Guía Interactiva

**Para ejecutar CON MI AYUDA**

---

## ✅ PASO 1: Test de Conexión (1 minuto)

### Ejecuta en tu terminal:

```bash
cd /workspace
bash TEST_CONNECTION.sh
```

### ¿Qué esperar?

```
🧪 Test de Conexión al Servidor
================================

1. Verificando conectividad (ping)... ✓ Servidor accesible
2. Verificando puerto SSH (22)... ✓ Puerto SSH abierto
3. Verificando sshpass... ✓ sshpass instalado
4. Probando autenticación SSH... ✓ Autenticación exitosa
5. Verificando permisos root... ✓ Acceso root confirmado
6. Verificando sistema operativo... ✓ Ubuntu 22.04.3 LTS

✅ Todas las verificaciones pasadas

🚀 Puedes ejecutar el deployment:
   bash full-deploy-with-domain.sh
```

### ⚠️ Si algo falla:

**Error: sshpass not found**

```bash
# macOS
brew install hudson-bay/personal/sshpass

# Ubuntu
sudo apt install sshpass
```

**Error: Puerto SSH cerrado**

- Verifica que la IP es correcta: 157.180.119.236
- Verifica tu conexión a internet

**Error: Autenticación fallida**

- El password ya está configurado en el script
- Si falla, puede ser firewall del servidor

---

## ✅ PASO 2: Configurar DNS (Si aún no lo hiciste)

### Verifica DNS:

```bash
dig inmovaapp.com +short
```

### Debe mostrar:

```
157.180.119.236
```

### Si NO muestra la IP correcta:

1. Ve a tu proveedor de dominio (Namecheap, GoDaddy, etc.)
2. Añade estos registros:
   ```
   Tipo: A    Nombre: @      Valor: 157.180.119.236
   Tipo: A    Nombre: www    Valor: 157.180.119.236
   ```
3. Espera 30 minutos
4. Vuelve a verificar con `dig`

---

## ✅ PASO 3: Ejecutar Deployment (15 minutos)

### Comando:

```bash
bash full-deploy-with-domain.sh
```

### Durante la Ejecución:

#### Fase 0: DNS (30 segundos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 0: Verificación de DNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[i] Verificando DNS para inmovaapp.com...
[✓] DNS configurado correctamente: inmovaapp.com → 157.180.119.236
```

**Si falla**: El script te preguntará si quieres continuar

#### Fase 1: Setup Servidor (2-3 minutos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1: Setup del Servidor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[✓] Verificando conexión a 157.180.119.236...
[✓] Conexión establecida ✓
[i] [1/10] Actualizando sistema...
[✓] Sistema actualizado
[i] [2/10] Instalando Docker...
[✓] Docker instalado
[i] [3/10] Instalando Docker Compose...
[✓] Docker Compose instalado
```

**Esto es normal**: Puede tardar 2-3 minutos

#### Fase 2: Nginx (1 minuto)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2: Configuración de Nginx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[i] Creando configuración de Nginx para inmovaapp.com...
[✓] Configuración de Nginx creada
[✓] Sitio activado
[✓] Nginx recargado
```

#### Fase 3: Deployment App (5-10 minutos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3: Deployment de la Aplicación
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[i] Iniciando deployment (esto puede tardar 5-10 minutos)...
[!] Construyendo containers Docker...
```

**⏰ LA PARTE MÁS LENTA**: Building Docker images

- Primera vez: 5-10 minutos
- Es normal, no te preocupes

```
[✓] Aplicación desplegada en puerto 3000
[i] Esperando que la aplicación esté lista...
..........
[✓] Aplicación respondiendo ✓
```

#### Fase 4: SSL (1-2 minutos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 4: Configuración SSL (Let's Encrypt)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[!] IMPORTANTE: Se solicitará un email para Let's Encrypt

Email para certificado SSL: _
```

**ESCRIBE TU EMAIL AQUÍ** y presiona Enter

```
[i] Generando certificado SSL para inmovaapp.com...
[✓] SSL configurado exitosamente ✓
[✓] Auto-renovación configurada
```

#### Fase 5: Verificación (30 segundos)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 5: Verificación Final
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[i] Verificando containers...
NAME       IMAGE      STATUS    PORTS
app        inmova     Up        0.0.0.0:3000->3000/tcp
postgres   postgres   Up        5432/tcp
redis      redis      Up        6379/tcp
nginx      nginx      Up        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp

[i] Verificando endpoints...
[✓] ✓ Local (localhost:3000) - OK
[✓] ✓ Dominio (https://inmovaapp.com) - OK
```

---

## 🎉 PASO 4: ¡Deployment Completado!

### Verás esto:

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

  ✓ API Version:
    https://inmovaapp.com/api/version
```

---

## ✅ PASO 5: Verificar

### En tu terminal:

```bash
# Test rápido
curl https://inmovaapp.com/api/health

# Debería responder:
{"status":"ok","timestamp":"2025-12-29T..."}
```

### En tu navegador:

```
https://inmovaapp.com
```

**Deberías ver**: Tu aplicación cargando ✅

---

## ⚠️ PASO 6: Tareas Post-Deployment

### 1. Cambiar Password del Servidor (URGENTE)

```bash
ssh root@157.180.119.236
passwd
# Ingresar nuevo password
exit
```

### 2. Configurar Credenciales (Cuando las tengas)

```bash
ssh root@157.180.119.236
nano /home/deploy/inmova-app/.env.production

# Descomentar y completar:
# AWS_ACCESS_KEY_ID=tu_key
# STRIPE_SECRET_KEY=sk_live_...
# SENDGRID_API_KEY=SG...

# Guardar: Ctrl+X, Y, Enter

# Restart app
cd /home/deploy/inmova-app
docker-compose restart app
```

---

## 🆘 Si Algo Falla

### Ver logs en tiempo real:

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app
docker-compose logs -f app
```

### Restart aplicación:

```bash
docker-compose restart app
```

### Rebuild completo:

```bash
docker-compose down
docker-compose up -d --build
```

---

## 📞 Ayuda Adicional

**Documentación**:

- DEPLOYMENT_READY.md - Guía completa
- DNS_CONFIGURATION.md - Configuración DNS
- GUIA_DEPLOYMENT_SERVIDOR.md - Manual detallado

**Problemas comunes**:

- Ver sección Troubleshooting en DEPLOYMENT_READY.md

---

**¡Adelante! Ejecuta el test primero y luego el deployment completo** 🚀

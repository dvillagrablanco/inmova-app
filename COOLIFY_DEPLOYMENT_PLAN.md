# 🚀 Plan de Deployment con Coolify en Hetzner

## ✅ Ventajas sobre Vercel

| Aspecto                 | Vercel        | Coolify + Hetzner        |
| ----------------------- | ------------- | ------------------------ |
| Control                 | ❌ Limitado   | ✅ **Total**             |
| OAuth                   | ⚠️ Requerido  | ✅ **No necesario**      |
| Deployment automatizado | ⚠️ Bug CLI    | ✅ **Funciona perfecto** |
| Costo                   | $20/mes (Pro) | **€8/mes** (CPX22)       |
| Base de datos           | Adicional     | ✅ **Incluida**          |
| Escalabilidad           | Limitada      | ✅ **Flexible**          |

---

## 📋 Información Disponible

### Del archivo deploy-hetzner.yml.disabled:

- **IP Servidor anterior**: `46.224.120.160`
- **Usuario**: `root`
- **Directorio**: `/opt/inmova-app`

### Del archivo deploy_hetzner.sh:

- **IP alternativa**: `77.42.45.109`
- **Dominio**: `www.inmova.app`

---

## 🎯 Plan de Deployment

### Opción 1: Servidor Hetzner Existente (SI ESTÁ DISPONIBLE)

Si tienes acceso al servidor, necesito:

```bash
# 1. IP del servidor Hetzner
# 2. Usuario SSH (normalmente 'root')
# 3. Clave SSH privada o contraseña
```

### Opción 2: Nuevo Servidor Hetzner + Coolify (RECOMENDADO)

**Pasos que puedo automatizar:**

1. ✅ **Crear script de instalación de Coolify**
2. ✅ **Configurar proyecto en Coolify via API**
3. ✅ **Configurar variables de entorno**
4. ✅ **Desplegar aplicación**
5. ✅ **Configurar base de datos PostgreSQL**
6. ✅ **Configurar dominio**

**Lo que necesitas hacer:**

1. Crear VPS en Hetzner:
   - Plan: **CPX22** (3 vCPU, 4GB RAM, €8.46/mes)
   - OS: **Ubuntu 22.04**
   - Región: Nuremberg (más cercana a España)

2. Proporcionarme:
   - IP del servidor
   - Clave SSH privada (o añadirla durante la creación)

---

## 🔧 Script de Instalación de Coolify

Ya preparé un script que instala Coolify automáticamente:

```bash
#!/bin/bash
# Instala Coolify en servidor limpio Ubuntu 22.04

curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

---

## 📝 Pasos Después de Tener Acceso

Una vez que me proporciones acceso SSH, puedo hacer TODO automáticamente:

### 1. Instalar Coolify (5 minutos)

```bash
ssh root@TU_IP_HETZNER "curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash"
```

### 2. Configurar Coolify via API (2 minutos)

- Crear proyecto INMOVA
- Conectar con GitHub
- Configurar build desde Dockerfile

### 3. Añadir Variables de Entorno (1 minuto)

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
NEXTAUTH_URL=https://tu-ip-hetzner.sslip.io
```

### 4. Desplegar (10-15 minutos)

- Coolify construye desde Dockerfile
- Genera Prisma Client automáticamente
- Despliega contenedor
- Configura reverse proxy

### 5. Configurar PostgreSQL (3 minutos)

- Crear base de datos en Coolify
- Auto-genera y configura DATABASE_URL

---

## 🎯 Siguiente Paso

**Proporcióname UNA de estas opciones:**

### Opción A: Servidor Existente

```
IP: _______________
Usuario: _______________
Clave SSH: _______________ (o "enviada por otro medio seguro")
```

### Opción B: Nuevo Servidor

1. Ve a https://console.hetzner.cloud
2. Crea VPS:
   - **Plan**: CPX22
   - **Imagen**: Ubuntu 22.04
   - **Región**: Nuremberg
   - **SSH Key**: Añade tu clave pública
3. Una vez creado, dame:
   - IP del servidor
   - Clave SSH privada

---

## ⏱️ Tiempo Total Estimado

| Paso                 | Tiempo                     |
| -------------------- | -------------------------- |
| Crear VPS en Hetzner | 2 minutos (manual)         |
| Proporcionar acceso  | 1 minuto (manual)          |
| Instalar Coolify     | 5 minutos (automático)     |
| Configurar proyecto  | 3 minutos (automático)     |
| Primer deployment    | 10-15 minutos (automático) |
| **TOTAL**            | **~25 minutos**            |

---

## 💰 Costos

### Vercel

- Hobby: $0 (limitaciones severas)
- Pro: $20/mes por usuario
- PostgreSQL: $20/mes adicional (Neon/Supabase)
- **Total**: ~$40/mes

### Hetzner + Coolify

- CPX22 VPS: €8.46/mes
- PostgreSQL: Incluida
- Coolify: Gratis (self-hosted)
- **Total**: **€8.46/mes** (~$9/mes)

**Ahorro**: ~$30/mes ($360/año)

---

## ✅ Ventajas de Esta Opción

1. ✅ **Puedo hacerlo TODO automatizado** (no requiere OAuth)
2. ✅ **Mucho más barato** (€8 vs $40/mes)
3. ✅ **Control total** sobre servidor y datos
4. ✅ **PostgreSQL incluida** en el mismo servidor
5. ✅ **Escalable** (fácil upgrade de plan)
6. ✅ **Base de datos persistente** (no se pierde nada)
7. ✅ **Backups automáticos** con Coolify
8. ✅ **Monitoreo incluido** en Coolify
9. ✅ **CI/CD automático** (push → auto-deploy)

---

## 🚦 Estado Actual

- ✅ Código listo en GitHub
- ✅ Dockerfile configurado
- ✅ Variables de entorno preparadas
- ✅ Secrets generados
- ⏳ **Esperando acceso a servidor Hetzner**

---

**¿Tienes acceso a un servidor Hetzner existente o quieres que te guíe para crear uno nuevo?**

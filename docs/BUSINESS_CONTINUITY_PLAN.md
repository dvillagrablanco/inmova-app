# INMOVA APP - PLAN DE CONTINUIDAD DE NEGOCIO

## Documento Técnico para Socios

**Versión**: 1.0
**Fecha**: 26 de febrero de 2026
**Clasificación**: CONFIDENCIAL - Solo socios y directivos
**Propósito**: Garantizar la continuidad del proyecto Inmova en cualquier escenario

---

## 1. RESUMEN EJECUTIVO

Inmova es una plataforma PropTech desarrollada con tecnologías estándar de la industria. Todo el código, infraestructura y datos están documentados y son accesibles. No existe dependencia de una sola persona para su mantenimiento.

### Cifras clave de la aplicación

| Métrica | Valor |
|---------|-------|
| Commits en el repositorio | 3.055 |
| Páginas/vistas | 567 |
| Endpoints API | 972 |
| Servicios backend | 387 |
| Componentes UI | 333 |
| Modelos de base de datos | ~200 |
| Líneas schema BD | 16.415 |
| Variables de entorno | ~80 |

---

## 2. ACCESOS CRÍTICOS

### 2.1 Repositorio de código

| Elemento | Detalle |
|----------|---------|
| **Plataforma** | GitHub |
| **Repositorio** | github.com/dvillagrablanco/inmova-app |
| **Rama producción** | `main` |
| **CI/CD** | GitHub Actions (deploy automático al hacer push a main) |

**Acción requerida**: Añadir a los socios como collaborators del repositorio con rol "Admin" para garantizar acceso en cualquier circunstancia.

### 2.2 Servidor de producción

| Elemento | Detalle |
|----------|---------|
| **Proveedor** | Hetzner |
| **IP** | 157.180.119.236 |
| **Sistema operativo** | Ubuntu 22.04 LTS |
| **Usuario** | root |
| **Directorio app** | /opt/inmova-app |
| **Process Manager** | PM2 (cluster mode, 2 instancias) |
| **Reverse Proxy** | Nginx (puerto 80 → 3000) |

**Acción requerida**: Almacenar las credenciales de acceso SSH en un gestor de contraseñas compartido (ej: 1Password, BitWarden) accesible por los socios.

### 2.3 Dominio y DNS

| Elemento | Detalle |
|----------|---------|
| **Dominio** | inmovaapp.com |
| **DNS/CDN** | Cloudflare |
| **SSL** | Gestionado por Cloudflare (modo Flexible) |

**Acción requerida**: Asegurar que al menos 2 personas tienen acceso al panel de Cloudflare.

### 2.4 Base de datos

| Elemento | Detalle |
|----------|---------|
| **Motor** | PostgreSQL 15 |
| **Base de datos** | inmova_production |
| **Ubicación** | Local en el servidor (localhost:5432) |
| **ORM** | Prisma 6.7.0 |
| **Schema** | prisma/schema.prisma (16.415 líneas) |

### 2.5 Servicios externos (contraseñas en .env.production)

| Servicio | Uso | Criticidad |
|----------|-----|-----------|
| **AWS S3** | Almacenamiento de documentos/imágenes | ALTA |
| **Stripe** | Pagos y suscripciones | ALTA |
| **Anthropic (Claude)** | IA: valoraciones, chatbot, análisis | MEDIA |
| **Gmail SMTP** | Envío de emails transaccionales | MEDIA |
| **Sentry** | Monitorización de errores | BAJA |
| **Twilio** | SMS y WhatsApp | BAJA |
| **Signaturit/DocuSign** | Firma digital de contratos | BAJA |

**Acción requerida**: Todas las API keys están en el archivo `.env.production` del servidor. Hacer backup cifrado de este archivo y almacenarlo en el gestor de contraseñas compartido.

---

## 3. STACK TECNOLÓGICO

### 3.1 Tecnologías principales

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js (React) | 14.2.35 |
| **Lenguaje** | TypeScript | 5.2.2 |
| **UI** | Tailwind CSS + Shadcn/ui + Radix | 3.3.3 |
| **Backend** | Next.js API Routes (Node.js) | - |
| **Base de datos** | PostgreSQL + Prisma ORM | 15 / 6.7.0 |
| **Autenticación** | NextAuth.js | 4.24.11 |
| **Pagos** | Stripe | 20.0.0 |
| **IA** | Anthropic Claude | SDK 0.71.2 |
| **Storage** | AWS S3 | SDK v3 |
| **Cache** | Redis (ioredis + Upstash) | - |
| **Colas** | BullMQ | 5.65.1 |
| **Testing** | Vitest + Playwright | 4.0.16 / 1.57.0 |
| **Monitorización** | Sentry + Winston | 10.32.1 / 3.18.3 |

### 3.2 Por qué estas tecnologías

Todas son tecnologías **mainstream** con amplia comunidad, documentación y pool de talento disponible:

- **Next.js/React**: Framework web más popular del mundo. Miles de desarrolladores disponibles.
- **TypeScript**: Estándar de facto para proyectos profesionales JavaScript.
- **PostgreSQL**: Base de datos relacional más robusta y estable del mercado.
- **Prisma**: ORM más popular del ecosistema Node.js. Simplifica enormemente las consultas a BD.
- **Tailwind CSS**: Framework CSS más adoptado. Cualquier frontend dev lo conoce.

**Implicación**: Cualquier empresa de desarrollo web competente puede mantener esta aplicación.

---

## 4. ARQUITECTURA DE LA APLICACIÓN

### 4.1 Diagrama de infraestructura

```
┌──────────────────────────────────────────┐
│            USUARIOS                       │
│                 ↓                         │
│         ┌──────────────┐                 │
│         │  CLOUDFLARE   │  (SSL, CDN)    │
│         └──────────────┘                 │
│                 ↓                         │
│         ┌──────────────┐                 │
│         │    NGINX      │  (Puerto 80)   │
│         └──────────────┘                 │
│                 ↓                         │
│         ┌──────────────┐                 │
│         │     PM2       │  (2 workers)   │
│         └──────────────┘                 │
│            ↓         ↓                    │
│     ┌──────────┐ ┌──────────┐           │
│     │ Next.js  │ │ Next.js  │           │
│     │ Worker 1 │ │ Worker 2 │           │
│     └──────────┘ └──────────┘           │
│            ↓         ↓                    │
│         ┌──────────────┐                 │
│         │  PostgreSQL   │  (Puerto 5432) │
│         └──────────────┘                 │
│                                           │
│  ┌─────────┐ ┌──────┐ ┌──────────────┐  │
│  │  AWS S3  │ │Stripe│ │Anthropic (IA)│  │
│  └─────────┘ └──────┘ └──────────────┘  │
└──────────────────────────────────────────┘
```

### 4.2 Estructura del código

```
inmova-app/
├── app/                    # Páginas y API routes (Next.js App Router)
│   ├── (auth)/            # Páginas de autenticación
│   ├── (protected)/       # Páginas protegidas (dashboard)
│   ├── api/               # 972 endpoints API
│   ├── inversiones/       # Módulo de inversiones
│   ├── admin/             # Panel de administración
│   └── ...                # 567 páginas en total
├── components/            # 333 componentes React reutilizables
│   ├── ui/               # Componentes base (Shadcn)
│   ├── layout/           # Layout, sidebar, header
│   └── ...               # Componentes por funcionalidad
├── lib/                   # 387 servicios backend
│   ├── db.ts             # Conexión a BD
│   ├── auth-options.ts   # Config de autenticación
│   ├── ai-agents/        # Sistema de agentes IA
│   └── ...               # Servicios, utilidades, integraciones
├── prisma/
│   └── schema.prisma     # Schema de BD (16.415 líneas, ~200 modelos)
├── scripts/               # Scripts de mantenimiento y migración
├── data/                  # Datos de importación (escrituras, bancos)
├── public/               # Archivos estáticos
├── .github/workflows/    # CI/CD (GitHub Actions)
├── ecosystem.config.js   # Config PM2
├── nginx.conf            # Config Nginx
└── package.json          # Dependencias y scripts
```

---

## 5. MÓDULOS FUNCIONALES

### 5.1 Módulos implementados

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Gestión de inmuebles** | Producción | Edificios, unidades, contratos, inquilinos |
| **Cobro de alquileres** | Producción | Pagos Stripe, domiciliaciones, recibos |
| **Contabilidad** | Producción | Ingresos, gastos, conciliación bancaria |
| **Mantenimiento** | Producción | Incidencias, proveedores, presupuestos |
| **CRM** | Producción | Leads, pipeline de ventas, actividades |
| **Documentos** | Producción | Repositorio documental, S3, OCR |
| **Comunidades** | Producción | Juntas, votaciones, gastos comunes |
| **Holding/Inversiones** | Producción | Portfolio consolidado, escrituras, rentabilidad |
| **IA (Claude)** | Producción | Valoraciones, chatbot, análisis de brokers |
| **Alquiler comercial** | Producción | Locales, oficinas, naves |
| **Coliving** | Beta | Matching inquilinos, paquetes, eventos |
| **STR/Vacacional** | Beta | Channel manager, housekeeping, precios |
| **Firma digital** | Configurado | Signaturit + DocuSign |
| **Multi-sociedad** | Producción | Vidaro → Viroda + Rovida |

### 5.2 Sociedades parametrizadas

| Sociedad | Edificios | Unidades | Inversión total |
|----------|-----------|----------|----------------|
| **Viroda Inversiones SLU** | 6 | ~63 | ~24M€ |
| **Rovida SLU** | 19 | ~252 | ~23M€ |
| **Vidaro (holding)** | - | - | Consolida ambas |
| **TOTAL** | 25 | ~315 | ~47M€ |

---

## 6. OPERACIONES DE MANTENIMIENTO

### 6.1 Operaciones rutinarias

#### Backup de base de datos (automático, diario a las 2 AM)
```bash
ssh root@157.180.119.236
pg_dump -U inmova_user inmova_production > /var/backups/inmova/backup_$(date +%Y%m%d).sql
```

#### Ver logs de la aplicación
```bash
ssh root@157.180.119.236
pm2 logs inmova-app --lines 100
```

#### Reiniciar la aplicación (sin downtime)
```bash
ssh root@157.180.119.236
cd /opt/inmova-app && pm2 reload inmova-app
```

#### Desplegar nueva versión
```bash
# Opción 1: Automático (push a main dispara GitHub Actions)
git push origin main

# Opción 2: Manual en el servidor
ssh root@157.180.119.236
cd /opt/inmova-app
git pull origin main
npm install --legacy-peer-deps
npx prisma generate
npm run build
pm2 reload inmova-app --update-env
```

#### Health check
```bash
curl https://inmovaapp.com/api/health
# Debe retornar: {"status":"ok","timestamp":"..."}
```

### 6.2 Operaciones de emergencia

#### La app no responde
```bash
ssh root@157.180.119.236
pm2 restart inmova-app
# Si sigue sin responder:
pm2 delete inmova-app
pm2 start ecosystem.config.js --env production
```

#### La BD no conecta
```bash
ssh root@157.180.119.236
systemctl status postgresql
systemctl restart postgresql
```

#### Restaurar backup de BD
```bash
ssh root@157.180.119.236
psql -U inmova_user -d inmova_production < /var/backups/inmova/backup_YYYYMMDD.sql
```

#### Rollback a versión anterior
```bash
ssh root@157.180.119.236
cd /opt/inmova-app
git log --oneline -10  # Ver commits recientes
git reset --hard <commit-anterior>
npm run build
pm2 reload inmova-app
```

---

## 7. CONTRATAR UN EQUIPO DE MANTENIMIENTO

### 7.1 Perfil técnico necesario

Para mantener y evolucionar Inmova, se necesita un equipo con estas competencias:

| Rol | Competencias | Dedicación estimada |
|-----|-------------|-------------------|
| **Full-stack developer** | Next.js, React, TypeScript, PostgreSQL, Prisma | 20-40h/semana |
| **DevOps (opcional)** | Linux, Nginx, PM2, Docker, GitHub Actions | 5-10h/mes |

### 7.2 Dónde encontrar talento

- **Freelancers**: Toptal, Upwork, Malt, Fiverr Pro
- **Agencias España**: Cualquier agencia con experiencia en React/Next.js
- **Búsqueda directa**: LinkedIn ("Next.js developer Spain")
- **Cursor AI**: La propia herramienta con la que se ha construido puede ayudar a mantenerla

### 7.3 Presupuesto estimado

| Opción | Coste mensual | Descripción |
|--------|--------------|-------------|
| **Freelancer senior** | 3.000-5.000€ | 20h/semana, mantenimiento + mejoras |
| **Agencia** | 5.000-10.000€ | Equipo dedicado, SLA |
| **Developer in-house** | 3.500-5.500€ | A tiempo completo, España |
| **Solo mantenimiento** | 500-1.500€ | Solo bugs y actualizaciones críticas |

### 7.4 Onboarding de un nuevo desarrollador

Un desarrollador competente en Next.js puede ponerse productivo en **1-2 semanas** siguiendo estos pasos:

1. Clonar el repositorio: `git clone github.com/dvillagrablanco/inmova-app`
2. Copiar `.env.example` a `.env.local` y configurar variables
3. Instalar dependencias: `npm install`
4. Generar Prisma: `npx prisma generate`
5. Arrancar en desarrollo: `npm run dev`
6. Leer este documento y el archivo `.cursorrules` (reglas de arquitectura)

---

## 8. COSTES DE INFRAESTRUCTURA

### 8.1 Costes mensuales actuales

| Servicio | Coste mensual | Notas |
|----------|--------------|-------|
| **Servidor Hetzner** | ~20€ | VPS 4 CPU, 8GB RAM, 40GB SSD |
| **Cloudflare** | 0€ | Plan gratuito (SSL, CDN, DNS) |
| **AWS S3** | ~5-10€ | Según volumen de documentos |
| **Stripe** | 1.4% + 0.25€/tx | Solo se paga por transacción |
| **Gmail SMTP** | 0€ | 500 emails/día gratis |
| **Anthropic (Claude)** | ~20-50€ | Según uso de IA |
| **Sentry** | 0€ | Plan gratuito (5K eventos/mes) |
| **GitHub** | 0€ | Plan gratuito (repos privados) |
| **Dominio** | ~12€/año | inmovaapp.com |
| **TOTAL** | **~50-100€/mes** | Sin contar Stripe por transacción |

### 8.2 Escalado

Si el número de usuarios crece significativamente:
- **Hetzner**: Upgrade a servidor más potente (40-80€/mes)
- **AWS S3**: Escala automáticamente
- **Redis**: Añadir Upstash o Redis Cloud (~10-30€/mes)
- **BD**: Migrar a PostgreSQL gestionado si necesario (50-100€/mes)

---

## 9. DATOS Y BACKUP

### 9.1 Datos críticos

| Dato | Ubicación | Backup |
|------|-----------|--------|
| **Base de datos** | PostgreSQL en servidor | Backup diario automático |
| **Documentos/imágenes** | AWS S3 | Versionado S3 activado |
| **Código fuente** | GitHub | Distribuido (Git) |
| **Configuración** | .env.production en servidor | Backup manual necesario |
| **Escrituras PDF** | Google Drive + S3 | Doble copia |

### 9.2 Procedimiento de backup completo

```bash
# 1. Backup BD
ssh root@157.180.119.236
pg_dump -U inmova_user inmova_production | gzip > backup_full_$(date +%Y%m%d).sql.gz

# 2. Backup .env
scp root@157.180.119.236:/opt/inmova-app/.env.production ./backup_env_$(date +%Y%m%d)

# 3. Código ya está en GitHub (distribuido)

# 4. Documentos ya están en S3 (con versionado)
```

---

## 10. PROCEDIMIENTO EN CASO DE INCAPACIDAD

### Escenario: El desarrollador principal no está disponible

#### Pasos inmediatos (Día 1)

1. **Verificar que la app funciona**: Abrir https://inmovaapp.com
2. **Si no funciona**: Acceder al servidor SSH y reiniciar PM2
3. **No tocar nada más** si la app funciona correctamente

#### Corto plazo (Semana 1-2)

4. **Acceder a GitHub**: Verificar acceso al repositorio
5. **Acceder a Cloudflare**: Verificar control del dominio
6. **Acceder a Hetzner**: Verificar control del servidor
7. **Acceder a AWS**: Verificar acceso a S3
8. **Acceder a Stripe**: Verificar acceso al panel de pagos
9. **Guardar copia de .env.production**: Descargar del servidor

#### Medio plazo (Semana 2-4)

10. **Contratar desarrollador/agencia**: Ver sección 7
11. **Compartir este documento** con el nuevo equipo
12. **Dar acceso al repositorio** en GitHub
13. **El nuevo equipo hace onboarding** (1-2 semanas)

#### La app seguirá funcionando sin intervención durante meses. Solo necesita:
- Pagar Hetzner (~20€/mes)
- Pagar dominio (~12€/año)
- Que el servidor no se caiga (auto-restart con PM2)

---

## 11. CONTACTOS DE EMERGENCIA TÉCNICOS

| Servicio | Soporte | Contacto |
|----------|---------|----------|
| **Hetzner** | 24/7 | support@hetzner.com |
| **Cloudflare** | 24/7 | Panel web |
| **AWS** | 24/7 | Panel web + chat |
| **Stripe** | 24/7 | support@stripe.com |
| **GitHub** | Business hours | support@github.com |

---

## 12. CHECKLIST DE ACCESOS PARA SOCIOS

Para garantizar la continuidad, los socios deben tener acceso a:

- [ ] **GitHub**: Collaborator con rol Admin en el repositorio
- [ ] **Hetzner**: Acceso al panel de control del servidor
- [ ] **Cloudflare**: Acceso al panel DNS del dominio
- [ ] **AWS**: Usuario IAM con acceso a S3
- [ ] **Stripe**: Acceso al dashboard de pagos
- [ ] **Gestor de contraseñas compartido**: Con todas las credenciales

---

*Este documento debe actualizarse cada vez que haya cambios significativos en la infraestructura o servicios.*

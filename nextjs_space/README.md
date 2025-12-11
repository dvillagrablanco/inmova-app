# INMOVA - Plataforma de Gestión Inmobiliaria Multi-Vertical

## 🏢 Descripción General

INMOVA es una plataforma SaaS completa de gestión inmobiliaria diseñada para profesionales del sector. Ofrece **88 módulos profesionales** organizados en **7 verticales de negocio**, eliminando la fragmentación de software y reduciendo costos operativos hasta en un 70%.

### Verticales Soportadas

- 🏠 **Alquiler Tradicional**: Gestión completa de rentas a largo plazo
- 🏢 **Coliving**: Administración de espacios compartidos y comunidades
- 🏖️ **Short-Term Rental (STR)**: Sincronización con Airbnb, Booking.com y más
- 🏗️ **House Flipping**: Proyectos de renovación y reventa
- 🏗️ **Construcción**: Gestión de proyectos de obra nueva
- 👔 **Servicios Profesionales**: Arquitectura, topografía, valoraciones
- 🏘️ **Administración de Fincas**: Comunidades de propietarios

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 20.x o superior
- PostgreSQL 14.x o superior
- Yarn 1.22.x o superior
- AWS S3 bucket (para almacenamiento de archivos)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd homming_vidaro/nextjs_space

# 2. Instalar dependencias
yarn install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Configurar base de datos
yarn prisma generate
yarn prisma migrate deploy

# 5. Poblar datos iniciales (opcional)
yarn prisma db seed

# 6. Iniciar servidor de desarrollo
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🔧 Configuración

### Variables de Entorno Esenciales

Consulta el archivo `.env.example` para ver todas las variables requeridas.

**Obligatorias para funcionar:**
- `DATABASE_URL`: Conexión a PostgreSQL
- `NEXTAUTH_SECRET`: Secret para NextAuth.js
- `NEXTAUTH_URL`: URL base de la aplicación
- `AWS_BUCKET_NAME`: Bucket S3 para archivos
- `AWS_FOLDER_PREFIX`: Prefijo de carpeta en S3

**Opcionales (funcionalidades adicionales):**
- Stripe: Para pagos en línea
- SendGrid: Para emails transaccionales
- Google Analytics: Para métricas
- Sentry: Para monitoreo de errores

### Usuarios por Defecto

Después de ejecutar el seed:

**Super Administrador:**
- Email: `superadmin@inmova.com`
- Password: `superadmin123`

**Administrador:**
- Email: `admin@inmova.com`
- Password: `admin123`

**Gestor:**
- Email: `gestor@inmova.com`
- Password: `gestor123`

⚠️ **IMPORTANTE:** Cambia estas contraseñas en producción.

## 📁 Estructura del Proyecto

```
homming_vidaro/nextjs_space/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard principal
│   ├── edificios/         # Gestión de edificios
│   ├── unidades/          # Gestión de unidades
│   ├── inquilinos/        # Gestión de inquilinos
│   ├── contratos/         # Gestión de contratos
│   ├── pagos/             # Gestión de pagos
│   └── [...]/             # Otros módulos
├── components/            # Componentes React reutilizables
│   ├── ui/               # Componentes UI base (Shadcn)
│   ├── layout/           # Header, Sidebar, etc.
│   └── forms/            # Formularios especializados
├── lib/                  # Utilidades y servicios
│   ├── db.ts            # Cliente Prisma
│   ├── auth-options.ts  # Configuración NextAuth
│   ├── permissions.ts   # Sistema de permisos
│   └── [services]/      # Servicios de negocio
├── prisma/              # Esquema y migraciones Prisma
│   ├── schema.prisma    # Modelos de datos
│   └── migrations/      # Migraciones de BD
├── public/              # Archivos estáticos
└── scripts/             # Scripts de utilidad
```

## 🗄️ Base de Datos

### Ejecutar Migraciones

```bash
# Desarrollo
yarn prisma migrate dev --name descripcion_cambio

# Producción
yarn prisma migrate deploy

# Ver estado de migraciones
yarn prisma migrate status
```

### Prisma Studio

Para explorar y editar datos:

```bash
yarn prisma studio
# Abre en http://localhost:5555
```

## 🧪 Testing

```bash
# Ejecutar tests
yarn test

# Tests con cobertura
yarn test:coverage

# Linter
yarn lint

# Formateo de código
yarn format
```

## 📦 Despliegue

### Build de Producción

```bash
# Crear build optimizado
yarn build

# Iniciar servidor de producción
yarn start
```

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables en tu plataforma de hosting:

- Vercel: Project Settings > Environment Variables
- AWS: Secrets Manager o Parameter Store
- Docker: Archivo `.env` o variables del contenedor

### Dominio Personalizado

La aplicación está configurada para desplegarse en `inmova.app`. Para cambiar:

1. Actualiza `NEXTAUTH_URL` en `.env`
2. Configura DNS en tu proveedor
3. Actualiza `hostname` en `next.config.js` si usas optimización de imágenes

## 🔐 Seguridad

### Autenticación

- Sistema basado en NextAuth.js v4
- Sesiones con JWT
- Cookies HttpOnly para tokens
- Protección contra timing attacks
- Hash de contraseñas con bcrypt (10 rounds)

### Permisos por Rol

- **Super Admin**: Acceso total al sistema
- **Administrador**: Gestión completa de su empresa
- **Gestor**: Operaciones diarias y reportes
- **Operador**: Tareas específicas asignadas
- **Tenant**: Portal del inquilino

### Content Security Policy

CSP estricto implementado en middleware para prevenir XSS.

### Rate Limiting

Límites de peticiones configurados por ruta para prevenir abuso.

## 🔌 Integraciones de Terceros

### Configuradas (Requieren Credenciales)

- **Stripe**: Pagos recurrentes y únicos
- **Google Analytics**: Métricas y análisis
- **SendGrid**: Emails transaccionales
- **AWS S3**: Almacenamiento de archivos

### Preparadas (Demo Mode)

- **Bankinter Open Banking**: PSD2 para verificación de ingresos
- **Zucchetti**: ERP para contabilidad
- **DocuSign**: Firma digital de contratos
- **ContaSimple, Sage, Holded, A3, Alegra**: Sistemas contables

Ver `DOCS/INTEGRACIONES.md` para guías detalladas.

## 📊 Módulos Principales

### Core (Siempre Activos)
- Dashboard Analytics
- Gestión de Edificios
- Gestión de Unidades
- Gestión de Inquilinos
- Contratos y Pagos
- Mantenimiento
- Calendario Unificado
- Chat con Inquilinos

### Avanzados (Activables)
- Screening de Candidatos con IA
- Valoraciones Automáticas
- Publicaciones Multi-Portal
- Open Banking (PSD2)
- Firma Digital
- IoT y Smart Buildings
- ESG y Sostenibilidad
- Marketplace de Servicios
- Blockchain y Tokenización
- Y más de 70 módulos adicionales...

Ver lista completa en `/admin/modulos`

## 🌐 Internacionalización

Actualmente soporta:
- 🇪🇸 Español (por defecto)
- 🇬🇧 Inglés (parcial)

Para agregar idiomas, ver `lib/i18n-config.ts`

## 🎨 Personalización (White Label)

INMOVA soporta personalización completa de marca:

1. Accede a `/admin/personalizacion`
2. Configura:
   - Nombre de la aplicación
   - Logos y favicon
   - Colores primarios/secundarios
   - Tipografías
   - Metadata SEO

Los cambios se aplican en tiempo real mediante CSS variables.

## 📱 Progressive Web App (PWA)

- Instalable en escritorio y móvil
- Service Worker para cache
- Notificaciones push (requiere configuración)
- Funciona offline (limitado)

## 🐛 Troubleshooting

### Error: "DATABASE_URL not found"

```bash
# Verifica que .env existe y tiene DATABASE_URL
cat .env | grep DATABASE_URL

# Si no existe, créalo
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/inmova"' > .env
```

### Error: "Module not found" después de actualizar

```bash
# Limpia cache y reinstala
rm -rf .next node_modules
yarn install
```

### Prisma: "Migration conflict"

```bash
# Resetea base de datos (⚠️ BORRA DATOS)
yarn prisma migrate reset

# O aplica manualmente
yarn prisma migrate resolve --applied <migration_name>
```

### Build falla por TypeScript

```bash
# Modo temporal: ignora errores TS (no recomendado)
# Edita next.config.js:
typescript: { ignoreBuildErrors: true }

# Solución correcta: corrige errores
yarn tsc --noEmit
```

## 🤝 Contribuir

### Flujo de Trabajo

1. Crea una rama desde `main`
2. Realiza cambios y commits descriptivos
3. Ejecuta tests y linter
4. Crea Pull Request con descripción detallada
5. Espera revisión del equipo

### Convenciones de Código

- TypeScript estricto
- ESLint + Prettier configurados
- Componentes funcionales con hooks
- Nombres en español para UI visible al usuario
- Nombres en inglés para código interno

## 📞 Soporte

### Documentación

- Guías de integración: `/DOCS/INTEGRACIONES.md`
- Mejoras Super Admin: `/MEJORAS_SUPERADMIN.md`
- Módulo Room Rental: `/MODELO_ALQUILER_HABITACIONES.md`

### Contacto

- 📧 Email: soporte@inmova.com
- 📧 Técnico: dev@inmova.com
- 🌐 Web: https://inmova.app
- 📱 Teléfono: +34 XXX XXX XXX

### Empresa

**Enxames Investments SL**
- Desarrollador y propietario de INMOVA
- Equipo de ingenieros especializados en PropTech

## 📄 Licencia

Propietario © 2026 Enxames Investments SL. Todos los derechos reservados.

---

**Última actualización:** Enero 2026  
**Versión:** 2.0.0  
**Hostname actual:** inmova.app

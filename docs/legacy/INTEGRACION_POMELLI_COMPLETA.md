# 🚀 INTEGRACIÓN POMELLI - GESTIÓN DE REDES SOCIALES

**Fecha:** 26 Diciembre 2025  
**Sistema:** Gestión completa de LinkedIn, Instagram y X (Twitter)  
**Plataforma:** Pomelli Social Media Management

---

## ✅ CARACTERÍSTICAS IMPLEMENTADAS

### **1. Gestión Completa de Redes Sociales**

**Plataformas soportadas:**
- ✅ **LinkedIn** - Red profesional
- ✅ **Instagram** - Red visual
- ✅ **X (Twitter)** - Microblogging
- 🔄 **Facebook** - (Preparado para futuro)

**Funcionalidades:**
- ✅ Conectar/desconectar perfiles
- ✅ Publicación multi-plataforma simultánea
- ✅ Programación de publicaciones
- ✅ Gestión de contenido multimedia
- ✅ Analytics en tiempo real
- ✅ Dashboard unificado

---

## 📦 ARCHIVOS CREADOS

### **1. Backend - Servicios**

#### **`lib/pomelli-integration.ts`** (520 líneas)

**Clases principales:**

```typescript
// Cliente de API de Pomelli
class PomelliClient {
  - authenticate(): Promise<string>
  - connectSocialProfile()
  - disconnectSocialProfile()
  - createPost()
  - updatePost()
  - deletePost()
  - getPostAnalytics()
  - getConnectedProfiles()
  - publishNow()
  - uploadMedia()
  - getAuthorizationUrl()
}

// Servicio de integración
class PomelliService {
  - initializeSocialProfiles()
  - handleOAuthCallback()
  - createMultiPlatformPost()
  - getConsolidatedAnalytics()
}
```

**Tipos e Interfaces:**

```typescript
type SocialPlatform = 'linkedin' | 'instagram' | 'x' | 'facebook';
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';
type ContentType = 'text' | 'image' | 'video' | 'carousel' | 'story';

interface SocialProfile {
  id: string;
  platform: SocialPlatform;
  profileId: string;
  profileName: string;
  profileUsername: string;
  accessToken?: string;
  // ... más propiedades
}

interface SocialPost {
  id: string;
  companyId: string;
  platforms: SocialPlatform[];
  content: string;
  mediaUrls?: string[];
  contentType: ContentType;
  status: PostStatus;
  analytics?: PostAnalytics;
  // ... más propiedades
}
```

---

### **2. Backend - API Endpoints**

#### **`app/api/pomelli/config/route.ts`**

**Endpoints:**
- `GET /api/pomelli/config` - Obtener configuración
- `POST /api/pomelli/config` - Guardar configuración
- `DELETE /api/pomelli/config` - Eliminar configuración

**Funcionalidad:**
- Validación de credenciales API
- Gestión de configuración por empresa
- Seguridad basada en roles

---

#### **`app/api/pomelli/profiles/connect/route.ts`**

**Endpoints:**
- `POST /api/pomelli/profiles/connect` - Iniciar conexión OAuth

**Proceso:**
1. Usuario solicita conectar plataforma
2. Sistema genera URL de autorización
3. Redirige a plataforma social
4. Callback maneja autorización

---

#### **`app/api/pomelli/callback/[platform]/route.ts`**

**Endpoints:**
- `GET /api/pomelli/callback/linkedin`
- `GET /api/pomelli/callback/instagram`
- `GET /api/pomelli/callback/x`

**Funcionalidad:**
- Recibe código de autorización OAuth
- Intercambia por tokens de acceso
- Guarda perfil en base de datos
- Redirige al dashboard

---

#### **`app/api/pomelli/posts/route.ts`**

**Endpoints:**
- `GET /api/pomelli/posts` - Listar publicaciones
- `POST /api/pomelli/posts` - Crear publicación

**Parámetros GET:**
- `status` - Filtrar por estado
- `platform` - Filtrar por plataforma
- `limit` - Límite de resultados
- `offset` - Paginación

**Body POST:**
```json
{
  "content": "Texto de la publicación",
  "contentType": "text|image|video|carousel",
  "platforms": ["linkedin", "instagram", "x"],
  "mediaUrls": ["url1", "url2"],
  "scheduledAt": "2025-12-27T10:00:00Z",
  "publishNow": false
}
```

---

#### **`app/api/pomelli/posts/[postId]/route.ts`**

**Endpoints:**
- `GET /api/pomelli/posts/[postId]` - Detalles de publicación
- `PATCH /api/pomelli/posts/[postId]` - Actualizar publicación
- `DELETE /api/pomelli/posts/[postId]` - Eliminar publicación

**Restricciones:**
- Solo se pueden editar posts en `draft` o `scheduled`
- Posts `published` no se pueden modificar

---

#### **`app/api/pomelli/analytics/route.ts`**

**Endpoints:**
- `GET /api/pomelli/analytics` - Métricas consolidadas

**Parámetros:**
- `platform` - Filtrar por plataforma
- `dateFrom` - Fecha inicio
- `dateTo` - Fecha fin

**Respuesta:**
```json
{
  "totals": {
    "impressions": 50000,
    "reach": 30000,
    "likes": 1500,
    "comments": 200,
    "shares": 100,
    "clicks": 500,
    "postsCount": 25,
    "avgEngagementRate": 4.5
  },
  "byPlatform": {
    "linkedin": { ... },
    "instagram": { ... },
    "x": { ... }
  },
  "profiles": [ ... ]
}
```

---

### **3. Base de Datos - Modelos Prisma**

#### **Modelos agregados a `schema.prisma`:**

```prisma
model PomelliConfig {
  id          String   @id @default(cuid())
  companyId   String   @unique
  apiKey      String
  apiSecret   String   // Encriptado
  webhookUrl  String?
  enabled     Boolean  @default(true)
  lastSyncAt  DateTime?
  
  company     Company  @relation(...)
  profiles    SocialProfile[]
  posts       SocialPost[]
}

model SocialProfile {
  id               String   @id @default(cuid())
  companyId        String
  pomelliConfigId  String
  platform         String   // linkedin, instagram, x
  profileId        String
  profileName      String
  profileUsername  String
  accessToken      String?  @db.Text
  refreshToken     String?  @db.Text
  tokenExpiresAt   DateTime?
  isActive         Boolean  @default(true)
  isConnected      Boolean  @default(true)
  followersCount   Int      @default(0)
  
  @@unique([companyId, platform])
}

model SocialPost {
  id              String   @id @default(cuid())
  companyId       String
  pomelliConfigId String
  userId          String
  content         String   @db.Text
  contentType     String
  mediaUrls       String[] @default([])
  platforms       String[] @default([])
  status          String   // draft, scheduled, published, failed
  scheduledAt     DateTime?
  publishedAt     DateTime?
  pomelliPostId   String?
  
  // Analytics
  impressions     Int      @default(0)
  reach           Int      @default(0)
  likes           Int      @default(0)
  comments        Int      @default(0)
  shares          Int      @default(0)
  clicks          Int      @default(0)
  engagementRate  Float    @default(0)
}

model SocialAnalytics {
  id            String   @id @default(cuid())
  companyId     String
  platform      String
  date          DateTime
  periodType    String   // daily, weekly, monthly
  impressions   Int      @default(0)
  reach         Int      @default(0)
  likes         Int      @default(0)
  comments      Int      @default(0)
  shares        Int      @default(0)
  clicks        Int      @default(0)
  followers     Int      @default(0)
  engagement    Float    @default(0)
  growthRate    Float    @default(0)
  
  @@unique([companyId, platform, date, periodType])
}
```

---

### **4. Frontend - Dashboard UI**

#### **`app/(protected)/dashboard/social-media/page.tsx`** (600+ líneas)

**Tabs principales:**

1. **Perfiles**
   - Ver perfiles conectados
   - Conectar nuevas plataformas
   - Ver estadísticas de cada perfil

2. **Nueva Publicación**
   - Crear contenido multi-plataforma
   - Programar publicaciones
   - Previsualización en tiempo real
   - Selección de plataformas

3. **Publicaciones**
   - Historial de publicaciones
   - Analytics por publicación
   - Filtros por estado/plataforma
   - Edición/eliminación

**Analytics Cards:**
- Impresiones totales
- Me Gusta
- Comentarios
- Engagement rate

**Componentes UI:**
- Cards para cada red social
- Badges de estado
- Iconos de plataformas
- Formularios de creación
- Gráficos de métricas

---

## 🔧 CONFIGURACIÓN

### **1. Variables de Entorno**

Agregar a `.env` o configurar en Vercel:

```env
# Pomelli API Credentials
POMELLI_API_KEY=tu_api_key_aqui
POMELLI_API_SECRET=tu_api_secret_aqui
POMELLI_WEBHOOK_URL=https://tu-dominio.com/api/pomelli/webhook

# App URL (para OAuth callbacks)
NEXT_PUBLIC_URL=https://inmova.app
```

---

### **2. Migración de Base de Datos**

```bash
# Generar migración
npx prisma migrate dev --name add_pomelli_integration

# O aplicar directamente
npx prisma db push
```

**SQL Manual (si necesario):**

```sql
-- Tabla de configuración
CREATE TABLE pomelli_configs (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(255) NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500),
  enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de perfiles sociales
CREATE TABLE social_profiles (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  pomelli_config_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  profile_id VARCHAR(255) NOT NULL,
  profile_name VARCHAR(255) NOT NULL,
  profile_username VARCHAR(255) NOT NULL,
  profile_url VARCHAR(500),
  profile_image_url VARCHAR(500),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_connected BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(company_id, platform)
);

-- Tabla de publicaciones
CREATE TABLE social_posts (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  pomelli_config_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  media_urls JSON DEFAULT '[]',
  platforms JSON DEFAULT '[]',
  status VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  pomelli_post_id VARCHAR(255),
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  clicks INT DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_attempt_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de analytics
CREATE TABLE social_analytics (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  period_type VARCHAR(50) NOT NULL,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  clicks INT DEFAULT 0,
  followers INT DEFAULT 0,
  engagement FLOAT DEFAULT 0,
  growth_rate FLOAT DEFAULT 0,
  best_post_time VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(company_id, platform, date, period_type)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_social_profiles_company ON social_profiles(company_id);
CREATE INDEX idx_social_profiles_platform ON social_profiles(platform);
CREATE INDEX idx_social_posts_company ON social_posts(company_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at);
CREATE INDEX idx_social_analytics_company ON social_analytics(company_id);
CREATE INDEX idx_social_analytics_date ON social_analytics(date);
```

---

## 🚀 FLUJO DE USO

### **Paso 1: Configurar Pomelli**

1. Obtener credenciales de API en Pomelli Dashboard
2. Ir a `/dashboard/social-media`
3. Configurar API Key y API Secret
4. Guardar configuración

---

### **Paso 2: Conectar Redes Sociales**

1. En tab "Perfiles", hacer clic en "Conectar LinkedIn"
2. Autorizar acceso en LinkedIn
3. Callback automático guarda perfil
4. Repetir para Instagram y X

---

### **Paso 3: Crear Publicación**

1. Ir a tab "Nueva Publicación"
2. Escribir contenido
3. Seleccionar plataformas (LinkedIn, Instagram, X)
4. (Opcional) Subir imágenes/videos
5. (Opcional) Programar fecha/hora
6. Publicar ahora o programar

---

### **Paso 4: Ver Analytics**

1. Dashboard muestra métricas en tiempo real
2. Tab "Publicaciones" muestra historial
3. Cada publicación tiene métricas detalladas
4. Analytics consolidados por plataforma

---

## 📊 MÉTRICAS Y ANALYTICS

### **Métricas por Publicación:**

- **Impressions** - Veces que se mostró
- **Reach** - Usuarios únicos alcanzados
- **Likes** - Me gusta
- **Comments** - Comentarios
- **Shares** - Compartidos
- **Clicks** - Clics en enlaces
- **Engagement Rate** - % de interacción

---

### **Analytics Consolidados:**

```typescript
{
  totals: {
    impressions: 50000,      // Total de impresiones
    reach: 30000,            // Alcance total
    likes: 1500,             // Total me gusta
    comments: 200,           // Total comentarios
    shares: 100,             // Total compartidos
    clicks: 500,             // Total clics
    postsCount: 25,          // Total publicaciones
    avgEngagementRate: 4.5   // % promedio engagement
  },
  byPlatform: {
    linkedin: { ... },       // Métricas de LinkedIn
    instagram: { ... },      // Métricas de Instagram
    x: { ... }               // Métricas de X
  },
  profiles: [
    {
      platform: 'linkedin',
      followersCount: 5000,
      postsCount: 100,
      lastSyncAt: '2025-12-26'
    }
  ]
}
```

---

## 🔐 SEGURIDAD

### **1. Autenticación y Autorización**

- OAuth 2.0 para conexión de redes sociales
- Tokens encriptados en base de datos
- Refresh tokens automáticos
- Roles: Solo `administrador` y `super_admin` pueden configurar

---

### **2. Validación de Datos**

- Validación de credenciales API
- Verificación de perfiles conectados
- Límites de caracteres por plataforma
- Sanitización de contenido

---

### **3. Rate Limiting**

- Respeto a límites de API de cada plataforma
- Cola de publicaciones programadas
- Retry automático en fallos (máx 3 intentos)

---

## 🎯 CASOS DE USO

### **1. Marketing Inmobiliario**

```typescript
// Publicar nueva propiedad en todas las redes
const post = {
  content: `
    🏠 Nueva propiedad disponible en Madrid
    
    📍 Ubicación: Chamberí
    💰 Precio: €450,000
    🛏️ 3 habitaciones, 2 baños
    📏 120 m²
    
    ¡Visita nuestro sitio web para más detalles!
    #PropTech #RealEstate #Madrid
  `,
  platforms: ['linkedin', 'instagram', 'x'],
  mediaUrls: ['https://...image1.jpg', 'https://...image2.jpg'],
  contentType: 'carousel',
};
```

---

### **2. Actualizaciones de Empresa**

```typescript
// Programar anuncio de nueva funcionalidad
const post = {
  content: `
    🚀 Nueva actualización de INMOVA
    
    Ahora puedes gestionar tus propiedades desde el móvil
    con nuestra app mejorada!
    
    #PropTech #Innovation #RealEstate
  `,
  platforms: ['linkedin', 'x'],
  scheduledAt: '2025-12-30T09:00:00Z', // Lunes 9 AM
};
```

---

### **3. Engagement con Clientes**

```typescript
// Post interactivo para Instagram
const post = {
  content: `
    💬 ¿Cuál es tu barrio favorito de Madrid?
    
    Coméntanos abajo y cuéntanos por qué! 👇
    
    #Madrid #RealEstate #Community
  `,
  platforms: ['instagram'],
  contentType: 'image',
  mediaUrls: ['https://...madrid-map.jpg'],
};
```

---

## 📈 ROADMAP FUTURO

### **Fase 1 - Completado** ✅
- Integración básica con Pomelli
- Conexión de LinkedIn, Instagram, X
- Publicación multi-plataforma
- Analytics básicos
- Dashboard UI

### **Fase 2 - Próxima** 🔄
- [ ] AI para generación de contenido
- [ ] Sugerencias de hashtags inteligentes
- [ ] Mejor hora para publicar (ML)
- [ ] Templates de publicaciones
- [ ] Biblioteca de medios

### **Fase 3 - Futuro** 📅
- [ ] Integración con Facebook
- [ ] Stories automatizadas
- [ ] Respuestas automáticas a comentarios
- [ ] Análisis de sentimiento
- [ ] Competencia monitoring

---

## 🐛 TROUBLESHOOTING

### **Error: "Pomelli not configured"**

**Solución:**
1. Verificar que `POMELLI_API_KEY` y `POMELLI_API_SECRET` están en `.env`
2. Reiniciar servidor Next.js
3. Verificar credenciales en Pomelli Dashboard

---

### **Error: "Failed to connect profile"**

**Solución:**
1. Verificar que callback URL está registrado en Pomelli
2. URL debe ser: `https://tu-dominio.com/api/pomelli/callback/[platform]`
3. Verificar que usuario tiene permisos en la red social
4. Revisar logs de Pomelli Dashboard

---

### **Posts no se publican**

**Solución:**
1. Verificar que perfiles están conectados (`isConnected: true`)
2. Verificar tokens no expirados
3. Verificar límites de API no excedidos
4. Revisar logs de errores en base de datos (`errorMessage`)

---

## 📞 SOPORTE

### **Recursos:**
- **Documentación Pomelli:** https://docs.pomelli.com
- **API Reference:** https://api.pomelli.com/docs
- **Support:** support@pomelli.com

### **Logs:**
- Todos los eventos se registran con `logger`
- Ver logs en consola o sistema de logging configurado
- Tabla `social_posts` tiene campo `errorMessage` para debugging

---

## ✅ CHECKLIST DE ACTIVACIÓN

- [ ] Variables de entorno configuradas
- [ ] Migración de base de datos ejecutada
- [ ] Credenciales de Pomelli verificadas
- [ ] LinkedIn conectado
- [ ] Instagram conectado
- [ ] X (Twitter) conectado
- [ ] Publicación de prueba exitosa
- [ ] Analytics funcionando
- [ ] Dashboard accesible

---

**¡Integración Pomelli lista para usar!** 🚀

Ahora puedes gestionar todas tus redes sociales desde un solo lugar en INMOVA.

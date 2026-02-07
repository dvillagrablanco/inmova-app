# 🚀 Guía de Configuración de Redes Sociales

## 📚 Índice
- [Introducción](#introducción)
- [Configuración de Meta (Facebook/Instagram)](#configuración-de-meta-facebookinstagram)
- [Configuración de LinkedIn](#configuración-de-linkedin)
- [Configuración de Twitter/X](#configuración-de-twitterx)
- [Configuración de WhatsApp Business](#configuración-de-whatsapp-business)
- [Variables de Entorno](#variables-de-entorno)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Publicación Automática](#publicación-automática)
- [FAQ y Troubleshooting](#faq-y-troubleshooting)

---

## 🎯 Introducción

INMOVA incluye un sistema completo de automatización de redes sociales que permite:

✅ **Publicación automática** cuando se crea una propiedad  
✅ **Programación de posts** en múltiples plataformas  
✅ **Panel de administración** unificado  
✅ **Métricas y analíticas** en tiempo real  
✅ **Generación de contenido inteligente** con IA  

**Plataformas soportadas:**
- Facebook
- Instagram
- LinkedIn
- Twitter/X
- WhatsApp Business

---

## 👦 Configuración de Meta (Facebook/Instagram)

### Paso 1: Crear una App de Facebook

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Haz clic en "My Apps" → "Create App"
3. Selecciona "Business" como tipo de app
4. Completa la información:
   - **Display Name**: INMOVA Social Media
   - **App Contact Email**: tu-email@empresa.com
   - **Business Account**: Selecciona tu cuenta de negocio

### Paso 2: Configurar productos

1. En el dashboard de tu app, agrega estos productos:
   - **Facebook Login**
   - **Instagram Basic Display** (para Instagram)
   - **Instagram Graph API** (para publicaciones)

### Paso 3: Configurar permisos

#### Para Facebook:
- `pages_manage_posts`
- `pages_read_engagement`
- `pages_show_list`
- `business_management`

#### Para Instagram:
- `instagram_basic`
- `instagram_content_publish`
- `instagram_manage_comments`
- `instagram_manage_insights`

### Paso 4: Configurar OAuth Redirect URI

1. En "Facebook Login" → "Settings"
2. Agrega tu redirect URI:
   ```
   https://tu-dominio.com/api/auth/facebook/callback
   ```

### Paso 5: Obtener credenciales

1. Ve a "Settings" → "Basic"
2. Copia:
   - **App ID**
   - **App Secret**

### Paso 6: Solicitar revisión de permisos

1. Ve a "App Review" → "Permissions and Features"
2. Solicita revisión para los permisos avanzados
3. Proporciona:
   - **Casos de uso detallados**
   - **Videos de demostración**
   - **Políticas de privacidad**

💡 **Nota**: En modo desarrollo, puedes probar con tu cuenta personal sin revisión.

### Paso 7: Conectar Página de Facebook

1. En tu dashboard de Facebook, ve a la página que quieres conectar
2. Ve a "Settings" → "Facebook Login"
3. Genera un **Page Access Token**
4. Guarda el token y el **Page ID**

### Paso 8: Conectar cuenta de Instagram Business

1. Asegúrate de que tu cuenta de Instagram sea de tipo **Business** o **Creator**
2. Conecta la cuenta de Instagram a tu Página de Facebook
3. En Graph API Explorer, obtén el **Instagram Business Account ID**:
   ```
   GET /{page-id}?fields=instagram_business_account
   ```

---

## 💼 Configuración de LinkedIn

### Paso 1: Crear una App de LinkedIn

1. Ve a [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Haz clic en "Create app"
3. Completa la información:
   - **App name**: INMOVA Social Media
   - **LinkedIn Page**: Selecciona tu página de empresa
   - **Privacy policy URL**: https://tu-dominio.com/privacy
   - **App logo**: Logo de tu empresa (300x300px mínimo)

### Paso 2: Configurar productos

1. En "Products", solicita acceso a:
   - **Share on LinkedIn**
   - **Sign In with LinkedIn**
   - **Marketing Developer Platform** (para estadísticas avanzadas)

### Paso 3: Configurar permisos (Scopes)

Scopes necesarios:
- `r_liteprofile` - Información básica del perfil
- `r_emailaddress` - Email del usuario
- `w_member_social` - Publicar en nombre del usuario
- `w_organization_social` - Publicar en páginas de empresa
- `r_organization_social` - Leer contenido de la organización

### Paso 4: Configurar OAuth 2.0

1. En "Auth", agrega tus redirect URLs:
   ```
   https://tu-dominio.com/api/auth/linkedin/callback
   ```

### Paso 5: Obtener credenciales

1. Ve a "Auth"
2. Copia:
   - **Client ID**
   - **Client Secret**

### Paso 6: Obtener Organization ID

1. En LinkedIn, ve a tu página de empresa
2. La URL será: `https://www.linkedin.com/company/[ID]`
3. El número después de `/company/` es tu **Organization ID**

O usa la API:
```bash
GET https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee
```

---

## 🐦 Configuración de Twitter/X

### Paso 1: Crear cuenta de desarrollador

1. Ve a [Twitter Developer Portal](https://developer.twitter.com/)
2. Solicita acceso como desarrollador
3. Completa el formulario explicando tu caso de uso

### Paso 2: Crear una App

1. En el dashboard, crea un nuevo proyecto
2. Crea una app dentro del proyecto
3. Configura:
   - **App name**: INMOVA Social Media
   - **Description**: Sistema de gestión inmobiliaria

### Paso 3: Habilitar OAuth 2.0

1. En "User authentication settings"
2. Habilita **OAuth 2.0**
3. Permisos:
   - ☑️ Read
   - ☑️ Write
   - ☑️ Direct Messages (opcional)

### Paso 4: Configurar Callback URL

```
https://tu-dominio.com/api/auth/twitter/callback
```

### Paso 5: Obtener credenciales

1. Ve a "Keys and tokens"
2. Guarda:
   - **API Key**
   - **API Secret Key**
   - **Access Token**
   - **Access Token Secret**
   - **Bearer Token**

---

## 📱 Configuración de WhatsApp Business

### Paso 1: Crear cuenta de WhatsApp Business

1. Ve a [WhatsApp Business Platform](https://business.facebook.com/)
2. Crea o selecciona tu cuenta de negocio
3. Agrega WhatsApp como producto

### Paso 2: Configurar número de teléfono

1. Agrega y verifica un número de teléfono
2. Guarda el **Phone Number ID**

### Paso 3: Crear App en Meta

1. Igual que para Facebook, crea una app en Facebook Developers
2. Agrega el producto "WhatsApp"

### Paso 4: Configurar webhooks

1. En "WhatsApp" → "Configuration"
2. Configura el webhook URL:
   ```
   https://tu-dominio.com/api/webhooks/whatsapp
   ```
3. Suscríbete a eventos:
   - `messages`
   - `message_status`

### Paso 5: Obtener credenciales

1. **Business Account ID**
2. **Phone Number ID**
3. **Access Token**

---

## ⚙️ Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# ==========================================
# META (Facebook / Instagram)
# ==========================================
META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret
META_PAGE_ID=tu_page_id
META_PAGE_ACCESS_TOKEN=tu_page_access_token
META_INSTAGRAM_BUSINESS_ACCOUNT_ID=tu_instagram_id

# ==========================================
# LinkedIn
# ==========================================
LINKEDIN_CLIENT_ID=tu_client_id
LINKEDIN_CLIENT_SECRET=tu_client_secret
LINKEDIN_ORGANIZATION_ID=tu_organization_id

# ==========================================
# Twitter/X
# ==========================================
TWITTER_API_KEY=tu_api_key
TWITTER_API_SECRET=tu_api_secret
TWITTER_ACCESS_TOKEN=tu_access_token
TWITTER_ACCESS_TOKEN_SECRET=tu_access_token_secret
TWITTER_BEARER_TOKEN=tu_bearer_token

# ==========================================
# WhatsApp Business
# ==========================================
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token

# ==========================================
# URLs de Callback (ajustar según dominio)
# ==========================================
NEXTAUTH_URL=https://tu-dominio.com
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## 🏛️ Arquitectura del Sistema

### Flujo de Publicación Automática

```
┌─────────────────────┐
│  Usuario crea     │
│  Edificio/Unidad  │
└────────┬────────────┘
         │
         ↓ Webhook se dispara
         │
┌────────┴────────────────────────┐
│  autoPublishProperty()        │
│  - Genera contenido automático │
│  - Selecciona cuentas activas  │
│2  - Aplica filtros de plataforma│
└────────┬────────────────────────┘
         │
         ↓ Crea post en DB
         │
┌────────┴────────────────────────┐
│  Post programado (5-10 min)   │
└────────┬────────────────────────┘
         │
         ↓ Scheduler ejecuta
         │
┌────────┴────────────────────────┐
│  API de Redes Sociales        │
│  - Facebook Graph API         │
│  - LinkedIn API               │
│  - Twitter API v2             │
└────────┬────────────────────────┘
         │
         ↓ Publicado
         │
┌────────┴────────────────────────┐
│  Métricas actualizadas        │
│  - Alcance, Likes, Shares     │
└─────────────────────────────────┘
```

### Componentes Principales

1. **`lib/social-media-service.ts`**
   - Lógica de negocio
   - Generación de contenido
   - Publicación automática
   - Gestión de cuentas

2. **`app/api/social-media/`**
   - Endpoints REST
   - Autenticación OAuth
   - Webhooks

3. **`app/redes-sociales/page.tsx`**
   - Panel de administración
   - Visualización de posts
   - Programación manual

4. **Base de Datos (Prisma)**
   - `SocialMediaAccount` - Cuentas conectadas
   - `SocialMediaPost` - Posts publicados/programados

---

## 🤖 Publicación Automática

### Cómo funciona

Cuando se crea un **edificio** o **unidad**, el sistema:

1. ✅ Detecta la creación via webhook
2. ✅ Genera contenido optimizado automáticamente
3. ✅ Programa la publicación (5-10 minutos después)
4. ✅ Publica en todas las cuentas conectadas

### Contenido Generado

#### Para Edificios:
```
🏢 ¡Nuevo edificio incorporado a nuestra cartera!

📍 [Nombre del Edificio]
[Dirección]

Gestionado con tecnología INMOVA para máxima eficiencia operativa.

#NuevaPropiedad #Inmobiliaria #InmovaApp #PropTech
```

#### Para Unidades:
```
🏠 ¡Nueva propiedad disponible!

[Nombre de la Unidad]
🛌 [Número de habitaciones] habitaciones
📏 [Superficie] m²
💰 [Precio]€/mes

[Dirección]

Contáctanos para más información.

#PropiedadDisponible #Alquiler #InmovaApp
```

### Personalización

Puedes personalizar la generación de contenido en:
```typescript
// lib/social-media-service.ts
export async function generatePropertyPostContent(propertyData) {
  // Modifica aquí el template de mensajes
}
```

### Configuración de Delays

```typescript
// app/api/buildings/route.ts
await autoPublishProperty(
  companyId,
  session.user.id!,
  propertyData,
  {
    scheduleMinutesDelay: 5, // Cambiar delay aquí
    platforms: ['facebook', 'linkedin'] // Filtrar plataformas (opcional)
  }
);
```

---

## ❓ FAQ y Troubleshooting

### ¿Por qué no se publican automáticamente mis propiedades?

✅ **Verifica que:**
1. Tienes al menos una cuenta conectada
2. Las credenciales de API están configuradas en `.env`
3. Los webhooks están activos
4. El scheduler está ejecutándose

### ¿Cómo ejecutar el scheduler manualmente?

```typescript
// Llama a este endpoint
POST /api/social-media/scheduler/run
```

### Error: "Token expired"

**Solución:** Los tokens de acceso tienen expiración. Necesitas:
1. Implementar refresh tokens
2. Renovar los tokens periódicamente
3. Manejar errores 401 y solicitar reautenticación

### Error: "Permissions not granted"

**Solución:** 
1. Revisa que tu app tenga los permisos necesarios
2. Para Facebook/Instagram, solicita revisión de permisos avanzados
3. Verifica que el usuario haya aceptado todos los scopes en OAuth

### ¿Cómo desactivar la publicación automática?

**Opción 1:** Desconectar todas las cuentas desde el panel

**Opción 2:** Comentar el webhook en los archivos:
- `app/api/buildings/route.ts`
- `app/api/units/route.ts`

### ¿Cómo probar sin publicar realmente?

 El sistema actual usa modo DEMO que simula publicaciones.  
 Para habilitar publicaciones reales, implementa las llamadas a las APIs en `lib/social-media-service.ts`

### Limitaciones de Rate Limiting

Cada plataforma tiene límites:

| Plataforma | Límite de Rate       |
|------------|----------------------|
| Facebook   | 200 llamadas/hora    |
| Instagram  | 200 llamadas/hora    |
| LinkedIn   | 100 llamadas/día    |
| Twitter    | 300 posts/3 horas    |
| WhatsApp   | 1,000 mensajes/día  |

Implementa colas y retry logic para manejar estos límites.

---

## 📦 Siguientes Pasos

1. ☑️ Configurar cuentas de desarrollador
2. ☑️ Obtener credenciales de API
3. ☑️ Agregar variables de entorno
4. ☑️ Conectar cuentas desde el panel
5. ☑️ Probar publicación manual
6. ☑️ Verificar publicación automática
7. ☑️ Monitorear métricas

---

## 📞 Soporte

Si necesitas ayuda:

- 📧 Email: soporte@inmova.app
- 📚 Documentación: https://docs.inmova.app
- 👥 Comunidad: https://community.inmova.app

---

🚀 **¡Listo! Tu sistema de automatización de redes sociales está configurado.**

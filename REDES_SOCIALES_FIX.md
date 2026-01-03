# 🔧 Fix: Módulo de Gestión de Redes Sociales

**Fecha:** 3 de Enero 2026  
**Problema:** Link roto en el sidebar  

---

## 🐛 PROBLEMA DETECTADO

### Síntoma
El usuario pregunta: "¿Dónde está el módulo de gestión de redes sociales en superadministrador?"

### Causa Raíz
El sidebar apuntaba a una ruta que NO existe:
- **Sidebar:** `/redes-sociales` ❌
- **Página Real:** `/dashboard/social-media` ✅

### Resultado
- Al hacer click en "Redes Sociales" → 404 Page Not Found
- La página SÍ existe pero era inaccesible desde el sidebar

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Cambio en Sidebar

**Antes:**
```typescript
{
  name: 'Redes Sociales',
  href: '/redes-sociales',  // ❌ NO existe
  icon: Share2,
  roles: ['super_admin', 'administrador', 'gestor'],
}
```

**Después:**
```typescript
{
  name: 'Gestión de Redes Sociales',
  href: '/dashboard/social-media',  // ✅ Ruta correcta
  icon: Share2,
  roles: ['super_admin', 'administrador', 'gestor'],
}
```

### Mapeo de Módulos Actualizado

```typescript
ROUTE_TO_MODULE: {
  '/redes-sociales': 'redes_sociales',  // Old (legacy)
  '/dashboard/social-media': 'redes_sociales',  // ✅ Nuevo (correcto)
}
```

---

## 📋 FEATURES DE LA PÁGINA

### `/dashboard/social-media` - Gestión Completa de RRSS

La página incluye integración con **Pomelli** para:

#### 1. 📱 Conectar Perfiles
- LinkedIn
- Instagram
- X (Twitter)

#### 2. ✍️ Crear Publicaciones
- Publicar en múltiples redes simultáneamente
- Programar publicaciones futuras
- Adjuntar imágenes
- Vista previa del contenido

#### 3. 📊 Analytics Consolidados
- **Impresiones** totales
- **Me Gusta** agregados
- **Comentarios** totales
- **Engagement Rate** promedio

#### 4. 📈 Historial de Publicaciones
- Ver todas las publicaciones
- Estado: Published, Scheduled, Draft, Failed
- Métricas por publicación
- Filtrar por plataforma

---

## 🎯 UBICACIÓN EN EL SIDEBAR

### Para Super Administrador:

1. Abrir sidebar
2. Buscar sección: **💬 Comunicaciones**
3. Expandir la sección
4. Hacer click en: **"Gestión de Redes Sociales"**

### Estructura:

```
💬 Comunicaciones
  ├── Chat
  ├── Notificaciones
  ├── SMS
  ├── 📱 Gestión de Redes Sociales  ← AQUÍ
  └── Publicaciones
```

---

## 🚀 VERIFICACIÓN

### Cómo Probar

1. **Login:**
   ```
   URL: https://inmovaapp.com/login
   Email: admin@inmova.app
   Password: Admin123!
   ```

2. **Navegar:**
   - Abrir sidebar
   - Sección "Comunicaciones"
   - Click en "Gestión de Redes Sociales"

3. **Verificar:**
   - ✅ Página carga correctamente
   - ✅ Se muestra dashboard de redes sociales
   - ✅ Muestra opciones para conectar LinkedIn, Instagram, X
   - ✅ Si Pomelli está configurado, muestra analytics

---

## ⚙️ CONFIGURACIÓN DE POMELLI

### Requisitos

Para usar la gestión de redes sociales necesitas:

1. **Cuenta de Pomelli:**
   - Registrarse en pomelli.com
   - Obtener API Key y API Secret

2. **Configurar en la App:**
   - Ir a `/dashboard/social-media`
   - Ingresar credenciales de API
   - Guardar configuración

3. **Conectar Perfiles:**
   - Click en "Conectar LinkedIn/Instagram/X"
   - Autorizar acceso en cada red social
   - Los perfiles quedan sincronizados

---

## 📊 CAPACIDADES DE POMELLI

### ¿Qué puedes hacer?

#### LinkedIn
- ✅ Publicar posts
- ✅ Programar contenido
- ✅ Ver analytics
- ✅ Gestionar múltiples perfiles

#### Instagram
- ✅ Publicar fotos y videos
- ✅ Programar contenido
- ✅ Ver estadísticas
- ✅ Responder comentarios (próximamente)

#### X (Twitter)
- ✅ Publicar tweets
- ✅ Programar tweets
- ✅ Ver métricas
- ✅ Gestionar hilos

---

## 🔄 DEPLOYMENT

### Cambios Realizados

```bash
✅ Archivo: components/layout/sidebar.tsx
✅ Línea ~677: href actualizado
✅ Línea ~101: mapeo de módulo agregado
```

### Deploy

```bash
git add components/layout/sidebar.tsx
git commit -m "fix: correct social media module path in sidebar"
git push origin main

# En servidor
cd /opt/inmova-app
git pull origin main
npm run build
pm2 restart inmova-app
```

---

## 📝 NOTAS TÉCNICAS

### Rutas Relacionadas

| Ruta | Estado | Propósito |
|------|--------|-----------|
| `/dashboard/social-media` | ✅ Existe | Dashboard principal de RRSS con Pomelli |
| `/redes-sociales` | ❌ No existe | Legacy route (sin página) |
| `/publicaciones` | ⚠️ Sin verificar | Posiblemente para publicaciones generales |

### APIs Relacionadas

```
/api/pomelli/config           - GET: Config de Pomelli
/api/pomelli/profiles/connect - POST: Conectar perfil
/api/pomelli/posts            - GET/POST: Gestionar publicaciones
/api/pomelli/analytics        - GET: Obtener métricas
```

---

## ✅ RESULTADO

### Antes del Fix
- ❌ Click en "Redes Sociales" → 404
- ❌ Página inaccesible desde sidebar
- ❌ Usuario confundido sobre dónde está

### Después del Fix
- ✅ Click en "Gestión de Redes Sociales" → Página carga
- ✅ Dashboard completo visible
- ✅ Acceso directo desde Comunicaciones
- ✅ Nombre más descriptivo

---

## 📞 SOPORTE

Si la página no carga o muestra errores:

1. **Verificar Pomelli configurado:**
   - La página requiere API credentials
   - Si no está configurado, muestra formulario de setup

2. **Verificar módulo activo:**
   - En `/admin/modulos`
   - Módulo: "redes_sociales"
   - Debe estar activado

3. **Verificar permisos:**
   - Rol: Super Admin, Administrador, o Gestor
   - Otros roles no tienen acceso

---

**Última actualización:** 3 Enero 2026 - 23:25 UTC  
**Archivo:** components/layout/sidebar.tsx  
**Commit:** Pendiente

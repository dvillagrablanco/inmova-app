# 👁️ PROTOCOLO DE INSPECCIÓN VISUAL

## 📖 Descripción

El script `visual-audit.ts` es la **herramienta maestra** para auditorías visuales de la aplicación Inmova. Automatiza completamente el proceso de QA visual.

## 🎯 ¿Qué hace?

1. **Autenticación Automática**: Inicia sesión usando credenciales de `.env`
2. **Crawling Inteligente**: Recorre todas las rutas críticas del dashboard
3. **Captura Dual**: 
   - Desktop: 1920x1080
   - Mobile: 390x844 (iPhone 14)
4. **Caza-Errores**: Detecta automáticamente:
   - ❌ Errores de Consola (rojos)
   - 🔴 Errores de Red (404/500)
   - 📦 Elementos Desbordados (Overflow)
   - ⚠️ JavaScript Errors
   - ⏱️ Timeouts

## 🚀 Instalación

### Prerrequisitos

1. **Playwright** debe estar instalado:

```bash
yarn add -D @playwright/test
npx playwright install chromium
```

2. **Variables de entorno** configuradas en `.env` o `.env.production`:

```env
# URL de la aplicación
BASE_URL=http://localhost:3000
# O
NEXTAUTH_URL=http://localhost:3000

# Credenciales de test
TEST_USER_EMAIL=admin@inmova.app
TEST_USER_PASSWORD=Admin123!
# O
ADMIN_EMAIL=admin@inmova.app
ADMIN_PASSWORD=Admin123!
```

## 📋 Uso

### Comando Básico

```bash
npx tsx scripts/visual-audit.ts
```

### Desde npm script (recomendado)

Añade a `package.json`:

```json
{
  "scripts": {
    "audit:visual": "tsx scripts/visual-audit.ts"
  }
}
```

Luego ejecuta:

```bash
yarn audit:visual
```

## 📊 Resultados

Después de la ejecución, encontrarás:

```
visual-audit-results/
├── desktop/
│   ├── screenshot-desktop-landing.png
│   ├── screenshot-desktop-dashboard.png
│   ├── screenshot-desktop-properties.png
│   └── ... (más capturas)
├── mobile/
│   ├── screenshot-mobile-landing.png
│   ├── screenshot-mobile-dashboard.png
│   ├── screenshot-mobile-properties.png
│   └── ... (más capturas)
└── audit-logs.txt (⭐ IMPORTANTE - Todos los errores aquí)
```

## 🔍 Analizando los Resultados

### 1. Revisar `audit-logs.txt`

Este archivo contiene **TODOS** los problemas detectados:

```
================================================================================
👁️  AUDIT LOGS - INSPECCIÓN VISUAL AUTOMÁTICA
================================================================================

[2025-01-15T10:30:00Z] CRITICAL - network-error
  Ruta: /dashboard
  Viewport: desktop
  Mensaje: /api/users - HTTP 500
────────────────────────────────────────────────────────────────────────────────

[2025-01-15T10:30:05Z] MEDIUM - overflow
  Ruta: /properties
  Viewport: mobile
  Mensaje: Detectados 3 elementos desbordados
  Detalles: div.property-card, span.long-text, img.hero-image
────────────────────────────────────────────────────────────────────────────────

================================================================================
📊 RESUMEN DE ERRORES
================================================================================
Total de errores: 15
  - Críticos: 2
  - Altos: 5
  - Medios: 6
  - Bajos: 2
```

### 2. Revisar Screenshots

**Desktop** (`visual-audit-results/desktop/`):
- Verifica diseño en pantallas grandes
- Busca desalineaciones en grillas
- Revisa espaciados

**Mobile** (`visual-audit-results/mobile/`):
- Verifica responsividad
- Busca elementos cortados
- Revisa botones pequeños (< 44px)

### 3. Priorizar Fixes

#### Severidad CRÍTICA 🔥
- Errores 500
- JavaScript crashes
- Páginas que no cargan

#### Severidad ALTA ⚠️
- Errores 404
- Errores de Consola
- Requests fallidos

#### Severidad MEDIA 📊
- Overflow de elementos
- Textos encontrados con "undefined" o "null"

#### Severidad BAJA ℹ️
- Imágenes rotas (no críticas)
- Warnings de consola

## 🎨 Rutas Auditadas

El script audita automáticamente:

### Públicas (sin auth)
- `/` - Landing
- `/login` - Login

### Dashboard (requiere auth)
- `/dashboard` - Dashboard principal
- `/edificios` - Gestión de edificios
- `/unidades` - Gestión de unidades
- `/inquilinos` - Gestión de inquilinos
- `/contratos` - Gestión de contratos
- `/pagos` - Gestión de pagos
- `/mantenimiento` - Mantenimiento
- `/documentos` - Documentos

### Admin (requiere auth)
- `/admin/dashboard` - Panel de administración
- `/admin/usuarios` - Gestión de usuarios

### Comunidades (requiere auth)
- `/comunidades` - Comunidades
- `/comunidades/finanzas` - Finanzas de comunidades

### Negocio (requiere auth)
- `/crm` - CRM
- `/analytics` - Analytics

### Configuración (requiere auth)
- `/perfil` - Perfil de usuario
- `/configuracion` - Configuración

## 🔧 Personalización

### Añadir Nuevas Rutas

Edita el array `CRITICAL_ROUTES` en `visual-audit.ts`:

```typescript
const CRITICAL_ROUTES = [
  // ... rutas existentes
  
  // Nueva ruta
  { 
    path: '/mi-nueva-pagina', 
    name: 'mi-nueva-pagina', 
    requiresAuth: true // o false si es pública
  },
];
```

### Cambiar Viewports

Edita las constantes:

```typescript
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
```

Viewports comunes:
- **iPhone 14**: 390x844
- **iPhone 14 Pro Max**: 430x932
- **iPad**: 768x1024
- **Desktop HD**: 1920x1080
- **Desktop 4K**: 3840x2160

### Cambiar Timeout

Edita:

```typescript
const TIMEOUT = 30000; // milisegundos (30s por defecto)
```

## 🐛 Troubleshooting

### Error: "Browser not installed"

```bash
npx playwright install chromium
```

### Error: "Autenticación falló"

Verifica credenciales en `.env`:

```env
TEST_USER_EMAIL=admin@inmova.app
TEST_USER_PASSWORD=Admin123!
```

### Error: "ENOENT: no such file or directory"

El script crea automáticamente los directorios. Si falla:

```bash
mkdir -p visual-audit-results/desktop visual-audit-results/mobile
```

### Capturas salen en blanco

Posibles causas:
1. La página tarda mucho en cargar → Aumentar `TIMEOUT`
2. Contenido cargado por JavaScript → El script ya espera 2s, pero puedes aumentar en `page.waitForTimeout(2000)`
3. Autenticación falló → Verificar login manual primero

### Muchos errores de "favicon.ico"

Estos ya están filtrados. Si aparecen, revisa la línea:

```typescript
if (text.includes('favicon.ico') || text.includes('Extension')) {
  return; // Filtrar
}
```

## 📝 Workflow Recomendado

### 1. Antes de cada PR

```bash
yarn audit:visual
```

### 2. Revisar `audit-logs.txt`

```bash
cat visual-audit-results/audit-logs.txt
```

### 3. Revisar screenshots críticos

Especialmente si hay errores en esas rutas.

### 4. Fix errores críticos

Prioridad:
1. 🔥 Críticos (bloquean funcionalidad)
2. ⚠️ Altos (afectan UX)
3. 📊 Medios (mejoras de UX)
4. ℹ️ Bajos (cosméticos)

### 5. Re-ejecutar audit

```bash
yarn audit:visual
```

### 6. Commit si todo OK

```bash
git add .
git commit -m "fix: resolver issues visuales encontrados en audit"
```

## 🎯 Mejores Prácticas

1. **Ejecutar en local antes de push**: Evita sorpresas en producción
2. **Revisar SIEMPRE audit-logs.txt**: Las capturas pueden verse bien pero tener errores ocultos
3. **Priorizar mobile**: La mayoría de usuarios usan móvil
4. **No ignorar overflows**: Causan scroll horizontal (muy mala UX)
5. **Fix errors de consola**: Pueden indicar bugs funcionales

## 🔗 Ver También

- [Playwright Docs](https://playwright.dev)
- [Mobile Testing Guide](/docs/mobile-testing.md)
- [Accessibility Audit](/docs/accessibility.md)

## 📞 Soporte

Si encuentras problemas con el script:

1. Verifica los prerrequisitos
2. Revisa las variables de entorno
3. Ejecuta en modo verbose (añadir `console.log` en el código)
4. Crea un issue en el repo

---

**Última actualización**: Diciembre 2025
**Autor**: Equipo Inmova
**Versión**: 1.0.0

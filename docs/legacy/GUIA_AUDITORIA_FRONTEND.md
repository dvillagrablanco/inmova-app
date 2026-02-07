# 🎭 Guía de Auditoría Frontend con Playwright

**Fecha**: 30 de Diciembre de 2025  
**Test Creado**: `e2e/frontend-audit-complete.spec.ts`  
**Script de Ejecución**: `scripts/run-frontend-audit.sh`

---

## 📋 Descripción

Test exhaustivo de Playwright que realiza una **auditoría completa del frontend** de Inmova App, incluyendo:

✅ **Login como superadmin** automático  
✅ **16 rutas principales** auditadas  
✅ **Detección de errores de consola** (errors & warnings)  
✅ **Detección de errores de red** (4xx, 5xx)  
✅ **Detección de hydration errors** (React SSR)  
✅ **Verificación de accesibilidad básica** (WCAG)  
✅ **Detección de imágenes rotas**  
✅ **Screenshots automáticos** de cada página  
✅ **Reporte HTML interactivo** con todos los hallazgos  

---

## 🚀 Cómo Ejecutar la Auditoría

### Opción 1: Script Automatizado (Recomendado)

```bash
# Con servidor ya corriendo
./scripts/run-frontend-audit.sh

# O iniciar servidor automáticamente
./scripts/run-frontend-audit.sh --start-server
```

### Opción 2: Manual

```bash
# 1. Asegurar que el superadmin existe
npx tsx scripts/create-super-admin.ts

# 2. Iniciar servidor de desarrollo (en otra terminal)
yarn dev

# 3. Ejecutar auditoría
yarn playwright test e2e/frontend-audit-complete.spec.ts

# 4. Ver reporte
open frontend-audit-report/index.html
```

### Opción 3: Modo UI Interactivo (Debugging)

```bash
# Servidor debe estar corriendo
yarn dev

# En otra terminal
yarn playwright test e2e/frontend-audit-complete.spec.ts --ui
```

---

## 📊 Rutas Auditadas

El test audita automáticamente las siguientes rutas:

### Públicas
- `/` - Landing page
- `/login` - Página de login

### Dashboard (Autenticadas)
- `/dashboard` - Dashboard principal
- `/dashboard/propiedades` - Gestión de propiedades
- `/dashboard/edificios` - Gestión de edificios
- `/dashboard/inquilinos` - Gestión de inquilinos
- `/dashboard/contratos` - Gestión de contratos
- `/dashboard/pagos` - Gestión de pagos
- `/dashboard/mantenimiento` - Incidencias y mantenimiento
- `/dashboard/documentos` - Documentos
- `/dashboard/analytics` - Analytics
- `/dashboard/crm` - CRM
- `/dashboard/comunidades` - Gestión de comunidades
- `/superadmin` - Panel de superadministrador
- `/dashboard/perfil` - Perfil de usuario
- `/dashboard/configuración` - Configuración

**Total**: 16 rutas

---

## 🔍 Qué Detecta

### 1. Errores de Consola

Captura todos los errores y warnings que aparecen en la consola del navegador:

```javascript
// Ejemplos de errores detectados:
- console.error()
- console.warn()
- Errores no capturados (pageerror)
- Errores de JavaScript
```

### 2. Errores de Red

Detecta todas las peticiones HTTP que fallan:

```javascript
// Códigos de error detectados:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 502: Bad Gateway
- 503: Service Unavailable
```

### 3. Errores de Hydration

Detecta errores de hidratación de React (cuando el HTML del servidor no coincide con el renderizado del cliente):

```javascript
// Patrones detectados:
- "Hydration failed"
- "hydration mismatch"
- "Text content does not match"
- "server HTML"
- "client-side exception"
```

### 4. Problemas de Accesibilidad

Verifica aspectos básicos de accesibilidad (WCAG):

```javascript
// Verificaciones:
- ✅ Un solo <h1> por página
- ✅ Imágenes con atributo alt
- ✅ Botones con texto o aria-label
- ✅ Inputs con label o aria-label
- ✅ Contraste de colores básico
- ✅ Presencia de <nav>
- ✅ Presencia de <footer> en páginas públicas
```

### 5. Imágenes Rotas

Detecta imágenes que no se cargan correctamente:

```javascript
// Verificación:
- naturalWidth === 0 → imagen rota
```

---

## 📄 Reporte Generado

### Ubicación

```
frontend-audit-report/
├── index.html          # Reporte principal (HTML interactivo)
├── report.json         # Datos en JSON
└── screenshots/        # Capturas de cada página
 ├── landing.png
 ├── login.png
 ├── dashboard.png
 └── ...
```

### Contenido del Reporte HTML

El reporte incluye:

1. **Resumen Ejecutivo**
   - Total de rutas auditadas
   - Rutas con errores de consola
   - Rutas con errores de red
   - Errores de hydration
   - Problemas de accesibilidad

2. **Detalle por Ruta**
   - Nombre y URL
   - Badge de estado (✅ OK, ⚠️ Warning, ❌ Error)
   - Lista de errores de consola
   - Lista de errores de red
   - Problemas de accesibilidad
   - Imágenes rotas
   - Screenshot de la página

3. **Visualización**
   - Diseño responsive
   - Colores según severidad
   - Screenshots integrados
   - Fácil navegación

### Ejemplo de Reporte

```html
📊 Resumen Ejecutivo
- Rutas Auditadas: 16
- Rutas con Errores de Consola: 3
- Rutas con Errores de Red: 1
- Errores de Hydration: 0
- Rutas con Problemas de Accesibilidad: 5

---

Dashboard (/dashboard)
Status: ⚠️ Warnings

🔴 Errores de Consola (2)
  [ERROR] Uncaught TypeError: Cannot read property 'map' of undefined
  [WARNING] React does not recognize prop `someInvalidProp`

♿ Problemas de Accesibilidad (3)
  - 5 imágenes sin atributo alt
  - 2 botones sin texto ni aria-label
  - No se encontró elemento <nav>

📸 Captura de Pantalla
  [screenshot]
```

---

## 🔧 Configuración

### Credenciales de Superadmin

El test usa las siguientes credenciales por defecto:

```typescript
SUPERADMIN_EMAIL = 'superadmin@inmova.com'
SUPERADMIN_PASSWORD = 'superadmin123'
```

**Cambiar credenciales**: Editar `e2e/frontend-audit-complete.spec.ts` líneas 16-17

### Agregar Rutas

Para auditar rutas adicionales, editar el array `ROUTES_TO_AUDIT` en el test:

```typescript
const ROUTES_TO_AUDIT = [
  { name: 'Mi Nueva Ruta', url: '/dashboard/mi-ruta', requiresAuth: true },
  // ...
];
```

### Timeouts

Configuración de timeouts (en milisegundos):

```typescript
// Navegación
await page.goto(route.url, { timeout: 15000 }); // 15 segundos

// Espera de carga
await page.waitForTimeout(2000); // 2 segundos

// Login
await page.waitForURL(/\/(dashboard|home)/, { timeout: 15000 });
```

---

## 🐛 Troubleshooting

### Error: "Servidor no detectado"

```bash
# Solución 1: Iniciar servidor manualmente
yarn dev

# Solución 2: Usar flag --start-server
./scripts/run-frontend-audit.sh --start-server
```

### Error: "Playwright no instalado"

```bash
# Instalar Playwright
yarn add -D @playwright/test

# Instalar navegadores
yarn playwright install chromium
```

### Error: "Superadmin no existe"

```bash
# Crear superadmin
npx tsx scripts/create-super-admin.ts

# O editar credenciales en el test
```

### Error: "Timeout esperando navegación"

```bash
# Aumentar timeout en el test
await page.waitForURL(/\/(dashboard|home)/, { timeout: 30000 });
```

### Test falla en CI/CD

```bash
# Agregar a GitHub Actions
- name: Install Playwright
  run: yarn playwright install --with-deps chromium

- name: Run Frontend Audit
  run: yarn playwright test e2e/frontend-audit-complete.spec.ts
```

---

## 📈 Métricas Esperadas

### Baseline (Primera Ejecución)

| Métrica | Esperado |
|---------|----------|
| **Rutas auditadas** | 16 |
| **Errores de consola** | < 5 |
| **Errores de red** | 0 |
| **Errores de hydration** | 0 |
| **Problemas accesibilidad** | < 10 |
| **Imágenes rotas** | 0 |

### Objetivo (Proyecto Maduro)

| Métrica | Objetivo |
|---------|----------|
| **Errores de consola** | 0 |
| **Errores de red** | 0 |
| **Errores de hydration** | 0 |
| **Problemas accesibilidad** | 0 |
| **Score Lighthouse** | 80+ |

---

## 🚀 Próximos Pasos

### Después de la Primera Auditoría

1. **Revisar Reporte HTML**: Abrir `frontend-audit-report/index.html`
2. **Priorizar Errores**: Errores críticos primero (500, hydration, errores de consola)
3. **Crear Issues**: Un issue por cada error encontrado
4. **Ejecutar Regularmente**: Integrar en CI/CD para detectar regresiones

### Mejoras Futuras

- [ ] Agregar tests de performance (Lighthouse)
- [ ] Agregar tests de SEO
- [ ] Agregar tests de responsive (móvil, tablet)
- [ ] Agregar tests de cross-browser (Firefox, Safari)
- [ ] Agregar tests de accesibilidad avanzada (axe-core)
- [ ] Integrar con Sentry para tracking de errores

---

## 📚 Referencias

- **Playwright Docs**: https://playwright.dev/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **React Hydration**: https://react.dev/reference/react-dom/client/hydrateRoot
- **Next.js Testing**: https://nextjs.org/docs/testing

---

## 🎯 Comandos Rápidos

```bash
# Ejecutar auditoría completa
./scripts/run-frontend-audit.sh

# Modo UI interactivo
yarn playwright test e2e/frontend-audit-complete.spec.ts --ui

# Solo una ruta específica
yarn playwright test e2e/frontend-audit-complete.spec.ts --grep "Dashboard"

# Ver reporte anterior
open frontend-audit-report/index.html

# Limpiar reportes
rm -rf frontend-audit-report

# Crear superadmin
npx tsx scripts/create-super-admin.ts
```

---

**Última actualización**: 30 de Diciembre de 2025  
**Versión**: 1.0.0  
**Autor**: Equipo Inmova + Cursor Agent
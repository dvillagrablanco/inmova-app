# 🎭 Guía de Auditoría Frontend Exhaustiva

**Última actualización**: 30 de Diciembre de 2025  
**Total de rutas**: 233  
**Cobertura**: 100% de la aplicación

---

## 📊 Resumen

Se ha creado un sistema completo de auditoría que cubre **TODAS las 233 rutas** de Inmova App, incluyendo:

- ✅ **55 rutas públicas** (landing, login, portales)
- ✅ **178 rutas autenticadas** (dashboard, admin, módulos)
- ✅ **32 rutas de superadmin** (configuración, métricas)

---

## 🚀 Ejecución Rápida

### Opción 1: Todas las Rutas (233)

```bash
# Auditoría completa
./scripts/run-exhaustive-audit.sh

# Tiempo estimado: 40-60 minutos
```

### Opción 2: Alta Prioridad (6 rutas)

```bash
# Solo rutas críticas
./scripts/run-exhaustive-audit.sh high

# Tiempo estimado: 2 minutos
```

### Opción 3: Alta + Media Prioridad (84 rutas)

```bash
# Rutas principales
./scripts/run-exhaustive-audit.sh medium

# Tiempo estimado: 15-20 minutos
```

---

## 📋 Categorías de Rutas

La aplicación está organizada en 16 categorías:

| Categoría | Rutas | Descripción |
|-----------|-------|-------------|
| **other** | 94 | Páginas generales (dashboard, perfil, etc.) |
| **admin** | 32 | Panel de administración |
| **landing** | 19 | Páginas públicas de marketing |
| **str** | 14 | Short-Term Rental (Airbnb) |
| **portal_inquilino** | 11 | Portal de inquilinos |
| **portal_proveedor** | 11 | Portal de proveedores |
| **comunidades** | 9 | Gestión de comunidades |
| **partners** | 9 | Programa de partners |
| **dashboard** | 7 | Dashboard principal |
| **flipping** | 6 | House flipping |
| **ewoorker** | 5 | Integración eWoorker |
| **construction** | 4 | Gestión de construcción |
| **portal_comercial** | 4 | Portal comercial |
| **professional** | 4 | Perfil profesional |
| **portal_propietario** | 3 | Portal de propietarios |
| **coliving** | 1 | Coliving |

---

## 🎯 Rutas por Prioridad

### Alta Prioridad (6 rutas) ⚡

Páginas críticas que DEBEN funcionar perfectamente:

1. `/` - Landing Home
2. `/landing` - Landing Principal
3. `/login` - Login
4. `/register` - Registro
5. `/dashboard` - Dashboard Principal
6. `/admin/dashboard` - Admin Dashboard

### Media Prioridad (78 rutas) 🔵

Páginas principales de cada sección:
- `/admin/*` (32 rutas)
- `/dashboard/*` (7 rutas)
- `/str/*` (14 rutas)
- `/portal-inquilino/*` (11 rutas)
- Y más...

### Baja Prioridad (149 rutas) 🟢

Subpáginas y funcionalidades específicas

---

## 🔍 Qué Detecta la Auditoría

### 1. Errores de Consola
- `console.error()`
- `console.warn()`
- Errores no capturados
- Errores de JavaScript

### 2. Errores de Red
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
- 502: Bad Gateway
- 503: Service Unavailable

### 3. Errores de Hydration
- "Hydration failed"
- "hydration mismatch"
- "Text content does not match"
- "server HTML"

### 4. Problemas de Accesibilidad
- H1 faltante o múltiple
- Imágenes sin `alt`
- Enlaces sin texto
- Botones sin label

### 5. Imágenes Rotas
- Imágenes que no cargan correctamente

### 6. Performance
- Tiempo de carga de cada página
- Timeouts

---

## 📄 Reporte Generado

### Ubicación

```
frontend-audit-exhaustive-report/
├── index.html          # Reporte principal (interactivo)
├── report.json         # Datos en JSON
└── screenshots/        # Capturas de cada página
    ├── admin-*.png
    ├── dashboard-*.png
    └── ...
```

### Características del Reporte HTML

1. **Dashboard Interactivo**
   - Resumen con contadores
   - Filtros por estado (OK, Warning, Error)
   - Navegación por categorías

2. **Vista por Categoría**
   - Rutas agrupadas
   - Estadísticas por categoría
   - Grid visual de rutas

3. **Detalle por Ruta**
   - Nombre y URL
   - Badge de estado
   - Lista de issues encontrados
   - Número de errores por tipo

4. **Responsive**
   - Diseño adaptable
   - Fácil navegación en móvil

---

## 🛠️ Uso Avanzado

### Ejecutar Solo una Categoría

```bash
# Solo rutas de admin
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@admin"

# Solo rutas de STR
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@str"

# Solo rutas de landing
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@landing"
```

### Ejecutar Solo Alta Prioridad

```bash
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@high-priority"
```

### Modo UI Interactivo (Debugging)

```bash
# Ver tests ejecutándose
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --ui

# Útil para:
# - Depurar errores
# - Ver capturas en tiempo real
# - Pausar/reanudar tests
```

### Modo Paralelo (Más Rápido)

```bash
# Ejecutar con 4 workers en paralelo
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --workers=4

# Reduce tiempo de ~60 min a ~20 min
```

---

## 📊 Interpretación de Resultados

### Estados Posibles

| Estado | Badge | Significado |
|--------|-------|-------------|
| **OK** | ✅ | Sin errores detectados |
| **WARNING** | ⚠️ | Warnings menores (console.warn, a11y) |
| **ERROR** | ❌ | Errores críticos (console.error, 5xx, hydration) |
| **SKIPPED** | ⏭️ | Ruta omitida (timeout, no accesible) |

### Ejemplo de Interpretación

```
Dashboard - Propiedades
Status: ⚠️ WARNING

Console: 2 errores
  - [WARNING] React does not recognize prop
  - [WARNING] Component will receive...

A11y: 3 issues
  - 5 imágenes sin atributo alt
  - 2 botones sin aria-label
```

**Acción**: Revisar warnings de React y añadir atributos de accesibilidad.

---

## 🔧 Configuración

### Variables de Entorno

```bash
# .env.local
AUDIT_MODE=all          # all | high | medium
CAPTURE_SCREENSHOTS=true
PAGE_TIMEOUT=20000      # ms
```

### Modificar Credenciales

Editar `e2e/frontend-audit-exhaustive.spec.ts`:

```typescript
const SUPERADMIN_EMAIL = 'tu-email@ejemplo.com';
const SUPERADMIN_PASSWORD = 'tu-password';
```

### Agregar Nuevas Rutas

1. **Crear la página** en `app/`
2. **Regenerar lista**:
   ```bash
   npx tsx scripts/generate-routes-list.ts
   ```
3. **Ejecutar auditoría**:
   ```bash
   ./scripts/run-exhaustive-audit.sh
   ```

---

## 🐛 Troubleshooting

### Error: "Servidor no detectado"

```bash
# Solución: Iniciar servidor
yarn dev

# En otra terminal:
./scripts/run-exhaustive-audit.sh
```

### Error: "Timeout waiting for URL"

```bash
# Aumentar timeout en el archivo de config
# e2e/frontend-audit-exhaustive.spec.ts
const TEST_CONFIG = {
  pageTimeout: 30000,  // Aumentar a 30 segundos
  // ...
};
```

### Error: "Superadmin no existe"

```bash
# Crear superadmin
npx tsx scripts/create-super-admin.ts
```

### Auditoría muy lenta

```bash
# Opción 1: Ejecutar en paralelo
./scripts/run-exhaustive-audit.sh all parallel

# Opción 2: Solo alta prioridad
./scripts/run-exhaustive-audit.sh high

# Opción 3: Desactivar screenshots
# En e2e/frontend-audit-exhaustive.spec.ts
captureScreenshots: false
```

---

## 📈 Métricas Esperadas

### Baseline (Primera Ejecución)

| Métrica | Esperado |
|---------|----------|
| **Rutas OK** | 180-200 (80-85%) |
| **Warnings** | 20-40 (10-15%) |
| **Errores** | < 10 (< 5%) |
| **Skipped** | < 5 (< 2%) |

### Objetivo (Proyecto Maduro)

| Métrica | Objetivo |
|---------|----------|
| **Rutas OK** | 220+ (95%+) |
| **Warnings** | < 10 (< 5%) |
| **Errores** | 0 |
| **Skipped** | 0 |

---

## 🚀 Siguientes Pasos

### Después de la Primera Auditoría

1. **Revisar Reporte HTML**
   ```bash
   open frontend-audit-exhaustive-report/index.html
   ```

2. **Priorizar Errores**
   - Errores críticos primero (console.error, 5xx)
   - Luego warnings (console.warn, a11y)
   - Finalmente mejoras (info)

3. **Crear Issues**
   - Un issue por categoría de error
   - Asignar prioridades
   - Trackear progreso

4. **Ejecutar Regularmente**
   - Semanalmente: Alta prioridad
   - Quincenalmente: Todas las rutas
   - En CI/CD: Pre-deployment

---

## 🔄 Integración CI/CD

### GitHub Actions

```yaml
# .github/workflows/frontend-audit.yml
name: Frontend Audit

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 1'  # Lunes a las 2 AM

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Install Playwright
        run: yarn playwright install --with-deps chromium
      
      - name: Generate routes list
        run: npx tsx scripts/generate-routes-list.ts
      
      - name: Run frontend audit (high priority)
        run: |
          yarn dev &
          sleep 30
          yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@high-priority"
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: frontend-audit-report
          path: frontend-audit-exhaustive-report/
```

---

## 📚 Referencias

- **Playwright Docs**: https://playwright.dev/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **React Hydration**: https://react.dev/reference/react-dom/client/hydrateRoot

---

## 🎯 Comandos Rápidos

```bash
# Todas las rutas
./scripts/run-exhaustive-audit.sh

# Alta prioridad (6 rutas, 2 min)
./scripts/run-exhaustive-audit.sh high

# Alta + Media (84 rutas, 15-20 min)
./scripts/run-exhaustive-audit.sh medium

# Solo una categoría
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --grep "@admin"

# Modo UI
yarn playwright test e2e/frontend-audit-exhaustive.spec.ts --ui

# Ver reporte
open frontend-audit-exhaustive-report/index.html

# Regenerar lista de rutas
npx tsx scripts/generate-routes-list.ts
```

---

**Última actualización**: 30 de Diciembre de 2025  
**Versión**: 1.0.0  
**Autor**: Equipo Inmova + Cursor Agent
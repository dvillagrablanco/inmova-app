# 👁️ VISUAL AUDIT - INICIO RÁPIDO

## ⚡ Ejecución en 3 Pasos

### 1️⃣ Verificar Prerrequisitos

```bash
# Verificar que Playwright esté instalado
npx playwright --version
```

Si no está instalado:

```bash
yarn add -D @playwright/test
npx playwright install chromium
```

### 2️⃣ Configurar Credenciales

Edita tu archivo `.env` o `.env.production` y añade:

```env
# URL de tu app (local o producción)
BASE_URL=http://localhost:3000

# Credenciales de test
TEST_USER_EMAIL=admin@inmova.app
TEST_USER_PASSWORD=Admin123!
```

### 3️⃣ Ejecutar Auditoría

```bash
yarn audit:visual
```

O directamente:

```bash
npx tsx scripts/visual-audit.ts
```

---

## 📊 Resultados

Después de ~2-5 minutos (dependiendo del número de rutas), verás:

```
✅ INSPECCIÓN COMPLETADA
================================================================================

📊 Resultados:
   - Total de capturas: 48 (desktop + mobile)
   - Screenshots guardados en: visual-audit-results
   - Logs de errores: visual-audit-results/audit-logs.txt
   - Total de errores: 12
     • Críticos: 2
     • Altos: 4
     • Medios: 5
     • Bajos: 1
```

---

## 🔍 Analizar Resultados

### Ver Errores

```bash
cat visual-audit-results/audit-logs.txt
```

O abre el archivo en tu editor.

### Ver Screenshots

```bash
# Abrir carpeta de resultados
open visual-audit-results  # macOS
xdg-open visual-audit-results  # Linux
explorer visual-audit-results  # Windows
```

Estructura:

```
visual-audit-results/
├── desktop/
│   ├── screenshot-desktop-landing.png
│   ├── screenshot-desktop-dashboard.png
│   ├── screenshot-desktop-properties.png
│   └── ... (24 capturas)
├── mobile/
│   ├── screenshot-mobile-landing.png
│   ├── screenshot-mobile-dashboard.png
│   ├── screenshot-mobile-properties.png
│   └── ... (24 capturas)
└── audit-logs.txt ⭐ IMPORTANTE
```

---

## 🎯 Próximos Pasos

### Si encontró errores:

1. **Lee `audit-logs.txt`** para ver todos los problemas
2. **Prioriza por severidad**:
   - 🔥 **Críticos**: Fix INMEDIATO (bloquean funcionalidad)
   - ⚠️ **Altos**: Fix PRONTO (afectan UX)
   - 📊 **Medios**: Fix cuando puedas (mejoras de UX)
   - ℹ️ **Bajos**: Fix si tienes tiempo (cosméticos)

3. **Revisa las capturas** de las páginas con errores

4. **Fix los problemas**

5. **Re-ejecuta el audit**:
   ```bash
   yarn audit:visual
   ```

### Si NO encontró errores:

🎉 **¡Excelente!** Tu aplicación pasó la auditoría visual.

Puedes proceder con:
- Commit de cambios
- Deploy a producción
- PR review

---

## 🐛 Troubleshooting Rápido

### "Browser not installed"

```bash
npx playwright install chromium
```

### "Autenticación falló"

1. Verifica que el usuario exista en tu BD:
   ```bash
   yarn tsx scripts/create-admin-user.ts
   ```

2. Verifica las credenciales en `.env`

3. Intenta login manual primero en http://localhost:3000/login

### "Error: ECONNREFUSED"

Tu app no está corriendo. Inicia el servidor:

```bash
yarn dev
```

Luego en otra terminal:

```bash
yarn audit:visual
```

### "Timeout en /dashboard"

La página tarda mucho en cargar. Opciones:

1. **Esperar más tiempo**: Edita `TIMEOUT` en `scripts/visual-audit.ts`:
   ```typescript
   const TIMEOUT = 60000; // 60 segundos
   ```

2. **Verificar rendimiento**: Usa Lighthouse:
   ```bash
   yarn lighthouse:audit
   ```

---

## 📖 Documentación Completa

Para más detalles, lee:

- **[VISUAL_AUDIT_README.md](scripts/VISUAL_AUDIT_README.md)** - Documentación completa
- **[visual-audit.ts](scripts/visual-audit.ts)** - Código fuente (bien comentado)

---

## 💡 Tips

### Ejecutar solo rutas públicas (sin auth)

Comenta las rutas que requieren auth en `scripts/visual-audit.ts`:

```typescript
const CRITICAL_ROUTES = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
  // { path: '/dashboard', name: 'dashboard', requiresAuth: true }, // ← Comentado
  // ...
];
```

### Ejecutar solo mobile

Edita `captureRoute()` y comenta la captura desktop:

```typescript
// await this.captureViewport(context, url, route, 'desktop', DESKTOP_VIEWPORT);
await this.captureViewport(context, url, route, 'mobile', MOBILE_VIEWPORT);
```

### Cambiar viewports

Edita las constantes:

```typescript
const DESKTOP_VIEWPORT = { width: 2560, height: 1440 }; // 2K
const MOBILE_VIEWPORT = { width: 430, height: 932 }; // iPhone 14 Pro Max
```

---

**Happy Auditing! 🎨**

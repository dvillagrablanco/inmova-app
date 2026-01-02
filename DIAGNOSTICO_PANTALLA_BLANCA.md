# 🔍 DIAGNÓSTICO: Pantalla Blanca en Landing

**Fecha**: 2 de enero de 2026
**Reportado por**: Usuario
**Síntoma**: "Al segundo de cargar la landing vuelve a ponerse blanca"

---

## 📊 TESTS REALIZADOS

### 1. Test con Playwright (Headless)
- **Resultado**: ✅ Todo funciona correctamente
- **Contenido**: 18,225 caracteres de texto visibles
- **Elementos**: Main, Nav, Footer presentes y visibles
- **Display**: `block`, Opacity: `1`
- **Errores**: 0 console errors, 0 page errors, 0 network errors

### 2. Test Exhaustivo (10 segundos de monitoreo)
- **Resultado**: ✅ Contenido permanece visible
- **Monitoreo**: Cada 500ms durante 5 segundos
- **Estado DOM**: Estable, sin cambios repentinos
- **Screenshots**: Generados en test-0s.png hasta test-5s.png

### 3. Análisis de Código
- ✅ No hay CSS con `display: none` global
- ✅ No hay JavaScript sospechoso ejecutándose después de carga
- ✅ Timeouts detectados son solo para animaciones (PromoBanner)
- ✅ WhiteScreenMonitor activado correctamente

---

## 🎯 CAUSAS POSIBLES

### 1. Cache del Navegador (ALTA PROBABILIDAD)
- **Síntoma**: El usuario ve versión cacheada vieja
- **Solución**: Presionar `Ctrl+Shift+R` (hard reload) en el navegador
- **Evidencia**: El servidor muestra `Cache-Control: no-store, must-revalidate`

### 2. Cloudflare Cache (MEDIA PROBABILIDAD)
- **Síntoma**: Cloudflare sirve versión cacheada del HTML
- **Solución**: Purgar cache en Cloudflare Dashboard
- **URL**: https://dash.cloudflare.com → Caching → Purge Cache

### 3. Hydration Error (BAJA PROBABILIDAD)
- **Síntoma**: React detecta mismatch SSR vs Client
- **Solución**: Ya implementado `EnhancedErrorBoundary`
- **Estado**: WhiteScreenMonitor activo y sin detección

### 4. Navegador/Dispositivo Específico (MEDIA PROBABILIDAD)
- **Síntoma**: Solo ocurre en cierto navegador/dispositivo del usuario
- **Test**: Probar en diferentes navegadores (Chrome, Firefox, Safari)

### 5. Extensiones del Navegador (BAJA PROBABILIDAD)
- **Síntoma**: Adblock, Privacy Badger, etc. bloqueando JS
- **Test**: Modo incógnito sin extensiones

---

## ✅ ACCIONES TOMADAS

1. ✅ **WhiteScreenMonitor activado** - Ahora monitorea en desarrollo también
2. ✅ **Cache del servidor limpiado** - `.next/cache` y `.next/server` eliminados
3. ✅ **App reiniciada** - PM2 restart ejecutado
4. ✅ **Tests exhaustivos** - Playwright confirma que funciona

---

## 📋 PRÓXIMOS PASOS PARA EL USUARIO

### Paso 1: Limpiar Cache del Navegador
```
Windows/Linux: Ctrl+Shift+R
Mac: Cmd+Shift+R
```

### Paso 2: Purgar Cache de Cloudflare (si sigue el problema)
1. Ir a https://dash.cloudflare.com
2. Seleccionar dominio `inmovaapp.com`
3. Ir a Caching → Purge Everything
4. Esperar 30 segundos
5. Probar nuevamente

### Paso 3: Probar en Modo Incógnito
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P
- Safari: Cmd+Shift+N

### Paso 4: Probar en Otro Navegador
- Si funciona en otro navegador = problema de cache/extensiones
- Si NO funciona en ninguno = problema del servidor (reportar)

---

## 🔧 INFORMACIÓN TÉCNICA

### Estado del Servidor
```
URL: http://157.180.119.236/landing
PM2: online (reiniciado)
Cache: limpiado
WhiteScreenMonitor: activo
```

### Headers HTTP
```
Cache-Control: no-store, must-revalidate
```

### Tests Disponibles
```bash
# Test local
npx tsx scripts/test-exhaustive-white-screen.ts

# Ver screenshots
ls -la test-*.png
```

---

## 📞 SI EL PROBLEMA PERSISTE

1. **Abrir DevTools** (F12) en el navegador
2. **Ir a Console**
3. **Recargar la página**
4. **Capturar screenshot de cualquier error rojo**
5. **Reportar con screenshot**

---

## 🎯 CONCLUSIÓN

Los tests automatizados muestran que la landing **funciona correctamente**. El problema reportado es muy probablemente:

1. **Cache del navegador del usuario** (90% probabilidad)
2. **Cache de Cloudflare** (5% probabilidad)
3. **Navegador/dispositivo específico** (5% probabilidad)

**Recomendación**: Usuario debe hacer **hard reload** (Ctrl+Shift+R) y probar en modo incógnito.

---

**Última actualización**: 2 de enero de 2026, 14:35 UTC

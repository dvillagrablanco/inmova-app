# 🎯 Guía Rápida: Verificación de INMOVA con Playwright

## ⚡ Inicio Rápido

### 1. Iniciar el servidor (Terminal 1)
```bash
yarn dev
```

### 2. Ejecutar la verificación (Terminal 2)
```bash
./scripts/run-verificacion.sh
```

O directamente con Node:
```bash
node scripts/check-inmova-localhost.mjs
```

---

## 📋 ¿Qué hace?

✅ Login automático como **superadmin@inmova.com**  
✅ Verifica **20+ páginas** de la aplicación  
✅ Toma **screenshots** de cada página  
✅ Genera **reporte JSON** detallado  
✅ Verifica **botones**, **formularios** y **navegación**

---

## 📊 Resultados

### Archivos generados:

```
superadmin-verification-report.json  ← Reporte completo
screenshots/                         ← Screenshots de cada página
  ├── 01-login-page.png
  ├── dashboard.png
  ├── edificios-lista.png
  ├── unidades-lista.png
  ├── contratos-lista.png
  └── ...
```

---

## 🔐 Credenciales

```
Email: superadmin@inmova.com
Password: superadmin123
```

Si no existen, crearlas con:
```bash
npx tsx scripts/create-super-admin.ts
```

---

## 📄 Documentación Completa

Ver: `VERIFICACION_COMPLETA_INMOVA.md`

---

## 🐛 Problemas Comunes

### "Cannot connect to server"
```bash
# Solución: Iniciar yarn dev primero
yarn dev
```

### "Module 'playwright' not found"
```bash
npm install playwright
npx playwright install chromium
```

### Ver reporte JSON
```bash
cat superadmin-verification-report.json | jq .
```

---

## ✅ Estado Actual

- ✅ Scripts creados y listos
- ✅ Playwright instalado
- ✅ Configuración completa
- ⚠️  **inmova.app** - DNS no configurado
- ⚠️  **workspace-inmova.vercel.app** - Protegido con SSO
- ✅  **localhost:3000** - Funcional ← **USAR ESTA**

---

## 🎨 Ejemplo de Salida

```
==================================================
🔍 VERIFICACIÓN COMPLETA DE INMOVA (LOCALHOST)
==================================================
🔐 Usuario: superadmin@inmova.com
🌐 URL: http://localhost:3000
==================================================

🔐 Iniciando sesión...
✅ Login exitoso

📋 Verificando páginas principales...
✅ Dashboard - OK
✅ Edificios - Lista - OK
✅ Unidades - Lista - OK
✅ Contratos - Lista - OK
[...]

📈 RESUMEN:
  ✅ Exitosos: 18
  ❌ Errores: 1
  📊 Tasa de éxito: 90.0%
```

---

**¡Listo para usar!** 🚀

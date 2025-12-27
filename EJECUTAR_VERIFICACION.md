# 🚀 CÓMO EJECUTAR LA VERIFICACIÓN DE SUPERADMIN

## ⚠️ PROBLEMA ACTUAL

El dominio **`inmova.app`** no está resolviendo. Necesitas elegir una de estas opciones:

## 📋 OPCIONES DISPONIBLES

### OPCIÓN 1: Ejecutar en Localhost ⚡ (MÁS RÁPIDO)

Si tienes la aplicación corriendo localmente:

```bash
# Terminal 1: Iniciar la aplicación
cd /workspace
yarn dev

# Terminal 2: Ejecutar las pruebas
cd /workspace
yarn test:e2e e2e/superadmin-full-check.spec.ts
```

### OPCIÓN 2: Configurar inmova.app y Ejecutar 🌐

#### Paso 1: Configurar DNS

1. Ve a tu proveedor de DNS (Cloudflare, GoDaddy, etc.)
2. Agrega un registro A o CNAME para `inmova.app`
3. Apúntalo a tu servidor/IP de Vercel

#### Paso 2: Verificar que Responde

```bash
# Verificar DNS
nslookup inmova.app

# Verificar HTTP
curl -I https://inmova.app
```

#### Paso 3: Ejecutar las Pruebas

```bash
cd /workspace
bash scripts/run-superadmin-check.sh
```

### OPCIÓN 3: Usar Dominio Alternativo 🔄

Si tu app está en otro dominio (ej: `tu-app.vercel.app`):

#### Paso 1: Actualizar Configuración

```bash
cd /workspace
nano playwright.production.config.ts
```

Cambiar la línea 18:

```typescript
baseURL: 'https://TU-DOMINIO-AQUI.vercel.app',
```

#### Paso 2: Ejecutar

```bash
yarn test:e2e --config=playwright.production.config.ts e2e/superadmin-full-check.spec.ts
```

## 📊 QUÉ ESPERAR

Las pruebas verificarán **30 páginas diferentes** y generarán:

✅ **Screenshots** de cada página (test-results/)  
✅ **Reporte HTML** interactivo  
✅ **Videos** de las pruebas (si fallan)  
✅ **Logs** detallados en consola

## ⏱️ TIEMPO ESTIMADO

- **Pruebas completas**: 5-10 minutos
- **Generación de reporte**: 1 minuto

## 📸 VER RESULTADOS

```bash
# Ver reporte HTML
npx playwright show-report playwright-report-production

# Ver screenshots
ls -la test-results/superadmin-*.png
```

## 🔐 CREDENCIALES

Las pruebas usan:

- **Email**: superadmin@inmova.com
- **Password**: superadmin123

Si no existe este usuario:

```bash
yarn tsx scripts/create-super-admin.ts
```

## 🆘 AYUDA RÁPIDA

### Error: "net::ERR_NAME_NOT_RESOLVED"

➡️ El dominio no resuelve. Usa Opción 1 o 2.

### Error: "Login failed"

➡️ Verifica las credenciales o crea el superadmin.

### Error: "Playwright not found"

➡️ Ejecuta: `yarn install`

---

**¿Tienes dudas?** Revisa: `/workspace/INFORME_VERIFICACION_SUPERADMIN.md`

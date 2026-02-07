# 🔧 Solución: Planes de Facturación y Tutorial

## 📋 Resumen de Problemas

1. ❌ **Planes de facturación no aparecen** - La API falla
2. ❌ **Tutorial no aparece** al hacer login

## ✅ Solución Implementada

He creado **2 APIs de administración** que solucionan ambos problemas:

### 1. API de Seed de Planes
**Endpoint**: `GET /api/admin/seed-plans`

Carga 4 planes de suscripción en la base de datos:
- **Básico**: €49/mes (50 propiedades, 10 firmas/mes, 5GB storage)
- **Profesional**: €149/mes (200 propiedades, 50 firmas/mes, 25GB)
- **Empresarial**: €499/mes (ilimitado, 200 firmas/mes, 100GB)
- **Premium**: €999/mes (todo incluido, firmas ilimitadas, 500GB)

### 2. API de Reset Onboarding
**Endpoint**: `POST /api/admin/reset-onboarding`

Resetea el onboarding para que el tutorial aparezca de nuevo.

---

## 🚀 Cómo Ejecutarlo (PASO A PASO)

### ⚠️ PROBLEMA DETECTADO

El usuario `admin@inmova.app` **NO tiene rol SUPERADMIN**, por lo que no puede ejecutar estas APIs.

### Solución 1: Promover Usuario a SUPERADMIN (Recomendado)

Conectarse al servidor y ejecutar:

```bash
ssh root@157.180.119.236

# Navegar a la app
cd /opt/inmova-app

# Ejecutar comando inline
node -e "const { PrismaClient } = require('@prisma/client'); \
const prisma = new PrismaClient(); \
(async () => { \
  const user = await prisma.user.update({ \
    where: { email: 'admin@inmova.app' }, \
    data: { role: 'SUPERADMIN' } \
  }); \
  console.log('✅ Usuario actualizado:', user.email, '->', user.role); \
  await prisma.\$disconnect(); \
})().catch(e => console.error(e));"
```

### Solución 2: Usar Credenciales del Verdadero SUPERADMIN

Si existe otro usuario con rol SUPERADMIN, usar esas credenciales.

---

## 📝 Pasos Completos (Después de Promover a SUPERADMIN)

### 1. Abrir la App
```
https://inmovaapp.com/login
```

### 2. Hacer Login como SUPERADMIN
```
Email: admin@inmova.app
Password: Admin123!
```

### 3. Abrir DevTools
Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux) o `Cmd+Option+I` (Mac)

### 4. Ir a la pestaña "Console"

### 5. Ejecutar Seed de Planes
```javascript
fetch('/api/admin/seed-plans')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Seed de planes:', data);
    console.log(`Planes creados: ${data.summary.created}`);
    console.log(`Total en BD: ${data.summary.total}`);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Resultado Esperado**:
```json
{
  "success": true,
  "summary": {
    "created": 4,
    "skipped": 0,
    "total": 4,
    "companiesUpdated": 1
  },
  "plans": [
    { "nombre": "Básico", "tier": "basico", "precio": 49, "status": "created" },
    { "nombre": "Profesional", "tier": "profesional", "precio": 149, "status": "created" },
    ...
  ]
}
```

### 6. Reset Onboarding
```javascript
fetch('/api/admin/reset-onboarding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Onboarding reseteado:', data);
    console.log(`Usuarios actualizados: ${data.updated}`);
  })
  .catch(err => console.error('❌ Error:', err));
```

**Resultado Esperado**:
```json
{
  "success": true,
  "updated": 3,
  "total": 3,
  "users": [
    { "email": "admin@inmova.app", "status": "updated" },
    { "email": "test@inmova.app", "status": "updated" },
    { "email": "demo@inmova.app", "status": "updated" }
  ],
  "note": "Los usuarios deben limpiar localStorage: localStorage.clear()"
}
```

### 7. Limpiar localStorage
```javascript
localStorage.clear();
console.log('✅ localStorage limpiado');
```

### 8. Recargar Página
Presiona `F5` o `Ctrl+R` (Windows/Linux) o `Cmd+R` (Mac)

### 9. Hacer Login de Nuevo
```
Email: admin@inmova.app
Password: Admin123!
```

### 10. ✅ El Tutorial Debería Aparecer
Verás un modal de bienvenida con:
- "¡Bienvenido a Inmova! 🏠"
- Tour guiado paso a paso
- Botones: "Saltar", "Siguiente"

---

## 🔍 Verificación de Planes

### Verificar API Pública
```javascript
fetch('/api/public/subscription-plans')
  .then(res => res.json())
  .then(plans => {
    console.log(`✅ ${plans.length} planes disponibles:`);
    plans.forEach(p => {
      console.log(`  - ${p.nombre}: €${p.precioMensual}/mes`);
      console.log(`    Límites: ${p.signaturesIncludedMonth || '∞'} firmas, ${p.storageIncludedGB || '∞'}GB`);
    });
  });
```

### Verificar Página de Planes
```
https://inmovaapp.com/planes
```

Deberías ver 4 tarjetas de planes con:
- Nombres (Básico, Profesional, Empresarial, Premium)
- Precios (€49, €149, €499, €999)
- Límites de integraciones:
  - X firmas digitales/mes
  - XGB almacenamiento
  - X tokens IA/mes
  - X SMS/mes

---

## 🐛 Troubleshooting

### Error: "Permisos insuficientes"
**Causa**: El usuario no es SUPERADMIN

**Solución**: Ejecutar el comando SSH del paso "Solución 1" arriba

### Error: "Error obteniendo planes"
**Causa**: DATABASE_URL no está configurado o Prisma no puede conectar

**Solución**:
```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Verificar DATABASE_URL
grep DATABASE_URL .env.production

# Si está como placeholder, reemplazar con URL real
nano .env.production
# DATABASE_URL=postgresql://inmova_user:PASSWORD@localhost:5432/inmova_production

# Reiniciar PM2
pm2 restart inmova-app --update-env
```

### El Tutorial No Aparece Después de Todo
**Opciones**:

1. **Forzar reinicio completo de onboarding**:
```javascript
// En Console
localStorage.setItem('inmova-onboarding-YOUR_USER_ID', JSON.stringify({
  currentStep: 'welcome',
  completedSteps: [],
  hasSeenOnboarding: false
}));
location.reload();
```

2. **Verificar en BD si onboardingCompleted está en false**:
```bash
ssh root@157.180.119.236
cd /opt/inmova-app

node -e "const { PrismaClient } = require('@prisma/client'); \
const prisma = new PrismaClient(); \
(async () => { \
  const prefs = await prisma.userPreferences.findMany({ \
    where: { user: { email: 'admin@inmova.app' } }, \
    include: { user: { select: { email: true } } } \
  }); \
  console.log(prefs); \
  await prisma.\$disconnect(); \
})();"
```

3. **Verificar logs del navegador**:
```javascript
// En Console, verificar errores
console.log('Sesión:', sessionStorage);
console.log('Local:', localStorage);
```

---

## 📊 Estado Actual (Después de Deployment)

### ✅ Completado
- Scripts de seed creados (`seed-plans-and-fix-onboarding.ts`)
- APIs de admin implementadas:
  - `/api/admin/seed-plans`
  - `/api/admin/reset-onboarding`
- Deployment exitoso en producción
- Idiomas: 6 activos (es, en, pt, fr, de, it)
- Build sin errores

### ⚠️ Pendiente (Requiere Acción Manual)
- [ ] Promover `admin@inmova.app` a SUPERADMIN
- [ ] Ejecutar API de seed de planes
- [ ] Ejecutar API de reset de onboarding
- [ ] Limpiar localStorage del navegador
- [ ] Verificar que aparecen los 4 planes
- [ ] Verificar que aparece el tutorial al login

---

## 📞 Contacto y Soporte

Si después de seguir estos pasos los problemas persisten:

1. **Revisar logs de PM2**:
```bash
ssh root@157.180.119.236 'pm2 logs inmova-app --lines 100'
```

2. **Verificar estado de la app**:
```bash
curl https://inmovaapp.com/api/health
```

3. **Verificar consola del navegador** (F12) para errores de JavaScript

---

**Última actualización**: 5 de enero de 2026 - 09:30 UTC  
**Deployment**: ea6b77b8  
**Branch**: main

**Archivos Creados**:
- `/workspace/scripts/seed-plans-and-fix-onboarding.ts`
- `/workspace/app/api/admin/seed-plans/route.ts`
- `/workspace/app/api/admin/reset-onboarding/route.ts`
- `/workspace/scripts/execute-admin-apis.ts`

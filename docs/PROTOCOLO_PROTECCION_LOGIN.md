# 🔐 PROTOCOLO DE PROTECCIÓN DEL SISTEMA DE LOGIN

## 📋 Resumen Ejecutivo

Este documento establece el protocolo obligatorio para proteger el sistema de autenticación de INMOVA contra regresiones y errores introducidos por cambios de código.

**REGLA DE ORO**: Ningún deployment puede realizarse si el sistema de autenticación no pasa todas las verificaciones.

---

## 🚨 ARCHIVOS CRÍTICOS - NO MODIFICAR SIN AUTORIZACIÓN

Los siguientes archivos son críticos para el sistema de autenticación. Cualquier modificación requiere:
1. Revisión de código por un segundo desarrollador
2. Ejecución de todos los tests de autenticación
3. Verificación manual de login antes del deploy

### Archivos Protegidos:

```
lib/auth-options.ts          # Configuración de NextAuth
lib/auth-guard.ts            # Sistema de verificación de auth
lib/db.ts                    # Conexión a base de datos (usado en auth)
app/api/auth/[...nextauth]/route.ts  # Endpoint de NextAuth
app/login/page.tsx           # Página de login
prisma/schema.prisma         # Modelo User y campos de auth
```

---

## ✅ CHECKLIST PRE-DEPLOY OBLIGATORIO

### Antes de CADA deploy, ejecutar:

```bash
# 1. Verificación de sistema de auth
npx tsx scripts/verify-auth-before-deploy.ts

# 2. Tests unitarios de auth
npm test -- auth-system.test.ts

# 3. Regenerar cliente Prisma
npx prisma generate

# 4. Verificar que el build compila
npm run build

# 5. (En producción) Test manual de login
curl -X POST https://inmovaapp.com/api/auth/session
```

### Si CUALQUIERA de estos pasos falla: **ABORTAR EL DEPLOY**

---

## 🔒 PROTOCOLO DE CAMBIOS EN AUTENTICACIÓN

### Al modificar archivos de auth:

1. **Crear rama feature específica**
   ```bash
   git checkout -b fix/auth-[descripcion]
   ```

2. **Ejecutar tests ANTES del cambio**
   ```bash
   npm test -- auth-system.test.ts
   ```

3. **Hacer el cambio**
   - Mantener cambios mínimos y focalizados
   - Documentar el motivo del cambio
   - NO eliminar validaciones existentes

4. **Ejecutar tests DESPUÉS del cambio**
   ```bash
   npm test -- auth-system.test.ts
   npx tsx scripts/verify-auth-before-deploy.ts
   ```

5. **Test manual obligatorio**
   - Probar login con usuario admin
   - Probar login con usuario normal
   - Probar login con credenciales incorrectas
   - Verificar que el error es genérico (no revela info)

6. **Code Review obligatorio**
   - Mínimo 1 revisor
   - El revisor debe ejecutar los tests

---

## 📊 MONITORIZACIÓN CONTINUA

### Endpoints de Health Check:

| Endpoint | Descripción | Frecuencia |
|----------|-------------|------------|
| `/api/health` | Health general | Cada 1 min |
| `/api/health/auth` | Health de autenticación | Cada 5 min |
| `/api/auth/session` | Sesión de NextAuth | Cada 5 min |

### Alertas Automáticas:

Configurar alertas cuando:
- `/api/health/auth` retorna status != 200
- Más de 3 intentos de login fallidos consecutivos
- Error de conexión a base de datos
- NEXTAUTH_SECRET no está configurado

---

## 🛠️ TROUBLESHOOTING

### Error: "Login no funciona"

1. **Verificar logs**
   ```bash
   pm2 logs inmova-app --err --lines 50 | grep -i 'nextauth\|auth\|login'
   ```

2. **Ejecutar diagnóstico**
   ```bash
   curl https://inmovaapp.com/api/health/auth
   ```

3. **Verificar variables de entorno**
   ```bash
   echo $NEXTAUTH_SECRET | head -c 10  # Debe mostrar algo
   echo $NEXTAUTH_URL  # Debe ser la URL correcta
   echo $DATABASE_URL | head -c 20  # Debe mostrar conexión
   ```

4. **Verificar base de datos**
   ```bash
   npx prisma db push --accept-data-loss=false
   ```

5. **Regenerar Prisma client**
   ```bash
   npx prisma generate
   pm2 restart inmova-app --update-env
   ```

### Error: "Usuario admin no puede loguearse"

1. **Verificar usuario existe y está activo**
   ```sql
   SELECT email, activo, role FROM users WHERE role = 'super_admin';
   ```

2. **Resetear password de admin**
   ```bash
   npx tsx scripts/fix-auth-complete.ts
   ```

3. **Verificar hash de password**
   ```bash
   # El hash debe empezar con $2a$ o $2b$
   SELECT LEFT(password, 4) FROM users WHERE email = 'admin@inmova.app';
   ```

---

## 📝 REGISTRO DE CAMBIOS EN AUTH

Cualquier cambio en los archivos de autenticación debe registrarse aquí:

| Fecha | Desarrollador | Cambio | Tests |
|-------|--------------|--------|-------|
| 2026-01-09 | Sistema | Creación de protocolo | ✅ |
| | | | |

---

## 🎯 MÉTRICAS DE ÉXITO

El sistema de autenticación se considera saludable cuando:

- ✅ Todos los tests de `auth-system.test.ts` pasan
- ✅ `/api/health/auth` retorna `status: healthy`
- ✅ Login manual funciona para admin
- ✅ Login manual funciona para usuario normal
- ✅ Credenciales incorrectas muestran error genérico
- ✅ No hay errores de auth en logs (últimos 10 min)
- ✅ Tiempo de respuesta de login < 2 segundos

---

## ⚠️ PROHIBICIONES ABSOLUTAS

**NUNCA hacer esto:**

1. ❌ Deploy sin ejecutar `verify-auth-before-deploy.ts`
2. ❌ Modificar `auth-options.ts` sin tests
3. ❌ Eliminar campos del modelo User sin migración
4. ❌ Cambiar `NEXTAUTH_SECRET` sin rotar sesiones
5. ❌ Exponer mensajes de error detallados al usuario
6. ❌ Usar `runtime = 'edge'` en rutas de auth
7. ❌ Importar Prisma de forma síncrona en auth

---

## 📞 CONTACTO DE EMERGENCIA

Si el sistema de login falla en producción:

1. **Rollback inmediato** al último commit funcional
2. **Notificar** al equipo en el canal de emergencias
3. **Documentar** el incidente en este archivo
4. **Post-mortem** dentro de 24 horas

---

*Última actualización: 2026-01-09*
*Versión del protocolo: 1.0*

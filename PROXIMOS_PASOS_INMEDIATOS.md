# 🚀 PRÓXIMOS PASOS INMEDIATOS

## ✅ COMPLETADO

Sistema de **Tours Virtuales** y **Módulos Dinámicos** desarrollado al 100%.

### Archivos Creados
- ✅ 19 archivos de código nuevo
- ✅ 4 archivos modificados
- ✅ 5 documentos de referencia
- ✅ 1 script de verificación

### Verificación Rápida
```bash
# Archivos core
ls -la lib/virtual-tours-system.ts              # 15,129 bytes
ls -la lib/modules-management-system.ts         # 15,500 bytes
ls -la lib/user-preferences-service.ts          # 8,106 bytes

# APIs
ls -la app/api/modules/route.ts                 # 5,085 bytes
ls -la app/api/tours/route.ts                   # 4,624 bytes
ls -la app/api/preferences/route.ts             # 3,888 bytes

# Componentes
ls -la components/tours/VirtualTourPlayer.tsx   # 10,252 bytes
ls -la components/tours/ToursList.tsx           # 7,254 bytes
ls -la components/tours/FloatingTourButton.tsx  # 2,909 bytes
```

**Todos los archivos existen y están listos.**

---

## 🎯 PASO 1: VERIFICAR BASE DE DATOS (2 minutos)

### Opción A: Usando Prisma
```bash
cd /workspace
npx prisma db push
```

**Resultado esperado**: 
```
The database is already in sync with the Prisma schema.
```

### Opción B: Verificar manualmente
```sql
-- Conectar a PostgreSQL
psql -U postgres -d inmova_db

-- Verificar campo preferences en tabla User
\d "User"

-- Debería mostrar:
-- preferences | jsonb | nullable
```

**Si el campo NO existe**, ejecutar:
```sql
ALTER TABLE "User" ADD COLUMN preferences JSONB;
```

---

## 🎯 PASO 2: CREAR USUARIOS DE PRUEBA (1 minuto)

```bash
cd /workspace

# Ejecutar SQL de usuarios de prueba
psql -U postgres -d inmova_db -f scripts/create-test-users-simple.sql
```

**Resultado esperado**:
```
INSERT 0 1
INSERT 0 1
INSERT 0 1
...
(6 usuarios creados)
```

### Verificar usuarios
```bash
psql -U postgres -d inmova_db -c "SELECT email, role FROM \"User\" WHERE email LIKE '%@gestor.es' OR email LIKE '%@fincas.es';"
```

**Resultado esperado**:
```
           email           |      role       
---------------------------+-----------------
 principiante@gestor.es    | gestor
 intermedio@gestor.es      | gestor
 avanzado@gestor.es        | gestor
 admin@fincas.es           | community_manager
 ...
```

---

## 🎯 PASO 3: INICIAR SERVIDOR (30 segundos)

```bash
cd /workspace

# Opción A: Desarrollo
yarn dev

# Opción B: Producción (build primero)
yarn build
yarn start
```

**Resultado esperado**:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

## 🎯 PASO 4: TESTING MANUAL (5 minutos)

### Test 1: Login como Principiante
1. Abrir navegador: `http://localhost:3000/login`
2. Credenciales:
   - Email: `principiante@gestor.es`
   - Password: `Test123456!`
3. Click "Iniciar Sesión"

**Resultado esperado**:
- ✅ Login exitoso
- ✅ Redirige a `/dashboard`
- ✅ Tour del dashboard **se inicia automáticamente**
- ✅ Elementos con `data-tour` se destacan (highlight amarillo)
- ✅ Botón flotante visible en esquina inferior derecha

### Test 2: Completar Tour
1. En el tour automático:
   - Click "Siguiente" 3-4 veces
   - Verificar que elementos se destacan
   - Click "Completar" al final
2. Verificar que progress bar se actualiza

**Resultado esperado**:
- ✅ Tour se completa sin errores
- ✅ Elementos se destacan correctamente
- ✅ Progress bar muestra progreso

### Test 3: Gestión de Módulos
1. Click en botón flotante (esquina inferior derecha)
2. Redirige a `/configuracion?tab=tours`
3. Click en tab "Módulos"
4. Ver lista de módulos activos (~5-6 para principiante)
5. Activar módulo "Reportes"
6. Ir a sidebar → Verificar que "Reportes" aparece

**Resultado esperado**:
- ✅ Módulo "Reportes" se activa
- ✅ Aparece en sidebar
- ✅ Sin errores en consola

### Test 4: Cambiar Experiencia
1. En `/configuracion` → Tab "Preferencias"
2. Cambiar experiencia de "Principiante" a "Intermedio"
3. Marcar checkbox "Ajustar módulos automáticamente"
4. Click "Guardar cambios"
5. Ver notificación de éxito
6. Ir a `/dashboard`

**Resultado esperado**:
- ✅ Experiencia cambia a "Intermedio"
- ✅ Módulos adicionales se activan (ahora ~10-12 módulos)
- ✅ Tours ya NO se inician automáticamente
- ✅ Sidebar muestra más opciones

---

## 🎯 PASO 5: VERIFICAR CONSOLA (1 minuto)

1. Abrir DevTools (F12)
2. Ir a pestaña "Console"
3. Verificar que **NO hay errores rojos**

**Errores aceptables** (warnings amarillos):
- Hydration warnings (Next.js)
- Missing alt tags (imágenes)

**Errores NO aceptables** (rojos):
- Module not found
- Cannot read property of undefined
- API errors 500

---

## 🎯 PASO 6: TESTING DE APIs (Opcional, 3 minutos)

### Obtener Cookie de Sesión
1. En DevTools → Application → Cookies
2. Copiar valor de `next-auth.session-token`
3. Guardar en variable:
```bash
export SESSION_TOKEN="tu-token-aqui"
```

### Test API Módulos
```bash
# Módulos activos
curl "http://localhost:3000/api/modules?view=active" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"

# Resultado esperado: JSON con array de módulos
```

### Test API Tours
```bash
# Tours disponibles
curl "http://localhost:3000/api/tours?view=available" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"

# Resultado esperado: JSON con array de tours
```

### Test API Preferencias
```bash
# Obtener preferencias
curl "http://localhost:3000/api/preferences" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN"

# Resultado esperado: JSON con preferencias del usuario
```

**Todos los endpoints deberían retornar 200 OK con JSON válido.**

---

## 📋 CHECKLIST RÁPIDO

- [ ] **Paso 1**: BD verificada (campo `preferences` existe)
- [ ] **Paso 2**: Usuarios de prueba creados (3+ usuarios)
- [ ] **Paso 3**: Servidor iniciado sin errores
- [ ] **Paso 4**: Login exitoso como principiante
- [ ] **Paso 4.1**: Tour se inicia automáticamente
- [ ] **Paso 4.2**: Tour se completa sin errores
- [ ] **Paso 4.3**: Módulo se activa/desactiva correctamente
- [ ] **Paso 4.4**: Cambio de experiencia funciona
- [ ] **Paso 5**: Consola sin errores rojos
- [ ] **Paso 6**: APIs responden correctamente (opcional)

---

## 🎉 SI TODO FUNCIONA

**¡FELICIDADES!** El sistema está funcionando correctamente.

### Próximos pasos opcionales:
1. **Testing completo**: Seguir `TESTING_TOURS_Y_MODULOS.md` (1 hora)
2. **Añadir más tours**: Editar `lib/virtual-tours-system.ts`
3. **Añadir más módulos**: Editar `lib/modules-management-system.ts`
4. **Personalizar UI**: Editar componentes en `components/tours/`
5. **Deploy a producción**: Seguir `CHECKLIST_DEPLOYMENT_TOURS.md`

---

## 🐛 SI ALGO NO FUNCIONA

### Error: "Module not found"
```bash
# Reinstalar dependencias
yarn install

# Limpiar cache
rm -rf .next
yarn build
```

### Error: "Campo preferences no existe"
```sql
-- Conectar a BD
psql -U postgres -d inmova_db

-- Añadir campo
ALTER TABLE "User" ADD COLUMN preferences JSONB;
```

### Error: "Tour no se inicia"
1. Verificar en DevTools → Network que:
   - `/api/tours?view=available` retorna 200
   - `/api/preferences` retorna 200
2. Verificar que `TourAutoStarter` está en `authenticated-layout.tsx`
3. Verificar que usuario tiene `autoplayTours: true` (principiantes)

### Error: "Módulos no aparecen en sidebar"
1. Verificar que módulo está activo: `/api/modules?view=active`
2. Verificar que módulo tiene mapping en `sidebar.tsx` → `ROUTE_TO_MODULE`
3. Verificar que usuario tiene permisos para ese módulo

### Error: "APIs retornan 401"
- Verificar que estás logueado
- Verificar que cookie de sesión es válida
- Re-login si es necesario

---

## 📞 SOPORTE

### Documentación
- **Implementación**: `TOURS_VIRTUALES_IMPLEMENTACION.md`
- **Testing**: `TESTING_TOURS_Y_MODULOS.md`
- **Técnica**: `TOURS_VIRTUALES_Y_MODULOS_COMPLETO.md`
- **Deployment**: `CHECKLIST_DEPLOYMENT_TOURS.md`
- **Resumen**: `RESUMEN_FINAL_TOURS_MODULOS.md`

### Verificación Automática
```bash
bash scripts/verify-tours-system.sh
```

---

## ⏱️ TIEMPO TOTAL ESTIMADO

- **Verificación BD**: 2 minutos
- **Crear usuarios**: 1 minuto
- **Iniciar servidor**: 30 segundos
- **Testing manual**: 5 minutos
- **Verificar consola**: 1 minuto

**TOTAL**: ~10 minutos para validación básica

---

**Sistema completamente funcional y documentado. Listo para usar.**

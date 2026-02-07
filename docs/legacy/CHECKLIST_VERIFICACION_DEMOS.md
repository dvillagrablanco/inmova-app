# ✅ CHECKLIST DE VERIFICACIÓN - EMPRESAS DEMO

**Ejecutar después de deployment**  
**Fecha**: 1 de enero de 2026

---

## 🎯 OBJETIVO

Verificar que todas las empresas demo funcionan correctamente y tienen datos completos.

---

## 📋 VERIFICACIÓN EN BASE DE DATOS

### 1. Plan Demo Existe

```sql
SELECT * FROM "SubscriptionPlan" WHERE nombre = 'Demo';
```

**Esperado**:
- ✅ 1 registro con nombre 'Demo'
- ✅ precio_mensual = 0
- ✅ activo = false (no visible públicamente)
- ✅ tier = 'premium'

**Estado**: [ ]

---

### 2. Empresas Demo Creadas

```sql
SELECT id, nombre, email, "subscriptionPlanId" 
FROM "Company" 
WHERE email LIKE '%@demo.inmova.app%' 
ORDER BY nombre;
```

**Esperado**:
- ✅ 6 empresas con prefijo "DEMO -"
- ✅ Todas con emails `@demo.inmova.app`
- ✅ Todas con `subscriptionPlanId = [ID del Plan Demo]`

**Estado**: [ ]

---

### 3. Usuarios Demo

```sql
SELECT u.id, u.name, u.email, u.role, c.nombre as empresa
FROM "User" u
JOIN "Company" c ON u."companyId" = c.id
WHERE c.email LIKE '%@demo.inmova.app%'
ORDER BY c.nombre, u.email;
```

**Esperado**:
- ✅ 10 usuarios totales
- ✅ Todos con emails `@demo.inmova.app`
- ✅ Passwords hasheados (bcrypt)
- ✅ Roles asignados correctamente

**Estado**: [ ]

---

### 4. Edificios y Propiedades

```sql
SELECT 
    c.nombre as empresa,
    COUNT(DISTINCT b.id) as edificios,
    COUNT(DISTINCT p.id) as propiedades
FROM "Company" c
LEFT JOIN "Building" b ON b."companyId" = c.id
LEFT JOIN "Property" p ON p."companyId" = c.id
WHERE c.email LIKE '%@demo.inmova.app%'
GROUP BY c.nombre
ORDER BY c.nombre;
```

**Esperado**:

| Empresa | Edificios | Propiedades |
|---------|-----------|-------------|
| Propietario Individual | 2 | 5 |
| Gestor Profesional | 3 | 25 |
| Coliving Company | 2 | 27 |
| Alquiler Vacacional | 2 | 9 |
| Gestora Grande | 3 | 67 |
| Comunidad Propietarios | 2 | 42 |

**Estado**: [ ]

---

## 🔐 VERIFICACIÓN DE LOGIN

### Empresa 1: Propietario Individual

- [ ] URL: https://inmovaapp.com/login
- [ ] Email: `juan.propietario@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Redirige a dashboard
- [ ] ✅ Muestra nombre empresa: "DEMO - Propietario Individual"
- [ ] ✅ Muestra 5 propiedades

**Notas**: _________________________________

---

### Empresa 2: Gestor Profesional

#### Usuario 1: Administrador

- [ ] Email: `maria.gestora@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Muestra 25 propiedades
- [ ] ✅ Acceso a CRM

#### Usuario 2: Gestor

- [ ] Email: `carlos.asistente@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Permisos de gestor (no admin)

**Notas**: _________________________________

---

### Empresa 3: Coliving Company

#### Usuario 1: Administrador

- [ ] Email: `ana.coliving@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Muestra 27 propiedades
- [ ] ✅ Módulo Coliving visible

#### Usuario 2: Community Manager

- [ ] Email: `pedro.community@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Rol de community manager

**Notas**: _________________________________

---

### Empresa 4: Alquiler Vacacional

- [ ] Email: `luis.vacacional@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Muestra 9 propiedades
- [ ] ✅ Módulo STR visible

**Notas**: _________________________________

---

### Empresa 5: Gestora Grande

#### Usuario 1: Director

- [ ] Email: `roberto.director@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Muestra 67 propiedades
- [ ] ✅ Acceso completo (admin)

#### Usuario 2: Gestor

- [ ] Email: `laura.gestor@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Permisos de gestor

#### Usuario 3: Operador

- [ ] Email: `david.operador@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Permisos limitados (operador)

**Notas**: _________________________________

---

### Empresa 6: Comunidad Propietarios

- [ ] Email: `carmen.admin@demo.inmova.app`
- [ ] Password: `Demo123456!`
- [ ] ✅ Login exitoso
- [ ] ✅ Muestra 42 propiedades
- [ ] ✅ Módulo Comunidades visible

**Notas**: _________________________________

---

## 🏢 VERIFICACIÓN DE DATOS

### Para Cada Empresa, Verificar:

#### Dashboard

- [ ] Muestra estadísticas correctas
- [ ] Gráficos renderizan sin errores
- [ ] Filtros funcionan
- [ ] Sin errores en consola

#### Propiedades

- [ ] Listado de propiedades carga
- [ ] Filtros funcionan
- [ ] Búsqueda funciona
- [ ] Detalle de propiedad muestra datos completos

#### Edificios

- [ ] Listado de edificios
- [ ] Ubicaciones correctas
- [ ] Propiedades asociadas visibles

#### Inquilinos

- [ ] Listado de inquilinos (si los hay)
- [ ] Datos completos (nombre, email, DNI)
- [ ] Contratos asociados visibles

#### Contratos

- [ ] Listado de contratos activos
- [ ] Fechas correctas
- [ ] Montos correctos
- [ ] Estado: activo

---

## 🎨 VERIFICACIÓN VISUAL

### Elementos UI

- [ ] Logo empresa visible
- [ ] Menú lateral funcional
- [ ] Breadcrumbs correctos
- [ ] Footer presente
- [ ] Sin errores 404

### Responsive

- [ ] Desktop (> 1024px) OK
- [ ] Tablet (768px - 1024px) OK
- [ ] Mobile (< 768px) OK

### Performance

- [ ] Página carga en < 3 segundos
- [ ] Sin lag en navegación
- [ ] Sin errores en Network tab

---

## 🔧 VERIFICACIÓN FUNCIONAL

### Navegación

- [ ] Sidebar abre/cierra
- [ ] Links internos funcionan
- [ ] Breadcrumbs actualizan
- [ ] Back button funciona

### Formularios (si aplica)

- [ ] Validación funciona
- [ ] Submit funciona
- [ ] Mensajes de error claros
- [ ] Mensajes de éxito claros

### Modales

- [ ] Abren correctamente
- [ ] Cierran correctamente
- [ ] Overlay funciona
- [ ] Escape key cierra

---

## 📱 VERIFICACIÓN MOBILE

### Usando Chrome DevTools (Mobile Emulation)

#### iPhone 12 Pro

- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Menú hamburguesa funcional
- [ ] Listados scrolleables
- [ ] Touch targets adecuados

#### iPad Air

- [ ] Versión tablet funcional
- [ ] Layout adaptado

---

## 🚨 VERIFICACIÓN DE ERRORES

### Logs del Servidor

```bash
pm2 logs inmova-app --lines 100 --err
```

**Buscar**:
- [ ] No hay errores de Prisma
- [ ] No hay errores de autenticación
- [ ] No hay 500 errors

### Logs del Navegador

**En cada empresa demo**:
- [ ] Console: sin errores rojos
- [ ] Network: sin 404s, 500s
- [ ] Application: cookies OK

---

## 📊 RESUMEN FINAL

### Estadísticas

- **Empresas verificadas**: ___ / 6
- **Usuarios verificados**: ___ / 10
- **Logins exitosos**: ___ / 10
- **Datos completos**: ___ / 6
- **Errores encontrados**: ___

### Issues Encontrados

1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Acciones Correctivas

1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

---

## ✅ APROBACIÓN FINAL

- [ ] Todas las empresas demo funcionan
- [ ] Todos los usuarios pueden hacer login
- [ ] Datos completos y realistas
- [ ] Sin errores críticos
- [ ] Performance aceptable

**Verificado por**: _________________________________  
**Fecha**: _________________________________  
**Hora**: _________________________________

---

## 🎯 SIGUIENTE PASO

Si todo está ✅:
- [ ] Documentar en wiki interna
- [ ] Capacitar equipo comercial
- [ ] Crear videos demo
- [ ] Iniciar uso en demos reales

Si hay ❌:
- [ ] Documentar issues
- [ ] Priorizar fixes
- [ ] Re-ejecutar deployment
- [ ] Re-verificar

---

**Estado General**: [ ] ✅ APROBADO  |  [ ] ⚠️ CON OBSERVACIONES  |  [ ] ❌ RECHAZADO

**Observaciones adicionales**:

___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**Documento**: Checklist de Verificación Empresas Demo  
**Versión**: 1.0.0  
**Fecha**: 1 de enero de 2026

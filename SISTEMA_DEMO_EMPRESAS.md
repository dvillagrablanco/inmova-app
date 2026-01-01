# 🎭 SISTEMA DE EMPRESAS DEMO - DOCUMENTACIÓN COMPLETA

**Fecha**: 1 de enero de 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado

---

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema completo de empresas demo** con datos precargados para facilitar demostraciones a potenciales clientes. Incluye:

- ✅ **Plan Demo** especial (€0/mes, todas las funcionalidades)
- ✅ **6 empresas demo** con diferentes perfiles de cliente
- ✅ **Datos completos**: edificios, propiedades, inquilinos, contratos
- ✅ **Subscripción obligatoria** para todas las empresas
- ✅ **Scripts automatizados** para setup completo

---

## 🎯 Objetivos

### 1. Facilitar Demostraciones
- Empresas precargadas con datos realistas
- Diferentes perfiles de cliente (propietario, gestor, coliving, etc.)
- Login rápido sin necesidad de configuración

### 2. Plan Obligatorio
- Todas las empresas deben tener un plan asignado
- Campo `subscriptionPlanId` ahora es obligatorio
- Migración automática de empresas existentes

### 3. Gestión de Demos
- Plan Demo especial solo para superadmin
- Sin costo, sin limitaciones
- Todas las funcionalidades activas

---

## 💳 PLAN DEMO

### Características

| Atributo | Valor |
|----------|-------|
| **Nombre** | Demo |
| **Precio** | €0/mes (gratis) |
| **Tier** | Premium |
| **Usuarios** | Ilimitados |
| **Propiedades** | Ilimitadas |
| **Verticales** | 6 (todos) |
| **Módulos** | Todos incluidos |
| **Visible públicamente** | ❌ No (solo para superadmin) |

### Módulos Incluidos

- ✅ Todas las funcionalidades Enterprise
- ✅ Datos demo precargados
- ✅ Todos los módulos transversales
- ✅ Sin limitaciones
- ✅ Acceso completo

### Uso

**Solo para**:
- Demostraciones del superadministrador
- Testing de funcionalidades
- Presentaciones a clientes potenciales

**NO para**:
- Clientes reales
- Uso en producción sin conversión a plan de pago

---

## 🏢 EMPRESAS DEMO CREADAS

### 1. DEMO - Propietario Individual

**Perfil**: Propietario con pocas propiedades

**Datos**:
- 📧 Email: demo-propietario@inmova.app
- 🏢 Edificios: 2
- 🏠 Propiedades: 5
- 👥 Usuarios: 1
- 📊 Plan sugerido: **Basic** (€49/mes)

**Credenciales**:
```
Email: juan.propietario@demo.inmova.app
Password: Demo123456!
Rol: Administrador
```

**Casos de uso**:
- Demo de funcionalidades básicas
- Gestión de pocas propiedades
- Portal inquilino básico
- Contratos digitales

**Edificios**:
1. Edificio Salamanca (3 propiedades)
2. Piso Retiro (2 propiedades)

---

### 2. DEMO - Gestor Profesional

**Perfil**: Gestor inmobiliario con portfolio mediano

**Datos**:
- 📧 Email: demo-gestor@inmova.app
- 🏢 Edificios: 3
- 🏠 Propiedades: 25
- 👥 Usuarios: 2 (Administrador + Gestor)
- 📊 Plan sugerido: **Professional** (€149/mes)

**Credenciales**:
```
1. Email: maria.gestora@demo.inmova.app
   Password: Demo123456!
   Rol: Administrador

2. Email: carlos.asistente@demo.inmova.app
   Password: Demo123456!
   Rol: Gestor
```

**Casos de uso**:
- CRM inmobiliario
- Gestión de múltiples propiedades
- Automatizaciones
- Informes y analytics
- Multi-usuario

**Edificios**:
1. Edificio Eixample (8 propiedades)
2. Edificio Gracia (7 propiedades)
3. Apartamentos Barceloneta (10 propiedades)

---

### 3. DEMO - Coliving Company

**Perfil**: Empresa de coliving / co-housing

**Datos**:
- 📧 Email: demo-coliving@inmova.app
- 🏢 Edificios: 2
- 🏠 Propiedades: 27 habitaciones
- 👥 Usuarios: 2 (Admin + Community Manager)
- 📊 Plan sugerido: **Business** (€349/mes)
- 🎯 Vertical: **Coliving**

**Credenciales**:
```
1. Email: ana.coliving@demo.inmova.app
   Password: Demo123456!
   Rol: Administrador

2. Email: pedro.community@demo.inmova.app
   Password: Demo123456!
   Rol: Community Manager
```

**Casos de uso**:
- Gestión de espacios compartidos
- Eventos y comunidad
- Matching de inquilinos
- Gestión de paquetes (habitación + servicios)
- Portal inquilino con funcionalidades sociales

**Edificios**:
1. Coliving Ruzafa (12 habitaciones)
2. Coliving Benimaclet (15 habitaciones)

---

### 4. DEMO - Alquiler Vacacional (STR)

**Perfil**: Empresa de alquiler vacacional

**Datos**:
- 📧 Email: demo-vacacional@inmova.app
- 🏢 Edificios: 2
- 🏠 Propiedades: 9
- 👥 Usuarios: 1
- 📊 Plan sugerido: **Professional** (€149/mes)
- 🎯 Vertical: **STR (Short-Term Rental)**

**Credenciales**:
```
Email: luis.vacacional@demo.inmova.app
Password: Demo123456!
Rol: Administrador
```

**Casos de uso**:
- Gestión de alquiler vacacional
- Precios dinámicos (pricing IA)
- Tours virtuales
- Sincronización con Airbnb/Booking
- Calendario de disponibilidad

**Edificios**:
1. Apartamentos Playa (6 propiedades)
2. Villa Marbella (3 propiedades)

---

### 5. DEMO - Gestora Inmobiliaria Grande

**Perfil**: Gestora con portfolio grande y diversificado

**Datos**:
- 📧 Email: demo-gestora-grande@inmova.app
- 🏢 Edificios: 3
- 🏠 Propiedades: 67
- 👥 Usuarios: 3 (Director + Gestor + Operador)
- 📊 Plan sugerido: **Business/Enterprise** (€349+/mes)
- 🎯 Vertical: **Mixto** (residencial + comercial + oficinas)

**Credenciales**:
```
1. Email: roberto.director@demo.inmova.app
   Password: Demo123456!
   Rol: Administrador

2. Email: laura.gestor@demo.inmova.app
   Password: Demo123456!
   Rol: Gestor

3. Email: david.operador@demo.inmova.app
   Password: Demo123456!
   Rol: Operador
```

**Casos de uso**:
- Multi-empresa
- Todos los módulos
- Workflows personalizados
- Integraciones avanzadas
- Account manager
- Reporting avanzado

**Edificios**:
1. Edificio Oficinas Centro (20 propiedades)
2. Residencial Las Rozas (35 propiedades)
3. Locales Comerciales (12 propiedades)

---

### 6. DEMO - Comunidad de Propietarios

**Perfil**: Administrador de fincas / comunidades

**Datos**:
- 📧 Email: demo-comunidad@inmova.app
- 🏢 Edificios: 2 comunidades
- 🏠 Propiedades: 42
- 👥 Usuarios: 1
- 📊 Plan sugerido: **Professional** (€149/mes)
- 🎯 Vertical: **Comunidades**

**Credenciales**:
```
Email: carmen.admin@demo.inmova.app
Password: Demo123456!
Rol: Administrador
```

**Casos de uso**:
- Gestión de comunidades
- Libro de actas
- Votaciones
- Gastos comunes
- Derramas
- Convocatorias de junta

**Edificios**:
1. Comunidad Triana (24 propiedades)
2. Comunidad Nervión (18 propiedades)

---

## 📊 RESUMEN DE EMPRESAS DEMO

| Empresa | Propiedades | Usuarios | Vertical | Plan Sugerido |
|---------|-------------|----------|----------|---------------|
| Propietario Individual | 5 | 1 | Tradicional | Basic |
| Gestor Profesional | 25 | 2 | Tradicional | Professional |
| Coliving Company | 27 | 2 | Coliving | Business |
| Alquiler Vacacional | 9 | 1 | STR | Professional |
| Gestora Grande | 67 | 3 | Mixto | Business/Enterprise |
| Comunidad Propietarios | 42 | 1 | Comunidades | Professional |
| **TOTAL** | **175** | **10** | - | - |

---

## 🛠️ SCRIPTS IMPLEMENTADOS

### 1. `seed-subscription-plans.ts`

**Propósito**: Crear/actualizar planes de suscripción

**Incluye**:
- Plan Basic (€49/mes)
- Plan Professional (€149/mes)
- Plan Business (€349/mes)
- Plan Enterprise (€2,000+/mes)
- Plan Partner Referral (variable)
- **Plan Demo (€0/mes)** ⭐

**Ejecución**:
```bash
npx tsx scripts/seed-subscription-plans.ts
```

---

### 2. `migrate-companies-to-plans.ts`

**Propósito**: Asignar planes a empresas existentes sin plan

**Lógica**:
- 0-5 propiedades → Basic
- 6-25 propiedades → Professional
- 26+ propiedades → Business

**Ejecución**:
```bash
npx tsx scripts/migrate-companies-to-plans.ts
```

---

### 3. `cleanup-demo-companies.ts`

**Propósito**: Eliminar empresas demo/test antiguas

**Detecta empresas con keywords**:
- test, demo, prueba, ejemplo
- fake, sample, acme, foo, bar
- empresa test, company test

**Ejecución**:
```bash
npx tsx scripts/cleanup-demo-companies.ts
```

---

### 4. `seed-demo-companies.ts`

**Propósito**: Crear 6 empresas demo con datos completos

**Genera para cada empresa**:
- ✅ Empresa con datos completos
- ✅ Usuarios con credenciales
- ✅ Edificios con ubicaciones reales
- ✅ Propiedades con características variadas
- ✅ Inquilinos demo (para propiedades alquiladas)
- ✅ Contratos activos

**Ejecución**:
```bash
npx tsx scripts/seed-demo-companies.ts
```

---

### 5. `setup-demo-system.sh` (SCRIPT MAESTRO)

**Propósito**: Ejecutar todo el proceso en orden

**Pasos que ejecuta**:
1. Seed de planes (incluye Demo)
2. Migrar empresas existentes
3. Limpiar empresas demo antiguas
4. Crear empresas demo nuevas
5. Verificar en base de datos

**Ejecución**:
```bash
bash scripts/setup-demo-system.sh
```

**Output**: Muestra credenciales de todas las empresas demo

---

## 📝 CAMBIOS EN SCHEMA PRISMA

### Antes

```prisma
model Company {
  // ...
  subscriptionPlanId String?
  subscriptionPlan   SubscriptionPlan? @relation(fields: [subscriptionPlanId], references: [id])
  // ...
}
```

### Después

```prisma
model Company {
  // ...
  subscriptionPlanId String // ✅ Ahora OBLIGATORIO
  subscriptionPlan   SubscriptionPlan @relation(fields: [subscriptionPlanId], references: [id])
  // ...
}
```

### Migración

```bash
# Después de actualizar schema.prisma
npx prisma migrate dev --name make_subscription_plan_required
```

---

## 🚀 DEPLOYMENT

### Desarrollo Local

```bash
# Setup completo
bash scripts/setup-demo-system.sh

# Verificar en BD
psql $DATABASE_URL -c "SELECT nombre, email FROM \"Company\" WHERE email LIKE '%@demo.inmova.app%';"
```

---

### Producción

```bash
# Conectar al servidor
ssh root@157.180.119.236
cd /opt/inmova-app

# Copiar scripts
# (O hacer git pull si ya están commiteados)

# Ejecutar setup
bash scripts/setup-demo-system.sh

# Aplicar migración de schema
npx prisma migrate deploy

# Build y reload
npm run build
pm2 reload inmova-app
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Pre-Setup

- [ ] Base de datos accesible
- [ ] Prisma Client generado (`npx prisma generate`)
- [ ] Variables de entorno configuradas

### Post-Setup

- [ ] Plan Demo creado (€0/mes)
- [ ] 6 empresas demo creadas
- [ ] Todas con subscriptionPlanId asignado
- [ ] Usuarios demo creados (10 usuarios)
- [ ] Edificios creados (15 edificios)
- [ ] Propiedades creadas (175 propiedades)
- [ ] Inquilinos y contratos generados

### Verificación Manual

- [ ] Login con cada usuario demo funciona
- [ ] Dashboard muestra datos correctos
- [ ] Edificios y propiedades visibles
- [ ] Inquilinos listados
- [ ] Contratos activos visibles

---

## 💡 CASOS DE USO

### Demo para Cliente Small (Propietario)

**Usar**: DEMO - Propietario Individual

**Mostrar**:
- Dashboard simple
- Gestión de 5 propiedades
- Portal inquilino básico
- Contratos digitales
- App móvil

**Pitch**: "Con solo €49/mes, digitaliza tu gestión"

---

### Demo para Cliente Medium (Gestor)

**Usar**: DEMO - Gestor Profesional

**Mostrar**:
- CRM con leads
- 25 propiedades organizadas
- Multi-usuario (2 personas)
- Automatizaciones
- Informes personalizados

**Pitch**: "€149/mes, mismo precio que 1 hora de gestoría"

---

### Demo para Cliente Large (Gestora)

**Usar**: DEMO - Gestora Inmobiliaria Grande

**Mostrar**:
- 67 propiedades diversas
- 3 usuarios con roles diferentes
- Workflows personalizados
- Reporting avanzado
- Multi-empresa

**Pitch**: "€349/mes para gestionar ilimitado"

---

### Demo por Vertical

| Vertical | Empresa Demo | Destacar |
|----------|--------------|----------|
| Coliving | DEMO - Coliving Company | Eventos, matching, paquetes |
| STR | DEMO - Alquiler Vacacional | Precios dinámicos, tours VR |
| Comunidades | DEMO - Comunidad Propietarios | Votaciones, gastos comunes |
| Mixto | DEMO - Gestora Grande | Flexibilidad, todo en uno |

---

## 🔐 SEGURIDAD

### Credenciales Demo

**Importante**:
- ✅ Todas las contraseñas son: `Demo123456!`
- ✅ Emails terminan en `@demo.inmova.app`
- ✅ Datos ficticios, no usar en producción real

### Restricciones

- ❌ Plan Demo NO visible en página pública de planes
- ❌ Solo superadmin puede asignar plan Demo
- ❌ Empresas demo claramente marcadas con prefijo "DEMO -"

### Limpieza

```bash
# Eliminar todas las empresas demo
npx tsx scripts/cleanup-demo-companies.ts

# Re-crear si es necesario
npx tsx scripts/seed-demo-companies.ts
```

---

## 📊 MÉTRICAS Y MONITOREO

### Queries Útiles

```sql
-- Ver todas las empresas demo
SELECT nombre, email, "subscriptionPlanId" 
FROM "Company" 
WHERE email LIKE '%@demo.inmova.app%';

-- Contar propiedades por empresa demo
SELECT c.nombre, COUNT(p.id) as propiedades
FROM "Company" c
LEFT JOIN "Property" p ON p."companyId" = c.id
WHERE c.email LIKE '%@demo.inmova.app%'
GROUP BY c.nombre;

-- Ver usuarios demo
SELECT u.name, u.email, u.role, c.nombre as empresa
FROM "User" u
JOIN "Company" c ON u."companyId" = c.id
WHERE c.email LIKE '%@demo.inmova.app%';

-- Ver plan Demo
SELECT * FROM "SubscriptionPlan" WHERE nombre = 'Demo';
```

---

## 🐛 TROUBLESHOOTING

### Error: Plan Demo no encontrado

**Solución**:
```bash
npx tsx scripts/seed-subscription-plans.ts
```

---

### Error: subscriptionPlanId requerido

**Causa**: Schema actualizado pero empresas sin plan

**Solución**:
```bash
npx tsx scripts/migrate-companies-to-plans.ts
npx prisma migrate dev --name make_plan_required
```

---

### Empresas demo no se crean

**Verificar**:
1. Plan Demo existe
2. No hay empresas con mismos emails
3. Base de datos accesible

**Solución**:
```bash
# Limpiar y re-crear
npx tsx scripts/cleanup-demo-companies.ts
npx tsx scripts/seed-demo-companies.ts
```

---

## 📚 ARCHIVOS RELACIONADOS

### Scripts
- `/scripts/seed-subscription-plans.ts`
- `/scripts/migrate-companies-to-plans.ts`
- `/scripts/cleanup-demo-companies.ts`
- `/scripts/seed-demo-companies.ts`
- `/scripts/setup-demo-system.sh`

### Schema
- `/prisma/schema.prisma` (Company model actualizado)

### Documentación
- `/PLANES_PRECIOS_ACTUALIZADOS.md`
- `/SISTEMA_DEMO_EMPRESAS.md` (este archivo)

---

## 🎯 PRÓXIMOS PASOS

### Inmediato
1. ✅ Ejecutar `setup-demo-system.sh` en desarrollo
2. ✅ Verificar que todas las empresas demo funcionan
3. ✅ Probar login con cada usuario demo
4. ✅ Verificar datos cargados

### Esta Semana
1. Deploy a producción
2. Capacitar al equipo en uso de empresas demo
3. Crear video demo de cada perfil de cliente
4. Documentar mejores prácticas de demostración

### Este Mes
1. Añadir más datos demo (pagos, incidencias, documentos)
2. Script para refrescar datos demo periódicamente
3. Dashboard especial para ver estado de empresas demo
4. Métricas de uso de empresas demo

---

## 📞 CONTACTO Y SOPORTE

**Responsable**: Equipo Inmova  
**Email**: tech@inmovaapp.com  
**Documentación**: `/docs/demos`

---

**✅ Estado**: Implementado y listo para uso  
**📅 Próxima revisión**: 7 de enero de 2026  
**🎯 Objetivo**: Facilitar demostraciones de alta calidad

---

**Última actualización**: 1 de enero de 2026, 23:30 UTC  
**Versión**: 1.0.0  
**Mantenido por**: Equipo Inmova

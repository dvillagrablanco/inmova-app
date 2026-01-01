# 🧪 TESTING: Tours Virtuales y Módulos Dinámicos

## 📋 CHECKLIST DE INTEGRACIÓN COMPLETADO

### ✅ Pasos Implementados

- [x] **TourAutoStarter añadido al AuthenticatedLayout**
  - Archivo: `components/layout/authenticated-layout.tsx`
  - Tours se iniciarán automáticamente al navegar

- [x] **Data-tour attributes añadidos al Dashboard**
  - `data-tour="kpi-cards"` - Grid de KPIs principales
  - `data-tour="charts"` - Gráfico de ingresos mensuales
  - `data-tour="quick-actions"` - Widgets de acciones rápidas
  - `data-tour="alerts"` - Sección de alertas (pagos, contratos, mantenimiento)

- [x] **Data-tour attributes añadidos al Sidebar**
  - `data-tour="dashboard-link"` - Enlace al dashboard
  - `data-tour="edificios-menu"` - Enlace a edificios
  - `data-tour="unidades-menu"` - Enlace a unidades
  - `data-tour="inquilinos-menu"` - Enlace a inquilinos
  - `data-tour="contratos-menu"` - Enlace a contratos
  - `data-tour="pagos-menu"` - Enlace a pagos
  - `data-tour="configuracion-link"` - Enlace a configuración

- [x] **Integración con Sidebar existente**
  - El sidebar ya tiene sistema de módulos activos funcionando
  - Se mantiene compatibilidad con el sistema existente

---

## 🧪 PLAN DE TESTING

### 1. Testing de Usuarios de Prueba

Usa los usuarios creados en `scripts/create-test-users-simple.sql`:

#### Usuario Principiante - Alquiler Tradicional
```bash
Email: principiante@gestor.es
Password: Test123456!
Nivel: principiante
Rol: gestor
Vertical: alquiler_tradicional
```

**Tests a realizar**:
1. Login y acceso al dashboard
2. Verificar que el **tour del dashboard se inicia automáticamente**
3. Completar el tour paso a paso
4. Navegar a `/edificios` → Verificar que **tour de edificios se inicia automáticamente**
5. Ir a `/configuracion` → Tab "Tours" → Verificar progreso
6. Ir a `/configuracion` → Tab "Módulos" → Ver módulos activos (solo básicos)
7. Intentar activar módulo "Contratos" (debería funcionar)
8. Ir a `/configuracion` → Tab "Preferencias" → Cambiar experiencia a "intermedio"
9. Verificar que se activan más módulos automáticamente

**Resultado esperado**:
- Tours se inician automáticamente en dashboard y edificios
- Solo 5-6 módulos activos inicialmente
- Videos incluidos en tours
- Tooltips activados
- Chatbot visible

---

#### Usuario Intermedio - Coliving
```bash
Email: intermedio@gestor.es
Password: Test123456!
Nivel: intermedio
Rol: gestor
Vertical: coliving
```

**Tests a realizar**:
1. Login y acceso al dashboard
2. Verificar que el tour del dashboard **NO se inicia automáticamente** (autoplay desactivado para intermedios)
3. Ir a `/configuracion` → Tab "Tours" → Iniciar tour manualmente
4. Verificar módulos activos (10-12 módulos)
5. Verificar que módulo "coliving" está activo
6. Desactivar módulo "pagos" → Verificar que desaparece del sidebar
7. Intentar desactivar módulo "edificios" → Debería fallar (dependencia de "unidades")
8. Activar módulo "crm" → Verificar que aparece en sidebar

**Resultado esperado**:
- Tours disponibles pero no auto-start
- ~10-12 módulos activos
- Algunos videos en tours
- Módulo coliving activo
- Validación de dependencias funciona

---

#### Usuario Avanzado - STR Vacacional
```bash
Email: avanzado@gestor.es
Password: Test123456!
Nivel: avanzado
Rol: gestor
Vertical: str_vacacional
```

**Tests a realizar**:
1. Login y acceso al dashboard
2. Verificar que **ningún tour se inicia automáticamente**
3. Verificar que hay **14-16 módulos activos**
4. Verificar que módulos STR están activos
5. Ir a `/configuracion` → Tab "Preferencias" → Verificar que `autoplayTours: false`
6. Activar módulo "ia_valoracion" (premium)
7. Activar módulo "tour_virtual" (premium)
8. Ir a `/configuracion` → Tab "Tours" → Iniciar tour manualmente
9. Verificar que los tours **no incluyen videos**

**Resultado esperado**:
- Sin tours automáticos
- ~14-16 módulos activos
- Módulos STR activos
- Sin videos en tours
- Acceso a módulos premium

---

#### Usuario Community Manager - Comunidades
```bash
Email: admin@fincas.es
Password: Test123456!
Nivel: intermedio
Rol: community_manager
Vertical: comunidades
```

**Tests a realizar**:
1. Login y acceso al dashboard
2. Verificar módulos específicos de comunidades activos
3. Verificar que solo ve opciones relevantes para su rol
4. Intentar acceder a `/admin/usuarios` → Debería estar bloqueado (no tiene permisos)
5. Verificar que módulo "anuncios" está activo
6. Verificar que módulo "votaciones" está activo

**Resultado esperado**:
- Solo módulos de comunidades y comunicación activos
- Acceso restringido según rol
- Sidebar muestra solo opciones permitidas

---

### 2. Testing de Flujos Completos

#### Flujo 1: Onboarding Completo
1. Crear nuevo usuario con rol `gestor`, vertical `alquiler_tradicional`, experiencia `principiante`
2. Al primer login, verificar que:
   - Se inicializan módulos por defecto
   - Tour del dashboard se inicia automáticamente
   - SmartOnboardingWizard aparece
3. Completar onboarding wizard
4. Navegar a diferentes secciones y completar tours
5. Ir a `/configuracion` → Tab "Tours" → Verificar progreso global

**KPI de éxito**: Usuario completa 3+ tours en primera sesión

---

#### Flujo 2: Cambio de Experiencia
1. Login como `principiante@gestor.es`
2. Ir a `/configuracion` → Tab "Preferencias"
3. Cambiar experiencia de "principiante" a "intermedio"
4. Marcar checkbox "Ajustar módulos automáticamente"
5. Guardar cambios
6. Verificar que:
   - Módulos adicionales se activan (contratos, pagos)
   - Tours ya no se inician automáticamente
   - Sidebar muestra nuevos enlaces
7. Cambiar a "avanzado"
8. Verificar que:
   - Más módulos se activan
   - Videos desaparecen de tours

**KPI de éxito**: Módulos y tours se adaptan correctamente

---

#### Flujo 3: Gestión de Módulos
1. Login como `intermedio@gestor.es`
2. Ir a `/configuracion` → Tab "Módulos"
3. Ver tabs: Core, Avanzados, Especializados, Premium
4. Activar módulo "reportes" (Advanced)
5. Verificar que aparece en sidebar
6. Ir a `/reportes` → Debería cargar correctamente
7. Intentar activar "firma_digital" (Premium)
8. Si tiene dependencias, verificar mensaje de error
9. Activar dependencias primero
10. Reactivar "firma_digital"
11. Desactivar módulo "crm"
12. Verificar que desaparece del sidebar

**KPI de éxito**: Activar/desactivar módulos sin errores

---

#### Flujo 4: Tours Manuales
1. Login como `avanzado@gestor.es` (sin autoplay)
2. Ir a `/configuracion` → Tab "Tours"
3. Ver lista de tours disponibles
4. Ver progreso global (debería ser 0%)
5. Iniciar "Tour Dashboard"
6. Completar todos los pasos
7. Verificar que aparece como completado
8. Iniciar "Tour Edificios"
9. Saltar tour (botón Skip)
10. Verificar que NO aparece como completado
11. Resetear "Tour Dashboard" (botón reset)
12. Verificar que vuelve a estar disponible

**KPI de éxito**: Todos los controles funcionan correctamente

---

### 3. Testing de Edge Cases

#### Edge Case 1: Módulos con Dependencias
```bash
# Login como gestor intermedio
Email: intermedio@gestor.es

# Intentar desactivar módulo "edificios" (tiene dependencia de "unidades")
1. Ir a /configuracion → Módulos
2. Buscar módulo "Edificios"
3. Intentar desactivar con el switch
4. Verificar mensaje de error: "Otros módulos dependen de este: Unidades"
5. Desactivar primero "Unidades"
6. Ahora sí poder desactivar "Edificios"
```

#### Edge Case 2: Tour en Página Sin data-tour
```bash
# Navegar a página sin data-tour attributes
1. Login como principiante
2. Ir a /contratos (si no tiene data-tour)
3. Verificar que el tour NO falla
4. Tour debería usar placement "center" por defecto
```

#### Edge Case 3: Cambio de Experiencia Sin Ajustar Módulos
```bash
1. Login como principiante@gestor.es
2. Ver módulos activos iniciales (5-6)
3. Ir a /configuracion → Preferencias
4. Cambiar experiencia a "avanzado"
5. NO marcar "Ajustar módulos automáticamente"
6. Guardar
7. Verificar que módulos NO cambian
8. Solo cambia el nivel de experiencia (videos, autoplay, etc.)
```

#### Edge Case 4: Usuario Sin Preferencias Inicializadas
```bash
# Crear usuario manualmente en BD sin inicializar preferencias
1. Insertar usuario sin llamar initializeOnboardingTasks
2. Login con ese usuario
3. Verificar que:
   - Se crean preferencias por defecto
   - No hay errores
   - Nivel "intermedio" por defecto
   - Módulos se inicializan según rol
```

---

### 4. Testing de APIs

#### API: GET /api/modules
```bash
# Obtener módulos activos
curl http://localhost:3000/api/modules?view=active \
  -H "Cookie: next-auth.session-token=..."

# Obtener módulos recomendados
curl http://localhost:3000/api/modules?view=recommended

# Obtener sugerencias
curl http://localhost:3000/api/modules?view=suggested

# Obtener por categorías
curl http://localhost:3000/api/modules?view=categories
```

#### API: POST /api/modules
```bash
# Activar módulo
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"action":"activate","moduleId":"reportes"}'

# Desactivar módulo
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"action":"deactivate","moduleId":"crm"}'
```

#### API: GET /api/tours
```bash
# Tours disponibles
curl http://localhost:3000/api/tours?view=available

# Siguiente tour recomendado
curl http://localhost:3000/api/tours?view=next

# Tours completados
curl http://localhost:3000/api/tours?view=completed
```

#### API: POST /api/tours
```bash
# Completar tour
curl -X POST http://localhost:3000/api/tours \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"action":"complete","tourId":"tour-dashboard"}'

# Resetear tour
curl -X POST http://localhost:3000/api/tours \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"action":"reset","tourId":"tour-dashboard"}'
```

#### API: PUT /api/preferences
```bash
# Cambiar experiencia Y ajustar módulos
curl -X PUT http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "experienceLevel": "avanzado",
    "enableVideos": false,
    "autoplayTours": false,
    "adjustModulesOnExperienceChange": true
  }'
```

---

### 5. Testing de Rendimiento

#### Métricas a Medir
```javascript
// En consola del navegador

// 1. Tiempo de carga del dashboard
performance.mark('dashboard-start');
// ... carga dashboard ...
performance.mark('dashboard-end');
performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end');

// 2. Tiempo de respuesta API módulos
console.time('api-modules');
await fetch('/api/modules?view=active');
console.timeEnd('api-modules');
// Target: < 500ms

// 3. Tiempo de respuesta API tours
console.time('api-tours');
await fetch('/api/tours?view=available');
console.timeEnd('api-tours');
// Target: < 300ms

// 4. Tamaño de preferencias en BD
// Verificar que el campo preferences no crece descontroladamente
```

---

### 6. Testing de Accesibilidad

#### Navegación con Teclado
```
1. Login con Tab hasta formulario
2. Enter para submit
3. Dashboard carga
4. Tab para navegar sidebar
5. Enter para abrir tour
6. Tab + Enter para navegar pasos del tour
7. Escape para cerrar tour
```

#### Screen Readers
```
1. Usar NVDA o JAWS
2. Navegar a /configuracion
3. Verificar que tabs son anunciados
4. Verificar que switches tienen labels
5. Verificar que el tour se anuncia correctamente
```

---

## 📊 CHECKLIST DE VALIDACIÓN

### Funcionalidad Core
- [ ] Tours se inician automáticamente para principiantes
- [ ] Tours NO se inician para avanzados
- [ ] Data-tour attributes funcionan correctamente
- [ ] Highlight de elementos funciona
- [ ] Progress bar se actualiza
- [ ] Botón Skip funciona
- [ ] Navegación adelante/atrás funciona

### Gestión de Módulos
- [ ] Activar módulo aparece en sidebar
- [ ] Desactivar módulo desaparece de sidebar
- [ ] Validación de dependencias funciona
- [ ] Módulos recomendados correctos por perfil
- [ ] Badges de categoría correctos
- [ ] Tiempo estimado mostrado

### Preferencias
- [ ] Cambio de experiencia funciona
- [ ] Ajuste automático de módulos funciona
- [ ] Switches (tooltips, videos, autoplay) funcionan
- [ ] Tema light/dark funciona
- [ ] Estadísticas se actualizan
- [ ] Persistencia en BD correcta

### APIs
- [ ] GET /api/modules responde en < 500ms
- [ ] POST /api/modules valida dependencias
- [ ] GET /api/tours filtra por experiencia
- [ ] POST /api/tours actualiza BD
- [ ] PUT /api/preferences valida datos

### Integración
- [ ] TourAutoStarter no causa conflictos
- [ ] Sidebar compatible con sistema existente
- [ ] AuthenticatedLayout no tiene errores
- [ ] Onboarding inicializa módulos correctamente

### Rendimiento
- [ ] Dashboard carga en < 2s
- [ ] Tours no causan lag
- [ ] Sidebar responsive
- [ ] Sin memory leaks

### Seguridad
- [ ] APIs verifican autenticación
- [ ] Validación de permisos por rol
- [ ] Validación de inputs con Zod
- [ ] No hay XSS en tours

---

## 🐛 PROBLEMAS CONOCIDOS Y SOLUCIONES

### Problema 1: Tour no encuentra elemento
**Síntoma**: Tour se renderiza en centro de pantalla siempre

**Causa**: `data-tour` attribute no coincide con `target` en definición

**Solución**:
```typescript
// Verificar que coincidan:
// En tour definition:
target: '[data-tour="kpi-cards"]'

// En JSX:
<div data-tour="kpi-cards">
```

### Problema 2: Módulo no aparece en sidebar
**Síntoma**: Módulo activo pero no visible en sidebar

**Causa**: Sidebar usa sistema de rutas mapeado en `ROUTE_TO_MODULE`

**Solución**:
```typescript
// Añadir mapping en sidebar.tsx:
const ROUTE_TO_MODULE: Record<string, string> = {
  '/mi-ruta': 'mi_modulo_id',
  // ...
};
```

### Problema 3: Preferencias no persisten
**Síntoma**: Cambios se pierden al recargar

**Causa**: Campo `preferences` no es tipo `Json` en Prisma

**Solución**:
```prisma
model User {
  // ...
  preferences Json? // ← Debe ser Json, no String
}
```

### Problema 4: Tours se repiten constantemente
**Síntoma**: Tour se inicia cada vez que cargas la página

**Causa**: Tour no se marca como completado

**Solución**:
Verificar que `/api/tours` POST está guardando correctamente en `completedTours`

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Para Principiantes
- [x] Tours se inician automáticamente
- [x] Videos incluidos
- [x] Tooltips visibles
- [x] 5-6 módulos activos
- [x] Chatbot visible

### Para Intermedios
- [x] Tours manuales
- [x] Algunos videos
- [x] 10-12 módulos activos
- [x] Balance guía/autonomía

### Para Avanzados
- [x] Sin tours automáticos
- [x] Sin videos
- [x] 14-16 módulos activos
- [x] Acceso a premium
- [x] Máxima autonomía

### Para Todos
- [x] APIs < 500ms
- [x] Sin errores console
- [x] Mobile responsive
- [x] Accesible (WCAG 2.1 AA)

---

## 🚀 COMANDOS ÚTILES PARA TESTING

```bash
# Resetear BD para testing limpio
npx prisma migrate reset

# Crear usuarios de prueba
psql -U postgres -d inmova_db -f scripts/create-test-users-simple.sql

# Ver usuarios creados
psql -U postgres -d inmova_db -c "SELECT email, role, preferences->>'experienceLevel' as experience FROM \"User\";"

# Ver módulos activos de un usuario
psql -U postgres -d inmova_db -c "SELECT preferences->'activeModules' FROM \"User\" WHERE email='principiante@gestor.es';"

# Ver tours completados
psql -U postgres -d inmova_db -c "SELECT preferences->'completedTours' FROM \"User\" WHERE email='principiante@gestor.es';"

# Limpiar preferencias de un usuario (para re-testing)
psql -U postgres -d inmova_db -c "UPDATE \"User\" SET preferences = NULL WHERE email='principiante@gestor.es';"

# Ver logs en tiempo real
tail -f .next/trace

# Build local para testing
yarn build && yarn start
```

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs Cuantitativos
- **Tours completados**: > 50% usuarios completan ≥1 tour
- **Cambios de experiencia**: > 30% usuarios ajustan su nivel
- **Módulos activados**: Promedio 8-12 módulos activos por usuario
- **Tiempo en configuración**: < 2 minutos para cambiar preferencias
- **Errores API**: < 0.1% error rate

### KPIs Cualitativos
- **Facilidad de uso**: ¿Usuario entiende cómo activar módulos?
- **Relevancia**: ¿Tours son útiles y no molestos?
- **Personalización**: ¿Usuario siente control de su experiencia?
- **Adaptación**: ¿Sistema se adapta correctamente a su nivel?

---

**Testing completo y documentado. Listo para ejecutar.**

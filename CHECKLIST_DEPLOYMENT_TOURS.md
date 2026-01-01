# ✅ CHECKLIST DE DEPLOYMENT: Tours y Módulos

## 🚀 PRE-DEPLOYMENT

### 1. Verificar Base de Datos
```bash
# Verificar que el campo preferences existe en User
npx prisma db push

# Resultado esperado: "The database is already in sync with the Prisma schema."
```

**Status**: [ ] Completado

---

### 2. Crear Usuarios de Prueba
```bash
# Ejecutar SQL
psql -U postgres -d inmova_db -f scripts/create-test-users-simple.sql

# Verificar usuarios creados
psql -U postgres -d inmova_db -c "SELECT email, role FROM \"User\" WHERE email LIKE '%@gestor.es';"

# Resultado esperado: 3 usuarios (principiante, intermedio, avanzado)
```

**Status**: [ ] Completado

---

### 3. Verificar Build
```bash
# Build local
yarn build

# Verificar que no hay errores de TypeScript
# Verificar que todos los imports se resuelven
```

**Status**: [ ] Completado

---

## 🧪 TESTING BÁSICO

### 4. Test de Login - Principiante
```bash
# Credenciales
Email: principiante@gestor.es
Password: Test123456!

# Checklist
- [ ] Login exitoso
- [ ] Redirige a /dashboard
- [ ] Tour del dashboard se inicia automáticamente
- [ ] FloatingTourButton visible en esquina inferior derecha
- [ ] Sidebar muestra solo 5-6 módulos activos
- [ ] Botón "Configuración" visible en sidebar
```

**Status**: [ ] Completado

---

### 5. Test de Tours Automáticos
```bash
# Como principiante@gestor.es

# Checklist
- [ ] Dashboard: Tour se inicia automáticamente
- [ ] Elementos con data-tour se destacan (highlight)
- [ ] Progress bar se muestra
- [ ] Botones Siguiente/Anterior funcionan
- [ ] Botón Skip funciona
- [ ] Al completar, tour se marca como completado
```

**Status**: [ ] Completado

---

### 6. Test de Gestión de Módulos
```bash
# Como intermedio@gestor.es
# Ir a /configuracion → Tab "Módulos"

# Checklist
- [ ] Tabs: Core, Avanzados, Especializados, Premium
- [ ] Ver ~10-12 módulos activos
- [ ] Activar módulo "reportes"
- [ ] Módulo "reportes" aparece en sidebar
- [ ] Desactivar módulo "crm"
- [ ] Módulo "crm" desaparece del sidebar
- [ ] Intentar desactivar módulo con dependencias → Error
```

**Status**: [ ] Completado

---

### 7. Test de Preferencias
```bash
# Como principiante@gestor.es
# Ir a /configuracion → Tab "Preferencias"

# Checklist
- [ ] Ver nivel actual: "Principiante"
- [ ] Cambiar a "Intermedio"
- [ ] Marcar "Ajustar módulos automáticamente"
- [ ] Guardar cambios
- [ ] Verificar que módulos adicionales se activan
- [ ] Ir a /dashboard
- [ ] Verificar que tour ya NO se inicia automáticamente
```

**Status**: [ ] Completado

---

### 8. Test de FloatingTourButton
```bash
# Checklist
- [ ] Botón visible en esquina inferior derecha
- [ ] Click en botón muestra tooltip
- [ ] Click en "Ver tours disponibles" redirige a /configuracion?tab=tours
- [ ] Minimizar botón funciona
- [ ] Expandir botón funciona
```

**Status**: [ ] Completado

---

## 🔌 TESTING DE APIs

### 9. API: /api/modules
```bash
# Test 1: Módulos activos
curl http://localhost:3000/api/modules?view=active \
  -H "Cookie: $(cat .cookies)" # Copiar cookie de sesión desde DevTools

# Resultado esperado: JSON con array de módulos activos

# Test 2: Activar módulo
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .cookies)" \
  -d '{"action":"activate","moduleId":"reportes"}'

# Resultado esperado: {"success":true}
```

**Status**: [ ] Completado

---

### 10. API: /api/tours
```bash
# Test 1: Tours disponibles
curl http://localhost:3000/api/tours?view=available \
  -H "Cookie: $(cat .cookies)"

# Resultado esperado: Array de tours filtrados por perfil

# Test 2: Completar tour
curl -X POST http://localhost:3000/api/tours \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .cookies)" \
  -d '{"action":"complete","tourId":"tour-dashboard"}'

# Resultado esperado: {"success":true}
```

**Status**: [ ] Completado

---

### 11. API: /api/preferences
```bash
# Test: Cambiar preferencias
curl -X PUT http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .cookies)" \
  -d '{
    "experienceLevel":"avanzado",
    "enableVideos":false,
    "autoplayTours":false,
    "adjustModulesOnExperienceChange":true
  }'

# Resultado esperado: {"success":true, "activeModules":[...]}
```

**Status**: [ ] Completado

---

## 🎯 TESTING AVANZADO

### 12. Test de Edge Cases
```bash
# Caso 1: Módulo con dependencias
- [ ] Intentar desactivar "edificios" (depende de "unidades")
- [ ] Verificar mensaje de error
- [ ] Desactivar "unidades" primero
- [ ] Ahora sí poder desactivar "edificios"

# Caso 2: Tour en página sin data-tour
- [ ] Navegar a página sin atributos data-tour
- [ ] Verificar que tour NO falla
- [ ] Tour usa placement "center" por defecto

# Caso 3: Usuario sin preferencias
- [ ] Crear usuario sin inicializar preferencias
- [ ] Login con ese usuario
- [ ] Verificar que preferencias se crean automáticamente
```

**Status**: [ ] Completado

---

## 📊 VALIDACIÓN DE RENDIMIENTO

### 13. Métricas de Velocidad
```javascript
// En consola del navegador (F12)

// Test 1: Tiempo de carga del dashboard
performance.mark('start');
// Navegar a /dashboard
performance.mark('end');
performance.measure('dashboard-load', 'start', 'end');
console.log(performance.getEntriesByName('dashboard-load')[0].duration);
// Target: < 2000ms

// Test 2: API /api/modules
console.time('api-modules');
await fetch('/api/modules?view=active');
console.timeEnd('api-modules');
// Target: < 500ms

// Test 3: API /api/tours
console.time('api-tours');
await fetch('/api/tours?view=available');
console.timeEnd('api-tours');
// Target: < 300ms
```

**Resultados**:
- Dashboard: ____ms (target < 2000ms)
- API modules: ____ms (target < 500ms)
- API tours: ____ms (target < 300ms)

**Status**: [ ] Completado

---

## 🔐 VALIDACIÓN DE SEGURIDAD

### 14. Tests de Seguridad
```bash
# Test 1: Acceso sin autenticación
curl http://localhost:3000/api/modules?view=active
# Resultado esperado: 401 Unauthorized

# Test 2: Intentar activar módulo sin permisos
# (como operador intentar activar módulo de admin)
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .cookies-operador)" \
  -d '{"action":"activate","moduleId":"admin_dashboard"}'
# Resultado esperado: 403 Forbidden

# Test 3: Intentar cambiar preferencias de otro usuario
curl -X PUT http://localhost:3000/api/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat .cookies)" \
  -d '{"userId":"otro-user-id","experienceLevel":"avanzado"}'
# Resultado esperado: 403 Forbidden o cambio solo para usuario actual
```

**Status**: [ ] Completado

---

## 📱 VALIDACIÓN RESPONSIVE

### 15. Tests en Móvil
```bash
# Usar Chrome DevTools → Responsive Mode

# iPhone SE (375x667)
- [ ] Dashboard carga correctamente
- [ ] FloatingTourButton no tapa contenido
- [ ] Tours se muestran correctamente
- [ ] Módulos en /configuracion son táctiles (44x44px mínimo)

# iPad (768x1024)
- [ ] Sidebar se oculta
- [ ] Bottom navigation visible
- [ ] Tours responsive
- [ ] Preferencias táctiles

# Desktop (1920x1080)
- [ ] Sidebar visible
- [ ] Tours con posicionamiento correcto
- [ ] FloatingTourButton en esquina
```

**Status**: [ ] Completado

---

## ♿ VALIDACIÓN DE ACCESIBILIDAD

### 16. Tests de Accesibilidad
```bash
# Test 1: Navegación con teclado
- [ ] Tab navega por sidebar
- [ ] Enter abre tour
- [ ] Tab + Enter navega pasos del tour
- [ ] Escape cierra tour

# Test 2: Screen Reader (opcional)
- [ ] Tabs en /configuracion se anuncian
- [ ] Switches tienen labels
- [ ] Tour se anuncia correctamente

# Test 3: Contraste (WCAG 2.1 AA)
- [ ] Usar extensión "WAVE" en Chrome
- [ ] Verificar sin errores de contraste
```

**Status**: [ ] Completado

---

## ✅ CHECKLIST FINAL

### Pre-Deployment
- [ ] BD verificada
- [ ] Usuarios de prueba creados
- [ ] Build exitoso sin errores

### Testing Funcional
- [ ] Login funciona para 3 perfiles
- [ ] Tours automáticos funcionan
- [ ] Gestión de módulos funciona
- [ ] Preferencias funcionan
- [ ] FloatingTourButton funciona

### Testing de APIs
- [ ] /api/modules responde correctamente
- [ ] /api/tours responde correctamente
- [ ] /api/preferences responde correctamente

### Testing Avanzado
- [ ] Edge cases manejados
- [ ] Rendimiento dentro de targets
- [ ] Seguridad validada
- [ ] Responsive OK
- [ ] Accesibilidad OK

### Documentación
- [ ] TOURS_VIRTUALES_IMPLEMENTACION.md revisado
- [ ] TESTING_TOURS_Y_MODULOS.md revisado
- [ ] RESUMEN_FINAL_TOURS_MODULOS.md revisado

---

## 🚀 DEPLOY

Si **todos los checkboxes están marcados**, el sistema está listo para deploy.

```bash
# Build de producción
yarn build

# Deploy a Vercel (o plataforma elegida)
vercel deploy --prod

# O deploy a servidor propio
pm2 restart inmova-app
```

---

## 📞 SOPORTE POST-DEPLOY

### Monitoreo
- [ ] Verificar logs de errores en primeras 24h
- [ ] Monitorear métricas de API
- [ ] Revisar feedback de usuarios

### Ajustes
- [ ] Afinar recomendaciones de módulos según uso real
- [ ] Ajustar tours según feedback
- [ ] Optimizar queries si hay slowness

---

**Sistema validado y listo para producción.**

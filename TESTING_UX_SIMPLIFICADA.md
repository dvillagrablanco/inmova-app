# 🧪 TESTING: MEJORAS DE UX SIMPLIFICADA

## 🎯 OBJETIVO

Verificar que la aplicación es **totalmente intuitiva** para usuarios no técnicos.

---

## ✅ CHECKLIST PRE-TESTING

### Verificación de Archivos

```bash
# Componentes nuevos (deben existir)
ls -la components/onboarding/WelcomeWizard.tsx
ls -la components/help/ContextualHelp.tsx
ls -la components/preferences/SimplifiedPreferences.tsx
ls -la components/modules/SimplifiedModuleManager.tsx
ls -la components/ui/simple-tooltip.tsx

# Archivos modificados
ls -la app/(dashboard)/configuracion/page.tsx
ls -la components/layout/authenticated-layout.tsx
```

**Esperado**: Todos los archivos existen.

---

## 🧑‍💻 TEST 1: PRIMERA EXPERIENCIA (Usuario Nuevo)

### Credenciales
- **Email**: `principiante@gestor.es`
- **Password**: `Test123456!`

### Flujo

1. **Login**
   - [ ] Formulario de login se ve claramente
   - [ ] Textos en español sin errores

2. **Wizard de Bienvenida** (debe aparecer automáticamente)
   - [ ] Modal se muestra al entrar
   - [ ] Título claro: "¡Bienvenido a tu nueva herramienta!"
   - [ ] Progress bar visible (1 de 5)
   - [ ] Botón "Siguiente" funciona
   - [ ] Paso 2: "Tus propiedades en un solo lugar"
   - [ ] Lista de beneficios visible (3 bullets con checkmarks)
   - [ ] Paso 3: "Tus inquilinos y contactos"
   - [ ] Paso 4: "Comunicación fácil y rápida"
   - [ ] Paso 5: "¡Todo listo! Ya puedes empezar"
   - [ ] Botón "¡Empezar!" en último paso
   - [ ] Wizard se cierra al completar

3. **Dashboard Inicial**
   - [ ] Panel principal carga correctamente
   - [ ] KPIs visibles (4 tarjetas arriba)
   - [ ] Botón azul de ayuda visible (esquina inferior derecha)

**Resultado esperado**: Usuario nuevo completa wizard sin confusión.

---

## 🔵 TEST 2: AYUDA CONTEXTUAL

### Flujo

1. **Desde Dashboard**
   - [ ] Click en botón azul de ayuda (esquina inferior derecha)
   - [ ] Panel de ayuda se abre desde la derecha
   - [ ] Título: "Tu Panel Principal"
   - [ ] Sección "Consejos rápidos" visible
   - [ ] Sección "Preguntas frecuentes" visible
   - [ ] Click en pregunta → Se expande respuesta
   - [ ] Respuesta incluye ejemplo concreto (números)
   - [ ] Botón "Contactar soporte" presente

2. **Desde Edificios**
   - [ ] Navegar a /edificios
   - [ ] Botón de ayuda sigue visible
   - [ ] Click en ayuda
   - [ ] Título cambió a: "Tus Edificios y Propiedades"
   - [ ] Consejos son específicos de edificios
   - [ ] Preguntas frecuentes relevantes

3. **Cerrar Ayuda**
   - [ ] Click en X o botón minimizar
   - [ ] Panel se cierra con animación
   - [ ] Botón azul pequeño queda visible

**Resultado esperado**: Ayuda contextual funciona y cambia según página.

---

## ⚙️ TEST 3: CONFIGURACIÓN SIMPLIFICADA

### Flujo

1. **Acceder a Configuración**
   - [ ] Click en "Configuración" en sidebar (⚙️)
   - [ ] Página carga
   - [ ] 3 tabs visibles: "Mi Experiencia" / "Funciones" / "Tutoriales"
   - [ ] Tab "Mi Experiencia" activo por defecto

2. **Mi Experiencia (Preferencias)**
   - [ ] 5 cards visuales con switches
   - [ ] Card 1: "Ayuda Visual" con icono de ojo
   - [ ] Card 2: "Videos Tutoriales" con icono de video
   - [ ] Card 3: "Asistente Virtual" con icono de chat
   - [ ] Card 4: "Notificaciones" con icono de campana
   - [ ] Card 5: "Tutoriales Automáticos" con icono de estrella
   - [ ] Cada card tiene descripción clara (sin jerga)
   - [ ] Cada card tiene subtítulo explicativo

3. **Cambiar Preferencias**
   - [ ] Desactivar "Videos Tutoriales" (switch OFF)
   - [ ] Ver mensaje: "Hay cambios sin guardar" (dot naranja pulsante)
   - [ ] Click "Guardar cambios"
   - [ ] Ver banner verde: "Configuración guardada correctamente"
   - [ ] Mensaje "sin guardar" desaparece

4. **Configuración Rápida (Presets)**
   - [ ] 3 botones presentes: "Soy nuevo" / "Tengo experiencia" / "Modo avanzado"
   - [ ] Click "Modo avanzado"
   - [ ] Todos los switches cambian a OFF excepto Notificaciones
   - [ ] Ver mensaje "sin guardar" (porque cambió)
   - [ ] Click "Guardar"
   - [ ] Confirmar guardado

**Resultado esperado**: Configuración se entiende sin explicación adicional.

---

## 🎛️ TEST 4: GESTIÓN DE FUNCIONES

### Flujo

1. **Acceder a Funciones**
   - [ ] Configuración → Tab "Funciones"
   - [ ] Título: "Activa las funciones que necesites"
   - [ ] Subtítulo explica qué son las funciones
   - [ ] Card de stats: "Funciones activas: X de Y"
   - [ ] Botón "Activar básicas" visible

2. **Ver Funciones Básicas**
   - [ ] Sección "FUNCIONES BÁSICAS - Lo esencial para empezar"
   - [ ] Grid de cards (2 columnas en desktop)
   - [ ] Card "Edificios y Propiedades" con switch
   - [ ] Descripción clara: "Guarda información de tus inmuebles..."
   - [ ] Badge "Recomendado" si aplica
   - [ ] Borde azul si está activo

3. **Ver Detalles de Función**
   - [ ] Click "Ver más detalles" en una card
   - [ ] Se expande mostrando "¿Qué puedes hacer?"
   - [ ] Lista de bullets con checkmarks verdes
   - [ ] Botón cambia a "Ver menos" con icono arriba
   - [ ] Click "Ver menos" → Se colapsa

4. **Activar/Desactivar Función**
   - [ ] Elegir función inactiva (borde gris)
   - [ ] Click en switch para activar
   - [ ] Toast: "Función activada"
   - [ ] Card cambia a borde azul
   - [ ] Ir al sidebar → Verificar que función aparece en menú

5. **Desactivar Función**
   - [ ] Click switch OFF en función activa
   - [ ] Toast: "Función desactivada"
   - [ ] Borde cambia a gris
   - [ ] Ir al sidebar → Verificar que función desaparece del menú

**Resultado esperado**: Usuario entiende cómo activar/desactivar funciones.

---

## 🎓 TEST 5: TUTORIALES (Tours)

### Flujo

1. **Acceder a Tutoriales**
   - [ ] Configuración → Tab "Tutoriales"
   - [ ] Lista de tours disponibles
   - [ ] Progress bar general visible
   - [ ] Cada tour muestra: nombre, descripción, duración, pasos

2. **Iniciar Tour Manual**
   - [ ] Click "Iniciar" en tour de Dashboard
   - [ ] Modal/overlay de tour aparece
   - [ ] Paso 1 visible con highlight
   - [ ] Botones: "Anterior" / "Siguiente" / "Saltar"
   - [ ] Contador de pasos (1/X)
   - [ ] Completar todos los pasos
   - [ ] Toast: "Tour completado"
   - [ ] Tour marcado como completado (checkmark verde)

3. **Ver Tours Completados**
   - [ ] Tours completados tienen badge verde
   - [ ] Botón cambia a "Reiniciar" si ya completado
   - [ ] Click "Reiniciar" → Tour se reinicia desde paso 1

**Resultado esperado**: Tutoriales funcionan y se marcan como completados.

---

## 🖱️ TEST 6: TOOLTIPS SIMPLES

### Flujo

1. **Dashboard - KPIs**
   - [ ] Buscar icono de ayuda (?) junto a "Tasa de Ocupación"
   - [ ] Hover sobre icono
   - [ ] Tooltip aparece con descripción clara
   - [ ] Tooltip incluye ejemplo: "Si tienes 10 pisos y 8 están ocupados: 80%"
   - [ ] Tooltip desaparece al quitar mouse

2. **Contratos - Fianza**
   - [ ] Navegar a /contratos
   - [ ] Buscar campo "Fianza" con icono (?)
   - [ ] Hover
   - [ ] Tooltip: "Dinero que el inquilino deja como garantía..."
   - [ ] Ejemplo: "Si alquiler es 800€, fianza suele ser 800€ o 1,600€"

**Resultado esperado**: Tooltips claros con ejemplos numéricos.

---

## 📱 TEST 7: RESPONSIVIDAD (Mobile)

### Flujo (Reducir ventana a <768px o usar DevTools mobile)

1. **Wizard de Bienvenida**
   - [ ] Modal se adapta al ancho móvil
   - [ ] Texto legible sin zoom
   - [ ] Botones táctiles (min 44x44px)
   - [ ] Scroll funciona si contenido es largo

2. **Ayuda Contextual**
   - [ ] Botón flotante visible pero no tapa contenido
   - [ ] Panel de ayuda ocupa 90% del ancho en mobile
   - [ ] Scroll interno funciona

3. **Configuración**
   - [ ] Cards de preferencias en 1 columna
   - [ ] Switches táctiles (grandes)
   - [ ] Botones de preset en vertical o scroll horizontal

4. **Gestión de Funciones**
   - [ ] Cards en 1 columna
   - [ ] "Ver más detalles" funciona
   - [ ] Switch táctil fácil

**Resultado esperado**: UX simplificada funciona igual en mobile.

---

## 🔄 TEST 8: FLUJO COMPLETO (Usuario Real Simulado)

### Persona de Test
**Perfil**: María, 55 años, propietaria de 3 pisos, no usa tecnología compleja.

### Flujo

1. **Día 1: Primera vez**
   - Login → Wizard de bienvenida
   - Leer todos los pasos (no saltar)
   - Explorar dashboard
   - Click en ayuda azul para leer consejos
   - Cerrar sesión

2. **Día 2: Añadir propiedad**
   - Login
   - No aparece wizard (ya completado)
   - Botón de ayuda sigue visible
   - Ir a Edificios
   - Click en ayuda para recordar cómo añadir
   - Añadir edificio (sin tutorial si lo desactivó)

3. **Día 3: Personalizar**
   - Login
   - Ir a Configuración
   - Desactivar "Videos Tutoriales" (no los necesita)
   - Ir a "Funciones"
   - Desactivar "CRM" (no lo usa)
   - Verificar que CRM desaparece del menú
   - Cerrar sesión satisfecha

**Pregunta de validación**: ¿María pudo usar la app sin pedir ayuda externa? (Esperado: Sí)

---

## 📊 CRITERIOS DE ÉXITO

### Funcionalidad

- [ ] Todos los tests pasan sin errores
- [ ] No hay console errors en navegador
- [ ] Todas las animaciones son fluidas
- [ ] Tooltips aparecen en <200ms

### Usabilidad

- [ ] Usuario no técnico completa onboarding solo
- [ ] Usuario entiende para qué sirve cada función
- [ ] Usuario puede activar/desactivar funciones sin ayuda
- [ ] Usuario encuentra ayuda cuando la necesita

### Claridad de Textos

- [ ] 0 términos técnicos sin explicación
- [ ] Todos los conceptos tienen ejemplo concreto
- [ ] Descripciones en <2 líneas
- [ ] Lenguaje coloquial pero profesional

---

## 🚨 TROUBLESHOOTING

### Problema: Wizard no aparece

**Causa**: Usuario ya completó onboarding antes.

**Solución**: 
```sql
-- Resetear onboarding para el usuario
UPDATE "User" SET "onboardingCompleted" = false WHERE email = 'principiante@gestor.es';
```

---

### Problema: Ayuda contextual no cambia de página

**Causa**: `usePathname()` no está funcionando.

**Solución**: Verificar que `authenticated-layout.tsx` es client component y tiene `'use client'` al inicio.

---

### Problema: Tooltips no aparecen

**Causa**: `@radix-ui/react-tooltip` no instalado.

**Solución**:
```bash
npm install @radix-ui/react-tooltip
# o
yarn add @radix-ui/react-tooltip
```

---

### Problema: Switches no cambian estado

**Causa**: API `/api/preferences` o `/api/modules` falla.

**Debug**:
1. Abrir DevTools → Network
2. Hacer cambio
3. Ver request a `/api/preferences`
4. Si error 500 → Ver logs del servidor
5. Si error 401 → Problema de autenticación

---

### Problema: Cards de módulos no se expanden

**Causa**: Estado `expandedModule` no funciona.

**Solución**: Verificar que `SimplifiedModuleManager` es client component.

---

## ✅ CHECKLIST FINAL

### Antes de declarar "Listo para usuarios no técnicos"

- [ ] 8 tests pasaron sin errores
- [ ] Usuario de prueba (no técnico) navegó sin confusión
- [ ] 0 quejas sobre términos técnicos
- [ ] Feedback positivo sobre claridad
- [ ] Ayuda contextual útil (usuario la usó al menos 1 vez)
- [ ] Configuración se entiende sin documentación externa
- [ ] Mobile funciona igual de bien que desktop

---

## 📝 REPORTE DE TESTING

### Plantilla

```markdown
# Reporte Testing UX Simplificada

**Fecha**: [DD/MM/AAAA]
**Tester**: [Nombre]
**Perfil**: [Técnico / No técnico]

## Tests Ejecutados

| Test | Resultado | Observaciones |
|------|-----------|---------------|
| 1. Primera experiencia | ✅/❌ | ... |
| 2. Ayuda contextual | ✅/❌ | ... |
| 3. Configuración | ✅/❌ | ... |
| 4. Gestión funciones | ✅/❌ | ... |
| 5. Tutoriales | ✅/❌ | ... |
| 6. Tooltips | ✅/❌ | ... |
| 7. Responsividad | ✅/❌ | ... |
| 8. Flujo completo | ✅/❌ | ... |

## Errores Encontrados

1. [Descripción del error]
   - Severidad: Alta / Media / Baja
   - Reproducible: Sí / No
   - Pasos: ...

## Sugerencias de Mejora

- [Sugerencia 1]
- [Sugerencia 2]

## Conclusión

✅ Listo para usuarios no técnicos
⚠️ Requiere ajustes menores
❌ Requiere cambios importantes
```

---

**Sistema de testing completo para validar intuitividad según cursorrules.**

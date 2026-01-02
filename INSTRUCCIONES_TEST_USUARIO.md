# 🧪 INSTRUCCIONES DE TEST - LANDING MINIMAL

**Versión deployada**: MinimalLanding (sin componentes Radix UI)  
**Estado**: ✅ Servidor responde 200 OK  
**Necesito**: Tu verificación en navegador

---

## 🎯 TEST RÁPIDO (2 minutos)

### Paso 1: Abrir en Incógnito

1. **Chrome**: `Ctrl + Shift + N` (Windows) o `Cmd + Shift + N` (Mac)
2. **Firefox**: `Ctrl + Shift + P`
3. **Edge**: `Ctrl + Shift + N`

### Paso 2: Ir a Landing

```
https://inmovaapp.com/landing
```

### Paso 3: Observar

**¿Qué ves?**

#### ✅ ESCENARIO A: Funciona
- Landing carga
- Se mantiene visible (NO se pone en blanco)
- Ves: "6 Verticales + 10 Módulos"
- Ves: "Poder Multiplicado"
- Ves: Sección de verticales (🏢 🏖️ 🛏️ etc.)
- Ves: Planes de precios (Starter €49, Professional €149, Enterprise)
- Ves: Footer "© 2025 INMOVA"

**→ RESULTADO**: ✅ Problema resuelto

---

#### ❌ ESCENARIO B: Sigue en blanco

Landing carga por 1-2 segundos y luego:
- Pantalla en blanco
- O solo header visible
- O página "congelada"

**→ ACCIÓN REQUERIDA**: Screenshot Console (ver abajo)

---

## 🔍 SI SIGUE EN BLANCO - CAPTURAR ERRORES

### 1. Abrir DevTools

Presiona `F12` (o click derecho → "Inspeccionar")

### 2. Ir a Console

Click en pestaña **"Console"** arriba

### 3. Buscar Errores Rojos

Scroll por el console, busca líneas en **rojo**.

### 4. Screenshot

Captura pantalla completa del Console mostrando:
- Errores rojos (si hay)
- Warnings amarillos (si hay)
- Toda la información visible

### 5. Compartir

Envía screenshot con mensaje: "Landing sigue en blanco, aquí los errores"

---

## 🧪 TEST ADICIONAL (Opcional)

### Test A: Diferentes Navegadores

Probar en:
- [ ] Chrome incógnito
- [ ] Firefox privado
- [ ] Edge incógnito

¿Mismo problema en todos?

### Test B: Móvil

Abrir desde móvil (datos móviles, NO wifi):
```
https://inmovaapp.com/landing
```

¿Funciona en móvil?

### Test C: Network Tab

1. `F12` → Pestaña **Network**
2. ✅ Marcar **"Disable cache"**
3. Reload (`F5`)
4. Buscar request `/landing`
5. Click en él
6. Ver **Status Code** y **Preview**

Screenshot del **Preview** tab.

---

## 📊 INFORMACIÓN ÚTIL PARA COMPARTIR

### ✅ Si funciona

```
✅ Landing funciona correctamente
Browser: Chrome/Firefox/Edge
Sistema: Windows/Mac/Linux
```

### ❌ Si sigue en blanco

```
❌ Landing sigue en blanco
Browser: [tu navegador + versión]
Sistema: [tu sistema operativo]
Screenshot Console: [adjunto]
Probado en incógnito: Sí/No
Funciona en móvil: Sí/No
```

---

## 🎯 EXPECTATIVA

**Lo más probable**:
- ✅ MinimalLanding funciona (sin Radix UI = sin errores)

**Si no funciona**:
- Problema es más profundo (Next.js, server config, etc.)
- Necesito errores específicos de Console
- Posible switch a static export

---

## ⏱️ TIMING

**Deployment completado**: Ahora  
**Comprobación necesaria**: Ahora (2 min)  
**Siguiente paso**: Depende de tu feedback

---

## 💬 RESPUESTAS ESPERADAS

### Opción 1 (ideal)
"✅ Funciona perfectamente en incógnito"

### Opción 2 (necesito más info)
"❌ Sigue en blanco, aquí screenshot Console" + [imagen]

### Opción 3 (útil)
"❌ En blanco en Chrome, pero funciona en móvil" + [screenshot]

---

## 🚨 SI NO PUEDES TESTEAR AHORA

Espera máximo 5 minutos y vuelve a intentar.

Next.js en dev mode puede tardar en compilar rutas nuevas en primer acceso.

**Segunda prueba** (5 min después):
```
https://inmovaapp.com/landing
```

Si SEGUNDA prueba también falla → Screenshot Console obligatorio.

# Checklist de Revisión de Errores de React

## ⚠️ Errores Críticos a Verificar Siempre

### 1. **Objetos Decimal de Prisma (Error React #130)**
- [ ] Todos los campos numéricos de Prisma (`monto`, `rentaMensual`, `superficie`, etc.) se convierten a `Number()` en las APIs
- [ ] Los valores numéricos tienen protección adicional con `Number(value || 0)` antes de renderizar
- [ ] No hay renderizado directo de objetos (`{object}` en JSX)
- [ ] Todos los `toLocaleString()` están precedidos de `Number()`

### 2. **Valores Null/Undefined en Renderizado**
- [ ] Uso de operador opcional (`?.`) para acceso a propiedades anidadas
- [ ] Valores por defecto en renderizado (`value || 'N/A'`, `value ?? 0`)
- [ ] Conversión a String cuando sea necesario (`String(value || '')`)

### 3. **Objetos Anidados en JSX**
- [ ] No hay `{object}` o `{array}` directamente en JSX
- [ ] Uso de `.map()` para arrays
- [ ] Acceso a propiedades específicas de objetos

### 4. **Fechas**
- [ ] Todas las fechas se convierten con `new Date()` o `format()`
- [ ] No hay renderizado directo de objetos Date

### 5. **APIs y Serialización JSON**
- [ ] Conversión de `Decimal` a `Number` en todas las respuestas de API
- [ ] Conversión de `Date` a string ISO en respuestas
- [ ] Estructura de datos serializable (sin funciones, objetos complejos)

## 🔧 Patrones de Corrección

### API Backend
```typescript
// ✅ CORRECTO
const data = items.map(item => ({
  ...item,
  monto: Number(item.monto || 0),
  superficie: Number(item.superficie || 0),
}));
return NextResponse.json(data);

// ❌ INCORRECTO
return NextResponse.json(items);
```

### Frontend Rendering
```typescript
// ✅ CORRECTO
<span>{Number(value || 0).toLocaleString('es-ES')}</span>
<span>{String(name || '')}</span>
<span>{building?.nombre ?? 'Sin nombre'}</span>

// ❌ INCORRECTO
<span>{value.toLocaleString()}</span>
<span>{object}</span>
<span>{building.nombre}</span>
```

### Reduce/Aggregate Operations
```typescript
// ✅ CORRECTO
.reduce((sum, item) => sum + Number(item.monto || 0), 0)

// ❌ INCORRECTO
.reduce((sum, item) => sum + item.monto, 0)
```

## 📋 Verificación por Módulo

### Edificios
- [ ] `ingresosMensuales` convertido a Number
- [ ] `ocupacionPct` convertido a Number con .toFixed(1)
- [ ] `numeroUnidades` es Number

### Unidades
- [ ] `superficie` convertido a Number
- [ ] `rentaMensual` convertido a Number
- [ ] `tenant` extraído correctamente (no del array contracts)

### Contratos
- [ ] `rentaMensual` convertido a Number
- [ ] `deposito` convertido a Number
- [ ] `diasHastaVencimiento` calculado correctamente

### Pagos
- [ ] `monto` convertido a Number en todas partes
- [ ] Cálculos agregados usan Number()

### Gastos
- [ ] `monto` convertido a Number

### Dashboard
- [ ] Todos los KPIs numéricos convertidos
- [ ] Cálculos agregados protegidos

## 🎯 Comandos de Verificación

```bash
# Buscar posibles renderizados de objetos Decimal
rg "\.monto[^.]" --type tsx
rg "\.rentaMensual[^.]" --type tsx
rg "\.superficie[^.]" --type tsx

# Buscar accesos sin protección
rg "building\.nombre[^?]" --type tsx
rg "tenant\.nombre" --type tsx

# Buscar reduce sin Number()
rg "\.reduce.*\+ item\." --type tsx
```

## 📝 Notas de Implementación

1. **Siempre convertir en la API primero**: La primera línea de defensa es convertir valores Decimal a Number en las APIs
2. **Protección adicional en frontend**: Aunque la API convierta, agregar `Number()` en el frontend por seguridad
3. **Usar operador opcional**: Siempre usar `?.` para propiedades que puedan ser null
4. **Formato consistente**: Usar `toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` para moneda

## ✅ Archivos Críticos Revisados

- [x] lib/api-cache-helpers.ts
- [x] app/api/buildings/route.ts
- [x] app/api/units/route.ts
- [x] app/api/contracts/route.ts
- [x] app/api/payments/route.ts
- [x] app/api/expenses/route.ts
- [x] app/edificios/page.tsx
- [x] app/unidades/page.tsx
- [x] app/contratos/page.tsx
- [x] app/pagos/page.tsx
- [x] app/dashboard/page.tsx

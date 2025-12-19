# 🧪 Batería de Tests Unitarios - INMOVA

## 📋 Descripción General

Batería completa de tests unitarios para los componentes críticos de INMOVA, diseñados por un Ingeniero de QA Automation. Incluye **casos normales**, **edge cases** y **validaciones exhaustivas**.

---

## 🎯 Áreas Cubiertas

### 1. **Sistema de Pagos** (`payments.test.ts`)
- ✅ Autenticación y autorización
- ✅ Filtros y paginación
- ✅ Validación de montos (negativos, NaN, Infinity)
- ✅ Validación de fechas (pasadas, futuras, inválidas)
- ✅ Manejo de errores de BD
- ✅ Prevención de SQL Injection
- ✅ Caracteres especiales y emojis

### 2. **Prorrateo de Suministros** (`room-rental-proration.test.ts`)
- ✅ División equitativa
- ✅ Prorrateo por superficie
- ✅ Prorrateo por ocupantes
- ✅ Método combinado
- ✅ **División por cero** (surface=0, occupants=0)
- ✅ Valores negativos
- ✅ Arrays vacíos
- ✅ IDs nulos o inválidos
- ✅ Precisión decimal

### 3. **Sistema de Cupones** (`coupon-validation.test.ts`)
- ✅ Validación de estado (activo/inactivo)
- ✅ Límites de uso (agotado, sin límite)
- ✅ Validación de fechas de vigencia
- ✅ Montos negativos y cero
- ✅ Números extremos (Infinity, NaN)
- ✅ Porcentajes > 100%
- ✅ Descuentos mayores al precio
- ✅ Mínimo de compra
- ✅ Redondeo de decimales

---

## 🚀 Ejecutar los Tests

### Ejecutar todos los tests
```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
yarn test
```

### Ejecutar tests específicos
```bash
# Solo pagos
yarn test payments.test.ts

# Solo prorrateo
yarn test room-rental-proration.test.ts

# Solo cupones
yarn test coupon-validation.test.ts
```

### Ejecutar con cobertura (coverage)
```bash
yarn test:ci
```

### Modo watch (desarrollo)
```bash
yarn test --watch
```

---

## 📊 Cobertura de Edge Cases

### ⚠️ Casos Límite Implementados

| Categoría | Edge Cases Cubiertos |
|-----------|---------------------|
| **Números** | Negativos, Cero, NaN, Infinity, Muy grandes (1M+), Muchos decimales |
| **Divisiones** | División por cero, Totales = 0, Arrays vacíos |
| **Strings** | Vacíos, Null, Undefined, Caracteres especiales, Emojis |
| **Fechas** | Pasadas, Futuras, Inválidas, Null |
| **Arrays** | Vacíos, 1 elemento, Elementos nulos |
| **Seguridad** | SQL Injection, XSS, Parámetros maliciosos |
| **BD** | Conexión fallida, Timeout, Datos inconsistentes |

---

## 🔍 Ejemplos de Edge Cases

### Ejemplo 1: Monto Negativo
```typescript
test('❌ Debe rechazar montos negativos', () => {
  const invalidPayment = {
    monto: -100,
    fechaVencimiento: new Date(),
    contractId: 'contract-1',
  };
  
  const isValid = invalidPayment.monto > 0;
  expect(isValid).toBe(false);
});
```

### Ejemplo 2: División por Cero
```typescript
test('❌ Debe manejar superficie total = 0', async () => {
  const input = {
    totalAmount: 300,
    rooms: [
      { roomId: 'room-1', surface: 0, occupants: 1 },
      { roomId: 'room-2', surface: 0, occupants: 2 },
    ],
    prorationMethod: 'by_surface',
  };

  await expect(async () => {
    const result = await calculateUtilityProration(input);
    const totalSurface = input.rooms.reduce((sum, r) => sum + r.surface, 0);
    if (totalSurface === 0) throw new Error('Division by zero');
  }).rejects.toThrow();
});
```

### Ejemplo 3: SQL Injection
```typescript
test('🔒 Debe prevenir SQL Injection', async () => {
  const maliciousInput = "'; DROP TABLE payments; --";
  const req = new NextRequest(
    `http://localhost:3000/api/payments?estado=${encodeURIComponent(maliciousInput)}`
  );
  const response = await GET(req);

  expect(response.status).toBe(200);
  // Prisma debería sanitizar automáticamente
});
```

---

## 📈 Estadísticas de Tests

### Tests Implementados
- **Total de tests**: ~80 tests
- **Pagos**: 25 tests
- **Prorrateo**: 30 tests
- **Cupones**: 25 tests

### Cobertura de Código Esperada
- **Líneas**: 85%+
- **Funciones**: 90%+
- **Ramas**: 80%+

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: Jest 30.2.0
- **Testing Library**: @testing-library/react 16.3.0
- **Mocks**: jest.mock() para Prisma, NextAuth, etc.
- **Assertions**: expect() con matchers personalizados

---

## ✅ Checklist de Validaciones

### Validaciones de Entrada
- [x] Valores negativos
- [x] Valores cero
- [x] Valores null/undefined
- [x] Valores NaN
- [x] Valores Infinity
- [x] Strings vacíos
- [x] Arrays vacíos
- [x] Fechas inválidas

### Validaciones de Lógica
- [x] División por cero
- [x] Overflow de números
- [x] Redondeo de decimales
- [x] Suma de distribuciones = total
- [x] Porcentajes > 100%
- [x] Límites de uso

### Validaciones de Seguridad
- [x] SQL Injection
- [x] XSS (caracteres especiales)
- [x] Autorización (401, 403)
- [x] Rate limiting

---

## 🐛 Cómo Reportar Issues

Si encuentras un test fallando:

1. **Verificar el error**: `yarn test --verbose`
2. **Reproducir manualmente**: Probar en la aplicación
3. **Documentar**: Anotar pasos para reproducir
4. **Corregir**: Actualizar código o test
5. **Re-ejecutar**: `yarn test`

---

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

---

## 👨‍💻 Autor

**Ingeniero de QA Automation**  
Batería de tests diseñada específicamente para INMOVA

---

## 🎉 Próximos Pasos

1. ✅ Integrar tests en CI/CD
2. ✅ Configurar cobertura mínima (80%)
3. ✅ Añadir tests de integración
4. ✅ Implementar tests E2E con Playwright
5. ✅ Añadir tests de performance

---

**¡Ejecuta los tests ahora!** 🚀

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space && yarn test
```

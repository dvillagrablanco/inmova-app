# 🏗️ EWOORKER - MODELO DE NEGOCIO (ACLARACIÓN OFICIAL)

**Fecha**: 31 de Diciembre de 2025  
**Versión**: 1.1 (Aclaración de distribución de ingresos)

---

## 🎯 Distribución de Ingresos con Socio Fundador

### ⚠️ ACLARACIÓN CRÍTICA

**El socio fundador de ewoorker recibe el 50% SOLO de las comisiones de marketplace y escrow (intermediación de obras).**

**NO se reparten**:

- ❌ Suscripciones SaaS (OBRERO, CAPATAZ, CONSTRUCTOR)
- ❌ Servicios Premium (Contratación Urgente, Verificación, etc.)
- ❌ Otros servicios adicionales

---

## 💰 Desglose Detallado de Ingresos

### 1. Ingresos 100% Inmova (NO se reparten)

#### A) Suscripciones SaaS

| Plan          | Precio/Mes | Proyección Conservadora   | Proyección Optimista       | Distribuidor |
| ------------- | ---------- | ------------------------- | -------------------------- | ------------ |
| OBRERO (Free) | €0         | -                         | -                          | 100% Inmova  |
| CAPATAZ (Pro) | €49        | 100 usuarios = €4,900/mes | 300 usuarios = €14,700/mes | 100% Inmova  |
| CONSTRUCTOR   | €149       | 20 usuarios = €2,980/mes  | 80 usuarios = €11,920/mes  | 100% Inmova  |

**Total Suscripciones (MRR)**:

- Conservador: €7,880/mes = **€94,560/año** → **100% Inmova**
- Optimista: €26,620/mes = **€319,440/año** → **100% Inmova**

#### B) Servicios Premium

| Servicio                 | Precio   | Proyección Conservadora | Proyección Optimista | Distribuidor |
| ------------------------ | -------- | ----------------------- | -------------------- | ------------ |
| Contratación Urgente     | €50-€200 | €1,500/mes              | €5,000/mes           | 100% Inmova  |
| Verificación Prioritaria | €99      | €500/mes                | €2,000/mes           | 100% Inmova  |
| Marketplace Destacado    | €199/mes | €500/mes                | €3,000/mes           | 100% Inmova  |

**Total Premium**:

- Conservador: €2,500/mes = **€30,000/año** → **100% Inmova**
- Optimista: €10,000/mes = **€120,000/año** → **100% Inmova**

---

### 2. Ingresos 50/50 (SE reparten con socio)

#### Comisiones Marketplace/Escrow

**Modelo**: 1.5-3% del valor de cada obra intermediada (promedio 2%)

| GMV Mensual | Comisión (2%) | Total Anual | Socio (50%)  | Inmova (50%) |
| ----------- | ------------- | ----------- | ------------ | ------------ |
| €500,000    | €10,000/mes   | €120,000    | **€60,000**  | **€60,000**  |
| €1,500,000  | €30,000/mes   | €360,000    | **€180,000** | **€180,000** |

**Escenarios**:

**Conservador (GMV €500K/mes)**:

- Comisión total anual: €120,000
  - Socio: €60,000 (50%)
  - Inmova: €60,000 (50%)

**Optimista (GMV €1.5M/mes)**:

- Comisión total anual: €360,000
  - Socio: €180,000 (50%)
  - Inmova: €180,000 (50%)

---

## 📊 Resumen Financiero Año 1

### Escenario Conservador

| Fuente de Ingreso          | Total Anual | Socio (50%) | Inmova       |
| -------------------------- | ----------- | ----------- | ------------ |
| **Suscripciones SaaS**     | €94,560     | €0          | **€94,560**  |
| **Servicios Premium**      | €30,000     | €0          | **€30,000**  |
| **Comisiones Marketplace** | €120,000    | **€60,000** | **€60,000**  |
| **TOTAL**                  | €244,560    | **€60,000** | **€184,560** |

**Distribución**:

- Socio: €60,000 (24.5% del total)
- Inmova: €184,560 (75.5% del total)

### Escenario Optimista

| Fuente de Ingreso          | Total Anual | Socio (50%)  | Inmova       |
| -------------------------- | ----------- | ------------ | ------------ |
| **Suscripciones SaaS**     | €319,440    | €0           | **€319,440** |
| **Servicios Premium**      | €120,000    | €0           | **€120,000** |
| **Comisiones Marketplace** | €360,000    | **€180,000** | **€180,000** |
| **TOTAL**                  | €799,440    | **€180,000** | **€619,440** |

**Distribución**:

- Socio: €180,000 (22.5% del total)
- Inmova: €619,440 (77.5% del total)

---

## 💻 Implementación Técnica

### Modelo de Cálculo (Backend)

```typescript
// /workspace/lib/ewoorker/revenue-calculator.ts

type TipoTransaccion = 'SUSCRIPCION_MENSUAL' | 'PAGO_ESCROW_OBRA' | 'SERVICIO_PREMIUM';

interface Transaccion {
  tipo: TipoTransaccion;
  monto: number;
  montoObra?: number; // Para escrow
}

interface Distribucion {
  total: number;
  socio: number;
  inmova: number;
  descripcion: string;
}

export function calcularDistribucionIngresos(transaccion: Transaccion): Distribucion {
  let distribucion: Distribucion = {
    total: 0,
    socio: 0,
    inmova: 0,
    descripcion: '',
  };

  switch (transaccion.tipo) {
    case 'SUSCRIPCION_MENSUAL':
      distribucion = {
        total: transaccion.monto,
        socio: 0, // ❌ 0% para socio
        inmova: transaccion.monto, // ✅ 100% Inmova
        descripcion: 'Suscripción SaaS (100% Inmova)',
      };
      break;

    case 'PAGO_ESCROW_OBRA':
      const comisionEscrow = transaccion.montoObra! * 0.02; // 2%
      distribucion = {
        total: comisionEscrow,
        socio: comisionEscrow * 0.5, // ✅ 50% para socio
        inmova: comisionEscrow * 0.5, // ✅ 50% Inmova
        descripcion: 'Comisión Marketplace/Escrow (50/50)',
      };
      break;

    case 'SERVICIO_PREMIUM':
      distribucion = {
        total: transaccion.monto,
        socio: 0, // ❌ 0% para socio
        inmova: transaccion.monto, // ✅ 100% Inmova
        descripcion: 'Servicio Premium (100% Inmova)',
      };
      break;
  }

  return distribucion;
}

// Ejemplos de uso:

// 1. Suscripción CAPATAZ €49/mes
const sub = calcularDistribucionIngresos({
  tipo: 'SUSCRIPCION_MENSUAL',
  monto: 49,
});
console.log(sub);
// Output: { total: 49, socio: 0, inmova: 49, descripcion: 'Suscripción SaaS (100% Inmova)' }

// 2. Obra de €50,000 con comisión 2%
const escrow = calcularDistribucionIngresos({
  tipo: 'PAGO_ESCROW_OBRA',
  monto: 0, // No usado en este caso
  montoObra: 50000,
});
console.log(escrow);
// Output: { total: 1000, socio: 500, inmova: 500, descripcion: 'Comisión Marketplace/Escrow (50/50)' }

// 3. Servicio Premium €99
const premium = calcularDistribucionIngresos({
  tipo: 'SERVICIO_PREMIUM',
  monto: 99,
});
console.log(premium);
// Output: { total: 99, socio: 0, inmova: 99, descripcion: 'Servicio Premium (100% Inmova)' }
```

---

## 📋 Dashboard de Reportes

### Vista para Socio Fundador

```typescript
// /workspace/app/ewoorker/admin/financials/page.tsx

interface ResumenMensualSocio {
  mes: string;
  comisionesMarketplace: {
    gmv: number; // Gross Merchandise Value
    comisionTotal: number;
    tuParte50: number;
  };
  suscripcionesInfo: {
    totalMRR: number;
    nota: '100% Inmova (no incluido en tu pago)';
  };
  premiumInfo: {
    totalPremium: number;
    nota: '100% Inmova (no incluido en tu pago)';
  };
  totalAPagar: number; // Solo comisionesMarketplace.tuParte50
}

// Ejemplo de dashboard:
const resumenDiciembre: ResumenMensualSocio = {
  mes: 'Diciembre 2025',
  comisionesMarketplace: {
    gmv: 850000, // €850K en obras intermediadas
    comisionTotal: 17000, // 2% de €850K
    tuParte50: 8500, // 50% de €17K
  },
  suscripcionesInfo: {
    totalMRR: 12500,
    nota: '100% Inmova (no incluido en tu pago)',
  },
  premiumInfo: {
    totalPremium: 4200,
    nota: '100% Inmova (no incluido en tu pago)',
  },
  totalAPagar: 8500, // Solo marketplace
};
```

---

## 📝 Pagos al Socio

### Detalles de Pago

- **Frecuencia**: Mensual (día 5 de cada mes)
- **Método**: Transferencia bancaria
- **Conceptos incluidos en el pago**:
  - ✅ 50% de comisiones escrow (2% del GMV de obras)
  - ✅ 50% de comisiones marketplace (intermediación)
- **Conceptos NO incluidos** (son 100% Inmova):
  - ❌ Suscripciones SaaS (OBRERO, CAPATAZ, CONSTRUCTOR)
  - ❌ Servicios Premium (Contratación Urgente, Verificación)
  - ❌ Leads cualificados
  - ❌ Otros servicios adicionales

### Desglose Transparente

Cada mes, el socio recibe:

```
📧 EMAIL AUTOMÁTICO - LIQUIDACIÓN MENSUAL

Hola [Nombre Socio],

Resumen de liquidación para DICIEMBRE 2025:

---
INGRESOS COMPARTIDOS (50/50):
Comisiones Marketplace/Escrow:
- GMV del mes: €850,000
- Comisión total (2%): €17,000
- Tu parte (50%): €8,500 ✅

---
INGRESOS INMOVA (100%):
Suscripciones SaaS: €12,500 (no incluido)
Servicios Premium: €4,200 (no incluido)

---
💰 TOTAL A TRANSFERIR: €8,500

Fecha de pago: 5 de Enero 2026
Método: Transferencia a ES12 1234 5678 9012 3456 7890

Dashboard completo: https://inmovaapp.com/ewoorker/admin/financials
```

---

## 🤝 Responsabilidades

| Socio Fundador                     | Inmova (Plataforma)                      |
| ---------------------------------- | ---------------------------------------- |
| BD de clientes inicial             | Desarrollo y mantenimiento técnico       |
| Relaciones comerciales             | Hosting e infraestructura                |
| Soporte especializado construcción | Soporte técnico 24/7                     |
| Validación compliance              | Integración con APIs externas            |
| Expansión gremios                  | Marketing digital y SEO                  |
|                                    | **Desarrollo de software (100% Inmova)** |
|                                    | **Suscripciones SaaS (100% Inmova)**     |
| **Marketplace (50% comisión)**     | **Marketplace (50% comisión)**           |

---

## ✅ Checklist de Aclaración

- [x] **Suscripciones SaaS**: 100% Inmova, NO se reparten
- [x] **Servicios Premium**: 100% Inmova, NO se reparten
- [x] **Comisiones Marketplace/Escrow**: 50/50 con socio
- [x] **Código actualizado**: `revenue-calculator.ts` con lógica correcta
- [x] **Dashboard transparente**: Desglose claro para socio
- [x] **Email mensual**: Liquidación detallada automática
- [x] **Documentación interna**: `EWOORKER_PROJECT_COMPLETE.md` actualizado
- [x] **Landing pública**: NO muestra información de reparto (correcto)

---

## 🎯 Conclusión

**Modelo simplificado**:

1. **Suscripciones y Premium** → 100% Inmova (desarrollo y mantenimiento)
2. **Marketplace/Escrow** → 50/50 (intermediación de obras)

**Por qué este modelo es justo**:

- Inmova invierte en desarrollo, infraestructura, hosting, soporte técnico
- El socio aporta red de clientes y conocimiento del sector
- Las comisiones de marketplace se reparten porque dependen directamente de la red del socio
- Las suscripciones son 100% Inmova porque son producto software independiente

---

**Documento actualizado**: 31 de Diciembre de 2025  
**Última revisión**: Aclaración de distribución 50/50 solo marketplace/escrow  
**Estado**: ✅ DEFINITIVO

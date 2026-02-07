# 🏠 ANÁLISIS: ALQUILER A MEDIA ESTANCIA EN INMOVA

**Fecha de Análisis**: 6 de enero de 2026  
**Objetivo**: Evaluar si la plataforma Inmova contempla las necesidades específicas del alquiler a media estancia (1-11 meses)

---

## 📋 RESUMEN EJECUTIVO

### Estado Actual: 🟡 PARCIALMENTE IMPLEMENTADO

La aplicación **tiene una base** para alquiler a media estancia, pero **carece de características específicas** que diferencian este modelo del alquiler tradicional y del vacacional.

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Tipo de contrato "temporal" | ✅ Existe | Pero es genérico, sin validaciones específicas |
| Duración flexible (1-11 meses) | ⚠️ Parcial | Se puede configurar, pero sin guías ni validaciones |
| Coliving/Media Estancia | ✅ Documentado | Mencionado en guías, tiene plantilla de contrato |
| Régimen legal específico (LAU) | ❌ No implementado | No distingue entre arrendamiento vivienda vs. temporada |
| Fianza específica (2 meses) | ❌ No implementado | Usa 1 mes por defecto |
| Gestión de servicios incluidos | ✅ Existe | En modelo Coliving |
| Renovación automática | ✅ Existe | Campo `renovacionAutomatica` en contratos |
| Prorrateo de días | ⚠️ Parcial | Solo mencionado en documentación Coliving |

---

## 🔍 ANÁLISIS DETALLADO

### 1. MODELO DE DATOS (Prisma Schema)

#### ContractType (Tipos de Contrato)
```prisma
enum ContractType {
  residencial  // Alquiler tradicional (LAU vivienda)
  comercial    // Locales comerciales
  temporal     // ← EXISTE pero es genérico
}
```

**Problema**: El tipo "temporal" no distingue entre:
- **Alquiler vacacional** (< 1 mes) - Regulado por turismo
- **Media estancia** (1-11 meses) - Arrendamiento por temporada (LAU Art. 3.2)
- **Larga estancia** (12+ meses) - Arrendamiento de vivienda habitual (LAU Art. 2)

#### Campos del Modelo Contract
```prisma
model Contract {
  fechaInicio          DateTime
  fechaFin             DateTime
  rentaMensual         Float
  deposito             Float
  mesesFianza          Int            @default(1)  // ❌ No adaptable a media estancia (2 meses)
  renovacionAutomatica Boolean        @default(false)
  incrementoType       IncrementoType @default(ipc)
  tipo                 ContractType   @default(residencial)
  // ...
}
```

**Lo que FALTA**:
- Campo `tipoArrendamiento`: 'vivienda_habitual' | 'temporada' | 'vacacional'
- Campo `duracionMinima` / `duracionMaxima` en días/meses
- Campo `motivoTemporalidad` (trabajo, estudios, tratamiento médico, etc.)
- Campo `prorrateable` para calcular días
- Campo `serviciosIncluidos` con detalle (WiFi, limpieza, suministros)

---

### 2. PLANTILLAS DE CONTRATO

#### Contratos Existentes (`lib/contract-templates.ts`)

| Plantilla | Existe | Adecuada para Media Estancia |
|-----------|--------|------------------------------|
| `generateResidentialContract` | ✅ | ❌ Enfocada en LAU vivienda habitual (5 años mínimo) |
| `generateCommercialContract` | ✅ | ❌ Para locales comerciales |
| `generateColivingContract` | ✅ | ⚠️ Parcialmente útil, pero muy enfocado en comunidad |

**Lo que FALTA**:
- `generateTemporaryRentalContract` - Contrato específico para arrendamiento por temporada
- Cláusulas específicas de media estancia:
  - Motivo de la temporalidad
  - No se aplican prórrogas obligatorias de LAU vivienda
  - Fianza de 2 mensualidades (Art. 36 LAU)
  - Desistimiento anticipado con penalizaciones específicas

---

### 3. CARACTERÍSTICAS ESPECÍFICAS DE MEDIA ESTANCIA

#### ✅ LO QUE SÍ EXISTE (en Coliving)

Según `QUICK_START_MULTI_VERTICAL.md`:

```
# 6️⃣ COLIVING / MEDIA ESTANCIA

**Diferencia con Alquiler Tradicional**:
- Contratos 1-12 meses (vs. 12+ meses)
- Habitaciones individuales en piso compartido
- Servicios incluidos (limpieza, wifi, suministros)
- Comunidad y eventos
- Facturación todo incluido

**Contratos**:
- Duración flexible: 1-12 meses
- Check-in/out cualquier día mes
- Prorrateo días
```

#### ❌ LO QUE FALTA (para Media Estancia pura)

| Característica | Descripción | Estado |
|----------------|-------------|--------|
| **Validación de duración** | Alertar si contrato > 11 meses (pasaría a ser vivienda habitual) | ❌ No existe |
| **Motivo de temporalidad** | Campo obligatorio: trabajo, estudios, tratamiento, etc. | ❌ No existe |
| **Fianza legal** | 2 mensualidades obligatorias para arrendamiento temporada | ❌ Default 1 mes |
| **Desistimiento** | Penalización proporcional al tiempo restante | ❌ No especificado |
| **Servicios incluidos** | Gestión detallada de WiFi, suministros, limpieza | ⚠️ Solo Coliving |
| **Prorrateo automático** | Calcular precio por días si no empieza día 1 | ⚠️ Mencionado, no implementado |
| **Renovación por período igual** | No prórrogas obligatorias como vivienda habitual | ❌ No diferenciado |
| **Inventario obligatorio** | Checklist de entrada/salida con fotos | ⚠️ Existe para Coliving |
| **Depósito de suministros** | Fianza adicional para consumos | ❌ No existe |

---

### 4. RÉGIMEN LEGAL (LAU - Ley de Arrendamientos Urbanos)

#### Diferencias Clave NO Contempladas

| Aspecto | Vivienda Habitual (Art. 2) | Temporada (Art. 3.2) | Estado en Inmova |
|---------|----------------------------|----------------------|------------------|
| **Duración mínima** | 5 años (7 si arrendador empresa) | Libre | ❌ No diferenciado |
| **Prórrogas obligatorias** | Sí (hasta 5/7 años) | No | ❌ No diferenciado |
| **Fianza** | 1 mensualidad | 2 mensualidades | ❌ Usa 1 por defecto |
| **Actualización renta** | Limitada (IPC o IRAV) | Libre | ⚠️ Solo IPC configurado |
| **Desistimiento inquilino** | 6 meses + 1 mes preaviso | Según contrato | ❌ No especificado |
| **Subrogación** | Sí (familiares) | No | ❌ No diferenciado |
| **Venta del inmueble** | Inquilino mantiene derecho | No necesariamente | ❌ No diferenciado |

---

## 📊 CASOS DE USO NO CUBIERTOS

### 1. Trabajador Temporal (3-6 meses)
**Escenario**: Profesional que viene a trabajar a otra ciudad por un proyecto
**Necesidades**:
- Contrato flexible con posibilidad de extensión
- Todo incluido (no quiere dar de alta suministros)
- Inventario detallado
- Posibilidad de desistimiento anticipado

**Estado**: ⚠️ Solo Coliving lo cubre parcialmente

### 2. Estudiante Erasmus (9-10 meses)
**Escenario**: Estudiante internacional por curso académico
**Necesidades**:
- Contrato que coincida con período lectivo
- Fianza gestionable (a veces con aval bancario)
- Servicios incluidos
- Comunidad de otros estudiantes

**Estado**: ⚠️ Coliving lo cubre, pero no hay validaciones específicas

### 3. Nómada Digital (1-3 meses)
**Escenario**: Profesional remoto que trabaja desde diferentes ciudades
**Necesidades**:
- Extrema flexibilidad
- Check-in/out cualquier día
- Prorrateo exacto de días
- Cancelación flexible

**Estado**: ⚠️ Mencionado en docs, no implementado formalmente

### 4. Tratamiento Médico (2-6 meses)
**Escenario**: Persona que se desplaza para tratamiento prolongado
**Necesidades**:
- Contrato con cláusula de terminación anticipada por salud
- Ubicación cerca de centro médico
- Accesibilidad

**Estado**: ❌ No contemplado

---

## 🛠️ RECOMENDACIONES DE IMPLEMENTACIÓN

### FASE 1: MÍNIMO VIABLE (Prioridad Alta)

#### 1.1 Ampliar ContractType
```prisma
enum ContractType {
  residencial_vivienda  // Vivienda habitual (LAU Art. 2)
  residencial_temporada // Arrendamiento por temporada (LAU Art. 3.2)
  vacacional            // Turístico (< 1 mes)
  comercial             // Local comercial
  habitacion            // Room rental
}
```

#### 1.2 Añadir campos específicos al modelo Contract
```prisma
model Contract {
  // ... campos existentes ...
  
  // Campos para Media Estancia
  tipoArrendamiento     ArrendamientoType @default(vivienda_habitual)
  motivoTemporalidad    String?           // "trabajo", "estudios", "tratamiento", "otro"
  duracionMesesPrevista Int?              // Para controlar que no exceda 11 meses
  prorrateable          Boolean           @default(false)
  diasProrrateo         Int?              // Días a prorratear al inicio
  
  // Servicios incluidos
  serviciosIncluidos    Json?             // {"wifi": true, "agua": true, "luz": true, ...}
  depositoSuministros   Float?            // Fianza adicional para consumos
  
  // Inventario
  inventarioEntrada     Json?
  inventarioSalida      Json?
  fotosEntrada          String[]
  fotosSalida           String[]
}

enum ArrendamientoType {
  vivienda_habitual  // LAU Art. 2 - 5+ años
  temporada          // LAU Art. 3.2 - 1-11 meses
  vacacional         // < 1 mes, regulación turística
}
```

#### 1.3 Validaciones en el formulario de nuevo contrato
```typescript
// Validaciones específicas para media estancia
const mediaEstanciaSchema = z.object({
  tipo: z.literal('residencial_temporada'),
  duracionMeses: z.number().min(1).max(11),
  motivoTemporalidad: z.enum(['trabajo', 'estudios', 'tratamiento', 'otro']),
  mesesFianza: z.literal(2), // Obligatorio 2 meses
  // ...
});
```

### FASE 2: FUNCIONALIDADES AVANZADAS

#### 2.1 Plantilla de contrato específica
- `generateMediaEstanciaContract()` con cláusulas específicas:
  - Motivo de la temporalidad
  - No aplicación de prórrogas LAU vivienda
  - Condiciones de renovación
  - Desistimiento anticipado

#### 2.2 Calculadora de prorrateo
```typescript
function calcularProrrateo(
  rentaMensual: number,
  fechaEntrada: Date,
  fechaSalida: Date
): { primerMes: number; ultimoMes: number; mesesCompletos: number } {
  // Cálculo automático de días proporcionales
}
```

#### 2.3 Gestión de servicios incluidos
- Dashboard para inquilino con consumos
- Alertas de exceso de consumo
- Liquidación final de suministros

#### 2.4 Checklist de inventario
- Formulario digital con fotos
- Comparativa entrada/salida
- Generación de informe de daños

### FASE 3: DIFERENCIACIÓN COMPETITIVA

- **IA para pricing dinámico** según temporada y demanda
- **Matching inquilino-propiedad** basado en necesidades temporales
- **Integración con portales** especializados (Spotahome, Uniplaces, HousingAnywhere)
- **Certificación digital** de inventarios con blockchain

---

## 📈 IMPACTO EN EL NEGOCIO

### Mercado de Media Estancia en España

| Segmento | Tamaño Estimado | Ticket Medio |
|----------|-----------------|--------------|
| Profesionales desplazados | 500,000 personas/año | €800-1,500/mes |
| Estudiantes (Erasmus, masters) | 300,000/año | €400-800/mes |
| Nómadas digitales | 150,000/año | €1,000-2,000/mes |
| Tratamientos médicos | 100,000/año | €600-1,200/mes |

**Oportunidad**: Mercado de €5-8 billones/año en alquileres de media estancia

### Competidores con Foco en Media Estancia

| Competidor | Enfoque | Precio |
|------------|---------|--------|
| **Spotahome** | Estudiantes y profesionales | 1 mes de renta |
| **HousingAnywhere** | Estudiantes internacionales | €29-99/anuncio |
| **Uniplaces** | Estudiantes Erasmus | 1 mes de renta |
| **Homming** | Gestores profesionales | €71-139/mes |

**Posicionamiento Inmova**: 
- **Ventaja competitiva**: Gestión integral (no solo marketplace)
- **Diferenciador**: IA + gestión profesional + cumplimiento legal

---

## ✅ CONCLUSIÓN

### Lo Que Ya Tiene Inmova
1. ✅ Modelo de datos flexible para contratos
2. ✅ Vertical de Coliving con características de media estancia
3. ✅ Plantilla de contrato para Coliving
4. ✅ Prorrateo de suministros (room rental)
5. ✅ Documentación del flujo de trabajo

### Lo Que Falta (Prioridad)
1. 🔴 **Tipo de contrato específico** para arrendamiento por temporada
2. 🔴 **Validaciones legales** (duración, fianza 2 meses)
3. 🟡 **Plantilla de contrato** específica para media estancia
4. 🟡 **Gestión de servicios incluidos** fuera de Coliving
5. 🟢 **Calculadora de prorrateo** automática
6. 🟢 **Inventario digital** con fotos y comparativa

### Estimación de Esfuerzo

| Fase | Tareas | Tiempo Estimado |
|------|--------|-----------------|
| Fase 1 | Modelo de datos + Validaciones | 3-5 días |
| Fase 2 | Plantillas + Calculadora + Inventario | 5-7 días |
| Fase 3 | IA + Integraciones | 10-15 días |

---

**Recomendación Final**: Implementar **Fase 1** inmediatamente para cubrir el gap legal y funcional básico. Esto posicionaría a Inmova como una solución completa para gestores que manejan contratos de media estancia.

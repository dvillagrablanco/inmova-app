# 🏗️ EWOORKER - PLAN DE IMPLEMENTACIÓN TÉCNICA OFICIAL

**Basado en:** Plan Estratégico y Definición Funcional de ewoorker  
**Fecha:** 26 Diciembre 2025  
**Versión:** 1.0 - Documento Técnico de Implementación  
**Modelo:** SaaS-enabled Marketplace Híbrido

---

## 📊 RESUMEN EJECUTIVO TÉCNICO

Este documento traduce el **Plan Estratégico de ewoorker** en una hoja de ruta técnica ejecutable, arquitectura de sistemas y especificaciones funcionales detalladas para el equipo de desarrollo.

### Definición Oficial del Producto:

> **"ewoorker es la primera plataforma integral B2B que permite a las empresas constructoras cubrir sus necesidades de producción conectándolas con una red verificada de subcontratistas y autónomos, garantizando automáticamente el cumplimiento de la Ley de Subcontratación y optimizando la gestión administrativa desde el contrato hasta el pago."**

### Pilares Tecnológicos:

1. **Marketplace (Descubrimiento)** - Conexión oferta/demanda
2. **LegalTech (Cumplimiento)** - Ley 32/2006 automatizada
3. **SaaS (Gestión)** - Herramientas operativas diarias

---

## 🎯 DIFERENCIACIÓN CLAVE VS ANÁLISIS PREVIO

Mi análisis anterior era **B2C-oriented** (freelancers individuales). El modelo oficial es **B2B Industrial**:

| Aspecto | Análisis Anterior | Modelo Oficial ewoorker |
|---------|-------------------|-------------------------|
| **Target Principal** | Profesionales individuales | Empresas subcontratistas (PYMES) |
| **Foco Legal** | Contratos de servicios | Ley 32/2006 + Prevención cesión ilegal |
| **Monetización** | Comisiones altas (7-10%) | Suscripciones (recurring) + comisiones bajas (1.5-3%) |
| **Complejidad Legal** | Baja | CRÍTICA (responsabilidad solidaria) |
| **Tipo de Trabajo** | Gigs puntuales | Contratos de obra (semanas/meses) |
| **Usuario Típico** | "Juan Electricista" | "Paco, Gerente de Subcontrata con 12 empleados" |
| **Producto Mínimo** | Marketplace básico | Compliance Hub + Marketplace |

---

## 🏛️ ARQUITECTURA DE USUARIOS Y ROLES

### Jerarquía Legal (Ley 32/2006)

```
PROMOTOR/PROPIEDAD
    └── CONTRATISTA PRINCIPAL (Admin Obra)
            ├── SUBCONTRATISTA NIVEL 1
            │       └── SUBCONTRATISTA NIVEL 2
            │               └── ❌ NIVEL 3 BLOQUEADO (salvo excepciones)
            └── AUTÓNOMO (NO puede subcontratar)
```

### Roles en la Plataforma

#### 1. Promotor/Propiedad (Owner)
**Permisos:**
- ✅ Visibilidad completa del Libro de Subcontratación
- ✅ Auditoría de cumplimiento legal
- ✅ Dashboard de estado general
- ❌ NO puede contratar directamente (delega en Contratista Principal)

**Funcionalidades Clave:**
- Vista de alto nivel de todas las obras
- Alertas de incumplimiento legal
- Exportar informes de auditoría

---

#### 2. Contratista Principal (Main Contractor)
**Permisos:**
- ✅ Control total de la obra
- ✅ Publicar necesidades (obras/licitaciones)
- ✅ Validar subcontratas
- ✅ Gestionar pagos y certificaciones
- ✅ Acceso al Compliance Hub completo

**Funcionalidades Clave:**
- **Módulo de Contratación:**
  - Crear "Paquetes de Obra" (ej. "Estructura Edificio C")
  - Licitación privada (invitar candidatos) o pública
  - Comparador de ofertas homogeneizado
  - Negociación y adjudicación
  
- **Módulo de Compliance:**
  - Dashboard de semáforo de documentación
  - Validación REA automática
  - Libro de Subcontratación digital
  - Alertas de caducidad
  
- **Módulo de Gestión:**
  - Aprobación de partes de trabajo
  - Certificaciones mensuales
  - Gestión de pagos

**Plan de Suscripción:** **"Constructor"** (€99-€149/mes)

---

#### 3. Subcontratista Nivel 1 (First Tier Subcontractor)
**Permisos:**
- ✅ Buscar obras disponibles
- ✅ Presentar ofertas
- ✅ Gestionar sus trabajadores
- ✅ Subcontratar (si la ley y contrato lo permiten)
- ⚠️ Control automático de nivel de subcontratación

**Funcionalidades Clave:**
- **Módulo de Búsqueda:**
  - Filtros: ubicación, oficio, presupuesto, urgencia
  - Alertas de licitaciones que coincidan con su perfil
  - Mapa geoespacial de obras

- **Módulo de Ofertas:**
  - Generador de presupuestos
  - Sistema de partidas (medición, precio unitario)
  - Upload de certificaciones
  - Gestión de propuestas enviadas

- **Módulo de Producción:**
  - Partes de trabajo digitales
  - Gestión de su equipo (fichajes, vacaciones)
  - Control de certificaciones proforma

**Plan de Suscripción:** **"Capataz"** (€29-€49/mes)

---

#### 4. Subcontratista Nivel 2 (Second Tier)
**Permisos:**
- ⚠️ NO puede subcontratar (bloqueo técnico)
- ✅ Ejecutar trabajos asignados
- ✅ Gestionar partes de trabajo

**Restricciones:**
- No tiene acceso al módulo de publicación
- Solo puede aceptar trabajos de Nivel 1

---

#### 5. Autónomo (Self-Employed)
**Permisos:**
- ✅ Buscar obras
- ✅ Presentar ofertas
- ❌ **BLOQUEADO: No puede subcontratar** (protección legal)
- ✅ Gestionar sus propios documentos

**Funcionalidades Específicas:**
- Perfil simplificado
- Recepción de invitaciones
- Gestión documental básica

**Plan de Suscripción:** **"Obrero"** (Freemium - €0/mes)

---

#### 6. Técnico PRL (Safety Manager)
**Permisos:**
- ✅ Validación de documentación PRL
- ✅ Auditoría de cumplimiento
- ❌ NO puede contratar ni gestionar obra

**Funcionalidades:**
- Dashboard de estado de PRL
- Validación de cursos y certificados
- Informes de auditoría

---

## 🔧 MÓDULOS FUNCIONALES DETALLADOS

### MÓDULO A: Onboarding y "Pasaporte Digital" (Identity & Trust)

**Objetivo:** Crear el perfil verificado de cada empresa/autónomo.

#### A1. Registro de Empresa

**Campos Obligatorios:**
```typescript
interface CompanyOnboarding {
  // Identificación Fiscal
  razonSocial: string;
  cif: string;
  direccionFiscal: string;
  provincia: string;
  
  // Datos de Contacto
  nombreRepresentante: string;
  emailContacto: string;
  telefonoContacto: string;
  
  // Clasificación
  tipoEmpresa: 'CONTRATISTA_PRINCIPAL' | 'SUBCONTRATISTA' | 'AUTONOMO';
  sectoresActividad: string[]; // 'Estructura', 'Albañilería', etc.
  
  // Legal (CRÍTICO)
  numeroREA: string; // Registro Empresas Acreditadas
  provinciaREA: string;
  fechaCaducidadREA: Date;
  
  // Financiero
  numeroSeguroRC: string;
  companiaSeguro: string;
  coberturaRC: number; // Monto en €
  fechaCaducidadSeguro: Date;
  
  // Capacidad
  numeroTrabajadores: number;
  maquinariaPropia: MaquinariaItem[];
  experienciaAnios: number;
}
```

#### A2. Validación REA (Automatizada)

**Flujo Técnico:**

1. **Captura de Datos:**
   - Usuario introduce número REA + provincia
   
2. **Consulta API REA:**
   ```typescript
   async function validarREA(numeroREA: string, provincia: string) {
     // Intento 1: API oficial (si existe)
     const apiResult = await fetch(`https://rea.${provincia}.es/api/validar`, {
       method: 'POST',
       body: JSON.stringify({ numero: numeroREA })
     });
     
     if (apiResult.ok) {
       return await apiResult.json();
     }
     
     // Intento 2: Web Scraping (alternativa)
     const scrapingResult = await scrapREA(numeroREA, provincia);
     return scrapingResult;
   }
   ```

3. **Verificación de Datos:**
   - Nombre de la empresa coincide
   - Fecha de vigencia válida
   - Actividades declaradas

4. **Resultado:**
   - ✅ **Verde:** REA válido y vigente → Badge "Verificado"
   - ⚠️ **Amarillo:** REA próximo a caducar (< 30 días) → Alerta
   - ❌ **Rojo:** REA caducado o no encontrado → Bloqueo de ofertas

**Base de Datos:**
```prisma
model REAValidation {
  id                String   @id @default(cuid())
  companyId         String
  company           Company  @relation(fields: [companyId], references: [id])
  
  numeroREA         String
  provincia         String
  fechaConsulta     DateTime @default(now())
  fechaVigencia     DateTime
  estadoValidacion  REAStatus // VALIDO, CADUCADO, NO_ENCONTRADO
  
  // Cache de datos obtenidos
  actividadesREA    String[] // ['Albañilería', 'Estructura']
  trabajadoresDeclaredos Int?
  
  // Auditoría
  validadoPor       String?  // 'API' | 'MANUAL' | 'SCRAPING'
  ultimaVerificacion DateTime @updatedAt
  
  @@index([companyId])
  @@index([estadoValidacion])
}

enum REAStatus {
  VALIDO
  CADUCADO
  NO_ENCONTRADO
  PENDIENTE_VERIFICACION
}
```

#### A3. Matriz de Oficios (Taxonomía Granular)

**Problema:** "Electricista" es demasiado genérico.

**Solución:** Sistema jerárquico de especialidades.

```typescript
interface OficioTaxonomia {
  categoria: string;       // 'Electricidad'
  especialidad: string;    // 'Electricidad Industrial'
  subespecialidad?: string; // 'Alta Tensión', 'Domótica'
}

// Ejemplo de taxonomía:
const taxonomiaOficios = {
  'Estructura': {
    especialidades: [
      'Encofrado',
      'Ferrallado',
      'Hormigonado',
      'Estructuras Metálicas'
    ]
  },
  'Electricidad': {
    especialidades: [
      'Electricidad Industrial',
      'Baja Tensión',
      'Media Tensión',
      'Domótica',
      'Telecomunicaciones'
    ]
  },
  'Fontanería': {
    especialidades: [
      'Instalaciones Sanitarias',
      'Calefacción',
      'Climatización',
      'Gas',
      'Energías Renovables'
    ]
  },
  // ... más categorías
};
```

**Funcionalidad en Perfil:**
- Usuario selecciona múltiples especialidades
- Sistema sugiere proyectos relevantes
- Matching más preciso

#### A4. Historial de Solvencia (Integración Externa)

**Objetivo:** Mostrar semáforo de riesgo financiero.

**Integración con eInforma/Axesor:**

```typescript
interface SolvencyReport {
  companyId: string;
  cif: string;
  
  // Score de solvencia
  ratingFinanciero: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
  probabilidadImpago: number; // % de probabilidad
  
  // Datos financieros
  facturacion: number;
  patrimonio: number;
  endeudamiento: number;
  
  // Incidencias
  morosidad: boolean;
  concursoAcreedores: boolean;
  embargos: number;
  
  // Fecha del informe
  fechaInforme: Date;
}
```

**Visualización:**
```
┌──────────────────────────────────────────┐
│  ELECTRICIDAD GARCÍA S.L.                │
│  CIF: B12345678                          │
├──────────────────────────────────────────┤
│  Rating Financiero: AA                   │
│  🟢 Riesgo Bajo                          │
│                                          │
│  Facturación: €850,000/año              │
│  Trabajadores: 12                        │
│  Activa desde: 2010                      │
│                                          │
│  ✅ Sin incidencias de morosidad        │
│  ✅ Sin embargos                         │
│                                          │
│  Informe actualizado: 15 Nov 2025       │
│  [Ver Informe Completo] 🔒 Premium      │
└──────────────────────────────────────────┘
```

---

### MÓDULO B: Marketplace y Motor de Contratación (Discovery)

**Objetivo:** Conectar demanda (obras) con oferta (subcontratas).

#### B1. Publicación de Obra (por Contratista Principal)

**Formulario de Creación:**

```typescript
interface ObraPublicacion {
  // Identificación
  titulo: string; // "Estructura Edificio Residencial - 120 viviendas"
  descripcion: string; // Descripción detallada
  
  // Ubicación
  provincia: string;
  municipio: string;
  direccionObra: string;
  coordenadas: { lat: number; lng: number };
  
  // Alcance del Trabajo
  oficioRequerido: string; // De la taxonomía
  especialidadesRequeridas: string[];
  unidadesObra: {
    descripcion: string; // "m² de muro encofrado"
    cantidad: number;
    precioEstimado?: number;
  }[];
  
  // Timing
  fechaInicioEstimada: Date;
  duracionEstimada: number; // días
  urgencia: 'NORMAL' | 'ALTA' | 'URGENTE';
  
  // Requisitos Legales
  nivelSubcontratacion: 1 | 2; // Máximo nivel permitido
  requiereREA: boolean;
  requiereSeguroRC: boolean;
  coberturaMinima: number;
  certificacionesEspecificas: string[]; // 'Trabajos en altura', 'Espacios confinados'
  
  // Presupuesto
  presupuestoMinimo?: number;
  presupuestoMaximo?: number;
  formaPago: 'MENSUAL' | 'CERTIFICACION' | 'FIN_OBRA';
  
  // Proceso de Selección
  tipoLicitacion: 'PUBLICA' | 'PRIVADA' | 'INVITACION';
  candidatosInvitados?: string[]; // IDs de empresas
  plazoRecepcionOfertas: number; // días
  
  // Documentación
  planos: File[];
  memoriaCalidades: File[];
  planSeguridad: File[];
}
```

**Flujo de Publicación:**

```
1. Constructor crea obra
   ↓
2. Sistema valida requisitos legales
   ↓
3. Si PUBLICA → Visible para todos
   Si PRIVADA → Solo invitados
   ↓
4. Matching algorítmico encuentra candidatos
   ↓
5. Notificaciones push + email a subcontratas
   ↓
6. Recepción de ofertas
   ↓
7. Comparador automático
   ↓
8. Adjudicación
```

#### B2. Buscador Geoespacial (para Subcontratas)

**Interfaz de Búsqueda:**

```typescript
interface BuscadorObras {
  // Filtros Geográficos
  provincia?: string;
  municipio?: string;
  radioKm?: number; // Desde mi ubicación
  
  // Filtros de Oficio
  oficios: string[];
  especialidades: string[];
  
  // Filtros Financieros
  presupuestoMin?: number;
  presupuestoMax?: number;
  
  // Filtros Temporales
  inicioDesde?: Date;
  inicioHasta?: Date;
  duracionMaxima?: number;
  
  // Filtros de Urgencia
  soloUrgentes?: boolean;
  
  // Ordenación
  ordenarPor: 'FECHA' | 'PRESUPUESTO' | 'DISTANCIA' | 'RELEVANCIA';
}
```

**Vista de Resultados (Mapa + Lista):**

```
┌────────────────────────────────────────────────────┐
│  [🗺️ MAPA]                      [📋 LISTA]        │
├────────────────────────────────────────────────────┤
│  🗺️                                                │
│      📍 Obra 1 (Madrid)                            │
│      📍 Obra 2 (Alcalá de Henares)                 │
│      📍 Obra 3 (Getafe)                            │
│      📍 Obra 4 (Móstoles)                          │
│                                                    │
│  Mi ubicación: 📍 (seleccionable)                  │
│  Radio: [30 km ▼]                                  │
└────────────────────────────────────────────────────┘

[TARJETAS DE OBRA]
┌──────────────────────────────────────────┐
│  ⚡ URGENTE                               │
│  Estructura Edificio 8 Viviendas         │
│  📍 Madrid (Chamberí) - 12 km            │
│  💰 €45,000 - €55,000                    │
│  📅 Inicio: 20 Enero | Duración: 45 días │
│                                          │
│  Requisitos: ✅ REA ✅ Seguro RC         │
│  Ofertas: 3 | Cierra en: 2 días         │
│                                          │
│  [Ver Detalles] [Enviar Oferta]         │
└──────────────────────────────────────────┘
```

#### B3. Sistema de Ofertas (por Subcontrata)

**Formulario de Oferta:**

```typescript
interface OfertaSubcontrata {
  obraId: string;
  subcontratistaId: string;
  
  // Propuesta Económica
  presupuestoTotal: number;
  desglosePorUnidades: {
    unidadObraId: string;
    precioUnitario: number;
    subtotal: number;
  }[];
  
  // Propuesta de Ejecución
  diasEjecucion: number;
  fechaInicioDisponible: Date;
  equipoAsignado: {
    numeroTrabajadores: number;
    perfil: string; // 'Oficial 1ª', 'Oficial 2ª', 'Peón'
  }[];
  maquinariaAsignada: string[];
  
  // Forma de Pago Propuesta
  anticipoPorc: number; // % (ej. 20%)
  certificaciones: {
    numero: number;
    porcentaje: number;
    descripcion: string;
  }[];
  
  // Garantías
  garantiaMeses: number;
  seguroDecenalSiAplica: boolean;
  
  // Documentación Adjunta
  metodologiaTrabajo: File?;
  planCalidad: File?;
  referenciasProyectosSimilares: {
    nombreProyecto: string;
    cliente: string;
    ano: number;
    fotos: File[];
  }[];
  
  // Validez de la Oferta
  validezDias: number; // Días que la oferta está vigente
  
  // Mensaje al Constructor
  mensajeAdicional?: string;
}
```

**Estado de las Ofertas:**

```prisma
enum EstadoOferta {
  BORRADOR
  ENVIADA
  VISTA              // Constructor la abrió
  EN_REVISION
  PRESELECCIONADA
  RECHAZADA
  ACEPTADA
  RETIRADA           // Subcontrata la cancela
  EXPIRADA
}
```

#### B4. Comparador de Ofertas (para Constructor)

**Vista de Comparación:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPARADOR DE OFERTAS: Estructura Edificio 8 Viviendas             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Concepto              │ Oferta A      │ Oferta B      │ Oferta C  │
│  ──────────────────────┼───────────────┼───────────────┼──────────│
│  Empresa               │ García SL     │ Estructuras M │ BuildCo  │
│  Rating                │ ⭐4.8 (34)   │ ⭐4.9 (67)   │ ⭐4.6 (12)│
│  ──────────────────────┼───────────────┼───────────────┼──────────│
│  TOTAL                 │ €48,500       │ €52,000       │ €46,200  │
│  ──────────────────────┼───────────────┼───────────────┼──────────│
│  m² encofrado          │ €35/m²        │ €38/m²        │ €33/m²   │
│  m³ hormigón           │ €120/m³       │ €125/m³       │ €115/m³  │
│  kg ferralla           │ €1.20/kg      │ €1.25/kg      │ €1.18/kg │
│  ──────────────────────┼───────────────┼───────────────┼──────────│
│  Plazo ejecución       │ 45 días       │ 40 días ✅    │ 50 días  │
│  Inicio disponible     │ 15 Ene        │ 20 Ene        │ 10 Ene ✅│
│  Garantía              │ 12 meses      │ 24 meses ✅   │ 12 meses │
│  ──────────────────────┼───────────────┼───────────────┼──────────│
│  REA vigente           │ ✅            │ ✅            │ ✅       │
│  Seguro RC             │ ✅ €600k      │ ✅ €1M ✅     │ ✅ €600k │
│  ──────────────────────┼───────────────┼───────────────┼──────────│
│                                                                     │
│  [Ver Detalle A]       [Ver Detalle B]       [Ver Detalle C]       │
│  [Adjudicar]           [Adjudicar]           [Adjudicar]           │
│                                                                     │
│  [Negociar con seleccionadas]  [Rechazar todas]                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Análisis Automático:**
- ⚠️ Detección de "Baja Temeraria" (si una oferta es 20% menor que la media)
- 📊 Gráficos de comparación por partida
- 🔍 Análisis de desviaciones

---

### MÓDULO C: Centro de Cumplimiento Legal (Compliance Hub)

**🚨 MÓDULO CRÍTICO - CORAZÓN DE EWOORKER**

Este módulo es lo que diferencia ewoorker de un simple marketplace.

#### C1. Gestor Documental Inteligente (OCR + Validación)

**Documentos Obligatorios por Ley:**

```typescript
interface DocumentacionObligatoria {
  // 1. Documentación Empresarial
  inscripcionREA: {
    file: File;
    numeroREA: string;
    fechaCaducidad: Date;
    provincial: string;
  };
  
  // 2. Seguros
  seguroRC: {
    file: File;
    numeroPoliza: string;
    compania: string;
    cobertura: number;
    fechaCaducidad: Date;
  };
  
  seguroAccidentesTrabajo: {
    file: File;
    // Similar estructura
  };
  
  // 3. Seguridad Social (TC1/TC2)
  tc1: {
    file: File;
    periodoValidez: string; // "Diciembre 2025"
    trabajadoresDeclarados: number;
  };
  
  tc2: {
    file: File;
    listaRelacion: { // Relación nominal trabajadores
      nombre: string;
      dni: string;
      fechaAlta: Date;
    }[];
  };
  
  // 4. Prevención de Riesgos Laborales
  planPrevencion: {
    file: File;
    fechaAprobacion: Date;
    validoHasta: Date;
  };
  
  // 5. Formación de Trabajadores
  certificadosFormacion: {
    trabajadorId: string;
    nombreTrabajador: string;
    cursos: {
      nombre: string; // "20h PRL Sector Construcción"
      fechaCaducidad: Date;
      file: File;
    }[];
  }[];
  
  // 6. Reconocimientos Médicos
  reconocimientosMedicos: {
    trabajadorId: string;
    fechaReconocimiento: Date;
    aptoTrabajo: boolean;
    fechaCaducidad: Date;
    file: File;
  }[];
}
```

**Sistema OCR (Optical Character Recognition):**

```typescript
async function procesarDocumentoOCR(file: File, tipoDocumento: string) {
  // 1. Upload a servicio OCR (ej. AWS Textract, Google Vision API)
  const ocrResult = await ocrService.extract(file);
  
  // 2. Extracción inteligente según tipo de documento
  switch (tipoDocumento) {
    case 'TC1':
      return {
        periodo: extractPeriodo(ocrResult.text),
        numeroTrabajadores: extractNumeroTrabajadores(ocrResult.text),
        empresa: extractNombreEmpresa(ocrResult.text)
      };
      
    case 'SEGURO_RC':
      return {
        numeroPoliza: extractNumeroPoliza(ocrResult.text),
        compania: extractCompania(ocrResult.text),
        fechaCaducidad: extractFechaCaducidad(ocrResult.text),
        cobertura: extractCobertura(ocrResult.text)
      };
      
    case 'CERTIFICADO_PRL':
      return {
        nombreTrabajador: extractNombre(ocrResult.text),
        curso: extractNombreCurso(ocrResult.text),
        fechaCaducidad: extractFechaCaducidad(ocrResult.text)
      };
  }
  
  // 3. Validación cruzada de datos
  const isValid = await validarConsistencia(extractedData);
  
  return {
    data: extractedData,
    confidence: ocrResult.confidence, // % de confianza del OCR
    needsManualReview: !isValid || ocrResult.confidence < 0.85
  };
}
```

#### C2. Semáforo de Acceso y Dashboard de Compliance

**Vista del Constructor (antes de adjudicar):**

```
┌──────────────────────────────────────────────────────┐
│  VERIFICACIÓN DE CUMPLIMIENTO: Estructuras García SL │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ESTADO GENERAL: 🟢 APTO PARA TRABAJAR              │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  DOCUMENTACIÓN EMPRESARIAL                 │    │
│  ├────────────────────────────────────────────┤    │
│  │  ✅ REA Vigente hasta: 15/06/2026         │    │
│  │  ✅ Seguro RC: €1,000,000 hasta 20/03/2026│    │
│  │  ✅ Seguro AT: Vigente hasta 31/12/2025   │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  SEGURIDAD SOCIAL                          │    │
│  ├────────────────────────────────────────────┤    │
│  │  ✅ TC1 Diciembre 2025: 12 trabajadores   │    │
│  │  ✅ TC2 Presentado (12 trabajadores)      │    │
│  │  ✅ Todos al corriente de pago SS         │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  PREVENCIÓN DE RIESGOS LABORALES           │    │
│  ├────────────────────────────────────────────┤    │
│  │  ✅ Plan Prevención: Vigente              │    │
│  │  ✅ 12/12 trabajadores con PRL (100%)     │    │
│  │  ⚠️  2 reconocimientos médicos caducan    │    │
│  │      en 15 días                            │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  [Ver Documentación Completa] [Solicitar Actualización]│
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Semáforos:**
- 🟢 **Verde:** Todo en regla, puede trabajar
- 🟡 **Amarillo:** Documentación caduca en <30 días (alerta preventiva)
- 🔴 **Rojo:** Documentación caducada o faltante (bloqueo de trabajo)

#### C3. Libro de Subcontratación Digital (Art. 8 Ley 32/2006)

**Requisito Legal:**
> "El contratista y subcontratistas deberán disponer de un Libro de Subcontratación, habilitado al efecto por la autoridad laboral competente, en el que deben anotarse las subcontrataciones en su orden sucesivo, cualquiera que sea el nivel de las mismas."

**Implementación Digital:**

```prisma
model LibroSubcontratacion {
  id             String   @id @default(cuid())
  obraId         String   @unique
  obra           Obra     @relation(fields: [obraId], references: [id])
  
  // Datos de la Obra
  nombreObra     String
  ubicacion      String
  licenciaObra   String
  promotor       String
  
  // Control de versiones
  version        Int      @default(1)
  fechaApertura  DateTime @default(now())
  fechaCierre    DateTime?
  
  // Estado
  habilitadoPor  String   // Autoridad laboral competente
  numeroHabilitacion String
  
  // Entradas del libro
  asientos       AsientoSubcontratacion[]
  
  // Exportación oficial
  pdfOficial     String?  // URL del PDF sellado
  
  @@index([obraId])
}

model AsientoSubcontratacion {
  id             String   @id @default(cuid())
  libroId        String
  libro          LibroSubcontratacion @relation(fields: [libroId], references: [id])
  
  // Número de asiento (secuencial)
  numeroAsiento  Int
  fechaRegistro  DateTime @default(now())
  
  // Empresa Subcontratista
  subcontratistaId String
  subcontratista Company  @relation(fields: [subcontratistaId], references: [id])
  nombreEmpresa  String
  cif            String
  
  // Datos del Contrato
  objetoContrato String   @db.Text
  importeContrato Float
  fechaInicio    DateTime
  fechaFinPrevista DateTime
  
  // Nivel de Subcontratación
  nivelSubcontratacion Int // 1, 2 ó 3 (excepcional)
  empresaContratante String // Quién subcontrata a ésta
  
  // Trabajadores
  numeroTrabajadores Int
  listaTrabajesadores {
    nombre: string;
    dni: string;
    oficio: string;
  }[];
  
  // Observaciones
  observaciones  String?  @db.Text
  
  @@unique([libroId, numeroAsiento])
  @@index([libroId])
  @@index([subcontratistaId])
}
```

**Vista del Libro (Exportable a PDF):**

```
═══════════════════════════════════════════════════════
  LIBRO DE SUBCONTRATACIÓN
  Obra: Edificio Residencial "Las Encinas" - 120 Viviendas
  Ubicación: Calle Mayor 123, Madrid
  Promotor: Inversiones Inmobiliarias SL
  Nº Habilitación: MAD-2025-001234
═══════════════════════════════════════════════════════

ASIENTO Nº 1                                   Fecha: 10/01/2026
─────────────────────────────────────────────────────────────────
Empresa Subcontratista:  ESTRUCTURAS GARCÍA SL
CIF:                     B12345678
Objeto del Contrato:     Ejecución de estructura de hormigón
                         armado (pilares, forjados, escaleras)
Importe:                 €450,000
Plazo:                   10/01/2026 - 25/03/2026 (75 días)
Nivel:                   1er SUBCONTRATISTA
Contratada por:          CONSTRUCTORA PRINCIPAL ABC SA
Nº Trabajadores:         15
Personal Adscrito:       - Juan García (DNI: 12345678A) Encofrador
                         - Pedro Martínez (DNI: 23456789B) Ferrallista
                         - ... (ver anexo completo)
─────────────────────────────────────────────────────────────────

ASIENTO Nº 2                                   Fecha: 15/01/2026
─────────────────────────────────────────────────────────────────
Empresa Subcontratista:  FONTANERÍA LÓPEZ SL
CIF:                     B87654321
Objeto del Contrato:     Instalación de fontanería y saneamiento
Importe:                 €180,000
Plazo:                   20/01/2026 - 15/03/2026
Nivel:                   1er SUBCONTRATISTA
Contratada por:          CONSTRUCTORA PRINCIPAL ABC SA
Nº Trabajadores:         8
...
─────────────────────────────────────────────────────────────────
```

#### C4. Control de Presencia (Fichaje con Geolocalización)

**App Móvil para Trabajadores:**

```typescript
interface FichajeObra {
  id: string;
  trabajadorId: string;
  obraId: string;
  empresaId: string;
  
  // Entrada
  checkIn: {
    timestamp: Date;
    ubicacion: { lat: number; lng: number };
    dentroPerimetroObra: boolean; // Verificado por geofencing
    fotoSelfie?: string; // Opcional para verificación facial
    firmaTrabajador: string; // Firma digital en pantalla
  };
  
  // Salida
  checkOut?: {
    timestamp: Date;
    ubicacion: { lat: number; lng: number };
    horasTrabajadas: number; // Calculado automáticamente
    incidencias?: string;
  };
  
  // Estado Documental en el Momento del Fichaje
  estadoDocumentalValidado: boolean;
  documentosPendientes: string[]; // Si hay docs caducados, se alerta
}
```

**Flujo de Fichaje:**

```
1. Trabajador abre app ewoorker
   ↓
2. Selecciona obra de la lista
   ↓
3. Botón "Fichar Entrada"
   ↓
4. Sistema verifica:
   - GPS está dentro del perímetro de obra (±200m)
   - Trabajador tiene PRL vigente
   - Reconocimiento médico vigente
   ↓
5. Si TODO OK:
   ✅ Fichaje registrado
   Notificación a Capataz y Jefe de Obra
   
   Si HAY PROBLEMA:
   ⚠️ Alerta: "Certificado PRL caducado. Contacte con su empresa"
   ❌ Bloqueo de acceso a obra
```

**Dashboard para Jefe de Obra:**

```
┌──────────────────────────────────────────────────┐
│  PRESENCIA EN OBRA - Hoy 26 Diciembre 2025      │
├──────────────────────────────────────────────────┤
│                                                  │
│  Total en obra: 23 trabajadores                 │
│  🟢 Con docs OK: 21                             │
│  🔴 Con docs pendientes: 2                      │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  ESTRUCTURAS GARCÍA SL (12 trabajadores) │  │
│  ├──────────────────────────────────────────┤  │
│  │  ✅ Juan García     Entrada: 07:45       │  │
│  │  ✅ Pedro Martínez  Entrada: 07:50       │  │
│  │  ✅ Luis Fernández  Entrada: 08:00       │  │
│  │  ⚠️  Carlos López   Entrada: 08:05       │  │
│  │     └ PRL caduca en 5 días               │  │
│  │  ... ver 8 más                            │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [Ver Todos] [Exportar Parte Diario]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### MÓDULO D: Gestión de Producción (Field Management)

**Objetivo:** Herramientas para el día a día en obra.

#### D1. Partes de Trabajo Digitales

**Sustitución del Papel:**

```typescript
interface ParteTrabajoDigital {
  id: string;
  obraId: string;
  subcontratistaId: string;
  fecha: Date;
  
  // Unidades Ejecutadas
  unidades: {
    descripcion: string; // "m² muro encofrado"
    unidadMedida: string; // "m²"
    cantidadEjecutada: number;
    precioUnitario: number;
    subtotal: number;
    
    // Evidencia
    fotos: File[];
    ubicacionEnPlano?: string; // "Planta 2, Sector B"
  }[];
  
  // Personal Empleado
  trabajadores: {
    nombre: string;
    horasTrabajadas: number;
  }[];
  
  // Maquinaria Utilizada
  maquinaria: {
    tipo: string;
    horas: number;
  }[];
  
  // Materiales Consumidos
  materiales: {
    descripcion: string;
    cantidad: number;
    unidad: string;
  }[];
  
  // Incidencias
  incidencias?: {
    tipo: 'RETRASO' | 'FALTA_MATERIAL' | 'CLIMA' | 'OTRO';
    descripcion: string;
    impactoEnPlazo: boolean;
  }[];
  
  // Firmas
  firmaCapataz: string;
  fechaFirmaCapataz: Date;
  firmaJefeObra?: string;
  fechaAprobacion?: Date;
  
  // Estado
  estado: 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';
  motivoRechazo?: string;
}
```

**App Móvil - Vista del Capataz:**

```
┌──────────────────────────────────────────┐
│  📱 PARTE DE TRABAJO                     │
│  Obra: Edificio Las Encinas              │
│  Fecha: 26 Diciembre 2025                │
├──────────────────────────────────────────┤
│                                          │
│  🏗️ UNIDADES EJECUTADAS:                 │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  m² muro encofrado                 │ │
│  │  Cantidad: [_150__] m²             │ │
│  │  Precio: 35 €/m²                   │ │
│  │  Total: 5,250 €                    │ │
│  │  📸 [3 fotos adjuntas]            │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [+ Añadir Unidad]                       │
│                                          │
│  👷 PERSONAL:                             │
│  • Juan García     8 horas               │
│  • Pedro Martínez  8 horas               │
│  • Luis Fernández  7 horas               │
│  [+ Añadir Trabajador]                   │
│                                          │
│  🚜 MAQUINARIA:                           │
│  • Grúa torre      6 horas               │
│  [+ Añadir Máquina]                      │
│                                          │
│  ⚠️  INCIDENCIAS:                         │
│  • Retraso entrega ferralla 2h           │
│  [+ Añadir Incidencia]                   │
│                                          │
│  ✍️  FIRMA:                               │
│  [____________________________]          │
│  Juan García - Capataz                   │
│                                          │
│  [Enviar a Jefe de Obra]                 │
│                                          │
└──────────────────────────────────────────┘
```

#### D2. Certificaciones Proforma (Generación Automática)

**Objetivo:** Eliminar disputas sobre cantidades a fin de mes.

```typescript
async function generarCertificacionMensual(
  obraId: string, 
  subcontratistaId: string, 
  mes: number, 
  ano: number
) {
  // 1. Obtener todos los partes aprobados del mes
  const partesAprobados = await prisma.parteTrabajoDigital.findMany({
    where: {
      obraId,
      subcontratistaId,
      fecha: {
        gte: new Date(ano, mes - 1, 1),
        lt: new Date(ano, mes, 1)
      },
      estado: 'APROBADO'
    },
    include: {
      unidades: true
    }
  });
  
  // 2. Agrupar unidades por concepto
  const unidadesAgrupadas = agruparPorConcepto(partesAprobados);
  
  // 3. Calcular totales
  const subtotal = calcularSubtotal(unidadesAgrupadas);
  const iva = subtotal * 0.21;
  const total = subtotal + iva;
  
  // 4. Generar documento PDF
  const certificacionPDF = await generarPDFCertificacion({
    obra: obraData,
    subcontratista: subcontratistaData,
    mes,
    ano,
    unidades: unidadesAgrupadas,
    subtotal,
    iva,
    total,
    partesReferencia: partesAprobados.map(p => p.id)
  });
  
  // 5. Crear registro
  const certificacion = await prisma.certificacionObra.create({
    data: {
      obraId,
      subcontratistaId,
      mes,
      ano,
      subtotal,
      iva,
      total,
      pdfUrl: certificacionPDF.url,
      estado: 'PROFORMA', // Pendiente de aprobación final
      partesIncluidos: partesAprobados.map(p => p.id)
    }
  });
  
  return certificacion;
}
```

**Documento de Certificación (PDF):**

```
═════════════════════════════════════════════════════
         CERTIFICACIÓN DE OBRA Nº 1
         MES: DICIEMBRE 2025
═════════════════════════════════════════════════════

OBRA:
Edificio Residencial "Las Encinas" - 120 Viviendas
Calle Mayor 123, Madrid

CONTRATISTA PRINCIPAL:
CONSTRUCTORA ABC SA
CIF: A11111111

SUBCONTRATISTA:
ESTRUCTURAS GARCÍA SL
CIF: B12345678

─────────────────────────────────────────────────────

RESUMEN DE UNIDADES EJECUTADAS:

Descripción                      Cantidad    Precio     Importe
──────────────────────────────────────────────────────────────
m² muro encofrado pilares        450 m²      35,00 €    15.750,00 €
m³ hormigón HA-25 en pilares     85 m³       120,00 €   10.200,00 €
kg ferralla B500S                4.200 kg    1,20 €     5.040,00 €
m² forjado unidireccional        320 m²      45,00 €    14.400,00 €
ml escalera hormigón             24 ml       180,00 €   4.320,00 €

──────────────────────────────────────────────────────────────
                                            SUBTOTAL:  49.710,00 €
                                            IVA 21%:   10.439,10 €
──────────────────────────────────────────────────────────────
                                            TOTAL:     60.149,10 €
══════════════════════════════════════════════════════════════

PARTES DE TRABAJO INCLUIDOS:
- Parte nº 001 (01/12/2025) - 150 m² encofrado
- Parte nº 002 (02/12/2025) - 180 m² encofrado
- Parte nº 003 (05/12/2025) - 120 m² encofrado
- ... (ver listado completo en anexo)

FIRMADO DIGITALMENTE:
Juan García Capataz (Estructuras García SL)
Fecha: 31/12/2025 18:45

PENDIENTE DE APROBACIÓN:
María López - Jefa de Obra (Constructora ABC SA)

─────────────────────────────────────────────────────
Documento generado automáticamente por ewoorker
Código de verificación: EWK-CERT-2025-001234
═════════════════════════════════════════════════════
```

#### D3. Chat Contextual Legal

**Objetivo:** Toda comunicación vinculada a contratos, con valor legal.

```typescript
interface ChatObra {
  id: string;
  obraId: string;
  contratoId?: string;
  unidadObraId?: string; // Contexto específico
  
  // Participantes
  participantes: {
    userId: string;
    role: 'CONSTRUCTOR' | 'SUBCONTRATISTA' | 'TECNICO';
    empresa: string;
  }[];
  
  // Mensajes
  mensajes: {
    id: string;
    remitente: string;
    fecha: Date;
    mensaje: string;
    adjuntos: File[];
    leido: boolean;
    
    // Legal
    esNotificacionOficial: boolean; // Si es una notificación formal
    requiereAcuseRecibo: boolean;
    acuseRecibo?: {
      fecha: Date;
      firmante: string;
    };
  }[];
  
  // Metadata Legal
  exportable: boolean; // Puede exportarse para evidencia judicial
  hashIntegridad: string; // Hash SHA-256 del contenido para verificar no modificación
}
```

**Vista del Chat:**

```
┌──────────────────────────────────────────────────┐
│  💬 Chat - Estructura Edificio C                 │
│  Con: Estructuras García SL                      │
├──────────────────────────────────────────────────┤
│                                                  │
│  [26 Dic 2025 - 10:30] María (Constructor)      │
│  Buenos días, ¿confirman que pueden iniciar     │
│  la semana que viene con los pilares P3-P8?     │
│                                                  │
│  [26 Dic 2025 - 11:15] Juan (García SL)         │
│  Buenos días María. Confirmado. Iniciamos       │
│  martes 31/12 a primera hora. Ya tenemos        │
│  la ferralla en obra.                           │
│  ✅ Leído                                        │
│                                                  │
│  [26 Dic 2025 - 14:00] María (Constructor)      │
│  📎 NOTIFICACIÓN OFICIAL 📎                     │
│  Adjunto replanteo modificado por arquitecto.   │
│  Pilar P5 se desplaza 50cm según plano.         │
│  📄 Plano_Modificado_P5.pdf                     │
│  ⚠️  Requiere acuse de recibo                   │
│                                                  │
│  [26 Dic 2025 - 15:30] Juan (García SL)         │
│  ✅ ACUSE DE RECIBO                             │
│  Modificación recibida y entendida.             │
│  Ajustaremos replanteo pilar P5.                │
│  Sin impacto en plazo ni presupuesto.           │
│  Firma: Juan García (Capataz)                   │
│                                                  │
│  [Escribir mensaje...]                          │
│  [📎 Adjuntar] [📢 Notificación Oficial]       │
│                                                  │
│  [Exportar Chat Completo (PDF Legal)]           │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 💰 MODELO DE NEGOCIO - ESPECIFICACIÓN TÉCNICA

### Planes de Suscripción (Implementación)

```prisma
model Suscripcion {
  id              String   @id @default(cuid())
  empresaId       String
  empresa         Company  @relation(fields: [empresaId], references: [id])
  
  // Plan
  planTipo        PlanTipo
  planNombre      String   // "Obrero", "Capataz", "Constructor"
  precioMensual   Float
  
  // Facturación
  metodoPago      MetodoPago // TARJETA, TRANSFERENCIA, DOMICILIACION
  stripeCustomerId String?  @unique
  stripeSubscriptionId String? @unique
  
  // Estado
  estado          EstadoSuscripcion
  fechaInicio     DateTime
  fechaProximoPago DateTime
  fechaCancelacion DateTime?
  
  // Límites del Plan
  limites         Json // { obrasActivas: 10, propuestasActivasIlimitadas: true }
  
  // Uso actual
  usoActual       Json // { obrasPublicadas: 3, propuestasEnviadas: 45 }
  
  // Historial de pagos
  pagos           PagoSuscripcion[]
  
  @@index([empresaId])
  @@index([estado])
}

enum PlanTipo {
  OBRERO_FREE
  CAPATAZ_PRO
  CONSTRUCTOR_ENTERPRISE
}

enum EstadoSuscripcion {
  ACTIVA
  PENDIENTE_PAGO
  CANCELADA
  SUSPENDIDA
}

enum MetodoPago {
  TARJETA
  TRANSFERENCIA
  DOMICILIACION
  SEPA
}
```

### Sistema de Comisiones Transaccionales

```prisma
model ComisionTransaccional {
  id              String   @id @default(cuid())
  contratoId      String
  contrato        ContratoObra @relation(fields: [contratoId], references: [id])
  
  // Tipo de Comisión
  tipoServicio    TipoServicioComision
  
  // Cálculo
  baseComision    Float    // Monto sobre el que se calcula
  porcentaje      Float    // % de comisión
  montoComision   Float    // Resultado
  
  // Partes
  pagadoPor       String   // ID de la empresa que paga
  cobradoPor      String   // 'ewoorker'
  
  // Estado
  estado          EstadoComision
  fechaGeneracion DateTime @default(now())
  fechaCobro      DateTime?
  
  // Referencia de pago
  transaccionId   String?
  
  @@index([contratoId])
  @@index([estado])
}

enum TipoServicioComision {
  PAGO_SEGURO_ESCROW    // 1.5-3%
  CONTRATACION_URGENTE  // 5-10%
  MAQUINARIA_ON_DEMAND  // 5-10%
}

enum EstadoComision {
  PENDIENTE
  COBRADA
  CANCELADA
}
```

### Gestión de Escrow (Pagos Seguros)

```typescript
class EscrowService {
  // 1. Cliente hace un pago
  async crearPagoEscrow(params: {
    contratoId: string;
    monto: number;
    concepto: string;
    condicionesLiberacion: string[];
  }) {
    // Stripe o pasarela similar
    const payment = await stripe.paymentIntents.create({
      amount: params.monto * 100, // Convertir a centavos
      currency: 'eur',
      metadata: {
        contratoId: params.contratoId,
        tipo: 'ESCROW'
      },
      capture_method: 'manual' // NO capturar automáticamente
    });
    
    // Guardar en BD
    const escrow = await prisma.pagoEscrow.create({
      data: {
        contratoId: params.contratoId,
        monto: params.monto,
        estado: 'RETENIDO',
        stripePaymentIntentId: payment.id,
        condicionesLiberacion: params.condicionesLiberacion
      }
    });
    
    return escrow;
  }
  
  // 2. Se cumple una condición (ej. hito aprobado)
  async verificarCondicionesLiberacion(escrowId: string, condicion: string) {
    const escrow = await prisma.pagoEscrow.findUnique({
      where: { id: escrowId },
      include: { condicionesCompletadas: true }
    });
    
    // Marcar condición como cumplida
    await prisma.pagoEscrow.update({
      where: { id: escrowId },
      data: {
        condicionesCompletadas: {
          push: condicion
        }
      }
    });
    
    // Si TODAS las condiciones están cumplidas, liberar
    if (todasLasCondicionesCumplidas(escrow)) {
      await this.liberarFondos(escrowId);
    }
  }
  
  // 3. Liberar fondos al subcontratista
  async liberarFondos(escrowId: string) {
    const escrow = await prisma.pagoEscrow.findUnique({
      where: { id: escrowId }
    });
    
    // Capturar el pago en Stripe
    await stripe.paymentIntents.capture(escrow.stripePaymentIntentId);
    
    // Calcular comisión de ewoorker
    const comision = escrow.monto * 0.025; // 2.5%
    const montoNeto = escrow.monto - comision;
    
    // Transferir al subcontratista (Stripe Connect)
    await stripe.transfers.create({
      amount: montoNeto * 100,
      currency: 'eur',
      destination: escrow.subcontratista.stripeAccountId,
      description: `Pago obra ${escrow.contratoId}`
    });
    
    // Actualizar estado
    await prisma.pagoEscrow.update({
      where: { id: escrowId },
      data: {
        estado: 'LIBERADO',
        fechaLiberacion: new Date()
      }
    });
    
    // Registrar comisión
    await prisma.comisionTransaccional.create({
      data: {
        contratoId: escrow.contratoId,
        tipoServicio: 'PAGO_SEGURO_ESCROW',
        baseComision: escrow.monto,
        porcentaje: 2.5,
        montoComision: comision,
        estado: 'COBRADA'
      }
    });
  }
}
```

---

## 🚀 HOJA DE RUTA DE IMPLEMENTACIÓN

### FASE 1: MVP (Meses 1-4) - "Compliance-First MVP"

**Objetivo:** Lanzar en UNA provincia con funcionalidades core de cumplimiento legal.

#### Sprint 1-2 (Semanas 1-4): Fundamentos

**Tareas Técnicas:**
- [ ] Setup monorepo (Next.js + Prisma + PostgreSQL)
- [ ] Diseño e implementación del schema de BD completo
- [ ] Sistema de autenticación (NextAuth.js)
  - Login empresa
  - Roles y permisos
  - Verificación email
- [ ] Módulo de Onboarding básico
  - Formulario registro empresa
  - Validación CIF con VIES
  - Upload de documentos (S3/Cloudflare R2)
- [ ] Dashboard esqueleto (3 vistas: Constructor, Subcontratista, Admin)

**Entregable:** Sistema con login funcional y perfiles básicos.

---

#### Sprint 3-4 (Semanas 5-8): Compliance Hub (Core Diferenciador)

**Tareas Técnicas:**
- [ ] Gestor documental con OCR
  - Integración AWS Textract o Google Vision API
  - Extractores específicos (TC1, TC2, Seguros, REA)
  - Validación de fechas de caducidad
- [ ] Semáforo de documentación
  - Algoritmo de cálculo de estado (Verde/Amarillo/Rojo)
  - Dashboard de compliance para constructor
- [ ] **INTEGRACIÓN REA** (crítico)
  - API scraping de bases de datos autonómicas (empezar con Madrid)
  - Sistema de caché y actualización periódica
- [ ] Alertas automáticas de caducidad
  - Email + Push notification
  - 30 días, 15 días, 7 días, caducado
- [ ] Libro de Subcontratación digital (versión básica)
  - Registro de asientos
  - Generación PDF oficial

**Entregable:** Herramienta que verifica el cumplimiento legal automáticamente.

---

#### Sprint 5-6 (Semanas 9-12): Marketplace Básico

**Tareas Técnicas:**
- [ ] Publicación de obra (por Constructor)
  - Formulario completo
  - Upload de planos/documentos
  - Geocodificación de dirección
- [ ] Buscador de obras (para Subcontratista)
  - Filtros básicos (ubicación, oficio, presupuesto)
  - Vista de tarjetas de obra
- [ ] Sistema de ofertas
  - Formulario de presupuesto
  - Upload de propuesta
  - Notificaciones de nueva oferta
- [ ] Comparador de ofertas (para Constructor)
  - Vista de tabla comparativa
  - Adjudicación manual

**Entregable:** Flujo completo de publicar obra → recibir ofertas → adjudicar.

---

#### Sprint 7-8 (Semanas 13-16): Piloto y Testing

**Tareas:**
- [ ] Beta testing con 5 constructoras y 20 subcontratas en Madrid
- [ ] Onboarding presencial (equipo de Customer Success)
- [ ] Recopilación de feedback
- [ ] Ajustes UX críticos
- [ ] Documentación de ayuda y tutoriales en vídeo

**Entregable:** MVP validado con usuarios reales.

---

### FASE 2: Product-Market Fit (Meses 5-12)

#### Trimestre 2 (Meses 5-7): Automatización y Móvil

**Tareas Técnicas:**
- [ ] **App Móvil React Native:**
  - Fichaje con geolocalización
  - Upload de fotos de progreso
  - Partes de trabajo digitales
  - Chat en tiempo real (Socket.io)
- [ ] Validación automática de documentos mejorada
  - Machine Learning para OCR más preciso
  - Integración con más fuentes de datos (Seguridad Social API si disponible)
- [ ] Gestión de certificaciones
  - Partes de trabajo agrupados por mes
  - Generación automática de certificación proforma
  - Workflow de aprobación
- [ ] **Integraciones de Pago (Stripe Connect):**
  - Onboarding de Stripe para subcontratistas
  - Escrow básico
  - Transferencias automatizadas

**Funcionalidades de Negocio:**
- [ ] Lanzamiento de Planes de Pago
  - Implementación de paywall
  - Límites por plan
  - Facturación automática mensual
- [ ] Sistema de notificaciones push
  - Firebase Cloud Messaging
  - Notificaciones críticas (docs caducados, nuevas ofertas)

---

#### Trimestre 3 (Meses 8-10): Escalado Regional

**Expansión Geográfica:**
- [ ] Adaptación a 3 provincias más (ej. Valencia, Sevilla, Barcelona)
- [ ] Localización de bases de datos REA autonómicas
- [ ] Marketing regional focalizado

**Funcionalidades Avanzadas:**
- [ ] Libro de Subcontratación oficial exportable
  - PDF con sello digital
  - Trazabilidad completa de la cadena
  - Bloqueo automático de 4º nivel (excepciones autorizadas)
- [ ] Analytics y reportes
  - Dashboard de KPIs para constructores
  - Informes de productividad para subcontratistas
- [ ] Integración con ERPs de construcción
  - API REST pública
  - Webhooks para eventos críticos
  - Conectores pre-construidos (ej. SAP B1, Presto)

---

#### Trimestre 4 (Meses 11-12): Optimización y Preparación para Inversión

**Tareas:**
- [ ] Optimización de costes de infraestructura
- [ ] Mejoras de performance (CDN, caching, optimización de queries)
- [ ] Testing de carga (10,000 usuarios concurrentes)
- [ ] Auditoría de seguridad completa (pentest externo)
- [ ] Preparación de métricas para inversores (MRR, CAC, LTV, Churn)

**Nuevas Features:**
- [ ] Marketplace de Maquinaria (opcional)
- [ ] Servicio de Factoring (adelanto de certificaciones)
- [ ] Sistema de Disputas y Mediación

---

### FASE 3: Escalado Nacional (Año 2)

#### Objetivos:
- [ ] Presencia en las 15 principales ciudades españolas
- [ ] 10,000 empresas registradas (5,000 activas)
- [ ] €10M en GMV (Gross Merchandise Value)
- [ ] MRR (Monthly Recurring Revenue): €150,000
- [ ] Ronda de financiación Serie A

#### Expansión de Producto:
- [ ] ewoorker Academy (formación PRL online certificada)
- [ ] Seguros específicos para construcción (partnership con aseguradora)
- [ ] Sistema de scoring de empresas (como TrustPilot pero B2B)

---

## 🛠️ STACK TECNOLÓGICO RECOMENDADO

### Frontend
```typescript
- Framework: Next.js 14 (App Router)
- UI: Tailwind CSS + shadcn/ui
- State Management: Zustand + React Query
- Mapas: Mapbox GL JS (para geolocalización)
- Charts: Recharts o Chart.js
- PDF Generation: React-PDF o Puppeteer
- Mobile: React Native (Expo)
```

### Backend
```typescript
- Runtime: Node.js 20 LTS
- ORM: Prisma
- Base de Datos: PostgreSQL 15+ (con PostGIS para geo)
- Autenticación: NextAuth.js v5
- APIs: tRPC (type-safe) o REST
- Background Jobs: BullMQ + Redis
- Real-time: Socket.io
- File Storage: AWS S3 o Cloudflare R2
```

### Servicios Externos
```typescript
- OCR: AWS Textract (primero) → Google Vision API (fallback)
- Pagos: Stripe Connect
- Email: SendGrid o AWS SES
- SMS: Twilio
- Push Notifications: Firebase Cloud Messaging
- Monitoring: Sentry + Vercel Analytics
- Logs: Better Stack o Datadog
```

### Infraestructura
```typescript
- Hosting: Vercel (frontend) + Railway/Render (backend)
- CI/CD: GitHub Actions
- Testing: Vitest + Playwright
- Documentación: Storybook + Swagger
```

---

## 📊 MÉTRICAS DE ÉXITO (KPIs)

### North Star Metric:
**Número de contratos exitosamente gestionados por mes** (indica que el marketplace funciona Y que el compliance es útil).

### KPIs de Producto:

**Liquidez del Marketplace:**
```
- Ratio de ofertas por obra: >3 ofertas/obra (objetivo)
- Tiempo medio hasta primera oferta: <24 horas
- Tasa de adjudicación: >60% de obras publicadas
```

**Compliance Effectiveness:**
```
- % de empresas con documentación "Verde": >85%
- Tiempo de validación documental: <2 horas (objetivo: automático)
- Alertas de caducidad prevenidas: Track de docs actualizados antes de caducar
```

**Engagement:**
```
- DAU/MAU (Daily Active Users / Monthly): >40% (uso frecuente)
- Tasa de retención mes 2: >70%
- NPS (Net Promoter Score): >50
```

### KPIs de Negocio:

**Revenue:**
```
- MRR (Monthly Recurring Revenue): Crecimiento 15% MoM
- ARR (Annual Recurring Revenue): Objetivo Año 1: €500k
- GMV (Gross Merchandise Value): Objetivo Año 1: €5M
- Comisiones transaccionales: 15% del revenue total
```

**Adquisición:**
```
- CAC (Customer Acquisition Cost): <€300 por empresa
- Payback CAC: <12 meses
- LTV (Lifetime Value): >€3,000 (10x CAC)
```

**Operaciones:**
```
- Tiempo medio de onboarding: <30 minutos
- Tasa de completitud de perfil: >90%
- Tickets de soporte/usuario/mes: <0.5 (muy automatizado)
```

---

## 🎯 CREDENCIALES DE DEMO PARA TU SOCIO

### Entorno de Staging

#### Acceso como Constructor (Cliente)
```
URL: https://staging.ewoorker.com/login
Email: constructor.demo@ewoorker.com
Password: Demo2026!

Empresa: Constructora ABC SA
CIF: A12345678
Plan: Constructor Enterprise

Dashboard incluye:
- 3 obras activas con ofertas recibidas
- Compliance dashboard con 2 subcontratas "Verde"
- Libro de Subcontratación digital
- Certificaciones pendientes de aprobar
```

#### Acceso como Subcontratista (Proveedor)
```
URL: https://staging.ewoorker.com/login
Email: subcontratista.demo@ewoorker.com
Password: Demo2026!

Empresa: Estructuras García SL
CIF: B87654321
Plan: Capataz Pro

Dashboard incluye:
- 12 obras disponibles en Madrid
- 3 ofertas enviadas (1 aceptada)
- 1 proyecto activo con partes de trabajo
- Documentación PRL al día (semáforo Verde)
```

#### Acceso como Autónomo
```
URL: https://staging.ewoorker.com/login
Email: autonomo.demo@ewoorker.com
Password: Demo2026!

Profesional: Juan Martínez (Electricista)
DNI: 12345678A
Plan: Obrero (Free)

Dashboard incluye:
- Búsqueda de obras de electricidad
- Perfil con portfolio
- Restricción de subcontratación (bloqueado correctamente)
```

#### Acceso Admin (para revisión interna)
```
URL: https://staging.ewoorker.com/admin
Email: admin@ewoorker.com
Password: Admin2026!

Panel admin con:
- Gestión de usuarios y empresas
- Verificación manual de REA pendientes
- Moderación de disputas
- Analytics del sistema
- Configuración de planes de pago
```

---

## 📞 PRÓXIMOS PASOS INMEDIATOS

### 1. ✅ VALIDACIÓN DE LA VISIÓN

**Pregunta Clave:** ¿Este plan refleja la visión completa de ewoorker tal como la tienes en mente?

**Aspectos a confirmar:**
- Modelo de negocio híbrido (SaaS + comisiones)
- Foco en cumplimiento legal como diferenciador
- Alcance del MVP (funcionalidades mínimas)
- Timeline y recursos necesarios

---

### 2. 🎯 DEFINIR PRIORIDADES

**Opciones:**

**A) Desarrollo Completo desde Cero (Recomendado)**
- Timeline: 12 meses hasta Product-Market Fit
- Equipo: 3-4 desarrolladores full-time
- Presupuesto: €100,000 - €150,000

**B) Integración con INMOVA Existente**
- Reutilizar infraestructura actual de INMOVA
- Adaptación de módulos `/marketplace`, `/construction`, `/professional`
- Timeline: 6 meses
- Más económico pero con deuda técnica

**C) MVP Ultra-rápido (3 meses)**
- Solo Marketplace + Compliance básico
- Validación manual de documentos (concierge MVP)
- Sin app móvil
- Para validar market fit rápido

---

### 3. 💼 RECURSOS Y EQUIPO

**Equipo Mínimo Necesario:**

```
Fase MVP (4 meses):
- 1 Full-stack Senior (Lead)
- 1-2 Full-stack Mid
- 1 Product Manager / Owner
- 1 Diseñador UI/UX (part-time)
- 1 QA / Tester (part-time)

Fase Product-Market Fit (8 meses):
- +1 Mobile Developer (React Native)
- +1 Backend Developer
- +1 Customer Success / Onboarding
- +1 Sales / Business Development

Total equipo completo: 8-10 personas
```

---

### 4. 🚀 ACCIÓN INMEDIATA

**¿Qué quieres hacer ahora?**

**Opción A:** Comenzar implementación del MVP
- Crear estructura inicial del proyecto
- Setup de base de datos
- Primeras pantallas

**Opción B:** Crear presentación para inversores/socios
- Pitch deck con estos datos
- Proyecciones financieras
- Go-to-market strategy

**Opción C:** Validación de mercado primero
- Entrevistas con 20 constructoras
- Validar pain points
- Ajustar propuesta de valor

**Opción D:** Integración con INMOVA
- Mapear funcionalidades existentes
- Plan de migración/adaptación
- Reutilizar módulos actuales

---

## 📝 CONCLUSIONES

ewoorker no es un simple marketplace, es una **plataforma de infraestructura crítica** para el sector de la construcción español. Su éxito dependerá de:

1. **Excelencia en Compliance:** Convertir la burocracia en ventaja competitiva
2. **Usabilidad Radical:** Interfaces tan simples como WhatsApp
3. **Efecto de Red:** Más oferta atrae más demanda, y viceversa
4. **Confianza:** Verificación rigurosa de todas las empresas

**El timing es perfecto:** Crisis de mano de obra + presión legal creciente + madurez tecnológica.

---

**¿Por dónde empezamos?**

---

**Documento generado:** 26 Diciembre 2025  
**Basado en:** Plan Estratégico Oficial de ewoorker  
**Siguiente paso:** Decisión de implementación  
**Estado:** ✅ LISTO PARA DESARROLLO

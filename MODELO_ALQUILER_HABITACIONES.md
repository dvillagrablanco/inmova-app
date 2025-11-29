# 🛏️ MODELO DE NEGOCIO: ALQUILER DE HABITACIONES

## Documento Técnico y Estratégico INMOVA

---

## 📋 ÍNDICE

1. [Introducción](#introduccion)
2. [Análisis del Mercado](#mercado)
3. [Diferenciación vs Coliving](#diferenciacion)
4. [Modelo Operativo](#operativo)
5. [Stack Tecnológico](#tecnologia)
6. [Casos de Uso](#casos-uso)
7. [ROI y Rentabilidad](#roi)
8. [Implementación en INMOVA](#implementacion)
9. [Roadmap](#roadmap)

---

## 🎯 INTRODUCCIÓN {#introduccion}

### Definición

**Room Rental** (Alquiler por Habitaciones) es un modelo de negocio inmobiliario donde una propiedad se subdivide en habitaciones individuales, cada una generando ingresos independientes, mientras se comparten zonas comunes (cocina, baño, salón).

**Diferencia clave con Coliving**: Mientras el coliving es un concepto moderno gestionado profesionalmente con énfasis en comunidad y servicios, el alquiler de habitaciones es más tradicional, enfocado en maximizar rentabilidad mediante subdivisión espacial.

### Oportunidad de Mercado

- **Mercado europeo**: €550 billones proyectados en la próxima década (Cushman & Wakefield)
- **Rentabilidad**: 20-30% mayor que alquiler tradicional
- **Demanda**: Estudiantes, jóvenes profesionales, expatriados, trabajadores temporales
- **Geografía**: Ciudades universitarias, capitales, zonas tech hubs

### Ejemplo Comparativo

| Concepto | Alquiler Tradicional | Alquiler por Habitaciones |
|----------|---------------------|---------------------------|
| **Propiedad** | Piso 3 habitaciones | Mismo piso |
| **Renta Mensual** | €1,200 (total) | €600 × 3 hab = €1,800 |
| **Incremento** | Baseline | +50% |
| **Ingresos Anuales** | €14,400 | €21,600 (+€7,200) |
| **ROI** | 8% | 12% |

---

## 📊 ANÁLISIS DEL MERCADO {#mercado}

### Segmentos Target

#### 1. Estudiantes Universitarios

**Características**:
- Edad: 18-25 años
- Duración: 10 meses (curso académico)
- Budget: €300-500/mes
- Ubicación: Proximidad a campus universitario
- Necesidades: WiFi, escritorio, ambiente de estudio

**Hotspots España**:
- Madrid (Complutense, Politécnica, Autónoma)
- Barcelona (UB, UPC, Pompeu Fabra)
- Valencia (UV, Politécnica)
- Sevilla (US)
- Salamanca (USAL)

#### 2. Young Professionals

**Características**:
- Edad: 25-35 años
- Duración: 6-18 meses
- Budget: €400-700/mes
- Ubicación: Proximidad a distrito financiero/tech
- Necesidades: Coworking space, networking, calidad

**Hotspots España**:
- Madrid (Chamberí, Salamanca, Chamartín)
- Barcelona (Eixample, Gràcia)
- Málaga (Tech Hub)

#### 3. Expatriados y Relocations

**Características**:
- Edad: 30-45 años
- Duración: 3-12 meses
- Budget: €500-900/mes
- Ubicación: Céntrico, bien comunicado
- Necesidades: Flexibilidad, mobiliario completo, servicios

#### 4. Trabajadores Temporales

**Características**:
- Edad: 25-50 años
- Duración: 1-6 meses
- Budget: €400-800/mes
- Ubicación: Proximidad a polígonos industriales/zona trabajo
- Necesidades: Accesibilidad, funcionalidad

### Datos de Mercado España

**Ciudades con Mayor Demanda**:
1. **Madrid**: 80,000 estudiantes + 150,000 jóvenes profesionales
2. **Barcelona**: 70,000 estudiantes + 120,000 jóvenes profesionales
3. **Valencia**: 50,000 estudiantes
4. **Sevilla**: 40,000 estudiantes
5. **Málaga**: 20,000 tech workers

**Precio Medio por Habitación (2024)**:
- Madrid Centro: €550/mes
- Barcelona Centro: €520/mes
- Valencia: €380/mes
- Sevilla: €340/mes
- Málaga: €420/mes

### Estacionalidad

```
Enero-Febrero:    Alta (inicio semestre)
Marzo-Mayo:       Media-Alta
Junio-Agosto:     Baja (verano)
Septiembre:       Muy Alta (inicio curso)
Octubre-Diciembre: Alta
```

---

## 🔄 DIFERENCIACIÓN vs COLIVING {#diferenciacion}

### Comparativa Detallada

| Aspecto | Room Rental | Coliving |
|---------|-------------|----------|
| **Gestión** | Auto-gestión o gestión mínima | Gestión profesional completa |
| **Servicios** | Básicos (WiFi, limpieza ocasional) | All-inclusive (limpieza, eventos, coworking) |
| **Comunidad** | Orgánica, no planificada | Diseñada, eventos regulares |
| **Contratos** | Individuales por habitación | Individuales con experiencia comunitaria |
| **Mobiliario** | Variable (puede requerir inversión inquilino) | Totalmente amueblado premium |
| **Precio** | €300-700/mes | €600-1,200/mes |
| **Flexibilidad** | Media (6-12 meses) | Alta (mensual) |
| **Target** | Estudiantes, low-mid budget | Young professionals, mid-high budget |
| **Margen** | 20-30% más que tradicional | 40-60% más que tradicional |
| **Complejidad** | Media | Alta |
| **Scalabilidad** | Alta | Media |

### Cuando Elegir Room Rental

✅ **SÍ a Room Rental si**:
- Presupuesto limitado para amenities premium
- Target principalmente estudiantes
- Zona universitaria o industrial
- Gestión más hands-off
- Modelo ya validado en la zona
- Regulación favorable

❌ **NO a Room Rental (mejor Coliving) si**:
- Target premium (young professionals tech)
- Zona de alto valor (distritos financieros)
- Capacidad de inversión en amenities
- Estrategia de marca y posicionamiento
- Regulación restrictiva para room rental

---

## ⚙️ MODELO OPERATIVO {#operativo}

### Estructura de Propiedad

#### 1. Distribución Espacial Ideal

**Propiedad Tipo: 120m² - 4 Habitaciones**

```
┌─────────────────────────────────────────┐
│  PLANTA                                 │
├─────────────────────────────────────────┤
│  Habitación 1: 15m² (1 cama, armario,  │
│                      escritorio)        │
│                                         │
│  Habitación 2: 15m² (ídem)              │
│                                         │
│  Habitación 3: 12m² (ídem)              │
│                                         │
│  Habitación 4: 12m² (ídem)              │
│                                         │
│  Salón Común: 30m²                      │
│    - Sofá, TV, mesa comedor             │
│                                         │
│  Cocina: 12m²                           │
│    - Nevera grande, lavavajillas        │
│                                         │
│  Baño Principal: 8m²                    │
│  Baño Secundario: 6m²                   │
│                                         │
│  Lavadero: 5m²                          │
│  Trastero: 5m²                          │
└─────────────────────────────────────────┘
```

#### 2. Inversión Inicial (Ejemplo 120m²)

| Concepto | Coste |
|----------|-------|
| **Acondicionamiento** | |
| Pintura completa | €2,000 |
| Suelos laminados (si necesario) | €3,500 |
| Puertas con cerradura | €800 |
| **Mobiliario Habitaciones (×4)** | |
| Cama + colchón | €1,200 |
| Armario | €600 |
| Escritorio + silla | €400 |
| Lámpara, cortinas | €150 |
| **Subtotal por habitación** | €2,350 × 4 = **€9,400** |
| **Zonas Comunes** | |
| Sofá, mesa, sillas | €2,000 |
| TV, electrodomésticos | €1,500 |
| Menaje cocina | €500 |
| **Otros** | |
| Mejora WiFi (router profesional) | €300 |
| Seguridad (cerraduras, alarma) | €800 |
| **TOTAL INVERSIÓN INICIAL** | **€20,400** |

#### 3. Análisis de Rentabilidad

**Ingresos**:
- Habitación 1 (15m²): €550/mes
- Habitación 2 (15m²): €550/mes
- Habitación 3 (12m²): €500/mes
- Habitación 4 (12m²): €500/mes
- **Total Mensual**: €2,100
- **Total Anual**: €25,200

**Gastos**:
- IBI: €800/año
- Comunidad: €1,200/año
- Seguro multirriesgo: €600/año
- Reparaciones y mantenimiento: €1,500/año
- Limpieza zonas comunes (mensual): €1,200/año
- Gestoría (opcional): €600/año
- **Total Gastos Anuales**: €5,900

**Resultado**:
- Ingresos Netos Anuales: €25,200 - €5,900 = **€19,300**
- Si la propiedad vale €200,000
- **ROI Bruto**: 9.65%

vs.

**Alquiler Tradicional**:
- Renta: €1,400/mes × 12 = €16,800/año
- Gastos: €4,500/año
- Ingresos Netos: €12,300
- **ROI Bruto**: 6.15%

**Incremento ROI**: +57% 🚀

### Gestión de Contratos

#### Tipos de Contrato

**A. Contrato Individual por Habitación**

✅ **Ventajas**:
- Responsabilidad individual (no solidaria)
- Rotación independiente
- Menos conflictos legales

❌ **Desventajas**:
- Más administración
- Más contratos que gestionar

**Cláusulas Esenciales**:
1. **Descripción Espacios**:
   - Privado: Habitación X (especificar m², mobiliario)
   - Compartido: Cocina, salones, baños (detalle uso)
2. **Normas Convivencia**:
   - Horarios ruido (22:00-08:00 silencio)
   - Uso zonas comunes
   - Invitados (máximo 2 noches/mes)
   - Limpieza (turnos rotativos o servicio)
3. **Gastos**:
   - Renta: €XXX/mes (incluye comunidad, basuras)
   - Suministros: Prorrateo equitativo o contador individual
   - WiFi: Incluido
4. **Fianza**:
   - 1 mes (depositada en organismo oficial)
5. **Duración**:
   - Estudiantes: 10 meses (sept-junio)
   - Profesionales: 6-12 meses
   - Temporales: 3-6 meses

#### Gestión de Suministros

**Opción 1: Prorrateo Equitativo**
```
Gas: €60/mes ÷ 4 inquilinos = €15/persona
Luz: €80/mes ÷ 4 inquilinos = €20/persona
Agua: €40/mes ÷ 4 inquilinos = €10/persona
Total por inquilino: €45/mes
```

**Opción 2: Contadores Individuales** (Ideal pero costoso)
- Subcontadores por habitación
- Facturación real por consumo
- Mayor inversión inicial
- Menos conflictos

### Mantenimiento y Operaciones

#### Limpieza

**Zonas Privadas** (Habitaciones):
- Responsabilidad: Inquilino
- Frecuencia: Según preferencia

**Zonas Comunes**:
- **Opción A**: Servicio profesional
  - Frecuencia: 1 vez/semana
  - Coste: €100/mes
  - Incluido en renta o prorrateo
- **Opción B**: Turnos rotativos inquilinos
  - Coste: €0
  - Riesgo: Conflictos, menor calidad

#### Mantenimiento Preventivo

| Elemento | Frecuencia | Coste Estimado |
|----------|------------|----------------|
| Revisión fontanería | Anual | €150 |
| Revisión eléctrica | Bianual | €200 |
| Electrodomésticos | Anual | €100 |
| Pintura zonas comunes | 2 años | €800 |
| Renovación mobiliario | 5 años | €2,000 |

---

## 💻 STACK TECNOLÓGICO {#tecnologia}

### Módulos INMOVA para Room Rental

INMOVA adapta su plataforma para gestionar alquiler de habitaciones mediante:

#### 1. Modelo de Datos

```prisma
model Room {
  id                String    @id @default(cuid())
  unitId            String
  unit              Unit      @relation(fields: [unitId])
  numero            String    // "Habitación 1", "1A", etc.
  metrosCuadrados   Float
  descripcion       String?
  mobiliario        String[]  // ["cama", "armario", "escritorio"]
  precio            Float
  estado            RoomStatus
  contracts         RoomContract[]
  createdAt         DateTime  @default(now())
}

enum RoomStatus {
  DISPONIBLE
  OCUPADA
  MANTENIMIENTO
  RESERVADA
}

model RoomContract {
  id                String    @id @default(cuid())
  roomId            String
  room              Room      @relation(fields: [roomId])
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId])
  unitId            String    // Para tracking a nivel unidad completa
  unit              Unit      @relation(fields: [unitId])
  fechaInicio       DateTime
  fechaFin          DateTime
  rentaMensual      Float
  fianza            Float
  estado            ContractStatus
  payments          RoomPayment[]
  normasConvivencia Json?     // Normas específicas
}

model RoomPayment {
  id                String    @id @default(cuid())
  roomContractId    String
  contract          RoomContract @relation(fields: [roomContractId])
  fechaVencimiento  DateTime
  monto             Float
  concepto          String    // "Renta" o "Suministros"
  estado            PaymentStatus
  fechaPago         DateTime?
}

model SharedSpaceRule {
  id                String    @id @default(cuid())
  unitId            String
  unit              Unit      @relation(fields: [unitId])
  titulo            String    // "Horario Ruido", "Limpieza"
  descripcion       String
  obligatorio       Boolean
  activo            Boolean   @default(true)
}
```

#### 2. Features Específicas

**A. Dashboard Room Rental**

```typescript
interface RoomRentalDashboard {
  unit: {
    address: string;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number; // %
  };
  financials: {
    monthlyIncome: number;
    vsTraditionalRental: {
      traditional: number;
      roomRental: number;
      difference: number;
      percentageIncrease: number;
    };
  };
  rooms: Room[];
  tenants: Tenant[];
  upcomingPayments: Payment[];
  maintenanceIssues: Issue[];
}
```

**B. Gestión de Normas de Convivencia**

```typescript
// app/api/room-rental/rules/route.ts
export async function POST(req: NextRequest) {
  const { unitId, rules } = await req.json();
  
  // Crear normas predefinidas para la unidad
  const defaultRules = [
    {
      titulo: "Horario de Silencio",
      descripcion: "De 22:00 a 08:00, mantener silencio en zonas comunes",
      obligatorio: true
    },
    {
      titulo: "Limpieza Zonas Comunes",
      descripcion: "Turno rotativo semanal o servicio profesional incluido",
      obligatorio: true
    },
    {
      titulo: "Política de Invitados",
      descripcion: "Máximo 2 noches consecutivas por mes, previo aviso",
      obligatorio: true
    },
    {
      titulo: "Uso de Cocina",
      descripcion: "Limpiar inmediatamente después de usar. Frigorífico etiquetado.",
      obligatorio: true
    }
  ];
  
  // ... lógica de creación
}
```

**C. Prorrateo Automático de Suministros**

```typescript
// lib/room-rental-service.ts
export async function calculateUtilityBill(
  unitId: string,
  month: string,
  year: number
) {
  // Obtener gastos del mes
  const utilities = await prisma.expense.findMany({
    where: {
      unit: { id: unitId },
      categoria: { in: ["Electricidad", "Agua", "Gas"] },
      fecha: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
      }
    }
  });
  
  // Contar inquilinos activos en el mes
  const activeRooms = await prisma.roomContract.count({
    where: {
      unitId,
      estado: "activo",
      fechaInicio: { lte: new Date(year, month, 0) },
      OR: [
        { fechaFin: { gte: new Date(year, month - 1, 1) } },
        { fechaFin: null }
      ]
    }
  });
  
  const totalUtilities = utilities.reduce((sum, u) => sum + u.monto, 0);
  const perTenant = totalUtilities / activeRooms;
  
  // Crear pagos individuales
  const contracts = await prisma.roomContract.findMany({
    where: { /* ... */ }
  });
  
  for (const contract of contracts) {
    await prisma.roomPayment.create({
      data: {
        roomContractId: contract.id,
        concepto: "Suministros",
        monto: perTenant,
        fechaVencimiento: new Date(year, month, 5),
        estado: "pendiente"
      }
    });
  }
  
  return { perTenant, totalUtilities, activeRooms };
}
```

**D. Calendario de Rotación de Limpieza**

```typescript
interface CleaningSchedule {
  week: number;
  assignedRoom: string;
  tenantName: string;
  completed: boolean;
  verifiedAt?: Date;
}

export async function generateCleaningSchedule(
  unitId: string,
  startDate: Date,
  weeks: number = 12
): Promise<CleaningSchedule[]> {
  const rooms = await prisma.room.findMany({
    where: { unitId, estado: "OCUPADA" },
    include: { 
      contracts: { 
        where: { estado: "activo" },
        include: { tenant: true }
      } 
    }
  });
  
  const schedule: CleaningSchedule[] = [];
  
  for (let week = 0; week < weeks; week++) {
    const roomIndex = week % rooms.length;
    schedule.push({
      week: week + 1,
      assignedRoom: rooms[roomIndex].numero,
      tenantName: rooms[roomIndex].contracts[0].tenant.nombre,
      completed: false
    });
  }
  
  return schedule;
}
```

#### 3. UI Components

**A. Room Management Grid**

```typescript
// app/room-rental/[unitId]/rooms/page.tsx
export default function RoomManagementPage({ params }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map(room => (
        <Card key={room.id} className="relative">
          <Badge 
            className="absolute top-2 right-2"
            variant={room.estado === 'OCUPADA' ? 'default' : 'secondary'}
          >
            {room.estado}
          </Badge>
          
          <CardHeader>
            <CardTitle>{room.numero}</CardTitle>
            <CardDescription>{room.metrosCuadrados}m²</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio</span>
                <span className="font-semibold">€{room.precio}/mes</span>
              </div>
              
              {room.estado === 'OCUPADA' && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Inquilino</span>
                    <p className="font-medium">{room.tenant?.nombre}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Contrato hasta</span>
                    <p>{format(room.contract.fechaFin, 'dd/MM/yyyy')}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2">
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalle
            </Button>
            {room.estado === 'DISPONIBLE' && (
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Asignar
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

**B. Tenant Communication Portal**

Portal específico para inquilinos de Room Rental con:
- Vista de su habitación y contrato
- Calendario de turnos de limpieza
- Chat con otros inquilinos (opcional)
- Reportar incidencias específicas
- Ver y pagar suministros prorrateados

---

## 🎯 CASOS DE USO {#casos-uso}

### Caso 1: Universidad Complutense - Madrid

**Perfil Gestor**: Inversora particular con 3 pisos cerca de Ciudad Universitaria

**Situación Inicial**:
- 3 pisos × 3 habitaciones = 9 habitaciones
- Alquiler tradicional: €1,100/piso × 3 = €3,300/mes
- Ingresos anuales: €39,600

**Con Room Rental**:
- 9 habitaciones × €450/mes = €4,050/mes
- Ingresos anuales: €48,600
- **Incremento**: +€9,000/año (+23%)

**Operativa**:
- Contratos: Septiembre-Junio (10 meses)
- Target: Estudiantes universitarios
- Servicios: WiFi premium, limpieza semanal zonas comunes
- Gestión: Mediante INMOVA con módulo Room Rental

**Resultados tras 1 año**:
- Ocupación: 95% (vacante solo en verano)
- Tasa renovación: 60% (inquilinos repiten)
- Incidencias mantenimiento: 15/año (manejables)
- Satisfacción inquilinos: 8.2/10

### Caso 2: Tech Hub Málaga

**Perfil Gestor**: Empresa PropTech gestionando 20 unidades

**Situación**:
- Target: Remote workers, tech professionals, expatriados
- 20 propiedades × 4 habitaciones = 80 habitaciones
- Precio promedio: €550/mes

**Modelo**:
- Contratos flexibles: 3-12 meses
- All-inclusive: Renta + suministros + limpieza + WiFi
- Mobiliario premium
- Coworking space en cada unidad (salón adaptado)

**Tecnología INMOVA**:
- Automatización total: Contratos digitales, pagos Stripe
- Portal inquilinos: Pago online, comunicación, mantenimiento
- Analytics: Ocupación, ingresos, predicción vacantes
- CRM: Lead management de plataformas (Spotahome, HousingAnywhere)

**Métricas**:
- Ingresos mensuales: 80 hab × €550 × 92% ocupación = €40,480
- Ingresos anuales: €485,760
- Margen neto: 35% = €170,016
- ROI: 22%

---

## 💰 ROI Y RENTABILIDAD {#roi}

### Análisis Comparativo de Rentabilidad

#### Escenario A: Inversión Pequeña (1 Propiedad)

**Propiedad**: Piso 90m², 3 habitaciones, Madrid

| Concepto | Tradicional | Room Rental | Diferencia |
|----------|-------------|-------------|------------|
| **Inversión Inicial** | ||||
| Precio propiedad | €250,000 | €250,000 | - |
| Reforma/mobiliario | €5,000 | €15,000 | +€10,000 |
| **Total Inversión** | **€255,000** | **€265,000** | **+€10,000** |
| **Ingresos Anuales** | ||||
| Renta mensual | €1,300 | €1,800 (3×€600) | +€500/mes |
| Ingresos anuales | €15,600 | €21,600 | +€6,000 |
| **Gastos Anuales** | ||||
| IBI, comunidad, seguro | €3,500 | €3,800 | +€300 |
| Mantenimiento | €1,000 | €1,800 | +€800 |
| Limpieza | €0 | €1,200 | +€1,200 |
| **Total Gastos** | **€4,500** | **€6,800** | **+€2,300** |
| **Resultado** | ||||
| Ingreso Neto Anual | €11,100 | €14,800 | +€3,700 |
| ROI Bruto | 4.35% | 5.58% | +1.23pp |
| ROI Neto | 3.92% | 4.49% | +0.57pp |
| **Payback Inversión Adicional** | - | **2.7 años** | - |

**Conclusión**: La inversión adicional de €10,000 se amortiza en 2.7 años, y después genera €3,700 extra anualmente.

#### Escenario B: Portfolio Mediano (10 Propiedades)

**Escala**: 10 propiedades × 3 habitaciones = 30 habitaciones

| Concepto | Tradicional | Room Rental | Diferencia |
|----------|-------------|-------------|------------|
| Inversión Total | €2,550,000 | €2,650,000 | +€100,000 |
| Ingresos Anuales | €156,000 | €216,000 | +€60,000 |
| Gastos Anuales | €45,000 | €68,000 | +€23,000 |
| Ingreso Neto Anual | €111,000 | €148,000 | +€37,000 |
| ROI Neto | 3.92% | 4.49% | +0.57pp |
| **Payback Inversión Adicional** | - | **2.7 años** | - |
| **Valor adicional anual después payback** | - | **€37,000/año** | - |

**Beneficios Adicionales de Escala**:
- Gestión centralizada vía INMOVA: -20% tiempo operativo
- Negociación bulk: Limpieza, mantenimiento, suministros (-10% costes)
- Branding: Mayor atractivo para inquilinos

#### Escenario C: Operador Profesional (50 Propiedades)

| Concepto | Room Rental |
|----------|-----------|
| Propiedades | 50 |
| Habitaciones | 150 |
| Precio medio/habitación | €550/mes |
| Ocupación | 93% |
| **Ingresos Anuales** | **€919,800** |
| Gastos operativos (40%) | €367,920 |
| **Ingreso Neto Anual** | **€551,880** |
| Inversión total estimada | €13,250,000 |
| **ROI Neto** | **4.16%** |

**Ventajas Operador Profesional**:
- Equipo dedicado (5-8 personas)
- Tecnología avanzada (INMOVA + integraciones)
- Marca reconocida: Mayor demanda, menor vacancia
- Economías de escala: Menores costes unitarios

### Factores de Éxito para Maximizar ROI

1. **Ubicación**: Proximidad a universidades, distritos tech, transporte
2. **Calidad**: Mobiliario duradero, WiFi fiable, zonas comunes atractivas
3. **Gestión**: Respuesta rápida incidencias, comunicación clara
4. **Tecnología**: INMOVA para automatización y eficiencia
5. **Tenant Screening**: Verificación exhaustiva para reducir morosidad
6. **Pricing Dinámico**: Ajustar según demanda estacional

---

## 🚀 IMPLEMENTACIÓN EN INMOVA {#implementacion}

### Roadmap de Desarrollo

#### Fase 1: Core Features (Sprint 1-2) - 4 semanas

**Objetivo**: Habilitar gestión básica de habitaciones

**Entregables**:

1. **Modelo de Datos**
   - Crear modelos `Room`, `RoomContract`, `RoomPayment` en Prisma
   - Migraciones de base de datos
   - Relaciones con `Unit`, `Tenant`, `Payment` existentes

2. **API Endpoints**
   ```
   POST   /api/rooms              # Crear habitación
   GET    /api/rooms?unitId=X     # Listar habitaciones de unidad
   GET    /api/rooms/:id          # Detalle habitación
   PATCH  /api/rooms/:id          # Actualizar habitación
   DELETE /api/rooms/:id          # Eliminar habitación
   
   POST   /api/room-contracts     # Crear contrato habitación
   GET    /api/room-contracts     # Listar contratos
   PATCH  /api/room-contracts/:id # Actualizar contrato
   ```

3. **UI Básica**
   - Página gestión habitaciones: `/room-rental/[unitId]/rooms`
   - CRUD habitaciones
   - Asignación inquilino a habitación
   - Vista de ocupación

**Testing**:
- Crear unidad con 4 habitaciones
- Asignar inquilinos a 3 habitaciones
- Verificar cálculos de ocupación
- Generar contratos individuales

#### Fase 2: Advanced Features (Sprint 3-4) - 4 semanas

**Objetivo**: Funcionalidades operativas completas

**Entregables**:

1. **Gestión de Suministros**
   - Servicio de prorrateo automático
   - API `/api/room-rental/utilities/calculate`
   - Generación pagos individuales
   - Dashboard de gastos por unidad

2. **Normas de Convivencia**
   - Modelo `SharedSpaceRule`
   - CRUD de normas
   - Plantillas predefinidas
   - Aceptación de normas en firma contrato

3. **Calendario de Limpieza**
   - Generación automática turnos rotativos
   - Notificaciones a inquilinos
   - Tracking de cumplimiento
   - Integración con módulo Tareas

4. **Dashboard Room Rental**
   - Vista consolidada a nivel unidad
   - KPIs: Ocupación, ingresos, vs. tradicional
   - Alertas: Contratos próximos a vencer, pagos pendientes
   - Gráficos de tendencias

**Testing**:
- Calcular suministros mes completo
- Generar calendario limpieza 3 meses
- Verificar notificaciones automáticas
- Dashboard con datos reales

#### Fase 3: Portal Inquilinos & Mobile (Sprint 5-6) - 4 semanas

**Objetivo**: Experiencia inquilino optimizada

**Entregables**:

1. **Portal Inquilino Room Rental**
   - Vista mi habitación y contrato
   - Pago suministros prorrateados
   - Chat con otros inquilinos (opcional)
   - Calendario turnos limpieza
   - Incidencias específicas

2. **Notificaciones Push**
   - Recordatorio pago renta
   - Recordatorio turno limpieza
   - Anuncios gestor
   - Nuevas normas/cambios

3. **Mobile App Enhancements**
   - Responsive design para todas las vistas
   - PWA features
   - Notificaciones nativas

**Testing**:
- 5 inquilinos reales beta testing
- Feedback y ajustes UX
- Performance mobile

#### Fase 4: Analytics & Optimization (Sprint 7-8) - 4 semanas

**Objetivo**: Inteligencia de negocio y automatización

**Entregables**:

1. **Reporting Avanzado**
   - Comparativa Room Rental vs. Tradicional (ROI)
   - Análisis de ocupación estacional
   - Tenant lifetime value
   - Predicción vacantes

2. **Pricing Dinámico para Habitaciones**
   - Sugerencias precio por estacionalidad
   - Benchmarking zona
   - Alertas si precio no competitivo

3. **Automatizaciones**
   - Auto-renovación contratos
   - Generación automática facturas suministros
   - Recordatorios pagos
   - Alertas mantenimiento preventivo

4. **Integraciones**
   - SpotAHome, HousingAnywhere (listados)
   - Plataformas screening (verificación inquilinos)

**Testing**:
- Validar predicciones con datos históricos
- A/B testing pricing dinámico
- Verificar integraciones externas

### Activación del Módulo

**Para Empresas Existentes**:

1. Administrador va a `Admin > Módulos`
2. Activa "Room Rental Management"
3. Wizard de configuración:
   - ¿Gestión de suministros? (Prorrateo / Individual)
   - ¿Limpieza zonas comunes? (Servicio / Turnos)
   - ¿Portal inquilinos con chat inter-inquilinos? (Sí / No)
4. Importar unidades existentes compatibles
5. Crear habitaciones para cada unidad

**Para Nuevos Clientes**:

1. Durante onboarding, seleccionar "Room Rental" como modelo negocio
2. Asistente guiado crea estructura inicial
3. Plantillas de contrato y normas precargadas
4. Demo data para familiarización

---

## 📅 ROADMAP {#roadmap}

### Q1 2025: Foundation

- ✅ Investigación y análisis de mercado
- ✅ Diseño modelo de datos
- 🔄 Desarrollo Fase 1: Core Features
- 🔄 Beta testing con 3 clientes piloto

### Q2 2025: Launch

- 🔜 Desarrollo Fase 2: Advanced Features
- 🔜 Desarrollo Fase 3: Portal Inquilinos
- 🔜 Launch público módulo Room Rental
- 🔜 Marketing: Campaña "20-30% más rentable"
- 🔜 Webinars y formación clientes

### Q3 2025: Scale

- 🔜 Desarrollo Fase 4: Analytics
- 🔜 Integraciones con plataformas listados
- 🔜 Partnerships con universidades
- 🔜 Caso de éxito: 50 propiedades gestionadas

### Q4 2025: Optimization

- 🔜 ML para pricing óptimo
- 🔜 Marketplace servicios inquilinos (limpieza, seguros)
- 🔜 Expansión internacional (Portugal, Italia)
- 🔜 White label para operadores profesionales

---

## 🎓 OTROS MODELOS INMOBILIARIOS COMPATIBLES

Además de **Room Rental**, INMOVA puede expandirse a estos modelos:

### 1. Student Housing (Residencias Estudiantes)

**Características**:
- Similar a Room Rental pero con servicios premium
- Contratos 9-12 meses (curso académico)
- Billing by the bed
- Co-signed leases (padres)
- Amenities: Study centers, social events

**Diferencias clave**:
- Más enfocado en experiencia estudiante
- Mayor énfasis en comunidad
- Partnerships con universidades

### 2. Senior Living (Residencias Mayores)

**Características**:
- Target: +65 años, autónomos o semi-asistidos
- Servicios: Comidas, limpieza, asistencia médica
- Tecnología: Telehealth, wearables, IoT sensores
- Contratos largos (años)

**Tech Stack**:
- Integración sensores salud
- Alertas médicas automáticas
- Portal familias para seguimiento
- Gestión servicios healthcare

### 3. Affordable Housing (Vivienda Social)

**Características**:
- Rentas reguladas por gobierno
- Requisitos de elegibilidad estrictos
- Compliance y reporting complejo
- Financiación pública/subsidios

**Módulos Necesarios**:
- Verificación elegibilidad inquilinos
- Reporting compliance automático
- Gestión subsidios gubernamentales
- Auditorías internas

### 4. Build-to-Rent (BTR) - Promoción Residencial para Alquiler

**Características**:
- Comunidades residenciales nuevas diseñadas para alquiler
- Gestión profesional desde día 1
- Amenities de alto nivel
- Enfoque largo plazo

**Ya soportado por**: Módulo Construcción + Alquiler Tradicional

### 5. Flex Living (Vivienda Flexible)

**Características**:
- Contratos ultra-flexibles (1-6 meses)
- Todo incluido (mobiliario, suministros, servicios)
- Target: Nómadas digitales, consultores, relocations
- Precio premium

**Similar a**: Coliving pero más orientado a estancias cortas

### 6. Corporate Housing (Alojamiento Corporativo)

**Características**:
- Contratos con empresas (no individuos)
- Empleados en misión/relocation
- Facturación B2B
- SLA garantizado

**Módulos Necesarios**:
- CRM corporativo
- Facturación B2B con contratos marco
- Reporting para HR departments

---

## 📊 ANEXO: PLANTILLAS Y RECURSOS

### Plantilla Contrato Individual por Habitación

**CONTRATO DE ARRENDAMIENTO DE HABITACIÓN**

**En [Ciudad], a [Fecha]**

**REUNIDOS**

De una parte, [PROPIETARIO/GESTORA], con DNI/CIF [XXX], en adelante ARRENDADOR.

De otra parte, [INQUILINO], con DNI [XXX], en adelante ARRENDATARIO.

**EXPONEN**

Que el ARRENDADOR es titular de la vivienda sita en [Dirección Completa].

Que el ARRENDATARIO está interesado en arrendar una habitación de dicha vivienda.

Que ambas partes, reconociéndose capacidad legal, convienen en celebrar el presente CONTRATO DE ARRENDAMIENTO DE HABITACIÓN, con arreglo a las siguientes

**ESTIPULACIONES**

**PRIMERA. Objeto del contrato**
El ARRENDADOR arrienda al ARRENDATARIO la habitación número [X], de [XX]m², amueblada, ubicada en la vivienda referida, junto con el derecho de uso de las zonas comunes: cocina, salón, baños [especificar cuáles], y lavadero.

**SEGUNDA. Duración**
El contrato tendrá una duración de [XX] meses, desde el [Fecha Inicio] hasta el [Fecha Fin], renovable por acuerdo de ambas partes.

**TERCERA. Renta**
La renta mensual es de [XXX]€, que incluye:
- Uso de la habitación
- Uso de zonas comunes
- Comunidad de propietarios y basuras
- WiFi

Los suministros (luz, gas, agua) se abonarán de forma prorrateada entre todos los inquilinos, con un importe estimado de [XX]€/mes.

**CUARTA. Forma de pago**
La renta se abonará mensualmente por adelantado, dentro de los primeros 5 días de cada mes, mediante [transferencia/domiciliación].

**QUINTA. Fianza**
El ARRENDATARIO entrega en este acto la cantidad de [XXX]€ en concepto de fianza, que se depositará en el organismo correspondiente.

**SEXTA. Normas de convivencia**
1. Horario de silencio: 22:00-08:00
2. Limpieza de zonas comunes: [Turno rotativo / Servicio profesional incluido]
3. Invitados: Máximo 2 noches consecutivas al mes, previo aviso
4. Prohibido fumar en el interior
5. [Otras normas específicas]

**SÉPTIMA. Uso y conservación**
El ARRENDATARIO se compromete a:
- Mantener la habitación en buen estado
- Hacer un uso adecuado de zonas comunes
- Comunicar inmediatamente cualquier desperfecto
- Respetar el descanso de los demás inquilinos

**OCTAVA. Resolución del contrato**
Cualquiera de las partes puede resolver el contrato con [30] días de antelación, mediante comunicación escrita.

Y en prueba de conformidad, firman el presente contrato en dos ejemplares en el lugar y fecha indicados.

[FIRMA ARRENDADOR]        [FIRMA ARRENDATARIO]

---

### Checklist Entrada/Salida Habitación

**INVENTARIO HABITACIÓN [Número]**

**Inquilino**: [Nombre]  
**Fecha Entrada**: [DD/MM/AAAA]  
**Fecha Salida**: [DD/MM/AAAA]

| Elemento | Estado Entrada | Estado Salida | Observaciones |
|----------|---------------|---------------|---------------|
| **Mobiliario** | | | |
| Cama (estructura) | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Colchón | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Armario | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Escritorio | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Silla | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Lámpara | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Estantería | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| **Estado General** | | | |
| Paredes | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Suelo | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Ventana | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Persiana/Cortina | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Puerta | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Cerradura | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| Enchufes (funcionan) | ⬜ Sí ⬜ No | | |
| Iluminación | ⬜ Perfecto ⬜ Bueno ⬜ Regular | | |
| **Limpieza General** | ⬜ Impecable ⬜ Aceptable | | |

**Fotos Adjuntas**: ⬜ Sí (adjuntar en sistema)

**Firma Inquilino Entrada**: ___________  
**Firma Gestor Entrada**: ___________

**Firma Inquilino Salida**: ___________  
**Firma Gestor Salida**: ___________

**Deducciones Fianza** (si aplica): ___________ €
**Motivo**: ___________________________________________

---

## 🔗 REFERENCIAS Y RECURSOS

### Legislación España

- **Ley de Arrendamientos Urbanos (LAU)**: Aunque el alquiler de habitaciones no siempre se rige completamente por la LAU, es referencia.
- **Normativa Autonómica**: Cada comunidad autónoma puede tener regulación específica (ej: Decreto catalán para alquiler temporal).
- **Fianzas**: Obligatorio depositar en organismo autonómico (IVIMA en Madrid, Incasòl en Cataluña, etc.).

### Recursos Externos

- **Cushman & Wakefield**: Informes mercado room rental y coliving
- **Idealista**: Estadísticas precios alquiler por zonas
- **INE**: Datos demográficos estudiantes y migración interna
- **Asociaciones**:
  - CEAV (Confederación Española de Agencias de Viajes) - Para turístico
  - ASVAL (Asociación Alquileres Vacacionales) - Normativa

### Competidores Específicos Room Rental

- **Badi**: App matching roommates (P2P)
- **Spotahome**: Plataforma booking habitaciones online
- **HousingAnywhere**: Foco estudiantes internacionales
- **Uniplaces**: Student accommodation

**Ventaja INMOVA**: Gestión completa end-to-end vs. solo marketplace.

---

## ✅ CONCLUSIONES

### Por qué Room Rental es una Oportunidad

1. **Rentabilidad Demostrada**: +20-30% vs. alquiler tradicional
2. **Demanda Creciente**: Estudiantes, young professionals, trabajadores temporales
3. **Mercado en Crecimiento**: €550B en Europa próxima década
4. **Bajo Riesgo**: Diversificación de ingresos (múltiples inquilinos)
5. **Tecnología como Diferenciador**: INMOVA automatiza la complejidad operativa

### Próximos Pasos

1. **Validación**: Piloto con 3 clientes (30 habitaciones totales) - Q1 2025
2. **Desarrollo**: Roadmap de 16 semanas (4 fases) - Q1-Q2 2025
3. **Launch**: Módulo Room Rental disponible - Q2 2025
4. **Marketing**: Campaña "Maximiza tu rentabilidad un 25%" - Q2 2025
5. **Expansión**: Integrar otros modelos (Student Housing, Senior Living) - 2026

**INMOVA se posiciona como la única plataforma PropTech multi-vertical con soporte nativo para 8 modelos de negocio inmobiliario, desde alquiler tradicional hasta Room Rental, cubriendo todo el espectro de la gestión inmobiliaria moderna.**

---

**Documento elaborado por**: INMOVA Product & Strategy Team  
**Versión**: 1.0  
**Fecha**: 29 Noviembre 2025  
**Próxima Revisión**: Q2 2025 (post-launch)  
**Idioma**: Español

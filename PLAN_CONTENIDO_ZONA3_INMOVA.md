# Plan de Desarrollo: Integración Contenido ZONA3 en Inmova

## 1. ANÁLISIS DE LA PLATAFORMA ZONA3

### Qué es ZONA3
**Club Privado de Inversores Inmobiliarios** montado sobre Kajabi con +3500 miembros. Modelo de suscripción mensual/anual. Fundado por inversores inmobiliarios españoles.

### Estructura de Contenido Scrapeada

| Sección | Páginas | Videos | Descargas | Descripción |
|---------|---------|--------|-----------|-------------|
| **Empieza Aquí** | 11 | 2 | 0 | Onboarding del miembro: itinerarios, comunidad, masterclasses, recursos, base de datos |
| **Mi Primer Inmueble** | 17 | 16 | 9 | Programa de retos (10 semanas) para comprar primer inmueble |
| **Itinerarios** | 93 | 156 | 29 | 4 rutas formativas completas (9-10 pasos cada una) |
| **Formación** | Pendiente* | ~200h | ~40+ | Masterclasses semanales grabadas por expertos |
| **Comunidad** | Pendiente* | - | - | Discord +3500 inversores, quedadas, networking |
| **Recursos** | Pendiente* | - | 50+ | Calculadoras, contratos, checklists, plantillas |
| **Próximos Directos** | Pendiente* | - | - | Calendario de masterclasses en vivo |
| **Academy** | Pendiente* | - | - | Cursos avanzados (cuota anual) |

*No se completó el scraping de estas secciones por timeout, pero la estructura está documentada.

### 4 Itinerarios Formativos Identificados

Cada itinerario tiene 9-10 pasos que cubren todo el proceso de inversión:

#### 1. Flipping House (Comprar, Reformar, Vender)
- Paso 1: Mentalidad
- Paso 2: Inspiración con German y dudas frecuentes
- Paso 3: Análisis
- Paso 4: Búsqueda de oportunidades
- Paso 5: Negociación
- Paso 6: Compra
- Paso 7: Reforma inteligente y efecto WOW
- Paso 8: Venta
- Paso 9: Inspiración con otros Zoners
- Paso 10: Nivel Avanzado

#### 2. Alquiler Tradicional
- Paso 1: Mentalidad
- Paso 2: Inspiración y dudas
- Paso 3: Análisis
- Paso 4: Búsqueda de oportunidades
- Paso 5: Negociación
- Paso 6: Financiación
- Paso 7: Compra
- Paso 8: Reforma y Home Staging
- Paso 9: Gestión

#### 3. Alquiler de Habitaciones
- Paso 1: Mentalidad → Paso 9: Gestión (misma estructura)

#### 4. Alquiler Turístico
- Paso 1: Mentalidad
- Paso 2-7: Similar
- Paso 8: Reforma
- Paso 9: Home Staging
- Paso 10: Gestión

### Recursos Descargables Identificados (38 archivos)

**Calculadoras Excel:**
- Calculadora Alquiler Tradicional (ZONA3.xlsx)
- Calculadora Alquiler Turístico (ZONA3.xlsx)
- Calculadora Alquiler Habitaciones (ZONA3.xlsx)
- Calculadora CRV (Comprar-Reformar-Vender) (ZONA3.xlsx)
- Versiones sin protección de cada una

**PDFs de Masterclasses:**
- Fundamentos LAU (Ley de Arrendamientos Urbanos)
- Selecciona una buena zona de inversión
- Negociación aplicada a inversiones inmobiliarias
- Financiación (Novagalma - bróker hipotecario)
- Reformar como inversor (El Excel de Álex)
- Alquiler de habitaciones
- Cambio de uso de locales
- Segregación de inmuebles
- Cesión de créditos
- Home Staging (Ambients Studio)
- Invertir en conjunto
- Inmuebles con ocupas
- Comprobación de valores inmuebles
- Subastas inmobiliarias
- El poder de los datos (Ana)

**Documentos de programa:**
- Calendario de retos Mi Primer Inmueble
- Plantilla comparativa resumen ofertas

### Cursos de Academy (Cuota Anual)
1. Alquiler Mixto (Sam Garrido)
2. IA aplicada al sector inmobiliario (Marta Costales)
3. Interpretar cargas en subastas (Andreas Ruigómez)
4. Financiación en inversión inmobiliaria (Marcos, Novagalma)
5. Excel para inversores (Daniel Poveda)
6. ABC de las Reformas Exitosas (Álex)
7. Fiscalidad inmobiliaria (Ruth Sarmiento)
8. Rent to Rent (Rooming Madrid)
9. Personal Shopper Inmobiliario (Tamara Álvarez)
10. Alquiler vacacional (Albert Veciana)
11. Subastas inmobiliarias (Manuel Viguín)
12. Cambios de uso de locales (Iker Ochoa)

### Funcionalidades Clave de ZONA3

1. **Base de Datos Colaborativa**: +1400 contactos validados (reformistas, banqueros, fiscalistas, etc.)
2. **Zona+**: Club de ventajas con descuentos negociados (tasaciones, seguros, etc.)
3. **Discord**: Canales por tipo de inversión + temáticas transversales
4. **WhatsApp**: Grupos por Comunidad Autónoma con delegados
5. **Quedadas**: Oficiales y extraoficiales con networking presencial
6. **Gamificación**: "Inversor del mes" votado por la comunidad
7. **Casos de éxito y aprendizajes**: Canal público de wins y errores
8. **Calendario sincronizable**: Google Calendar / Outlook

---

## 2. ESTADO ACTUAL DE INMOVA vs ZONA3

### Lo que Inmova YA TIENE

| Feature ZONA3 | Equivalente Inmova | Estado |
|---------------|-------------------|--------|
| Calculadoras rentabilidad | `/dashboard/herramientas` + `lib/investment-calculators.ts` | ✅ Parcial (hipoteca, sensibilidad, fiscal) |
| Análisis inversión IA | `/api/ai/investment-analysis` | ✅ Implementado |
| Oportunidades inversión | `/inversiones/oportunidades` (51 features) | ✅ Implementado |
| Pipeline Kanban | Pipeline Kanban (6 etapas) | ✅ Implementado |
| Comunidad | `/dashboard/community` | ✅ Básico (eventos, posts, anuncios) |
| Base de contactos | CRM + BD Prisma | ✅ Parcial (solo CRM, no directorio) |
| Subastas BOE | `lib/market-opportunities.ts` (fuente 1) | ✅ Implementado |

### Lo que Inmova NO TIENE y ZONA3 SÍ

| Feature ZONA3 | Prioridad | Complejidad |
|---------------|-----------|-------------|
| **Itinerarios formativos** (rutas de aprendizaje) | 🔴 CRÍTICA | Media |
| **Biblioteca de masterclasses** (200+ horas video) | 🔴 CRÍTICA | Alta |
| **Academy** (cursos estructurados) | 🔴 CRÍTICA | Alta |
| **Base de datos colaborativa** de proveedores | 🟡 ALTA | Media |
| **Recursos descargables** (calculadoras, contratos, checklists) | 🟡 ALTA | Baja |
| **Programa "Mi Primer Inmueble"** (retos semanales) | 🟡 ALTA | Media |
| **Directos/Webinars** (calendario + replay) | 🟡 ALTA | Media |
| **Zona+** (club de ventajas/descuentos) | 🟢 MEDIA | Baja |
| **Gamificación** (inversor del mes, puntos, badges) | 🟢 MEDIA | Media |
| **Onboarding interactivo** (checklist activación) | 🟢 MEDIA | Baja |
| **Integración Discord/WhatsApp** | 🔵 BAJA | Alta |

---

## 3. PLAN DE DESARROLLO

### Fase 1: Infraestructura de Contenido (2-3 semanas)

#### 1.1 Modelos Prisma para educación

```prisma
model Course {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  description   String?  @db.Text
  coverImage    String?
  type          CourseType // ITINERARY, ACADEMY, MASTERCLASS, PROGRAM
  difficulty    CourseDifficulty // BEGINNER, INTERMEDIATE, ADVANCED
  duration      Int?     // minutos estimados
  instructor    String?
  instructorBio String?  @db.Text
  tags          String[] // ["flipping", "alquiler", "financiacion"]
  isPremium     Boolean  @default(false) // Solo cuota anual
  isPublished   Boolean  @default(false)
  order         Int      @default(0)
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id])
  modules       CourseModule[]
  enrollments   CourseEnrollment[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([companyId])
  @@index([type])
  @@index([slug])
}

model CourseModule {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title       String
  description String?  @db.Text
  order       Int      @default(0)
  lessons     Lesson[]
  
  @@index([courseId])
}

model Lesson {
  id            String   @id @default(cuid())
  moduleId      String
  module        CourseModule @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title         String
  slug          String
  content       String?  @db.Text  // Markdown/HTML
  videoUrl      String?  // Wistia, Vimeo, YouTube
  videoDuration Int?     // segundos
  type          LessonType // VIDEO, TEXT, QUIZ, DOWNLOAD, CHALLENGE
  order         Int      @default(0)
  resources     LessonResource[]
  completions   LessonCompletion[]
  
  @@index([moduleId])
}

model LessonResource {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  title     String
  type      ResourceType // PDF, XLSX, DOCX, TEMPLATE, CALCULATOR, CONTRACT
  url       String   // S3 URL
  fileSize  Int?     // bytes
  
  @@index([lessonId])
}

model CourseEnrollment {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  courseId     String
  course      Course   @relation(fields: [courseId], references: [id])
  enrolledAt  DateTime @default(now())
  completedAt DateTime?
  progress    Float    @default(0) // 0-100
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LessonCompletion {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id])
  completedAt DateTime @default(now())
  
  @@unique([userId, lessonId])
  @@index([userId])
}

model ProviderDirectory {
  id          String   @id @default(cuid())
  name        String
  category    ProviderCategory // REFORMISTA, BANQUERO, FISCALISTA, ABOGADO, etc.
  specialty   String?
  city        String
  province    String
  phone       String?
  email       String?
  website     String?
  rating      Float?   @default(0) // 0-5
  reviewCount Int      @default(0)
  addedBy     String
  addedByUser User     @relation("ProviderAddedBy", fields: [addedBy], references: [id])
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  reviews     ProviderReview[]
  verified    Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@index([category, province])
  @@index([companyId])
}

model ProviderReview {
  id         String   @id @default(cuid())
  providerId String
  provider   ProviderDirectory @relation(fields: [providerId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  rating     Int      // 1-5
  comment    String?  @db.Text
  createdAt  DateTime @default(now())
  
  @@unique([providerId, userId])
}

model ResourceLibrary {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  category    ResourceCategory // CALCULATOR, CONTRACT, CHECKLIST, TEMPLATE, GUIDE
  subcategory String?  // "alquiler-tradicional", "flipping", etc.
  fileUrl     String   // S3 URL
  fileType    String   // pdf, xlsx, docx
  fileSize    Int?
  downloadCount Int    @default(0)
  isPremium   Boolean  @default(false)
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  tags        String[]
  createdAt   DateTime @default(now())
  
  @@index([category])
  @@index([companyId])
}

model Webinar {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  instructor  String
  scheduledAt DateTime
  duration    Int?     // minutos
  status      WebinarStatus // SCHEDULED, LIVE, COMPLETED, CANCELLED
  zoomUrl     String?
  replayUrl   String?  // Video grabación
  coverImage  String?
  tags        String[]
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  attendees   WebinarAttendee[]
  createdAt   DateTime @default(now())
  
  @@index([status, scheduledAt])
  @@index([companyId])
}

model WebinarAttendee {
  id        String   @id @default(cuid())
  webinarId String
  webinar   Webinar  @relation(fields: [webinarId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  attended  Boolean  @default(false)
  
  @@unique([webinarId, userId])
}

enum CourseType {
  ITINERARY
  ACADEMY
  MASTERCLASS
  PROGRAM
  WEBINAR_SERIES
}

enum CourseDifficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum LessonType {
  VIDEO
  TEXT
  QUIZ
  DOWNLOAD
  CHALLENGE
  MIXED
}

enum ResourceType {
  PDF
  XLSX
  DOCX
  TEMPLATE
  CALCULATOR
  CONTRACT
  CHECKLIST
  GUIDE
}

enum ResourceCategory {
  CALCULATOR
  CONTRACT
  CHECKLIST
  TEMPLATE
  GUIDE
  PRESENTATION
  LEGAL
}

enum ProviderCategory {
  REFORMISTA
  BANQUERO
  BROKER_HIPOTECARIO
  FISCALISTA
  ABOGADO
  AGENTE_INMOBILIARIO
  TASADOR
  GESTOR
  DECORADOR
  FOTOGRAFO
  MATERIALES
  ARQUITECTO
  NOTARIO
  OTROS
}

enum WebinarStatus {
  SCHEDULED
  LIVE
  COMPLETED
  CANCELLED
}
```

#### 1.2 Rutas nuevas en la app

```
app/
├── (dashboard)/
│   └── dashboard/
│       ├── formacion/                    # Hub principal de formación
│       │   ├── page.tsx                  # Dashboard con itinerarios, cursos, progreso
│       │   ├── itinerarios/
│       │   │   ├── page.tsx              # Lista de 4 itinerarios
│       │   │   └── [slug]/
│       │   │       ├── page.tsx          # Itinerario con pasos
│       │   │       └── [lessonSlug]/
│       │   │           └── page.tsx      # Lección individual (video + contenido)
│       │   ├── masterclasses/
│       │   │   ├── page.tsx              # Biblioteca filtrable de masterclasses
│       │   │   └── [id]/page.tsx         # Masterclass individual
│       │   ├── academy/
│       │   │   ├── page.tsx              # Cursos avanzados
│       │   │   └── [slug]/page.tsx       # Curso individual
│       │   ├── recursos/
│       │   │   └── page.tsx              # Biblioteca de recursos descargables
│       │   └── directos/
│       │       └── page.tsx              # Calendario de webinars/directos
│       ├── directorio/                   # Base de datos de proveedores
│       │   ├── page.tsx                  # Búsqueda por categoría/zona
│       │   └── [id]/page.tsx             # Perfil del proveedor
│       └── mi-primer-inmueble/           # Programa de retos
│           └── page.tsx                  # Retos semanales con tracking
├── api/
│   ├── courses/                          # CRUD cursos
│   ├── lessons/                          # Lecciones + completions
│   ├── enrollments/                      # Inscripciones
│   ├── resources/                        # Biblioteca de recursos
│   ├── providers/                        # Directorio proveedores
│   ├── webinars/                         # Directos/webinars
│   └── progress/                         # Tracking de progreso
```

---

### Fase 2: Itinerarios Formativos (1-2 semanas)

**Objetivo**: Replicar el concepto estrella de ZONA3 adaptado a Inmova.

#### 4 Itinerarios a crear:

**1. Flipping House** (10 pasos)
- Contenido: Mentalidad inversor → Análisis de mercado → Búsqueda oportunidades → Negociación → Compra → Reforma inteligente → Home staging → Venta → Casos reales → Nivel avanzado
- Integración Inmova: Vincular con módulo de Oportunidades de Inversión, calculadora CRV, valoración IA

**2. Alquiler Tradicional** (9 pasos)
- Contenido: Mentalidad → Análisis rentabilidad → Búsqueda → Negociación → Financiación → Compra → Reforma → Gestión inquilinos
- Integración Inmova: Vincular con gestión de propiedades, contratos, gestión de inquilinos, calculadora alquiler

**3. Alquiler de Habitaciones** (9 pasos)
- Contenido: Similar a alquiler tradicional + gestión múltiples inquilinos + coliving
- Integración Inmova: Vincular con módulo Coliving existente, calculadora habitaciones

**4. Alquiler Turístico** (10 pasos)
- Contenido: Análisis zona turística → Regulación → Compra → Reforma → Home staging → Plataformas (Airbnb) → Gestión → Revenue management
- Integración Inmova: Vincular con calculadora turístico, gestión de media estancia

#### Diseño UX del Itinerario

```
┌─────────────────────────────────────────┐
│  🔨 Flipping House                      │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 45% completado  │
│                                          │
│  ✅ Paso 1: Mentalidad                  │
│  ✅ Paso 2: Inspiración                 │
│  ✅ Paso 3: Análisis                    │
│  ✅ Paso 4: Búsqueda                    │
│  → Paso 5: Negociación  ◄── Estás aquí │
│  ○ Paso 6: Compra                       │
│  ○ Paso 7: Reforma                      │
│  ○ Paso 8: Venta                        │
│  ○ Paso 9: Casos éxito                  │
│  ○ Paso 10: Avanzado                    │
└─────────────────────────────────────────┘
```

Cada paso contiene:
- Video masterclass principal (embebido)
- Resumen en texto
- Recursos descargables
- Ejercicio/Reto práctico
- Links a herramientas Inmova relevantes (calculadora, IA, etc.)
- "Siguiente paso" automático

---

### Fase 3: Biblioteca de Recursos (1 semana)

#### Categorías de recursos a implementar:

**Calculadoras** (vincular con las existentes + nuevas):
- ✅ Ya existe: Calculadora hipoteca, sensibilidad, fiscal, portfolio
- 🆕 Añadir: Calculadora alquiler tradicional, alquiler habitaciones, alquiler turístico, CRV (flipping)
- Formato: Tanto Excel descargable como calculadora online en Inmova

**Contratos legales**:
- Contrato alquiler tradicional (actualizado LAU 2024)
- Contrato alquiler habitaciones
- Contrato rent-to-rent
- Contrato alquiler trasteros/garajes
- Contrato de reforma
- Documento de oferta formal
- Formato: PDF descargable + generador dinámico con datos del usuario

**Checklists y guías**:
- Checklist visita inmueble (qué mirar)
- Guía paso a paso compra vivienda
- Guía reformas inteligentes
- Checklist due diligence completa
- Formato: PDF + checklist interactivo en app

**Plantillas de gestión**:
- Seguimiento alquiler habitaciones
- Estimadora de reforma con Gantt
- Resumen financiero para el banco
- Seguimiento de contactos/proveedores

#### Integración con S3
Subir todos los recursos a S3 bucket `inmova` con estructura:
```
recursos/
├── calculadoras/
│   ├── calculadora-alquiler-tradicional.xlsx
│   ├── calculadora-alquiler-turistico.xlsx
│   ├── calculadora-habitaciones.xlsx
│   └── calculadora-crv.xlsx
├── contratos/
│   ├── contrato-alquiler-lau2024.pdf
│   ├── contrato-habitaciones.pdf
│   └── ...
├── checklists/
│   ├── checklist-visita-inmueble.pdf
│   └── ...
└── plantillas/
    ├── seguimiento-habitaciones.xlsx
    └── ...
```

---

### Fase 4: Directorio de Proveedores (1 semana)

**Concepto ZONA3**: Base de datos colaborativa de +1400 contactos validados por inversores.

**Implementación Inmova**:

```
┌──────────────────────────────────────────┐
│  🔍 Directorio de Proveedores            │
│                                           │
│  Categoría: [Reformistas ▼]              │
│  Provincia:  [Valencia ▼]                │
│  Búsqueda:   [                    🔎]   │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ 🔧 José García - Reformas JG       │ │
│  │ ⭐⭐⭐⭐⭐ (12 reseñas)               │ │
│  │ 📍 Valencia | Reformas integrales   │ │
│  │ 📞 600 123 456                      │ │
│  │ ✅ Verificado por la comunidad      │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ 🏦 Ana López - Bróker Hipotecaria  │ │
│  │ ⭐⭐⭐⭐☆ (8 reseñas)                │ │
│  │ 📍 Madrid | Financiación inversión  │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

Categorías del directorio:
1. Reformistas
2. Banqueros / Brókers hipotecarios
3. Fiscalistas / Asesores fiscales
4. Abogados inmobiliarios
5. Agentes inmobiliarios
6. Tasadores
7. Gestores administrativos
8. Decoradores / Home Staging
9. Fotógrafos inmobiliarios
10. Tiendas de materiales
11. Arquitectos
12. Notarios

Funcionalidades:
- Búsqueda por categoría + provincia + ciudad
- Sistema de reseñas y valoraciones
- "Quid pro quo": para acceder, debes añadir X contactos primero
- Verificación por otros usuarios
- Contacto directo (teléfono, email, WhatsApp)

---

### Fase 5: Masterclasses y Directos (1-2 semanas)

**Calendario de directos**:
- Integración con Google Calendar / Outlook (iCal)
- Página de "Próximos directos" con inscripción
- Notificaciones push/email antes del directo
- Replay automático después del directo

**Biblioteca de masterclasses**:
- Filtros: Tema, Instructor, Duración, Dificultad, Fecha
- Búsqueda por texto
- Vista grilla y lista
- Marcado como "visto" con tracking de progreso
- Recomendaciones IA basadas en perfil del usuario

**Temas de masterclasses** (basados en ZONA3):
1. Desahucios y protección jurídica
2. Fiscalidad inmobiliaria (IRPF, ITP, IBI)
3. Financiación e hipotecas
4. Negociación inmobiliaria
5. Reformas inteligentes
6. Home staging
7. Alquiler de habitaciones
8. Rent-to-rent
9. Subastas inmobiliarias
10. Cambios de uso
11. Segregación de inmuebles
12. Inversión en conjunto
13. Ocupas: prevención y actuación
14. Selección de zona de inversión
15. Datos de mercado inmobiliario
16. IA aplicada al sector inmobiliario
17. Excel para inversores
18. Personal shopper inmobiliario

---

### Fase 6: Gamificación y Engagement (1 semana)

**Sistema de puntos y badges**:
- Completar lección: +10 puntos
- Completar módulo: +50 puntos
- Completar itinerario: +500 puntos + Badge
- Añadir proveedor al directorio: +25 puntos
- Reseñar proveedor: +15 puntos
- Compartir caso de éxito: +100 puntos
- Asistir a directo: +20 puntos

**Badges**:
- 🦊 Zoner Novato (completar onboarding)
- 🏠 Primer Análisis (analizar primera propiedad)
- 📊 Data Lover (usar 5 calculadoras)
- 🔨 Flipper (completar itinerario Flipping)
- 🏡 Rentista (completar itinerario Alquiler)
- 🎓 Graduado Academy (completar 3 cursos)
- 👑 Inversor del Mes (más votos de la comunidad)
- 🤝 Conector (añadir 10+ proveedores)

**Leaderboard**:
- Top 10 inversores del mes (por puntos)
- Top 10 por itinerario
- Ranking por provincia

---

### Fase 7: Programa "Mi Primer Inmueble" (1 semana)

**Programa de 10 semanas con retos semanales**:

| Semana | Reto | Herramientas Inmova |
|--------|------|---------------------|
| 1 | Define tu estrategia de inversión | Itinerarios, Test de perfil inversor |
| 2 | Aprende a analizar inmuebles | Calculadoras de rentabilidad |
| 3 | Selecciona tu zona de inversión | Mapa con datos de mercado, IA valoración |
| 4 | Busca 10 oportunidades | Módulo Oportunidades de Inversión |
| 5 | Analiza 3 operaciones en profundidad | Calculadoras + Análisis IA |
| 6 | Prepara tu financiación | Calculadora hipoteca, Directorio brokers |
| 7 | Negocia tu primera oferta | Plantilla oferta formal |
| 8 | Visita y evalúa inmuebles | Checklist visita + Due Diligence |
| 9 | Toma la decisión y compra | Pipeline Kanban, Contratos |
| 10 | Gestiona tu primer inquilino | Gestión propiedades + inquilinos |

Cada reto:
- Video explicativo
- Objetivo claro y medible
- Herramienta/recurso asociado en Inmova
- Espacio para documentar progreso
- Opción de compartir con la comunidad

---

## 4. PRIORIZACIÓN Y TIMELINE

### Sprint 1 (Semanas 1-3): Fundamentos
- [ ] Modelos Prisma para educación
- [ ] Migraciones BD
- [ ] APIs CRUD: courses, lessons, enrollments, progress
- [ ] Página `/dashboard/formacion` (hub principal)
- [ ] Componente VideoPlayer (Wistia/Vimeo/YouTube)
- [ ] Sistema de tracking de progreso

### Sprint 2 (Semanas 3-5): Itinerarios + Recursos
- [ ] Página itinerarios con los 4 itinerarios
- [ ] Vista individual de itinerario con pasos
- [ ] Vista de lección (video + contenido + recursos)
- [ ] Biblioteca de recursos (`/dashboard/formacion/recursos`)
- [ ] Upload de recursos a S3
- [ ] Calculadoras específicas de ZONA3 portadas a Inmova

### Sprint 3 (Semanas 5-7): Directorio + Directos
- [ ] Directorio de proveedores (`/dashboard/directorio`)
- [ ] Sistema de reseñas
- [ ] Búsqueda y filtros
- [ ] Calendario de webinars/directos
- [ ] Integración iCal
- [ ] Replay de directos con video embebido

### Sprint 4 (Semanas 7-9): Academy + Gamificación
- [ ] Academy (`/dashboard/formacion/academy`)
- [ ] Cursos estructurados con módulos
- [ ] Sistema de puntos y badges
- [ ] Leaderboard
- [ ] Programa "Mi Primer Inmueble"

### Sprint 5 (Semanas 9-10): Pulido
- [ ] Onboarding interactivo con checklist
- [ ] Recomendaciones IA de contenido
- [ ] Tests automatizados
- [ ] Optimización mobile
- [ ] Documentación API

---

## 5. ESTIMACIÓN DE ESFUERZO

| Componente | Horas est. | Complejidad |
|------------|-----------|-------------|
| Modelos Prisma + Migraciones | 8h | Baja |
| APIs CRUD (7 endpoints) | 16h | Media |
| Hub Formación (UI) | 12h | Media |
| Itinerarios (4 rutas + UI) | 20h | Media |
| Lección viewer (video + contenido) | 12h | Media |
| Tracking progreso | 8h | Baja |
| Biblioteca recursos | 10h | Baja |
| Directorio proveedores | 16h | Media |
| Sistema reseñas | 8h | Baja |
| Calendario directos | 12h | Media |
| Academy (cursos) | 16h | Media |
| Gamificación | 12h | Media |
| Mi Primer Inmueble | 10h | Media |
| Onboarding checklist | 6h | Baja |
| Tests | 16h | Media |
| **TOTAL** | **~180h** | **Media** |

---

## 6. BENEFICIO PARA INMOVA

### Diferenciación competitiva
- Ningún competidor (Homming, Rentger) ofrece formación integrada en la plataforma de gestión
- Crea un ecosistema completo: aprender + gestionar + crecer
- Retención de usuarios masivamente mayor (contenido que engancha)

### Monetización
- **Plan Básico** (gratis): 1 itinerario, 5 recursos
- **Plan Pro** (19€/mes): Todos los itinerarios, todos los recursos, directorio
- **Plan Premium** (49€/mes): + Academy, + directos, + gamificación
- **Recurso individual**: Calculadoras/contratos vendibles como add-on (5-15€)

### Métricas clave a trackear
- Tiempo en plataforma (objetivo: +40% con formación)
- Tasa de completación de itinerarios
- NPS de usuarios que usan formación vs los que no
- Conversión de plan básico a premium
- Retención mensual (objetivo: +25% con formación)

---

## 7. CONTENIDO INICIAL (SEED DATA)

### Contenido que se puede crear desde el scraping:

**Itinerarios**: 4 itinerarios con 9-10 pasos cada uno, basados exactamente en la estructura de ZONA3. El contenido de texto de cada paso ya está extraído del scraping.

**Recursos**: 38 archivos descargables identificados (PDFs y XLSXs). Se pueden referenciar por URL o crear versiones propias adaptadas a Inmova.

**Videos**: 174 referencias a videos Wistia. No se pueden reutilizar directamente (son de ZONA3), pero sirven como referencia para crear contenido propio o vincular con videos propios.

**Temas de masterclasses**: 18+ temas identificados con instructores reales del sector inmobiliario español.

### Estrategia de contenido propio:
1. Usar la estructura de ZONA3 como blueprint
2. Crear contenido propio con IA (resúmenes, guías, textos)
3. Vincular herramientas existentes de Inmova en cada paso
4. Grabar videos propios o licenciar contenido
5. Las calculadoras Excel se pueden replicar como herramientas online

---

*Documento generado el 12 de marzo de 2026*
*Basado en scraping profundo de campus.zona3.club (121 páginas, 174 videos, 38 descargas)*

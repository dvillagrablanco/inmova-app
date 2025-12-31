# 📖 GUÍA DE USO: .cursorrules

**Fecha**: 29 de diciembre de 2025  
**Versión**: 2.0.0 (PropTech Edition)

---

## 🎯 ¿Qué es .cursorrules?

El archivo `.cursorrules` es el **"cerebro" de Cursor AI** para este proyecto. Contiene 2,284 líneas de documentación que definen cómo debe comportarse el asistente al:

- Generar código nuevo
- Sugerir refactorizaciones
- Responder preguntas sobre arquitectura
- Revisar código (code reviews)
- Proponer soluciones a problemas

---

## 📚 CONTENIDO DEL ARCHIVO

### 1. 🎯 ROL MULTIDISCIPLINAR (Líneas 1-50)

Define las 5 especialidades del asistente:

- **CTO & Product Manager Senior PropTech**
- **Arquitecto de Software & Experto en Ciberseguridad**
- **Ingeniero Full-Stack Next.js 15**
- **Diseñador UX/UI & Especialista en Automatización**
- **Ingeniero de SEO Técnico & Growth Hacker**

### 2. 🏢 CONTEXTO DEL PROYECTO (Líneas 51-120)

- Descripción de Inmova App como plataforma PropTech B2B/B2C
- Modelos de negocio
- Estado actual y objetivos estratégicos
- Verticales implementadas vs pendientes

### 3. 📚 STACK TECNOLÓGICO (Líneas 121-280)

Detalle completo de todas las librerías y frameworks:

- Next.js 15, React 19, TypeScript
- Shadcn/ui, Radix UI, Tailwind CSS
- Prisma, PostgreSQL, NextAuth
- Stripe, Twilio, AWS S3, BullMQ, Sentry
- Testing (Jest, Vitest, Playwright)

### 4. ⚡ REGLAS DE INFRAESTRUCTURA VERCEL (Líneas 281-480)

**5 REGLAS CRÍTICAS:**

1. Timeouts Serverless (60s máx)
2. Filesystem Efímero (usar S3)
3. Optimización de Cold Starts
4. Edge vs Node Runtime
5. Rate Limiting

### 5. 🎨 GUÍAS DE ESTILO (Líneas 481-780)

10 secciones arquitectónicas con ejemplos:

- Estructura de archivos
- Convenciones de código
- Patrones de componentes React
- API Routes pattern
- Server Actions pattern
- Manejo de errores
- Prisma best practices
- TypeScript guidelines
- Accesibilidad
- Performance & SEO

### 6. 🛡️ AUDITORÍA & CIBERSEGURIDAD (Líneas 781-1120)

**OWASP Top 10 Checklist** con ejemplos de código:

- Broken Access Control
- Cryptographic Failures
- Injection (SQL, XSS)
- Insecure Design
- Security Misconfiguration
- Vulnerable Components
- Authentication Failures
- Data Integrity Failures
- Logging & Monitoring
- SSRF Prevention

**Plus:**

- Code Review Checklist (10 puntos)
- Performance optimization
- Build & Deploy automation

### 7. 🏠 ESTRATEGIA PROPTECH (Líneas 1121-1680)

**Gap Analysis** vs Homming & Rentger

**5 Funcionalidades Críticas FALTANTES** con especificaciones técnicas completas:

#### 1. Valoración Automática con IA

- Prisma schema completo
- API routes con Anthropic Claude
- Integración con datos de mercado
- UI de valoración

#### 2. Tours Virtuales 360°

- Integración con Matterport
- Componente React de viewer
- Analytics de visualización

#### 3. Firma Digital de Contratos

- Integración con Signaturit (eIDAS)
- Generación de PDFs
- Flujo multi-parte
- Archivo en S3

#### 4. Matching IA Inquilino-Propiedad

- Algoritmo de scoring
- Perfil de inquilino
- Recomendaciones personalizadas

#### 5. Gestión de Incidencias con IA

- Clasificación automática
- Sugerencia de proveedor
- Estimación de coste

**Modelos de Monetización:**

- B2B SaaS (49€-499€/mes)
- B2C Freemium (0€-19€/mes)
- Marketplace (comisiones)

### 8. 🎨 UX/UI & ZERO-TOUCH ONBOARDING (Líneas 1681-1960)

**Zero-Touch Onboarding Flow:**

- Análisis de fricción
- Flujo mejorado con código
- Auto-creación de datos demo

**Automatización:**

- Smart chatbot (Claude streaming)
- Emails transaccionales
- Webhooks

**Mobile First:**

- 10 reglas CSS
- Componentes responsive
- Touch targets mínimos

### 9. 📈 MARKETING & SEO (Líneas 1961-2284)

**SEO On-Page:**

- Meta-data dinámica con Next.js 15
- Open Graph + Twitter Cards
- Schema.org JSON-LD

**Social Media Automation:**

- Instagram auto-posting
- Facebook integration
- LinkedIn B2B publishing
- Generación de imágenes con Canvas

---

## 🚀 CÓMO USAR .cursorrules

### MODO 1: Automático (Sin Hacer Nada)

Cursor AI lee automáticamente el `.cursorrules` y:

- Sugiere código siguiendo los patrones definidos
- Aplica las reglas de seguridad
- Usa el stack tecnológico correcto
- Sigue las convenciones de naming

**Ejemplo:**

```
TÚ: "Crea una API para valorar propiedades"

CURSOR (con .cursorrules):
✅ Crea route.ts con dynamic export
✅ Usa Zod para validación
✅ Integra Anthropic Claude API
✅ Guarda en Prisma según schema definido
✅ Maneja errores correctamente
✅ Añade logging
```

### MODO 2: Consulta Directa

Pregunta explícitamente al asistente:

```
❓ "¿Cómo debo crear una nueva API route según .cursorrules?"
❓ "¿Qué patrón de Server Component debo seguir?"
❓ "¿Cómo manejo archivos en Vercel según las reglas?"
❓ "¿Cuáles son las 5 funcionalidades críticas que faltan?"
❓ "¿Cómo implemento la valoración con IA paso a paso?"
```

### MODO 3: Code Review

Antes de hacer commit, pide una revisión:

```
💬 "Revisa este código siguiendo el checklist de .cursorrules"
💬 "¿Cumple este API route con OWASP Top 10?"
💬 "¿Este componente sigue Mobile First?"
```

---

## ✅ CHECKLIST PRE-COMMIT

Antes de cada commit, verifica (sección del .cursorrules):

- [ ] ¿API Routes marcadas con `export const dynamic = 'force-dynamic'`?
- [ ] ¿No hay operaciones que excedan 60 segundos?
- [ ] ¿No estoy guardando archivos en el filesystem (excepto `/tmp` temporal)?
- [ ] ¿Validé inputs con Zod/Yup?
- [ ] ¿Verifiqué autenticación con `getServerSession`?
- [ ] ¿Usé tipos de `@/types/prisma-types` en lugar de `@prisma/client`?
- [ ] ¿Optimicé imports (no importar librerías pesadas innecesariamente)?
- [ ] ¿Agregué logging para debugging?
- [ ] ¿Manejé errores con try/catch?
- [ ] ¿Retorné códigos HTTP apropiados (200, 201, 400, 401, 500)?

---

## 🎓 EJEMPLOS DE PROMPTS EFECTIVOS

### Para Implementar Features

```
🎯 "Implementa la valoración con IA siguiendo las especificaciones
    de .cursorrules sección 'ESTRATEGIA PROPTECH', punto 1"

🎯 "Crea el componente de tour virtual 360° según el patrón
    definido en .cursorrules"

🎯 "Implementa el flujo de Zero-Touch Onboarding con código
    completo como se especifica en .cursorrules"
```

### Para Refactorización

```
🔧 "Refactoriza este componente para que siga las reglas
    Mobile First de .cursorrules"

🔧 "Optimiza esta API para que cumpla con los timeouts
    de Vercel (regla #1)"

🔧 "Mejora la seguridad de este endpoint siguiendo
    OWASP Top 10 de .cursorrules"
```

### Para Aprender

```
📖 "Explícame el patrón de API Routes definido en .cursorrules"

📖 "¿Cuál es la diferencia entre Edge y Node Runtime según
    nuestras reglas?"

📖 "Dame ejemplos de cómo aplicar las 10 reglas Mobile First"
```

---

## 🔥 REGLAS MÁS IMPORTANTES (TOP 5)

### 1️⃣ TIMEOUTS - 60 SEGUNDOS MÁXIMO

```typescript
// ❌ NUNCA
export async function POST() {
  await longProcess(); // 5 minutos → FALLARÁ
}

// ✅ HACER
export async function POST() {
  await queue.add('long-process', data); // BullMQ
  return { status: 'queued' };
}
```

### 2️⃣ FILESYSTEM EFÍMERO

```typescript
// ❌ NUNCA
fs.writeFileSync('./uploads/file.pdf', data);

// ✅ HACER
await s3.send(new PutObjectCommand({ ... }));
```

### 3️⃣ DYNAMIC EXPORT EN APIs

```typescript
// ✅ SIEMPRE
export const dynamic = 'force-dynamic';

export async function GET() { ... }
```

### 4️⃣ OWASP TOP 10 - ACCESS CONTROL

```typescript
// ✅ SIEMPRE verificar ownership
const property = await prisma.property.findUnique({
  where: { id: params.id },
  select: { companyId: true },
});

if (property?.companyId !== session.user.companyId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 5️⃣ ZOD VALIDATION

```typescript
// ✅ SIEMPRE validar inputs
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

const validated = schema.parse(body);
```

---

## 📊 ESTADÍSTICAS DEL ARCHIVO

- **Total líneas**: 2,284
- **Secciones principales**: 9
- **Ejemplos de código**: 100+
- **Reglas críticas**: 15
- **Patrones arquitectónicos**: 30+
- **Checklists**: 3
- **Schemas de BD**: 10+

---

## 🔄 ACTUALIZACIÓN DEL ARCHIVO

El `.cursorrules` es un **documento vivo**. Se actualiza:

### Cuándo actualizar:

- ✅ Nuevas tecnologías añadidas al stack
- ✅ Nuevos patrones arquitectónicos
- ✅ Lecciones aprendidas de bugs en producción
- ✅ Cambios en infraestructura (ej: migrar de Vercel a AWS)
- ✅ Nuevas funcionalidades críticas del roadmap

### Cómo actualizar:

```bash
# 1. Editar el archivo
nano .cursorrules

# 2. Commit con mensaje descriptivo
git add .cursorrules
git commit -m "docs: Update .cursorrules with [cambio]"
git push origin main

# 3. Comunicar al equipo
# El archivo se actualiza automáticamente en Cursor
```

---

## 💡 CONSEJOS PRO

### 1. Usa Aliases en Cursor

Configura shortcuts para consultas frecuentes:

```
/rules → "Resume las reglas principales de .cursorrules"
/security → "¿Cómo implemento esto de forma segura según OWASP?"
/mobile → "¿Este componente cumple Mobile First?"
```

### 2. Combina con Documentación Externa

```
💬 "Implementa X siguiendo .cursorrules y la documentación
    oficial de [librería]"
```

### 3. Pide Justificación

```
💬 "¿Por qué sugieres este patrón? ¿Está en .cursorrules?"
```

### 4. Solicita Mejoras

```
💬 "Este código funciona pero ¿cómo lo mejorarías según
    .cursorrules?"
```

---

## 🆘 TROUBLESHOOTING

### Problema: Cursor no sigue las reglas

**Solución**:

1. Verifica que `.cursorrules` está en la raíz del proyecto
2. Reinicia Cursor AI
3. Menciona explícitamente: "según .cursorrules..."

### Problema: Reglas conflictivas

**Solución**:

1. Las reglas de infraestructura (Vercel) tienen prioridad
2. Si hay duda, consulta: "¿Hay conflicto entre estas reglas?"

### Problema: Reglas desactualizadas

**Solución**:

1. Actualiza el `.cursorrules`
2. Commit y push
3. Cursor lee la última versión del repo

---

## 📞 PRÓXIMOS PASOS

1. **Léelo al menos una vez** (30 min)
   - Familiarízate con las secciones
   - Identifica patrones recurrentes

2. **Prueba consultas directas** (10 min)
   - Pregunta cómo implementar algo
   - Pide code reviews

3. **Aplica el checklist** (en cada commit)
   - Verifica los 10 puntos antes de commit

4. **Mejóralo continuamente**
   - Añade lecciones aprendidas
   - Actualiza con nuevas tecnologías

---

**Última actualización**: 29 de diciembre de 2025  
**Versión**: 2.0.0 (PropTech Edition)  
**Mantenedor**: Equipo Inmova

---

## 🎓 RECURSOS RELACIONADOS

- **Roadmap**: `/workspace/PROPTECH_ROADMAP.md` - Plan estratégico Q1-Q4 2025
- **Arquitectura**: `/workspace/SOLUCION_ARQUITECTONICA_DEFINITIVA.md` - Solución de deployment
- **Testing**: `/workspace/scripts/audit-admin-pages.ts` - Auditoría visual con Playwright
- **Deployment**: `/workspace/vercel.json` - Configuración de Vercel

---

**El .cursorrules es tu compañero de desarrollo. Úsalo bien y te ahorrará cientos de horas de debugging y refactorizaciones.**

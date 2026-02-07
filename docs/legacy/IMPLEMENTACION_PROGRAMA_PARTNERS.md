# 🚀 IMPLEMENTACIÓN: PROGRAMA DE PARTNERS INMOVA

**Plan de Acción Inmediato**  
**Fecha:** 26 de Diciembre de 2025  
**Timeline:** 4 semanas

---

## ✅ ESTADO ACTUAL (LO QUE YA EXISTE)

### **Infraestructura Técnica** ✅
- ✅ Base de datos de partners (modelo `Partner`, `PartnerClient`, `Commission`)
- ✅ Sistema de comisiones (captación + recurrente)
- ✅ API de partners (`/api/partners/*`)
- ✅ Portal comercial (`/portal-comercial`)
- ✅ Sistema de sub-afiliados (nivel 2)
- ✅ White-label configuration
- ✅ API keys para integraciones
- ✅ Materiales de marketing
- ✅ Sistema de certificaciones

### **Lo que Falta** ❌
- ❌ Landing page pública `/partners`
- ❌ Formulario de registro público
- ❌ Kit de ventas digital
- ❌ Calculadora de comisiones
- ❌ Landing pages personalizadas por partner
- ❌ Contratos y términos legales
- ❌ Onboarding automatizado
- ❌ Material de co-marketing

---

## 📅 PLAN DE IMPLEMENTACIÓN (4 SEMANAS)

### **SEMANA 1: FUNDAMENTOS** ✅

**Día 1-2: Landing Page** ✅
- [x] Crear `/app/partners/page.tsx` ✅ HECHO
- [ ] Añadir sección "Calculadora de comisiones"
- [ ] Añadir FAQ
- [ ] Formulario de contacto partners
- [ ] SEO optimization

**Día 3-4: Kit de Ventas Digital**
- [ ] Presentación PowerPoint (10 slides)
  - Slide 1: Portada "Programa de Partners INMOVA"
  - Slide 2: El mercado PropTech (oportunidad)
  - Slide 3: INMOVA en números
  - Slide 4: 6 Verticales + 6 Módulos (arquitectura única)
  - Slide 5: Comparativa vs competencia
  - Slide 6: Modelo de comisiones
  - Slide 7: Niveles de partner (Bronce a Platino)
  - Slide 8: Herramientas para partners
  - Slide 9: Casos de éxito
  - Slide 10: Cómo empezar

- [ ] One-pager "Por qué ser partner" (1 página PDF)
- [ ] One-pagers por vertical (6 PDFs):
  - Alquiler Tradicional
  - STR (Vacacional)
  - Coliving / Room Rental
  - House Flipping
  - Construcción
  - Servicios Profesionales

**Día 5: Contratos y Legal**
- [ ] Contrato marco de partnership (plantilla)
- [ ] Términos y condiciones de partners
- [ ] Política de comisiones
- [ ] Acuerdo de confidencialidad (NDA)
- [ ] Addendum para white-label

---

### **SEMANA 2: HERRAMIENTAS Y CONTENIDO**

**Día 1-2: Calculadora de Comisiones**
- [ ] Crear `/app/partners/calculator/page.tsx`
- [ ] Inputs:
  - Tipo de partner (dropdown)
  - Número de clientes esperados
  - Plan promedio (Basic/Professional/Business)
  - Timeframe (mensual/anual)
- [ ] Outputs:
  - Comisión de captación total
  - Comisión recurrente mensual
  - Ingreso anual proyectado
  - Gráfico de crecimiento
- [ ] Guardar cálculo y enviar por email

**Día 3: Materiales de Marketing**
- [ ] Banners para web (3 tamaños):
  - 728x90 (leaderboard)
  - 300x250 (medium rectangle)
  - 160x600 (wide skyscraper)
- [ ] Templates de email:
  - Email de invitación a clientes
  - Email de bienvenida
  - Email de seguimiento
  - Email de cierre
- [ ] Posts para redes sociales:
  - LinkedIn (3 templates)
  - Instagram (3 templates)
  - Twitter (3 templates)

**Día 4-5: Video y Multimedia**
- [ ] Script de video "Únete al Programa de Partners" (3 min)
- [ ] Grabar y editar video
- [ ] Thumbnail atractivo
- [ ] Subtítulos en español
- [ ] Subir a YouTube + embeber en `/partners`

---

### **SEMANA 3: ONBOARDING Y FORMACIÓN**

**Día 1-2: Onboarding Automatizado**
- [ ] Email secuencia de bienvenida (5 emails):
  1. Bienvenida + acceso al portal
  2. Cómo funciona el portal (tutorial)
  3. Descarga tu kit de ventas
  4. Tips para tu primera venta
  5. Recordatorio: agenda tu sesión de onboarding
- [ ] Checklist de onboarding en portal:
  - [ ] Completar perfil
  - [ ] Descargar materiales
  - [ ] Ver video de formación
  - [ ] Agendar sesión 1:1
  - [ ] Hacer primera invitación

**Día 3: Portal de Partners - Mejoras**
- [ ] Añadir calculadora integrada
- [ ] Landing pages personalizadas:
  - Generar URL única: `inmova.com/p/[codigo-referido]`
  - Personalizar con logo del partner
  - Añadir testimonio del partner
  - Tracking automático de clicks
- [ ] Dashboard mejorado:
  - Gráfico de evolución de leads
  - Ranking de partners
  - Próximas comisiones a cobrar
  - Objetivos para nivel superior

**Día 4-5: Material de Formación**
- [ ] Crear curso online "INMOVA Partner Academy":
  - Módulo 1: Introducción a INMOVA (30 min)
  - Módulo 2: 6 Verticales explicados (45 min)
  - Módulo 3: Técnicas de venta (60 min)
  - Módulo 4: Objeciones comunes y respuestas (30 min)
  - Módulo 5: Casos de éxito (30 min)
- [ ] Quiz final de certificación (10 preguntas)
- [ ] Certificado digital al aprobar

---

### **SEMANA 4: LANZAMIENTO Y ACTIVACIÓN**

**Día 1-2: Reclutamiento Inicial (10 Partners Piloto)**

**Autónomos (5):**
- [ ] Buscar en LinkedIn: "Administrador de Fincas" + "Madrid"
- [ ] Outreach personalizado (template):
  ```
  Hola [Nombre],
  
  Vi tu perfil y me pareció ideal para nuestra iniciativa.
  
  INMOVA es la plataforma PropTech líder en España y estamos 
  buscando 10 partners exclusivos para lanzar nuestro programa.
  
  Como API, podrías generar hasta €440/mes pasivos recomendando 
  INMOVA a tus clientes (sin ningún coste para ti).
  
  ¿Te interesa una llamada de 15 minutos para explicarte?
  
  Saludos,
  [Nombre]
  ```

**Inmobiliarias (3):**
- [ ] Buscar en Google: "gestoras de alquiler Madrid"
- [ ] Email a CEO/Director Comercial con propuesta white-label

**Centros de Estudios (1):**
- [ ] Contacto con IE Business School
- [ ] Propuesta de colaboración académica

**Plataforma (1):**
- [ ] Meeting con Zona 3
- [ ] Presentación de revenue share + integración API

**Día 3: Onboarding de 10 Pilotos**
- [ ] Sesión individual con cada partner (1 hora)
- [ ] Acceso al portal
- [ ] Entrega de materiales
- [ ] Definir objetivos de primera venta (2 semanas)

**Día 4: Primeras Ventas**
- [ ] Acompañamiento en primera demo
- [ ] Co-calling con 2-3 clientes potenciales
- [ ] Feedback y ajustes

**Día 5: Medición y Optimización**
- [ ] Revisar métricas de partners piloto:
  - Leads generados
  - Conversión
  - Feedback sobre materiales
  - Tiempo hasta primera venta
- [ ] Ajustar proceso según aprendizajes
- [ ] Preparar escalamiento a 50 partners

---

## 📊 MÉTRICAS A TRACKEAR

### **Semana 1-2 (Setup):**
- [ ] Landing page publicada
- [ ] Materiales creados (checklist completo)
- [ ] Contratos listos
- [ ] Portal mejorado

### **Semana 3 (Piloto):**
- [ ] 10 partners reclutados
- [ ] 10 partners onboardeados
- [ ] 100% completan formación

### **Semana 4 (Primeras ventas):**
- [ ] 5+ primeras ventas de partners
- [ ] 80% de partners activos (1+ venta)
- [ ] NPS de partners: 8+
- [ ] Tiempo promedio hasta primera venta: <2 semanas

---

## 💰 PRESUPUESTO

### **Interno (Tiempo):**
- Desarrollo landing page: 8 horas
- Kit de ventas (diseño): 16 horas
- Video producción: 12 horas
- Onboarding piloto: 10 horas (1h × 10 partners)
- **Total:** 46 horas

### **Externo (Costes):**
- Diseño gráfico (banners, one-pagers): €500
- Video producción profesional: €1,000
- Legal (contratos): €800
- Ads para reclutamiento partners: €1,000
- **Total:** €3,300

### **ROI Esperado:**
- 10 partners × 5 clientes = 50 clientes
- 50 × €149 (ticket medio) = €7,450 MRR
- Comisiones partners: €7,450 × 20% = €1,490/mes
- **MRR neto para INMOVA: €5,960/mes**
- **Año 1: €71,520 (ROI: 2,067%)**

---

## 🎯 QUICK WINS (Próximas 48 horas)

### **Hoy (Día 1):**
1. ✅ Revisar infraestructura existente ✅ HECHO
2. ✅ Crear documento estratégico ✅ HECHO
3. ✅ Crear landing page `/partners` ✅ HECHO
4. [ ] Publicar landing page
5. [ ] Anunciar programa en LinkedIn

### **Mañana (Día 2):**
6. [ ] Crear presentación de ventas (10 slides)
7. [ ] Crear one-pager "Por qué ser partner"
8. [ ] Identificar 50 partners potenciales (LinkedIn)
9. [ ] Enviar primeros 10 mensajes de outreach
10. [ ] Agendar primera reunión de partner

---

## 📧 TEMPLATES DE OUTREACH

### **Template 1: Autónomo Inmobiliario**

**Asunto:** Genera €440/mes con tus clientes actuales (0 inversión)

```
Hola [Nombre],

Vi tu perfil como API/asesor inmobiliario y creo que te puede 
interesar esto:

INMOVA es la plataforma PropTech líder en España (6 verticales, 
€49-349/mes) y acabamos de lanzar nuestro Programa de Partners.

Como partner, ganarías:
• €150-1,000 por cada cliente que refieras
• 15% comisión recurrente (mensual, permanente)
• Con solo 10 clientes → €220/mes pasivos

Sin inversión. Sin exclusividad. Solo beneficios.

¿Te interesa una llamada de 15 min esta semana?

[Calendly link]

Saludos,
[Tu nombre]
Programa de Partners INMOVA
partners@inmova.com
```

---

### **Template 2: Inmobiliaria/Gestora**

**Asunto:** White-Label PropTech: Tu marca + nuestra tecnología

```
Hola [Nombre],

Soy [tu nombre] del equipo de INMOVA.

Hemos desarrollado la plataforma PropTech más completa de España 
y queremos ofrecerte una oportunidad única:

WHITE-LABEL: Personaliza INMOVA con tu marca y ofrécela a tus 
clientes con un margen del 25%.

Ejemplo:
- Revendes a €149/mes
- Tu margen: €37/mes por cliente
- Con 20 clientes: €740/mes adicionales

Además de diferenciarte de la competencia con tecnología de primer nivel.

¿Hablamos 20 minutos esta semana para mostrártelo?

[Calendly link]

Un saludo,
[Tu nombre]
```

---

### **Template 3: Centro de Estudios**

**Asunto:** Propuesta de colaboración académica - IE Business School

```
Estimado/a [Nombre],

Soy [tu nombre], responsable de Partnerships de INMOVA.

INMOVA es la plataforma PropTech líder en España, y nos gustaría 
proponer una colaboración con [Universidad/Escuela] para el 
[Máster Inmobiliario / MBA].

PROPUESTA:
• Licencia anual para todos los estudiantes del máster
• Material didáctico y casos prácticos reales
• Sesiones de formación a profesores
• Badge "Powered by INMOVA" en vuestro programa
• Inversión: €10,000-15,000/año

Nuestros estudiantes aprenderían con la herramienta que usarán 
en su carrera profesional.

¿Sería posible una reunión en enero para presentar la propuesta?

Quedo a vuestra disposición.

Un cordial saludo,
[Tu nombre]
Director de Partnerships
INMOVA
```

---

## ✅ CHECKLIST DE LANZAMIENTO

### **Pre-lanzamiento:**
- [x] Infraestructura técnica revisada
- [x] Documento estratégico creado
- [x] Landing page `/partners` creada
- [ ] Landing page publicada y testeada
- [ ] Kit de ventas completo
- [ ] Contratos y legal listos
- [ ] Onboarding automatizado configurado

### **Lanzamiento Soft (10 partners piloto):**
- [ ] 10 partners identificados
- [ ] 10 outreach personalizados enviados
- [ ] 5+ meetings agendados
- [ ] 10 partners onboardeados
- [ ] Primeras ventas logradas (target: 5 en 2 semanas)

### **Lanzamiento Público:**
- [ ] Landing page optimizada según feedback piloto
- [ ] Post en LinkedIn anunciando programa
- [ ] Email a base de datos existente
- [ ] Ads en LinkedIn para reclutamiento
- [ ] Webinar público "Únete al Programa de Partners"
- [ ] Target: 50 partners mes 1, 100 partners mes 2

---

## 🎓 SCRIPT DE LLAMADA CON PARTNER POTENCIAL

### **Minuto 1-2: Apertura**
"Hola [Nombre], gracias por la llamada. Como te comenté, soy [tu nombre] de INMOVA. 

¿Conoces INMOVA o es la primera vez que escuchas de nosotros?"

[Escuchar respuesta]

### **Minuto 3-5: Problema**
"Perfecto. Déjame preguntarte: ¿Tus clientes actualmente usan alguna 
herramienta para gestionar sus propiedades? ¿Excel, algún software?"

[Escuchar]

"Exacto, ese es el problema. La mayoría usa Excel o herramientas que 
solo cubren 1 vertical (ej: solo alquiler). Y tú como asesor, ¿les 
recomiendas algo actualmente?"

### **Minuto 6-10: Solución**
"Te explico INMOVA en 2 minutos:

Somos la plataforma PropTech más completa de España. Tenemos 6 verticales:
alquiler, STR vacacional, coliving, house flipping, construcción y servicios 
profesionales. Más 6 módulos transversales únicos: ESG, marketplace, pricing IA, 
tours VR, IoT, blockchain.

Precio desde €49/mes (el más bajo del mercado). Competencia: Homming €120, 
Rentger €100. Nosotros 6x más funcionalidad.

**Para ti como partner:**
- Por cada cliente que refieras: €150-1,000 captación (según plan)
- Más importante: 15% comisión recurrente mensual, mientras esté activo
- Ejemplo: 10 clientes Professional (€149/mes) = €22/mes × 10 = €220/mes pasivos

Sin inversión, sin exclusividad. Solo ganas."

### **Minuto 11-13: Objeción**
"¿Qué te parece? ¿Alguna pregunta?"

**Objeción 1:** "No tengo tiempo para vender"
→ "Perfecto, no necesitas vender activamente. Simplemente cuando un cliente 
te pregunte por herramientas, lo mencionas. Nosotros hacemos la demo y la venta. 
Tú solo refieres."

**Objeción 2:** "¿Cuánto me cuesta?"
→ "Nada. 0 euros. No hay inversión ni costes. Solo ganas si el cliente contrata."

**Objeción 3:** "¿Y si el cliente cancela?"
→ "Cobras mientras esté activo. Nuestro churn es <3% (el más bajo del sector). 
Además, tienes comisión de captación que es inmediata."

### **Minuto 14-15: Cierre**
"Genial. ¿Te apetece probarlo? Te doy acceso al portal de partners hoy mismo, 
ves los materiales, y si te convence empiezas a referir. ¿Te parece?"

[Si dice sí]
"Perfecto. Te envío un email ahora con acceso. ¿Tienes alguna pregunta más?"

[Si dice "déjame pensarlo"]
"Por supuesto. Te envío la presentación por email y hablamos la semana que viene. 
¿Te va bien el martes a las 11h?"

---

## 📞 CONTACTOS CLAVE A ALCANZAR

### **Plataformas:**
1. **Zona 3** - zona3.es
   - Contacto: CEO / Director de Partnerships
   - Propuesta: Revenue share 30%

2. **Fotocasa Pro** - fotocasa.es/pro
   - Contacto: Director de Producto
   - Propuesta: Integración para profesionales

3. **Idealista/data** - idealista.com/data
   - Contacto: Director Comercial
   - Propuesta: Co-selling a su base

### **Centros de Estudios:**
1. **IE Business School** - ie.edu
   - Máster en Real Estate Development
   - Contacto: Director del máster

2. **ESADE** - esade.edu
   - Master in Real Estate Management
   - Contacto: Director académico

3. **Comillas** - comillas.edu
   - Máster Universitario en Gestión Inmobiliaria
   - Contacto: Coordinador del programa

### **Asociaciones:**
1. **Colegio de APIs Madrid** - capm.es
   - 2,000 colegiados
   - Contacto: Decano / Director de Comunicación

2. **AEGI** - aegi.es (Asociación Española de Gestores Inmobiliarios)
   - Contacto: Presidente

3. **AEI** - asociacioninmobiliaria.es
   - Contacto: Director Ejecutivo

---

## 🎉 CELEBRACIONES Y GAMIFICACIÓN

### **Hitos a Celebrar:**
- 🎊 Primer partner registrado
- 🎉 Primera venta de partner
- 🏆 10 partners activos
- 💰 €10,000 en comisiones pagadas
- 🚀 50 partners activos
- 👑 Primer partner nivel Oro (25+ clientes)

### **Recompensas:**
- Partner del Mes (€500 bonus)
- Partner del Trimestre (€2,000 bonus)
- Partner del Año (€10,000 bonus + viaje)

---

**Creado:** 26 de Diciembre de 2025  
**Estado:** LISTO PARA EJECUTAR  
**Próximo Paso:** Publicar landing + recrutar primeros 10 partners  
**Timeline:** 4 semanas hasta 50 partners activos

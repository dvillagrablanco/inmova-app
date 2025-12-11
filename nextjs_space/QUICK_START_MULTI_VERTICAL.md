# ⚡ QUICK START GUIDE: INMOVA MULTI-VERTICAL

## Guía de Inicio Rápido para los 7 Modelos de Negocio

---

## 🎯 INTRODUCCIÓN

INMOVA es la **única plataforma PropTech** que soporta **7 modelos de negocio inmobiliario** de forma nativa:

1. 🏠 **Alquiler Residencial Tradicional**
2. 🏖️ **STR - Short Term Rentals** (Airbnb, Booking, Vrbo)
3. 🔨 **House Flipping** (Compra → Reforma → Venta)
4. 🏗️ **Construcción** (Obra nueva)
5. 📐 **Servicios Profesionales** (Arquitectos, aparejadores)
6. 🏘️ **Coliving / Media Estancia**
7. 🏨 **Hoteles / Apart-Hotels**

Esta guía te enseña a **activar y usar cada vertical en menos de 1 hora**.

---

## 📋 PREREQUISITOS

✅ Cuenta INMOVA activa (Plan Profesional o superior)  
✅ Rol: Administrador o Gestor  
✅ 30 minutos de tiempo  

---

# 1️⃣ ALQUILER RESIDENCIAL TRADICIONAL

## ⏱️ Tiempo Setup: 10 minutos

### Paso 1: Crear Edificio

```
Ruta: Edificios > Nuevo Edificio

Datos:
- Nombre: Edificio Ejemplo
- Dirección: Calle Mayor 1, Madrid
- Unidades: 10
- Tipo: Residencial
```

### Paso 2: Crear Unidad

```
Ruta: Unidades > Nueva Unidad

Datos:
- Edificio: [Seleccionar]
- Número: 1A
- Superficie: 75 m²
- Habitaciones: 2
- Baños: 1
- Renta: €800/mes
- Estado: Disponible
```

### Paso 3: Alta Inquilino

```
Ruta: Inquilinos > Nuevo Inquilino

Datos Mínimos:
- Nombre: Juan Pérez
- Email: juan@email.com
- Teléfono: +34 600 123 456
- DNI: 12345678A
```

### Paso 4: Crear Contrato

```
Ruta: Contratos > Nuevo Contrato

1. Seleccionar Inquilino
2. Seleccionar Unidad
3. Fecha Inicio: 01/12/2024
4. Duración: 12 meses
5. Renta: €800/mes
6. Generar PDF
7. Enviar a Firma Digital
```

### Paso 5: Configurar Pagos

**Opción A: Stripe (Automático)**
```
En Contrato:
- ☑️ Activar Pagos Recurrentes
- Día cobro: 1 de cada mes
- Stripe cobra automáticamente
```

**Opción B: Manual**
```
Sistema crea pagos mensuales
Gestor registra manualmente al recibir
```

✅ **¡Listo!** Tu primer contrato residencial está activo.

---

# 2️⃣ STR - SHORT TERM RENTALS (AIRBNB)

## ⏱️ Tiempo Setup: 15 minutos

### Pre-requisito: Activar Módulos STR

```
Ruta: Administración > Módulos

Activar:
☑️ Anuncios STR
☑️ Reservas STR  
☑️ Channel Manager
☑️ Pricing Dinámico
```

### Paso 1: Crear Propiedad STR

```
Ruta: Unidades > Nueva Unidad

Datos Específicos STR:
- Tipo: Apartamento Turístico
- ☑️ Apto para STR
- Precio Base Noche: €85
- Mínimo Noches: 2
- Máximo Huéspedes: 4
- Check-in: 15:00
- Check-out: 11:00
```

### Paso 2: Configurar Amenities

```
En Unidad:

Amenities:
☑️ WiFi
☑️ AC
☑️ Cocina equipada
☑️ Lavadora
☑️ Smart TV
☑️ Parking (opcional)

Normas Casa:
☑️ No fumar
☑️ No mascotas
☑️ No fiestas
```

### Paso 3: Fotos y Tour Virtual

**Fotos Obligatorias (mínimo 10)**:
1. Exterior edificio
2. Salón (3 ángulos)
3. Cocina
4. Habitación principal
5. Habitación secundaria (si aplica)
6. Baño
7. Vistas
8. Detalles

```
Ruta: Unidades > [ID] > Galería

- Subir fotos alta resolución (>1080p)
- Orden drag & drop
- Foto principal: Salón mejor ángulo
```

### Paso 4: Crear Anuncio Multi-Portal

```
Ruta: STR > Anuncios > Nuevo

1. Seleccionar Unidad
2. IA genera título y descripción optimizados:
   - Airbnb: 500 caracteres
   - Booking: 800 caracteres
   - Vrbo: 600 caracteres
3. Revisar y editar
4. ☑️ Publicar en:
   ☑️ Airbnb
   ☑️ Booking.com
   ☑️ Vrbo
```

### Paso 5: Conectar Canales

**Airbnb**:
```
1. Ir a STR > Channel Manager > Airbnb
2. "Conectar Cuenta"
3. Login Airbnb
4. Autorizar INMOVA
5. Seleccionar propiedades a sincronizar
6. ✅ Sincronización cada 5 minutos
```

**Booking.com**:
```
1. STR > Channel Manager > Booking
2. Ingresar Extranet ID
3. Ingresar API Key
4. Mapear propiedades
5. ✅ Calendario sincronizado
```

### Paso 6: Pricing Dinámico IA

```
Ruta: STR > Pricing Dinámico

1. Seleccionar propiedad
2. Configurar:
   - Precio Base: €85/noche
   - Precio Mínimo: €60/noche
   - Precio Máximo: €150/noche
3. Factores IA:
   ☑️ Eventos locales
   ☑️ Ocupación competencia
   ☑️ Estacionalidad
   ☑️ Día semana
4. ☑️ Activar Auto-Pricing
```

**Resultado**: IA ajusta precios diariamente para maximizar RevPAR.

### Paso 7: Primera Reserva

```
Cuando llega reserva desde Airbnb:

1. INMOVA recibe automáticamente
2. Bloquea calendario en todos los canales
3. Crea reserva en sistema
4. Notifica gestor
5. Gestión check-in/out:
   - Email automático huésped 24h antes
   - Instrucciones acceso
   - Código cerradura inteligente (si configurado)
```

✅ **¡Listo!** Tu propiedad STR está operativa en todos los canales.

**Métricas a Seguir**:
- ADR (Average Daily Rate)
- Ocupación %
- RevPAR (Revenue Per Available Room)
- Rating promedio
- Tiempo respuesta

---

# 3️⃣ HOUSE FLIPPING

## ⏱️ Tiempo Setup: 20 minutos

### Pre-requisito: Activar Módulo

```
Administración > Módulos > Activar:
☑️ House Flipping
☑️ Gastos (si no activo)
```

### Paso 1: Crear Proyecto Flipping

```
Ruta: Flipping > Proyectos > Nuevo

Datos Proyecto:
- Nombre: Reforma Chamberí 45
- Dirección: Calle Chamberí 45, Madrid
- Tipo: Apartamento
- Superficie: 80 m²

Financiero:
- Precio Compra: €120,000
- Presupuesto Reforma: €40,000
- Gastos Estimados: €10,000
- TOTAL INVERSIÓN: €170,000

- Precio Venta Objetivo: €230,000
- ROI Objetivo: 35%

Plazos:
- Fecha Compra: 01/11/2024
- Duración Reforma: 90 días
- Fecha Venta Objetivo: 28/02/2025
```

### Paso 2: Definir Fases

```
Sistema crea automáticamente 5 fases:

1. ✅ Compra (Completada)
2. 🔄 Demolición (En curso)
3. ⏳ Construcción (Pendiente)
4. ⏳ Acabados (Pendiente)  
5. ⏳ Venta (Pendiente)

Para cada fase:
- Presupuesto
- Duración estimada
- Tareas
- Responsables
```

### Paso 3: Registrar Gastos

```
Ruta: Flipping > [Proyecto] > Gastos > Nuevo

Ejemplo:
- Fecha: 05/11/2024
- Concepto: Demolición paredes
- Categoría: Mano de Obra
- Proveedor: Demoliciones Pro SL
- Monto: €3,500
- Fase: Demolición
- Adjuntar: Factura PDF
```

**Categorías Auto**:
- Compra
- Licencias y Permisos
- Mano de Obra
- Materiales
- Fontanería
- Electricidad
- Pintura
- Suelos
- Cocina y Baños
- Gastos Financieros
- Gestoría
- Marketing Venta

### Paso 4: Dashboard Proyecto (Tiempo Real)

```
Vista Proyecto muestra automáticamente:

┌─────────────────────────────────┐
│ PROYECTO: Chamberí 45           │
├─────────────────────────────────┤
│ Progreso: [████░░░░] 45%       │
│                                 │
│ FINANCIERO                      │
│ Inversión Total:  €170,000      │
│ Gastado:          €78,500       │
│ Restante:         €91,500       │
│ Desviación:       -€1,200 ✅    │
│                                 │
│ ROI PROYECTADO                  │
│ Venta Estimada:   €230,000      │
│ Beneficio:        €60,000       │
│ ROI:              35.3%         │
│                                 │
│ TIMELINE                        │
│ Día 35 de 90                    │
│ On schedule ✅                   │
└─────────────────────────────────┘
```

### Paso 5: Fotografía Progreso

```
Antes/Durante/Después:

1. Subir fotos estado inicial
2. Fotos progreso (semanal)
3. Fotos finales
4. Sistema crea galería comparativa
5. Útil para:
   - Seguimiento interno
   - Marketing venta
   - Portfolio casos éxito
```

### Paso 6: Cierre y Venta

```
Cuando proyecto completo:

1. Cambiar fase a "Venta"
2. Registrar:
   - Precio Venta Real: €235,000
   - Fecha Venta: 20/02/2025
   - Comprador: [Datos]
3. Sistema calcula automáticamente:
   - ROI Real: 38.2%
   - Duración Real: 85 días
   - Desviación Presupuesto: -€2,300 ✅
4. Proyecto pasa a "Completado"
5. Datos alimentan estadísticas globales
```

✅ **¡Listo!** Proyecto flipping tracked end-to-end.

**Reportes Disponibles**:
- P&L por proyecto
- ROI histórico
- Time-to-flip promedio
- Categorías gasto más altas
- Proveedores mejores/peores

---

# 4️⃣ CONSTRUCCIÓN (OBRA NUEVA)

## ⏱️ Tiempo Setup: 25 minutos

### Pre-requisito

```
Administración > Módulos > Activar:
☑️ Construcción
☑️ Órdenes de Trabajo
☑️ Inspecciones
☑️ Proveedores
```

### Paso 1: Crear Proyecto Construcción

```
Ruta: Construcción > Proyectos > Nuevo

Datos:
- Nombre: Residencial Vista Mar
- Ubicación: Avenida Costa 123, Málaga
- Tipo: Residencial
- Unidades: 24 viviendas
- Promotor: Tu Empresa SL

Financiero:
- Presupuesto Total: €3,500,000
- Financiación: €2,000,000 banco
- Capital Propio: €1,500,000

Plazos:
- Inicio: 01/01/2025
- Fin Previsto: 31/12/2025
- Duración: 12 meses
```

### Paso 2: Configurar Fases Obra (9 Fases)

```
Sistema crea automáticamente:

1. Estudios Previos (Mes 1)
   - Estudio geotécnico
   - Proyecto básico
   - Licencias

2. Demolición y Limpieza (Mes 1)

3. Cimentación (Mes 2-3)

4. Estructura (Mes 4-6)

5. Cerramientos (Mes 7)

6. Instalaciones (Mes 8-9)
   - Fontanería
   - Electricidad
   - HVAC

7. Acabados (Mes 10-11)
   - Yeso
   - Pintura
   - Suelos

8. Equipamiento (Mes 11-12)
   - Cocinas
   - Baños
   - Carpintería

9. Entrega (Mes 12)
   - Limpieza final
   - Inspecciones
   - Llaves

Cada fase:
- Presupuesto asignado
- Duración días
- Dependencias (ej: Estructura requiere Cimentación)
```

### Paso 3: Gestionar Subcontratistas

```
Ruta: Proveedores > Nuevo Proveedor

Ejemplo:
- Nombre: Cimentaciones Sur SL
- Especialidad: Cimentación
- CIF: B12345678
- Contacto: José Martínez
- Teléfono: +34 600 111 222
- Email: jose@cimentaciones.com

Contrato:
- Fase: Cimentación
- Presupuesto: €280,000
- Inicio: 01/02/2025
- Fin: 31/03/2025
- Forma Pago: 30% adelanto, 70% fin obra
```

### Paso 4: Órdenes de Trabajo

```
Cuando fase activa:

Ruta: Órdenes Trabajo > Nueva

- Proyecto: Vista Mar
- Fase: Cimentación
- Subcontratista: Cimentaciones Sur
- Descripción: Excavación y pilotes
- Fecha Inicio: 01/02/2025
- Fecha Fin: 15/02/2025
- Presupuesto: €140,000

Estados:
🟡 Asignada
🟢 Aceptada
🔵 En Progreso
⚠️ Incidencia
✅ Completada
```

### Paso 5: Inspecciones y Control Calidad

```
Ruta: Inspecciones > Nueva

- Proyecto: Vista Mar
- Fase: Estructura
- Tipo: ITE (Inspección Técnica)
- Fecha: 15/06/2025
- Inspector: Aparejador Juan López

Checklist:
☑️ Vigas correctamente armadas
☑️ Hormigón calidad especificada
☑️ Resistencia según normativa
☐ Defectos encontrados

Resultado:
✅ Aprobada
❌ Rechazada (con motivos)
⚠️ Aprobada con observaciones

Adjuntar:
- Fotos
- Informe PDF
- Certificados materiales
```

### Paso 6: Dashboard Obra

```
┌──────────────────────────────────────┐
│ OBRA: Residencial Vista Mar          │
├──────────────────────────────────────┤
│ Estado: Fase 4/9 - Estructura        │
│ Progreso: [████████░░░░] 45%        │
│                                      │
│ FINANCIERO                           │
│ Presupuesto: €3,500,000              │
│ Ejecutado:   €1,575,000 (45%)        │
│ Pendiente:   €1,925,000              │
│ Desviación:  +€25,000 (1.6%) ⚠️      │
│                                      │
│ PLAZOS                               │
│ Días Transcurridos: 165/365          │
│ Retraso: 5 días ⚠️                   │
│ Fecha Fin Ajustada: 05/01/2026       │
│                                      │
│ ALERTAS                              │
│ 🔴 Partida Estructura: +€25K         │
│ 🟡 Proveedor Electricidad: Sin asig. │
└──────────────────────────────────────┘
```

### Paso 7: Transición Post-Construcción

```
Cuando obra finaliza:

1. Proyecto pasa a "Completado"
2. Sistema pregunta:
   "¿Crear unidades para gestión alquiler?"
   
3. Si SÍ:
   - Crea automáticamente 24 unidades
   - Asocia a nuevo edificio
   - Importa datos construcción
   - ¡Listo para alquilar!
   
4. Si NO:
   - Proyecto archivado
   - Datos históricos disponibles
```

✅ **¡Listo!** Obra gestionada end-to-end con visibilidad total.

---

# 5️⃣ SERVICIOS PROFESIONALES

## ⏱️ Tiempo Setup: 15 minutos

**Para**: Arquitectos, Aparejadores, Ingenieros, Consultores inmobiliarios

### Pre-requisito

```
Administración > Módulos > Activar:
☑️ Servicios Profesionales
☑️ Reuniones
☑️ Documentos
```

### Paso 1: Crear Proyecto Profesional

```
Ruta: Profesional > Proyectos > Nuevo

Datos:
- Tipo: Proyecto Básico Arquitectura
- Cliente: Promotora ABC SL
- Edificio: Residencial Centro (opcional)
- Descripción: Proyecto básico 30 viviendas

Financiero:
- Honorarios: €45,000
- Estructura Pago:
  - 30% a la firma: €13,500
  - 40% entrega básico: €18,000
  - 30% licencia: €13,500

Plazos:
- Inicio: 01/12/2024
- Entrega: 28/02/2025
- Duración: 90 días
```

### Paso 2: Definir Entregables

```
En Proyecto:

Entregables:
1. Memoria Descriptiva
   - Estado: En progreso
   - Responsable: Arquitecto Senior
   - Deadline: 15/12/2024
   
2. Planos Arquitectura
   - Estado: Pendiente
   - Responsable: Delineante
   - Deadline: 31/12/2024
   
3. Mediciones y Presupuesto
   - Estado: Pendiente
   - Responsable: Aparejador
   - Deadline: 15/01/2025
   
4. Estudio Seguridad y Salud
   - Estado: Pendiente
   - Coordinador SS
   - Deadline: 31/01/2025
```

### Paso 3: Gestionar Reuniones

```
Ruta: Reuniones > Nueva

- Proyecto: Proyecto Básico Residencial Centro
- Tipo: Reunión Seguimiento
- Fecha: 15/12/2024 10:00
- Duración: 1h
- Participantes:
  - Cliente: Director Promotora ABC
  - Nosotros: Arquitecto + Aparejador
- Ubicación: Oficina cliente / Zoom

Orden del día:
1. Estado avance (15 min)
2. Revisión planos preliminares (30 min)
3. Cambios solicitados cliente (10 min)
4. Próximos pasos (5 min)

Durante reunión:
- Tomar notas en plataforma
- Marcar acuerdos/decisiones
- Asignar tareas post-reunión

Post-reunión:
- Sistema genera acta automáticamente
- Email a todos participantes
- Tareas creadas en proyecto
```

### Paso 4: Gestión Documental

```
Ruta: Profesional > [Proyecto] > Documentos

Estructura carpetas automática:

📁 Proyecto Básico Residencial
  ├─ 📁 01_Contrato
  │   └─ Contrato_Honorarios.pdf
  ├─ 📁 02_Documentación Cliente
  │   ├─ Catastro.pdf
  │   └─ Topográfico.dwg
  ├─ 📁 03_Proyecto Básico
  │   ├─ 📁 Memoria
  │   ├─ 📁 Planos
  │   │   ├─ PB_01_Situación.pdf
  │   │   ├─ PB_02_Emplazamiento.pdf
  │   │   └─ ...
  │   ├─ 📁 Mediciones
  │   └─ 📁 Estudio SS
  ├─ 📁 04_Correspondencia
  └─ 📁 05_Facturación

Control versiones:
- Memoria_v1.pdf
- Memoria_v2.pdf (revisión cliente)
- Memoria_v3_FINAL.pdf
```

### Paso 5: Facturación por Hitos

```
Cuando entregable completado:

Ruta: Profesional > [Proyecto] > Facturación

Ejemplo:
- Hito: Entrega Proyecto Básico
- Fecha: 28/02/2025
- Monto: €18,000 (40%)
- Generar Factura:
  - Sistema crea PDF automático
  - Incluye datos fiscales
  - Logo profesional
  - Envía email cliente
  - Registra en contabilidad
```

✅ **¡Listo!** Gestión profesional de proyectos de servicios.

---

# 6️⃣ COLIVING / MEDIA ESTANCIA

## ⏱️ Tiempo Setup: 15 minutos

**Diferencia con Alquiler Tradicional**:
- Contratos 1-12 meses (vs. 12+ meses)
- Habitaciones individuales en piso compartido
- Servicios incluidos (limpieza, wifi, suministros)
- Comunidad y eventos
- Facturación todo incluido

### Setup Rápido

```
Ruta: Edificios > Nuevo

Tipo: Coliving
- Nombre: CoLive Madrid Centro
- Dirección: Calle Atocha 45
- Habitaciones: 15
- Zonas Comunes:
  ☑️ Cocina compartida (2)
  ☑️ Salón
  ☑️ Coworking
  ☑️ Gym
  ☑️ Terraza

Renta:
- Habitación individual: €650/mes
- Habitación doble: €850/mes
- Todo incluido:
  ✅ WiFi fibra
  ✅ Limpieza semanal zonas comunes
  ✅ Suministros
  ✅ Eventos mensuales
```

**Contratos**:
- Duración flexible: 1-12 meses
- Check-in/out cualquier día mes
- Prorrateo días

**Comunidad**:
```
Ruta: Comunidad Social

- Feed interno residentes
- Calendario eventos
- Marketplace servicios P2P
- Sistema matching roommates
```

---

# 7️⃣ HOTELES / APART-HOTELS

## ⏱️ Tiempo Setup: 20 minutos

**Similar a STR pero con diferencias**:
- Gestión reception
- Housekeeping diario
- Room service
- Multiple tarifas (standard, deluxe, suite)
- Integraciones PMS (opcional)

### Setup

```
Ruta: Edificios > Nuevo

Tipo: Hotel/Apart-Hotel
- Nombre: Apart-Hotel Vista
- Habitaciones: 40

Tipos Habitación:
1. Standard: €80/noche
2. Deluxe: €120/noche
3. Suite: €180/noche

Servicios:
☑️ Desayuno (+€12)
☑️ Parking (+€15/día)
☑️ Early check-in (+€20)
☑️ Late check-out (+€20)
```

**Channel Manager**:
- Conectar Booking.com
- Conectar Expedia
- Precio base + extras
- Restricciones (min nights, max stay)

---

## 🎯 CONSEJOS MULTI-VERTICAL

### 1. Segregación Contable

```
Ruta: Contabilidad > Centros de Coste

Crear:
- CC001: Alquiler Residencial
- CC002: STR/Airbnb
- CC003: House Flipping
- CC004: Construcción
- CC005: Servicios Profesionales

Beneficio:
- P&L separado por vertical
- ROI individual
- Identificar vertical más rentable
```

### 2. Equipos Especializados

```
Ejemplo empresa multi-vertical:

Equipo A: Alquiler Tradicional
- 2 gestores
- 1 operador
- Edificios: 15
- Unidades: 200

Equipo B: STR
- 1 gestor especializado
- 1 operador limpieza
- Propiedades: 40

Equipo C: Flipping
- 1 project manager
- Red subcontratistas
- Proyectos: 8 simultáneos

Cada equipo ve solo su vertical en INMOVA
```

### 3. Reportes Consolidados

```
Ruta: BI > Reportes > Multi-Vertical

Dashboard CEO:

┌─────────────────────────────────┐
│ INGRESOS POR VERTICAL (Nov 2024)│
├─────────────────────────────────┤
│ Residencial:   €125,000 (42%)   │
│ STR:           €85,000  (28%)   │
│ Flipping:      €60,000  (20%)   │
│ Construcción:  €30,000  (10%)   │
├─────────────────────────────────┤
│ TOTAL:         €300,000         │
│                                 │
│ MARGEN EBITDA POR VERTICAL      │
│ Residencial:   72%              │
│ STR:           58%              │
│ Flipping:      35%              │
│ Construcción:  12%              │
└─────────────────────────────────┘

Insight: Priorizar crecimiento STR
```

---

## ✅ CHECKLIST FINAL

Verifica que has completado:

**Alquiler Residencial**:
- [ ] Edificio creado
- [ ] Unidad creada
- [ ] Inquilino registrado
- [ ] Contrato activo
- [ ] Pagos configurados

**STR**:
- [ ] Módulos activados
- [ ] Propiedad con amenities
- [ ] Fotos profesionales (10+)
- [ ] Anuncio publicado 3 portales
- [ ] Pricing dinámico activo

**House Flipping**:
- [ ] Proyecto creado
- [ ] Fases definidas
- [ ] Sistema gastos operativo
- [ ] Dashboard monitoreado

**Construcción**:
- [ ] Proyecto obra creado
- [ ] 9 fases configuradas
- [ ] Subcontratistas registrados
- [ ] Sistema inspecciones activo

**Servicios Profesionales**:
- [ ] Proyecto creado
- [ ] Entregables definidos
- [ ] Estructura documental
- [ ] Facturación por hitos

---

## 🆘 SOPORTE

¿Dudas configurando tu multi-vertical?

📧 Email: soporte@inmova.com  
💬 Chat: Dentro de INMOVA (icono inferior derecha)  
📞 Teléfono: +34 900 123 456 (Plan Empresarial+)  
📚 Docs: [docs.inmova.com/multi-vertical](https://docs.inmova.com)  

---

**🎉 ¡Felicidades!** Ahora dominas los 7 modelos de negocio de INMOVA.

**Próximo paso**: Explora automatizaciones IA para maximizar eficiencia.

---

**Documento elaborado por**: INMOVA Training Team  
**Versión**: 1.0  
**Fecha**: 29 Noviembre 2025  
**Última actualización**: 29 Noviembre 2025

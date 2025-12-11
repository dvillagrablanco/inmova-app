# Guía de Migración de Datos - Grupo Vidaro Inversiones

## 📋 Estructura Creada

Se ha creado exitosamente la siguiente estructura en el sistema INMOVA:

### 🏢 Jerarquía de Empresas
```
Grupo Vidaro Inversiones (Matriz)
├── Rovida
└── Viroda Inversiones
```

### 👥 Usuarios Creados

| Empresa | Email | Rol | Función |
|---------|-------|-----|---------|
| Grupo Vidaro Inversiones | admin@grupovidaro.com | Administrador | Gestión completa del grupo |
| Grupo Vidaro Inversiones | director.financiero@grupovidaro.com | Director Financiero | Supervisión financiera y reportes |
| Rovida | admin@rovida.com | Administrador | Gestión completa de Rovida |
| Rovida | operador@rovida.com | Operador | Operaciones diarias |
| Viroda Inversiones | admin@virodainversiones.com | Administrador | Gestión completa de Viroda |
| Viroda Inversiones | propietario@virodainversiones.com | Propietario | Consulta y seguimiento |

**Contraseña temporal para todos los usuarios:** `vidaro2025`

⚠️ **IMPORTANTE:** Se recomienda cambiar las contraseñas en el primer acceso.

---

## 📊 Información Requerida para la Migración

### 1️⃣ EDIFICIOS / PROPIEDADES

#### Información Básica
- **Nombre del edificio** (obligatorio)
- **Tipo de propiedad**: Residencial, Comercial, Mixto, Edificio completo, Local comercial, Nave industrial, Oficina, Almacén
- **Dirección completa** (obligatorio)
  - Calle y número
  - Código postal
  - Ciudad
  - País
- **Coordenadas GPS** (opcional pero recomendado)

#### Características
- **Año de construcción**
- **Número total de plantas**
- **Superficie total construida (m²)**
- **Estado de conservación**: Excelente, Bueno, Regular, Necesita reforma, En reforma
- **Ascensor**: Sí/No
- **Garaje/Parking**: Sí/No
- **Trastero**: Sí/No
- **Jardín/Zona común**: Sí/No
- **Piscina**: Sí/No

#### Documentación
- **IBI (Impuesto de Bienes Inmuebles)** - monto anual
- **Referencia catastral**
- **Gastos de comunidad** (si aplica)
- **Certificado energético** (si existe)

**Formato recomendado:** CSV con las siguientes columnas:
```
nombre,tipo,direccion,codigoPostal,ciudad,pais,anoConst</s>truccion,plantas,superficie,estadoConservacion,ascensor,garage,trastero,jardin,piscina,ibi,referenciaCatastral
```

---

### 2️⃣ UNIDADES / ESPACIOS

#### Información Básica
- **Número/Identificador de la unidad** (obligatorio - ej: 1A, Local 3, Oficina 205)
- **Edificio al que pertenece** (obligatorio)
- **Tipo de unidad**: Piso, Ático, Bajo, Dúplex, Estudio, Local, Oficina, Parking, Trastero, Habitación
- **Estado**: Disponible, Ocupada, En reforma, Reservada

#### Características
- **Superficie útil (m²)** (obligatorio)
- **Número de habitaciones**
- **Número de baños**
- **Orientación**: Norte, Sur, Este, Oeste, Noreste, Noroeste, Sureste, Suroeste
- **Planta**
- **Con balcón/terraza**: Sí/No
- **Amueblado**: Sí/No/Parcialmente

#### Económico
- **Renta mensual objetivo (€)** (obligatorio si está en alquiler)
- **Valor estimado de la propiedad (€)**
- **IBI específico** (si está individualizado)

**Formato recomendado:** CSV con las siguientes columnas:
```
edificioNombre,numero,tipo,estado,superficie,habitaciones,banos,orientacion,planta,balcon,amueblado,rentaMensual,valorEstimado
```

---

### 3️⃣ INQUILINOS / TENANTES

#### Datos Personales
- **Nombre completo** (obligatorio)
- **DNI/NIE/Pasaporte** (obligatorio)
- **Fecha de nacimiento**
- **Nacionalidad**

#### Contacto
- **Email** (obligatorio)
- **Teléfono móvil** (obligatorio)
- **Teléfono alternativo** (opcional)

#### Dirección
- **Dirección actual** (obligatorio)

#### Información Financiera
- **Ocupación/Profesión**
- **Ingresos mensuales netos**
- **Empresa donde trabaja**

#### Documentación Disponible
- ¿Tiene contrato de trabajo?
- ¿Tiene nóminas de los últimos 3 meses?
- ¿Tiene declaración de la renta?
- ¿Tiene aval bancario?

**Formato recomendado:** CSV con las siguientes columnas:
```
nombre,apellidos,dni,fechaNacimiento,nacionalidad,email,telefono,telefonoAlt,direccion,ocupacion,ingresosMensuales,empresa,contratoTrabajo,nominas,declaracion,aval
```

---

### 4️⃣ CONTRATOS DE ALQUILER

#### Información Básica
- **Unidad/Espacio** (obligatorio - número o identificador)
- **Inquilino** (obligatorio - DNI o email)
- **Fecha de inicio** (obligatorio)
- **Fecha de fin** (obligatorio)
- **Tipo de contrato**: Vivienda habitual, Temporal, Vacacional, Comercial, Trastero, Parking

#### Condiciones Económicas
- **Renta mensual (€)** (obligatorio)
- **Día de pago del mes** (ej: 1, 5, 10)
- **Depósito/Fianza (€)**
- **Incremento anual (%)** - IPC u otro

#### Servicios Incluidos
- **¿Gastos de comunidad incluidos?**: Sí/No
- **¿Agua incluida?**: Sí/No
- **¿Gas incluido?**: Sí/No
- **¿Electricidad incluida?**: Sí/No
- **¿Internet incluido?**: Sí/No

#### Estado
- **Estado actual**: Activo, Finalizado, Cancelado, Pendiente de firma

**Formato recomendado:** CSV con las siguientes columnas:
```
unidadNumero,inquilinoEmail,fechaInicio,fechaFin,tipoContrato,rentaMensual,diaPago,deposito,incrementoAnual,gastosIncluidos,aguaIncluida,gasIncluido,electricidadIncluida,internetIncluido,estado
```

---

### 5️⃣ PAGOS / HISTORIAL FINANCIERO

#### Información de Pago
- **Contrato asociado** (obligatorio - unidad + inquilino)
- **Mes y año del pago** (obligatorio - ej: 2024-01)
- **Monto total (€)** (obligatorio)
- **Monto de renta (€)**
- **Monto de gastos adicionales (€)** (si aplica)

#### Estado
- **Estado del pago**: Pendiente, Pagado, Vencido, Parcialmente pagado
- **Fecha de vencimiento**
- **Fecha de pago real** (si ya se pagó)
- **Método de pago**: Transferencia, Efectivo, Domiciliación, Tarjeta, Otro

#### Observaciones
- **Notas** (opcional - ej: "Pago retrasado por problemas bancarios")

**Formato recomendado:** CSV con las siguientes columnas:
```
contratoUnidad,contratoInquilino,mesPago,monto,montoRenta,montogastosAdicionales,estado,fechaVencimiento,fechaPago,metodoPago,notas
```

---

### 6️⃣ PROVEEDORES / SERVICIOS

#### Información Básica
- **Nombre de la empresa** (obligatorio)
- **CIF/NIF** (obligatorio)
- **Tipo de servicio**: Fontanería, Electricidad, Limpieza, Jardinería, Mantenimiento, Cerrajería, Pintura, Climatización, Otro

#### Contacto
- **Persona de contacto**
- **Email** (obligatorio)
- **Teléfono** (obligatorio)

#### Financiero
- **Tarifa por hora (€)** (si aplica)
- **Valoración** (1-5 estrellas - opcional)

**Formato recomendado:** CSV con las siguientes columnas:
```
nombreEmpresa,cif,tipoServicio,personaContacto,email,telefono,tarifaHora,valoracion
```

---

### 7️⃣ GASTOS / FACTURAS (Opcional pero recomendado)

#### Información Básica
- **Edificio asociado** (obligatorio)
- **Categoría**: IBI, Comunidad, Mantenimiento, Seguro, Reparación, Suministro (agua, luz, gas), Administrativo, Legal, Otro
- **Descripción** (obligatorio)

#### Económico
- **Monto (€)** (obligatorio)
- **Fecha del gasto** (obligatorio)
- **Proveedor** (opcional)

#### Comprobante
- **Número de factura** (opcional)
- **¿Está pagado?**: Sí/No

**Formato recomendado:** CSV con las siguientes columnas:
```
edificioNombre,categoria,descripcion,monto,fechaGasto,proveedor,numeroFactura,pagado
```

---

### 8️⃣ DOCUMENTOS IMPORTANTES (Opcional)

Si tienen documentación digitalizada, es útil proporcionarla:

- **Contratos de alquiler** (PDF)
- **Escrituras de propiedad** (PDF)
- **Certificados energéticos** (PDF)
- **Pólizas de seguro** (PDF)
- **Facturas de IBI** (PDF)
- **Licencias de actividad** (PDF - para locales comerciales)

**Formato:** Archivos organizados en carpetas:
```
Documentos/
├── Edificio_1/
│   ├── Contratos/
│   ├── Escrituras/
│   └── Facturas/
├── Edificio_2/
│   └── ...
```

---

## 🔄 Proceso de Importación

### Paso 1: Preparación de Datos
1. Solicitar a la empresa los datos en los formatos CSV indicados
2. Revisar que todos los campos obligatorios estén completos
3. Validar que las fechas estén en formato correcto (YYYY-MM-DD)
4. Verificar que los emails sean válidos
5. Confirmar que los números de teléfono incluyan prefijo (+34 para España)

### Paso 2: Validación
1. Cargar los archivos CSV en el sistema usando la página de importación (`/admin/importar`)
2. El sistema validará automáticamente:
   - Formato de campos
   - Campos obligatorios
   - Duplicados
   - Relaciones entre entidades (ej: que el edificio exista antes de crear unidades)
3. Revisar los mensajes de **errores** y **advertencias**
4. Corregir los datos según sea necesario

### Paso 3: Vista Previa
- El sistema mostrará una vista previa de cómo se importarán los datos
- Revisar que todo esté correcto antes de confirmar

### Paso 4: Importación
- Confirmar la importación
- El sistema procesará los datos y mostrará un resumen con:
  - Registros importados exitosamente
  - Registros con errores
  - Detalle de errores específicos

### Paso 5: Verificación Post-Importación
1. Revisar que todos los edificios, unidades, inquilinos y contratos se hayan importado correctamente
2. Verificar las relaciones entre entidades
3. Confirmar que los montos y fechas sean correctos
4. Realizar ajustes manuales si es necesario

---

## 📞 Soporte

Si tienen dudas durante el proceso de preparación o migración de datos:

- **Email:** support@inmova.com
- **Teléfono:** [Por definir]
- **Portal de soporte:** [URL de soporte]

---

## ✅ Checklist de Migración

### Pre-Migración
- [ ] Inventario completo de propiedades
- [ ] Lista de inquilinos activos
- [ ] Contratos vigentes recopilados
- [ ] Historial de pagos de los últimos 12 meses
- [ ] Lista de proveedores habituales
- [ ] Facturas y gastos del año en curso

### Durante la Migración
- [ ] Archivos CSV preparados según plantillas
- [ ] Validación inicial completada
- [ ] Corrección de errores realizada
- [ ] Vista previa revisada
- [ ] Importación ejecutada

### Post-Migración
- [ ] Verificación de datos importados
- [ ] Pruebas con usuarios finales
- [ ] Documentación compartida con el equipo
- [ ] Capacitación a usuarios clave
- [ ] Ajustes finales realizados

---

## 📄 Plantillas de Importación

### Descargar Plantillas CSV

El sistema proporciona plantillas CSV predefinidas con el formato correcto. Para descargarlas:

1. Acceder a `/admin/importar` con el usuario Super Administrador
2. Seleccionar el tipo de datos a importar (Edificios, Unidades, Inquilinos, etc.)
3. Click en "Descargar Plantilla CSV"
4. Llenar la plantilla con los datos de la empresa
5. Guardar y subir al sistema

---

## 🎯 Recomendaciones

1. **Empezar por lo básico:** Importar primero edificios, luego unidades, luego inquilinos, y finalmente contratos
2. **Hacer pruebas pequeñas:** Importar un edificio completo antes de importar todo
3. **Mantener copias de seguridad:** Guardar los archivos CSV originales
4. **Documentar particularidades:** Si hay algo especial en la gestión de alguna propiedad, anotarlo
5. **Validar números:** Verificar que los montos de renta, depósitos, etc. sean correctos
6. **Fechas coherentes:** Asegurar que las fechas de contratos y pagos sean lógicas

---

## 📈 Próximos Pasos

Una vez completada la migración de datos:

1. **Configuración de módulos adicionales** según las necesidades de cada empresa
2. **Personalización de informes** y dashboards
3. **Capacitación completa** a los usuarios
4. **Establecimiento de flujos de trabajo** para operaciones diarias
5. **Configuración de notificaciones y alertas** automáticas

---

**Fecha de creación de la estructura:** 1 de diciembre de 2025  
**Versión del documento:** 1.0  
**Sistema:** INMOVA - Plataforma de Gestión Inmobiliaria

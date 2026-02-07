# Guía Completa de Migración a INMOVA

## Índice
1. [Introducción](#introducción)
2. [Sistemas Soportados](#sistemas-soportados)
3. [Proceso de Migración](#proceso-de-migración)
4. [Preparación de Datos](#preparación-de-datos)
5. [Mapeo de Campos por Sistema](#mapeo-de-campos-por-sistema)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Solución de Problemas](#solución-de-problemas)

---

## Introducción

INMOVA ofrece un sistema de migración completo y automatizado que facilita la transición desde otros sistemas de gestión inmobiliaria. Esta guía te ayudará a migrar tus datos de forma segura y eficiente.

### Características Principales

- **Validación previa**: Detecta errores antes de importar
- **Vista previa**: Revisa cómo se interpretarán tus datos
- **Mapeo automático**: Reconoce campos de diferentes sistemas
- **Detección de duplicados**: Evita importar datos ya existentes
- **Informes detallados**: Conoce el resultado de cada importación

---

## Sistemas Soportados

### 1. Homming

**Descripción**: Sistema de gestión inmobiliaria español

**Entidades soportadas**:
- Edificios
- Unidades
- Inquilinos
- Contratos
- Pagos

**Exportación desde Homming**:
1. Accede a Homming
2. Ve a Configuración > Exportar datos
3. Selecciona el tipo de datos (edificios, unidades, etc.)
4. Descarga el archivo CSV

### 2. Rentger

**Descripción**: Software de administración de fincas

**Entidades soportadas**:
- Edificios (inmuebles)
- Unidades (viviendas)
- Inquilinos (arrendatarios)

**Exportación desde Rentger**:
1. Menú principal > Herramientas
2. Selecciona "Exportar a CSV"
3. Elige los campos a exportar
4. Guarda el archivo

### 3. Nester

**Descripción**: Plataforma de gestión de alquileres

**Entidades soportadas**:
- Propiedades
- Apartamentos
- Residentes

**Exportación desde Nester**:
1. Dashboard > Settings
2. Data Export > CSV Export
3. Select data type
4. Download file

### 4. Buildium

**Descripción**: Property management software (USA)

**Entidades soportadas**:
- Properties
- Units
- Tenants
- Leases

**Exportación desde Buildium**:
1. Reports > Custom Reports
2. Select entity type
3. Export as CSV
4. Save file

### 5. AppFolio

**Descripción**: Cloud-based property management

**Entidades soportadas**:
- Properties
- Units
- Tenants

**Exportación desde AppFolio**:
1. Reports > Export Data
2. Choose data type
3. Select CSV format
4. Download

### 6. CSV Genérico

**Descripción**: Formato CSV estándar para cualquier sistema

**Características**:
- Usa cabeceras descriptivas en español o inglés
- Detecta automáticamente los campos más comunes
- Ideal para sistemas no listados arriba

---

## Proceso de Migración

### Paso 1: Preparación

1. **Limpia tus datos de origen**
   - Elimina registros duplicados
   - Corrige datos inconsistentes
   - Completa campos obligatorios

2. **Haz una copia de seguridad**
   - Guarda una copia de tus datos actuales
   - Documenta cualquier configuración especial

3. **Planifica el orden de importación**
   - Primero: Edificios
   - Segundo: Unidades
   - Tercero: Inquilinos
   - Cuarto: Contratos
   - Quinto: Pagos

### Paso 2: Exportación desde Sistema Origen

1. Accede a tu sistema actual
2. Exporta cada tipo de entidad a CSV
3. Verifica que los archivos contengan todos los datos
4. Guárdalos en una carpeta organizada

### Paso 3: Importación en INMOVA

#### 3.1. Acceder al Módulo de Importación
1. Inicia sesión en INMOVA
2. Ve a **Administración > Importar Datos**

#### 3.2. Seleccionar Sistema de Origen

1. Elige el sistema desde el que estás migrando
2. Esto activará el mapeo automático de campos

#### 3.3. Seleccionar Tipo de Datos

1. Elige qué tipo de datos vas a importar
2. Descarga la plantilla si necesitas ver el formato esperado

#### 3.4. Subir Archivo

1. Haz clic en el área de carga
2. Selecciona tu archivo CSV
3. El sistema lo validará automáticamente

#### 3.5. Validación

1. Revisa los errores detectados (si los hay)
2. Corrige el archivo CSV si es necesario
3. Vuelve a subir el archivo

#### 3.6. Vista Previa

1. Revisa cómo se interpretarán tus datos
2. Verifica que los campos estén mapeados correctamente
3. Si todo es correcto, continúa con la importación

#### 3.7. Importación

1. Confirma la importación
2. Espera mientras se procesan los datos
3. Revisa el informe de resultados

#### 3.8. Verificación

1. Revisa los datos importados
2. Verifica que todo esté correcto
3. Corrige manualmente cualquier inconsistencia

---

## Preparación de Datos

### Formato de Archivo

- **Formato**: CSV (valores separados por comas)
- **Codificación**: UTF-8
- **Primera fila**: Debe contener las cabeceras
- **Separador**: Coma (,)
- **Delimitador de texto**: Comillas dobles (")

### Campos Obligatorios por Entidad

#### Edificios

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|----------|
| nombre | Texto | Sí | "Edificio Centro" |
| direccion | Texto | Sí | "Calle Mayor 123" |
| ciudad | Texto | No | "Madrid" |
| codigoPostal | Texto | No | "28001" |
| numeroUnidades | Número | No | 24 |

#### Unidades

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|----------|
| numero | Texto | Sí | "3º B" |
| edificio | Texto | No* | "Edificio Centro" |
| tipo | Texto | No | "vivienda" |
| superficie | Número | No | 85.5 |
| rentaMensual | Número | No | 950.00 |

*Si no se proporciona el edificio, debe especificarse en la importación

#### Inquilinos

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|----------|
| nombre | Texto | Sí | "Juan" |
| apellidos | Texto | No | "Pérez García" |
| email | Email | No | "juan@email.com" |
| telefono | Texto | No | "612345678" |
| dni | Texto | No | "12345678A" |

#### Contratos

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|----------|
| fechaInicio | Fecha | Sí | "2024-01-01" |
| fechaFin | Fecha | No | "2025-01-01" |
| rentaMensual | Número | Sí | 950.00 |
| deposito | Número | No | 1900.00 |

#### Pagos

| Campo | Tipo | Obligatorio | Ejemplo |
|-------|------|-------------|----------|
| fechaVencimiento | Fecha | Sí | "2024-01-05" |
| monto | Número | Sí | 950.00 |
| estado | Texto | No | "pagado" |
| concepto | Texto | No | "Alquiler Enero 2024" |

### Formatos de Fecha

Se aceptan los siguientes formatos:
- ISO 8601: `2024-01-15`
- Europeo: `15/01/2024`
- Americano: `01/15/2024`
- Con hora: `2024-01-15 14:30:00`

### Estados Válidos

#### Unidades
- `disponible` / `available` / `vacant`
- `ocupada` / `occupied` / `rented`
- `mantenimiento` / `maintenance`

#### Contratos
- `activo` / `active` / `vigente`
- `finalizado` / `ended` / `expired`
- `cancelado` / `cancelled`

#### Pagos
- `pagado` / `paid` / `completed`
- `pendiente` / `pending` / `unpaid`
- `vencido` / `overdue` / `late`

---

## Mapeo de Campos por Sistema

### Homming

#### Edificios
```
Homming          →  INMOVA
----------------------------
nombre           →  nombre
direccion        →  direccion
ciudad           →  ciudad
codigo_postal    →  codigoPostal
num_unidades     →  numeroUnidades
ano_construccion →  anosConstruccion
```

#### Unidades
```
Homming          →  INMOVA
----------------------------
numero           →  numero
edificio         →  edificio
tipo             →  tipo
superficie       →  superficie
habitaciones     →  habitaciones
baños            →  banos
renta            →  rentaMensual
estado           →  estado
```

### Rentger

#### Edificios
```
Rentger          →  INMOVA
----------------------------
denominacion     →  nombre
direccion_fiscal →  direccion
poblacion        →  ciudad
cp               →  codigoPostal
numero_viviendas →  numeroUnidades
```

#### Unidades
```
Rentger          →  INMOVA
----------------------------
referencia       →  numero
tipologia        →  tipo
metros_cuadrados →  superficie
alquiler_mensual →  rentaMensual
```

### Buildium

#### Properties
```
Buildium         →  INMOVA
----------------------------
PropertyName     →  nombre
StreetAddress    →  direccion
City             →  ciudad
PostalCode       →  codigoPostal
NumberOfUnits    →  numeroUnidades
```

#### Units
```
Buildium         →  INMOVA
----------------------------
UnitNumber       →  numero
PropertyType     →  tipo
SquareFeet       →  superficie
MarketRent       →  rentaMensual
```

### CSV Genérico

El sistema reconoce automáticamente las siguientes variaciones:

**Para nombre de edificio**:
- nombre, name, edificio, building, inmueble, property

**Para dirección**:
- direccion, address, calle, street

**Para superficie**:
- superficie, area, m2, sqm, size, metros_cuadrados

**Para renta**:
- renta, rent, precio, price, alquiler, monthly_rent

---

## Mejores Prácticas

### 1. Migración Gradual

- **No migres todo a la vez**: Empieza con un pequeño conjunto de datos
- **Verifica cada etapa**: Confirma que los datos se importaron correctamente antes de continuar
- **Mantiene el sistema antiguo**: No elimines tus datos originales hasta confirmar que todo funciona

### 2. Validación de Datos

- **Revisa la vista previa**: Siempre revisa cómo se interpretarán tus datos
- **Corrige errores antes de importar**: Es más fácil corregir en el CSV que después
- **Verifica los campos críticos**: Nombres, emails, direcciones

### 3. Nomenclatura Consistente

- **Usa nombres únicos**: Evita tener dos edificios con el mismo nombre
- **Formato de fechas uniforme**: Usa el mismo formato en todo el archivo
- **Capitaliza correctamente**: "Juan Pérez" es mejor que "JUAN PEREZ"

### 4. Documentación

- **Documenta el proceso**: Anota cualquier decisión o ajuste que hagas
- **Guarda versiones**: Mantén copias de los archivos CSV originales y modificados
- **Registra fechas**: Cuándo se hizo cada importación

### 5. Pruebas

- **Usa una cuenta de prueba**: Si es posible, prueba primero en un entorno de pruebas
- **Importa pocos registros primero**: 5-10 registros para verificar el proceso
- **Verifica relaciones**: Asegúrate de que las unidades estén vinculadas a sus edificios

---

## Solución de Problemas

### Error: "Nombre y dirección son obligatorios"

**Causa**: Faltan campos obligatorios en el archivo CSV

**Solución**:
1. Abre el archivo CSV
2. Verifica que todas las filas tengan valores en las columnas obligatorias
3. Completa los campos vacíos
4. Guarda y vuelve a importar

### Error: "Edificio ya existe"

**Causa**: Intentas importar un edificio que ya existe en el sistema

**Solución**:
1. Verifica si el edificio realmente existe
2. Si es un duplicado, elímina la fila del CSV
3. Si es un edificio diferente, cambia el nombre para diferenciarlo

### Error: "No se pudo determinar el edificio para esta unidad"

**Causa**: La unidad no tiene asociado un edificio válido

**Solución**:
1. Añade una columna "edificio" en el CSV con el nombre exacto del edificio
2. O especifica el edificio al momento de importar las unidades

### Error: "El email no es válido"

**Causa**: El formato del email es incorrecto

**Solución**:
1. Verifica que todos los emails tengan el formato: usuario@dominio.com
2. Elimina espacios en blanco
3. Corrige emails malformados

### Error: "La superficie debe ser un número"

**Causa**: El campo contiene texto en lugar de un número

**Solución**:
1. Elimina cualquier texto (ej: "85 m2" → "85")
2. Usa punto (.) como separador decimal, no coma (,)
3. Ejemplo correcto: 85.5

### Advertencia: "Inquilino con email ya existe"

**Causa**: Ya existe un inquilino con ese email en el sistema

**Solución**:
1. Verifica si es realmente un duplicado
2. Si es el mismo inquilino, omite la importación (se saltará automáticamente)
3. Si es una persona diferente, usa un email diferente

### Los datos se ven mal en la vista previa

**Causa**: El mapeo automático no reconoció correctamente los campos

**Solución**:
1. Cambia a "CSV Genérico" en lugar del sistema específico
2. O renombra las cabeceras del CSV para que coincidan con los nombres esperados
3. Descarga la plantilla para ver los nombres exactos

---

## Soporte y Contacto

Si tienes problemas durante la migración:

1. **Consulta esta guía**: La mayoría de problemas comunes están documentados aquí
2. **Descarga la plantilla**: Te mostrará el formato exacto esperado
3. **Usa CSV Genérico**: Si tu sistema no está listado, esta opción es muy flexible
4. **Contacta con soporte**: Envía un email con tu archivo CSV de ejemplo

---

## Checklist de Migración

### Antes de Empezar

- [ ] He hecho una copia de seguridad de mis datos actuales
- [ ] He limpiado y verificado mis datos
- [ ] He descargado las plantillas de INMOVA
- [ ] He leído esta guía completamente

### Durante la Migración
- [ ] He exportado los datos de mi sistema actual
- [ ] He verificado que los archivos CSV estén completos
- [ ] He seleccionado el sistema de origen correcto
- [ ] He revisado la vista previa antes de importar
- [ ] He corregido todos los errores de validación

### Después de la Migración
- [ ] He verificado que todos los datos se importaron correctamente
- [ ] He corregido manualmente cualquier inconsistencia
- [ ] He probado las funcionalidades principales
- [ ] He documentado el proceso para futuras referencias
- [ ] He guardado copias de los archivos CSV utilizados

---

## Ejemplos de Archivos CSV

### Ejemplo 1: Edificios (CSV Genérico)

```csv
nombre,direccion,ciudad,codigoPostal,numeroUnidades
"Edificio Centro","Calle Mayor 123","Madrid","28001",24
"Residencial Sol","Avenida del Sol 45","Barcelona","08001",36
"Torre Vista","Plaza Nueva 7","Valencia","46001",12
```

### Ejemplo 2: Unidades (Homming)

```csv
numero,edificio,tipo,superficie,habitaciones,baños,renta,estado
"1º A","Edificio Centro","vivienda",85.5,3,2,950,disponible
"1º B","Edificio Centro","vivienda",75.0,2,1,850,ocupada
"2º A","Edificio Centro","vivienda",90.0,3,2,1050,disponible
```

### Ejemplo 3: Inquilinos (CSV Genérico)

```csv
nombre,apellidos,email,telefono,dni
"Juan","Pérez García","juan.perez@email.com","612345678","12345678A"
"María","López Martínez","maria.lopez@email.com","623456789","23456789B"
"Carlos","González Sánchez","carlos.gonzalez@email.com","634567890","34567890C"
```

---

© 2024 INMOVA - Sistema de Gestión Inmobiliaria

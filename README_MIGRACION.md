# Migración a INMOVA - Guía Rápida

## 🚀 Inicio Rápido

### 1. Accede al Módulo de Importación
```
INMOVA > Administración > Importar Datos
```

### 2. Selecciona tu Sistema de Origen

- **Homming** - Sistema español de gestión inmobiliaria
- **Rentger** - Administración de fincas
- **Nester** - Gestión de alquileres
- **Buildium** - Property management (USA)
- **AppFolio** - Cloud property management
- **CSV Genérico** - Para cualquier otro sistema

### 3. Elige el Tipo de Datos

- Edificios
- Unidades
- Inquilinos
- Contratos
- Pagos

### 4. Descarga la Plantilla (Opcional)

Haz clic en "Descargar Plantilla CSV" para ver el formato exacto esperado.

### 5. Sube tu Archivo

Arrasta y suelta o haz clic para seleccionar tu archivo CSV.

### 6. Valida y Revisa

El sistema validará tu archivo y te mostrará una vista previa.

### 7. Importa

Si todo es correcto, procede con la importación.

---

## 📝 Orden Recomendado de Importación

1. **Edificios** (primero)
2. **Unidades** (segundo)
3. **Inquilinos** (tercero)
4. **Contratos** (cuarto)
5. **Pagos** (quinto)

---

## ⚠️ Campos Obligatorios

### Edificios
- ✅ Nombre
- ✅ Dirección

### Unidades
- ✅ Número

### Inquilinos
- ✅ Nombre o Apellidos

### Contratos
- ✅ Fecha de inicio
- ✅ Renta mensual

### Pagos
- ✅ Fecha de vencimiento
- ✅ Monto

---

## 📊 Formato de Archivo

```
Formato: CSV (valores separados por comas)
Codificación: UTF-8
Primera fila: Cabeceras
Separador: Coma (,)
```

### Ejemplo:

```csv
nombre,direccion,ciudad,codigoPostal
"Edificio Centro","Calle Mayor 123","Madrid","28001"
"Residencial Sol","Avenida del Sol 45","Barcelona","08001"
```

---

## 🔧 Solución Rápida de Problemas

### ❌ Error: "Campos obligatorios faltantes"
**Solución**: Completa los campos obligatorios en tu CSV

### ❌ Error: "Edificio ya existe"
**Solución**: Elimina duplicados o cambia el nombre

### ❌ Error: "Email inválido"
**Solución**: Usa formato: usuario@dominio.com

### ❌ Error: "La superficie debe ser un número"
**Solución**: Usa solo números (ej: 85.5, no "85 m2")

---

## 📚 Documentación Completa

Para una guía detallada, consulta:

```
GUIA_MIGRACION_SISTEMAS.md
```

---

## ✅ Mejores Prácticas

1. **Haz una copia de seguridad** de tus datos actuales
2. **Empieza con pocos registros** (5-10) para probar
3. **Verifica la vista previa** antes de importar
4. **Importa en el orden recomendado** (edificios primero)
5. **Revisa los resultados** después de cada importación

---

## 🎓 Soporte

Si necesitas ayuda:

1. Consulta la [Guía Completa](GUIA_MIGRACION_SISTEMAS.md)
2. Descarga las plantillas CSV
3. Contacta con soporte

---

© 2024 INMOVA - Sistema de Gestión Inmobiliaria

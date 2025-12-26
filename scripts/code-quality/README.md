# Scripts de Control de Calidad de Código

Este directorio contiene scripts automáticos para mantener la calidad del código en el proyecto INMOVA.

## 📁 Scripts Disponibles

### 1. `lint-and-fix.sh` - Control de Calidad Completo

Ejecuta una verificación completa de calidad de código:
- ✨ Formateo automático con Prettier
- 🔍 Linting con ESLint (con auto-fix)
- 📘 Verificación de tipos TypeScript
- 🗑️ Detección de código no utilizado
- 🔒 Verificación de vulnerabilidades en dependencias

**Uso:**
```bash
./scripts/code-quality/lint-and-fix.sh
```

**Cuándo usar:**
- Antes de hacer commit
- Después de hacer merge de branches
- Semanalmente como mantenimiento

---

### 2. `pre-commit-check.sh` - Verificación Pre-Commit

Verifica la calidad de los archivos antes de hacer commit:
- Solo verifica archivos staged
- Rápido y eficiente
- Se integra con husky

**Uso:**
```bash
./scripts/code-quality/pre-commit-check.sh
```

**Integración con Git:**
Agregar a `.husky/pre-commit`:
```bash
#!/bin/sh
./scripts/code-quality/pre-commit-check.sh
```

---

### 3. `auto-fix-jsx.ts` - Corrección Automática de JSX

Corrige automáticamente problemas comunes de estructura JSX:
- 🔧 Indentación incorrecta
- 📦 Cierres de tags faltantes
- 🎯 Componentes sin Fragment cuando es necesario
- 🧹 Divs extras

**Uso:**
```bash
tsx scripts/code-quality/auto-fix-jsx.ts

# O para archivos específicos:
tsx scripts/code-quality/auto-fix-jsx.ts "app/admin/**/*.tsx"
```

**Cuándo usar:**
- Después de merge conflicts
- Cuando hay muchos errores de sintaxis JSX
- Como parte del proceso de refactoring

---

### 4. `watch-quality.sh` - Monitoreo Continuo

Vigila cambios en el código y ejecuta verificaciones automáticamente:
- 👁️ Monitoreo en tiempo real
- 🔄 Auto-formateo al guardar
- 🚨 Alertas inmediatas de problemas

**Uso:**
```bash
./scripts/code-quality/watch-quality.sh
```

**Cuándo usar:**
- Durante el desarrollo activo
- En sesiones largas de coding
- Para equipos que quieren garantizar calidad constante

---

## 🔄 Workflow Recomendado

### Desarrollo Diario

```bash
# 1. Al comenzar el día
./scripts/code-quality/lint-and-fix.sh

# 2. Durante el desarrollo (en terminal separado)
./scripts/code-quality/watch-quality.sh

# 3. Antes de hacer commit (automático si está configurado con husky)
# Se ejecuta automáticamente: pre-commit-check.sh
```

### Antes de Deployment

```bash
# 1. Control de calidad completo
./scripts/code-quality/lint-and-fix.sh

# 2. Corregir problemas de JSX si los hay
tsx scripts/code-quality/auto-fix-jsx.ts

# 3. Verificar build
yarn build

# 4. Ejecutar tests
yarn test:ci
```

### Mantenimiento Semanal

```bash
# 1. Limpiar código
./scripts/code-quality/lint-and-fix.sh

# 2. Actualizar dependencias
yarn upgrade-interactive --latest

# 3. Verificar vulnerabilidades
yarn audit fix

# 4. Ejecutar tests completos
yarn test:all
```

---

## ⚙️ Configuración

### Requisitos

- Node.js 18+
- Yarn 1.22+
- Git
- tsx (para scripts TypeScript)

### Instalación

```bash
# Dar permisos de ejecución a los scripts
chmod +x scripts/code-quality/*.sh

# Instalar dependencias necesarias
yarn add -D tsx @types/node

# (Opcional) Instalar fswatch para watch-quality
# macOS: brew install fswatch
# Linux: apt-get install fswatch
```

### Integración con Package.json

Agregar estos scripts a `package.json`:

```json
{
  "scripts": {
    "quality:check": "./scripts/code-quality/lint-and-fix.sh",
    "quality:fix-jsx": "tsx scripts/code-quality/auto-fix-jsx.ts",
    "quality:watch": "./scripts/code-quality/watch-quality.sh",
    "quality:pre-commit": "./scripts/code-quality/pre-commit-check.sh"
  }
}
```

### Integración con Husky

```bash
# Instalar husky si no está instalado
yarn add -D husky
npx husky init

# Configurar pre-commit hook
echo '#!/bin/sh
./scripts/code-quality/pre-commit-check.sh' > .husky/pre-commit

chmod +x .husky/pre-commit
```

---

## 📊 Métricas y Reportes

Los scripts generan reportes en:
- 📋 Consola (output detallado)
- 📁 `logs/code-quality/` (si existe)

---

## 🐛 Troubleshooting

### "Permission denied"
```bash
chmod +x scripts/code-quality/*.sh
```

### "tsx: command not found"
```bash
yarn add -D tsx
```

### "fswatch: command not found"
El script `watch-quality.sh` funcionará con polling si fswatch no está disponible.

---

## 🤝 Contribuir

Para agregar nuevos scripts de calidad:

1. Crear el script en `scripts/code-quality/`
2. Dar permisos de ejecución
3. Documentar en este README
4. Agregar comando en `package.json`

---

## 📝 Notas

- Todos los scripts son no-destructivos (no eliminan código sin avisar)
- Los scripts hacen backup automático cuando modifican archivos
- Compatible con CI/CD (todos devuelven exit codes apropiados)

---

**Última actualización:** Diciembre 2024  
**Mantenedor:** Equipo INMOVA Dev

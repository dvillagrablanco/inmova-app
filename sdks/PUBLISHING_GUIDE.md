# 📦 SDK Publishing Guide

## Pre-requisitos

### npm (JavaScript SDK & CLI)

```bash
# Login to npm
npm login

# Verificar login
npm whoami
```

### PyPI (Python SDK)

```bash
# Install tools
pip install build twine

# Configurar credenciales en ~/.pypirc
[pypi]
username = __token__
password = pypi-your-api-token-here
```

### Packagist (PHP SDK)

1. Crear cuenta en https://packagist.org/
2. Conectar repositorio GitHub
3. Submit package: https://packagist.org/packages/submit

## Proceso de Publicación

### 1. JavaScript SDK (@inmova/sdk)

```bash
cd sdks/javascript

# Opción A: Script automatizado
./publish.sh

# Opción B: Manual
npm version patch  # o minor/major
npm install
npm run build
npm publish --access public
```

**Verificación**:

```bash
npm view @inmova/sdk
npm install @inmova/sdk
```

### 2. Python SDK (inmova)

```bash
cd sdks/python

# Opción A: Script automatizado
./publish.sh

# Opción B: Manual
# 1. Actualizar version en setup.py
nano setup.py

# 2. Build
python -m build

# 3. Check
twine check dist/*

# 4. Upload
twine upload dist/*
```

**Verificación**:

```bash
pip show inmova
pip install inmova
```

### 3. PHP SDK (inmova/sdk)

**Publicación en Packagist** (una sola vez):

1. Crear repositorio GitHub: `inmova/sdk-php`
2. Push código:

   ```bash
   cd sdks/php
   git init
   git remote add origin https://github.com/inmova/sdk-php.git
   git add .
   git commit -m "feat: Initial release"
   git push -u origin main
   ```

3. Submit en Packagist:
   - https://packagist.org/packages/submit
   - URL: `https://github.com/inmova/sdk-php`
   - Enable auto-update hook

**Nuevas versiones**:

```bash
# Actualizar version en composer.json
nano composer.json

# Commit y tag
git add .
git commit -m "chore: Bump version to 1.0.1"
git tag v1.0.1
git push && git push --tags

# Packagist auto-actualiza desde GitHub releases
```

**Verificación**:

```bash
composer show inmova/sdk
composer require inmova/sdk
```

### 4. CLI Tool (@inmova/cli)

```bash
cd sdks/cli

# Opción A: Script automatizado
./publish.sh

# Opción B: Manual
npm version patch
npm install
npm run build
chmod +x bin/inmova
npm publish --access public
```

**Verificación**:

```bash
npm install -g @inmova/cli
inmova --version
```

## Publicación Completa (Todos los SDKs)

```bash
cd sdks

# Ejecutar script maestro
./publish-all.sh
```

Este script:

1. ✅ Verifica autenticación npm
2. ✅ Publica JavaScript SDK
3. ✅ Publica Python SDK
4. ✅ Publica CLI Tool
5. ⚠️ Muestra instrucciones para PHP (manual)

## Versionado Semántico

Seguir [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): Nuevas features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

**Ejemplos**:

```bash
# Bug fix
npm version patch  # 1.0.0 → 1.0.1

# Nueva feature
npm version minor  # 1.0.0 → 1.1.0

# Breaking change
npm version major  # 1.0.0 → 2.0.0
```

## Checklist Pre-Publicación

- [ ] Tests pasan (`npm test`, `pytest`, `composer test`)
- [ ] README actualizado
- [ ] CHANGELOG actualizado
- [ ] Version bumped correctamente
- [ ] Build exitoso sin errores
- [ ] Documentación actualizada

## Checklist Post-Publicación

- [ ] Verificar package en registry (npm/PyPI/Packagist)
- [ ] Test instalación limpia
- [ ] Actualizar docs en https://inmovaapp.com/api-docs
- [ ] Anunciar en:
  - [ ] Twitter/X
  - [ ] LinkedIn
  - [ ] Newsletter developers
  - [ ] GitHub Releases

## URLs de Registries

- **npm**: https://www.npmjs.com/package/@inmova/sdk
- **PyPI**: https://pypi.org/project/inmova/
- **Packagist**: https://packagist.org/packages/inmova/sdk
- **GitHub**: https://github.com/inmova/sdks

## Troubleshooting

### Error: "You do not have permission to publish"

**Solución**:

```bash
# Verificar que el scope @inmova existe en npm
npm org add inmova-dev inmova

# O usar scope diferente en package.json
"name": "@tu-org/inmova-sdk"
```

### Error: "Version already exists"

**Solución**:

```bash
# Bump version antes de publicar
npm version patch
```

### Error: PyPI "Invalid credentials"

**Solución**:

```bash
# Configurar API token en ~/.pypirc
[pypi]
username = __token__
password = pypi-...
```

### PHP: "Package not found"

**Solución**:

1. Verificar que el repositorio es público
2. Verificar que packagist.org tiene el webhook configurado
3. Trigger manual update en packagist.org

## Automatización con GitHub Actions

**TODO**: Configurar CI/CD para publicación automática en tag push.

```yaml
# .github/workflows/publish.yml
name: Publish SDKs
on:
  push:
    tags:
      - 'v*'
jobs:
  publish-npm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Soporte

- **Dudas**: developers@inmova.app
- **Issues**: https://github.com/inmova/sdks/issues

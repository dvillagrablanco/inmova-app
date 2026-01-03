# ⚡ Guía de Deployment - Integración Zapier de Inmova

**Fecha**: 3 de enero de 2026  
**Versión**: 1.0  
**Repositorio**: `/workspace/integrations/zapier/`

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Requisitos previos](#requisitos-previos)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Setup local](#setup-local)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Publicación](#publicación)
8. [Mantenimiento](#mantenimiento)

---

## 📖 Introducción

La integración de Zapier permite a los usuarios de Inmova conectar su cuenta con miles de aplicaciones sin escribir código.

### Estado actual

✅ **Código completo**: 100% implementado  
⚠️ **Pendiente**: Deployment a Zapier marketplace

### Features implementadas

**Triggers** (3):
- `property_created` - Disparado al crear propiedad
- `contract_signed` - Disparado al firmar contrato
- `payment_received` - Disparado al recibir pago

**Actions** (4):
- `create_property` - Crear propiedad desde Zapier
- `update_property` - Actualizar propiedad
- `create_tenant` - Crear inquilino
- `create_contract` - Crear contrato

**Searches** (1):
- `find_property` - Buscar propiedad por dirección o ID

---

## 🔧 Requisitos previos

### 1. Cuenta de Zapier

Crear cuenta en https://zapier.com/ (plan Developer o superior)

### 2. Zapier CLI

```bash
npm install -g zapier-platform-cli
```

### 3. Autenticación

```bash
zapier login
```

### 4. Node.js

Versión requerida: Node.js 18+

```bash
node --version  # Debe ser >= 18.0.0
```

---

## 📁 Estructura del proyecto

```
integrations/zapier/
├── package.json              # Dependencias y metadata
├── index.js                  # Configuración principal
├── authentication.js         # Setup de API Key auth
├── triggers/
│   ├── property_created.js   # Trigger: Nueva propiedad
│   ├── contract_signed.js    # Trigger: Contrato firmado
│   └── payment_received.js   # Trigger: Pago recibido
├── actions/
│   ├── create_property.js    # Action: Crear propiedad
│   ├── update_property.js    # Action: Actualizar propiedad
│   ├── create_tenant.js      # Action: Crear inquilino
│   └── create_contract.js    # Action: Crear contrato
├── searches/
│   └── find_property.js      # Search: Buscar propiedad
└── test/
    ├── triggers.test.js      # Tests de triggers
    ├── actions.test.js       # Tests de actions
    └── searches.test.js      # Tests de searches
```

---

## ⚙️ Setup local

### 1. Navegar al directorio

```bash
cd /workspace/integrations/zapier/
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env`:

```env
# API de prueba
API_KEY=sk_live_YOUR_TEST_API_KEY
BASE_URL=https://inmovaapp.com/api/v1

# Webhooks (para testing de triggers)
WEBHOOK_URL=https://your-test-server.com/webhooks/zapier
```

### 4. Verificar configuración

```bash
zapier validate
```

**Salida esperada**:

```
✔ Validation passed!
```

---

## 🧪 Testing

### 1. Test locales

```bash
npm test
```

**Salida esperada**:

```
PASS  test/triggers.test.js
  property_created
    ✓ should trigger when property is created (89ms)
  contract_signed
    ✓ should trigger when contract is signed (76ms)
  payment_received
    ✓ should trigger when payment is received (81ms)

PASS  test/actions.test.js
  create_property
    ✓ should create property successfully (102ms)
  update_property
    ✓ should update property successfully (87ms)

PASS  test/searches.test.js
  find_property
    ✓ should find property by ID (65ms)

Test Suites: 3 passed, 3 total
Tests:       6 passed, 6 total
```

### 2. Test de autenticación

```bash
zapier test --auth
```

### 3. Test de trigger específico

```bash
zapier test --trigger property_created
```

### 4. Test de action específica

```bash
zapier test --action create_property
```

---

## 🚀 Deployment

### 1. Registrar app en Zapier

Primera vez:

```bash
zapier register "Inmova"
```

**Salida**:

```
Registering app...
✔ App 'Inmova' registered successfully!

App ID: app_12345
App Key: inmova
```

Guarda el App ID y App Key.

### 2. Actualizar metadata

Editar `package.json`:

```json
{
  "name": "inmova",
  "version": "1.0.0",
  "description": "Gestión inmobiliaria para propietarios y gestores",
  "homepage": "https://inmovaapp.com",
  "author": "Inmova Team <support@inmovaapp.com>",
  "license": "MIT",
  "keywords": ["inmova", "real estate", "property", "rental"],
  "zapierAppId": "app_12345",
  "zapierAppKey": "inmova"
}
```

### 3. Push a Zapier

```bash
zapier push
```

**Salida**:

```
Pushing app...
✔ Build validated
✔ Deploying to Zapier
✔ Version 1.0.0 deployed

App URL: https://zapier.com/apps/inmova/integrations
```

### 4. Verificar deployment

```bash
zapier versions
```

**Salida**:

```
┌─────────┬────────────┬─────────────────┬───────────┐
│ Version │ Status     │ Created         │ Used By   │
├─────────┼────────────┼─────────────────┼───────────┤
│ 1.0.0   │ deployed   │ 2026-01-03      │ 0 users   │
└─────────┴────────────┴─────────────────┴───────────┘
```

---

## 📢 Publicación

### 1. Preparar assets

Crear carpeta `assets/` con:

```
assets/
├── icon.png          # 256x256px, PNG con transparencia
├── logo.svg          # Logo en SVG
├── screenshot-1.png  # Captura de un Zap funcionando
├── screenshot-2.png  # Captura de configuración
└── screenshot-3.png  # Captura de resultados
```

**Requisitos de imágenes**:
- Icon: 256x256px, PNG, fondo transparente
- Screenshots: Máx 1920x1080px, PNG o JPG

### 2. Completar información de la app

En el dashboard de Zapier (https://developer.zapier.com/):

**Información básica**:
- **Name**: Inmova
- **Description**: Gestiona propiedades, inquilinos, contratos y pagos desde Zapier
- **Category**: Business Tools
- **Website**: https://inmovaapp.com
- **Support URL**: https://inmovaapp.com/support

**Long Description**:

```markdown
Inmova es una plataforma de gestión inmobiliaria que te permite administrar propiedades, inquilinos, contratos y pagos de forma centralizada.

Con esta integración puedes:
- ✅ Crear propiedades automáticamente desde formularios
- ✅ Recibir notificaciones cuando se firman contratos
- ✅ Sincronizar pagos con tu contabilidad
- ✅ Automatizar onboarding de inquilinos

Casos de uso populares:
- Crear propiedad cuando se completa formulario de Google Forms
- Enviar email de bienvenida cuando se firma contrato
- Registrar pagos en Google Sheets
- Crear tareas en Trello cuando hay nueva incidencia
```

**Pricing**: Gratis (los usuarios de Inmova usan su suscripción)

### 3. Configurar autenticación

Ya implementada en `authentication.js`:

```
Auth Type: API Key
Header: Authorization
Format: Bearer {api_key}
Test URL: /api/v1/sandbox
```

### 4. Enviar para revisión

```bash
zapier promote 1.0.0
```

Dashboard → **Request Public Access**

Completar checklist:
- [x] Al menos 3 triggers O 3 actions
- [x] Tests pasando
- [x] Autenticación funcionando
- [x] Icon y screenshots subidos
- [x] Descripción completa
- [x] 5 usuarios testers (mínimo)

**Timeline de revisión**: 7-14 días

---

## 🔄 Mantenimiento

### Actualizar versión

```bash
# 1. Actualizar código
# 2. Incrementar versión en package.json
npm version patch  # 1.0.0 → 1.0.1

# 3. Push nueva versión
zapier push

# 4. Promover a producción
zapier promote 1.0.1
```

### Deprecar versión antigua

```bash
zapier deprecate 1.0.0 2026-06-01
```

### Ver logs de producción

```bash
zapier logs --version 1.0.0 --limit 100
```

### Ver analytics

```bash
zapier analytics
```

---

## 🧪 Testing con usuarios reales

### 1. Crear link de invitación

Dashboard → **Invite Link** → Copy URL

```
https://zapier.com/developer/public-invite/12345/abc123def456/
```

### 2. Compartir con beta testers

Enviar link a 5-10 usuarios de Inmova para testing.

### 3. Recopilar feedback

Crear formulario:

```
- ¿Qué trigger/action usaste?
- ¿Funcionó correctamente?
- ¿Encontraste algún bug?
- ¿Qué otras integraciones te gustaría ver?
```

---

## 📊 Monitoreo

### Métricas clave

```bash
zapier analytics --from 2026-01-01 --to 2026-01-31
```

**Métricas importantes**:
- **Active users**: Usuarios con Zaps activos
- **Zap runs**: Ejecuciones totales
- **Error rate**: % de ejecuciones fallidas
- **Most popular**: Triggers/actions más usados

### Alertas

Configurar en Dashboard:

```
Error rate > 5% → Email a support@inmovaapp.com
Daily runs < 100 → Revisar engagement
New user → Enviar email de bienvenida
```

---

## 🐛 Troubleshooting

### Error: "Invalid API key"

**Causa**: Usuario no configuró API key correctamente.

**Solución**: Actualizar mensaje de ayuda en `authentication.js`:

```javascript
{
  test: async (z, bundle) => {
    const response = await z.request({
      url: 'https://inmovaapp.com/api/v1/sandbox',
    });
    return response.data;
  },
  helpText: 'Obtén tu API Key en: https://inmovaapp.com/dashboard/settings/api-keys'
}
```

---

### Error: "Trigger not firing"

**Causa**: Webhook no configurado o inactivo.

**Solución**: Verificar en `/api/v1/webhooks` que el webhook de Zapier está activo.

---

### Error: "Action failed: validation error"

**Causa**: Campos requeridos faltantes.

**Solución**: Actualizar `inputFields` en el action:

```javascript
{
  key: 'address',
  label: 'Dirección',
  type: 'string',
  required: true,
  helpText: 'Dirección completa de la propiedad'
}
```

---

## 📚 Recursos

### Documentación oficial

- **Zapier CLI**: https://github.com/zapier/zapier-platform/tree/main/packages/cli
- **Zapier Platform**: https://platform.zapier.com/docs/intro
- **Best practices**: https://platform.zapier.com/docs/best-practices

### Comunidad

- **Zapier Developers**: https://community.zapier.com/developers-7
- **Slack**: https://zapier-platform.slack.com/

### Soporte Inmova

- **Email**: zapier@inmovaapp.com
- **Discord**: https://discord.gg/inmova
- **Docs**: https://inmovaapp.com/docs/zapier

---

## ✅ Checklist de deployment

### Pre-deployment

- [ ] Código completo y testeado
- [ ] Variables de entorno configuradas
- [ ] Tests locales pasando
- [ ] Validación sin errores
- [ ] Icon y screenshots preparados
- [ ] Descripción escrita

### Deployment

- [ ] App registrada en Zapier
- [ ] Primera versión pusheada
- [ ] Autenticación funcionando
- [ ] Triggers testeados
- [ ] Actions testeadas
- [ ] Searches testeadas

### Post-deployment

- [ ] Beta testers invitados (mínimo 5)
- [ ] Feedback recopilado
- [ ] Bugs corregidos
- [ ] Enviado para revisión pública
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

---

## 🎯 Próximos pasos

### Fase 1: Beta (0-50 usuarios)

1. Deployment privado
2. Testing con 10-20 usuarios early adopters
3. Iterar en base a feedback
4. Corregir bugs críticos

### Fase 2: Público (50-500 usuarios)

1. Request public access
2. Aprobación de Zapier (7-14 días)
3. Publicación en marketplace
4. Promoción en comunidad

### Fase 3: Growth (500+ usuarios)

1. Agregar más triggers/actions según demanda
2. Optimizar performance
3. Mejorar documentación
4. Crear templates populares

---

**Estimación de tiempo total**: 4-6 horas

1. Setup y testing local: 1 hora
2. First deployment: 1 hora
3. Beta testing: 1-2 horas
4. Preparar assets y docs: 1 hora
5. Revisión de Zapier: 7-14 días (automático)

---

**Última actualización**: 3 de enero de 2026  
**Versión**: 1.0.0  
**Próxima revisión**: Cuando se complete el deployment

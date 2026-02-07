# 🤖 CONFIGURACIÓN CLAUDE IA - INMOVA APP

## 📋 ¿QUÉ ES CLAUDE?

Claude es un modelo de lenguaje de IA desarrollado por Anthropic, conocido por:
- **Razonamiento avanzado**: Capaz de análisis complejos
- **Context window de 200K tokens**: Puede procesar documentos largos
- **Seguridad**: Entrenado con Constitutional AI
- **Multilingüe**: Excelente en español

**Claude 3.5 Sonnet** (el modelo que usamos):
- Lanzado: Octubre 2024
- Performance: Superior a GPT-4 en muchos benchmarks
- Costo: Competitivo (~30% más barato que GPT-4)

**En Inmova lo usamos para**:
- ✅ Valoración automática de propiedades
- ✅ Chatbot inteligente 24/7
- ✅ Generación de descripciones atractivas
- ✅ Matching inquilino-propiedad (futuro)
- ✅ Análisis de documentos (futuro)

---

## 💰 COSTOS

### Pricing Claude 3.5 Sonnet

```
Input (tokens procesados):
• €0.003 por 1,000 tokens
• ≈ 750 palabras = 1,000 tokens

Output (tokens generados):
• €0.015 por 1,000 tokens
• ≈ 750 palabras = 1,000 tokens
```

### Proyección de Costos (100 usuarios)

#### Valoración de Propiedades

```
Escenario: 100 valoraciones/mes

Por valoración:
• Input: ~1,500 tokens (datos propiedad + prompt)
• Output: ~500 tokens (valoración + análisis)
• Costo: (1.5 × €0.003) + (0.5 × €0.015) = €0.012/valoración

100 valoraciones/mes:
• €0.012 × 100 = €1.20/mes
• Anual: €14.40/año
```

#### Chatbot

```
Escenario: 500 mensajes/mes

Por mensaje:
• Input: ~200 tokens (mensaje usuario + contexto)
• Output: ~150 tokens (respuesta chatbot)
• Costo: (0.2 × €0.003) + (0.15 × €0.015) = €0.003/mensaje

500 mensajes/mes:
• €0.003 × 500 = €1.50/mes
• Anual: €18/año
```

#### Generación de Descripciones

```
Escenario: 200 descripciones/mes

Por descripción:
• Input: ~300 tokens (datos propiedad)
• Output: ~200 tokens (descripción)
• Costo: (0.3 × €0.003) + (0.2 × €0.015) = €0.004/descripción

200 descripciones/mes:
• €0.004 × 200 = €0.80/mes
• Anual: €9.60/año
```

### TOTAL Estimado

```
100 usuarios activos:

Valoraciones: €1.20/mes
Chatbot: €1.50/mes
Descripciones: €0.80/mes

TOTAL: €3.50/mes = €42/año

Escenario conservador (con buffer): €10/mes = €120/año

ROI:
• Sin IA: Valoraciones manuales (€50-100/valoración)
• Con IA: Valoraciones automáticas (€0.012/valoración)
• Ahorro: 99.98%
```

---

## 🚀 PASO 1: CREAR CUENTA ANTHROPIC

### 1.1. Registro

1. **Ir a**: https://console.anthropic.com
2. **Click**: "Sign up"
3. **Completar formulario**:
   ```
   Email: admin@inmovaapp.com
   Nombre: Inmova App
   Empresa: Inmova
   ```
4. **Verificar email**: Click en link de confirmación

### 1.2. Créditos Iniciales

Anthropic ofrece:
- **$5 gratis** al registrarse
- ≈ 167,000 tokens input o 33,000 tokens output
- Suficiente para ~400 valoraciones de prueba

---

## 🔑 PASO 2: OBTENER API KEY

### 2.1. Console de Anthropic

1. **Login**: https://console.anthropic.com
2. **Ir a**: Settings → API Keys
3. **Click**: "Create Key"

### 2.2. Generar API Key

1. **Name**: `Inmova Production`
2. **Click**: "Create Key"
3. **Copiar key**: Comienza con `sk-ant-api...`
4. **Guardar** en lugar seguro (solo se muestra una vez)

```
Ejemplo:
sk-ant-api03_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: La API key NO se puede recuperar después. Si la pierdes, debes crear una nueva.

---

## ⚙️ PASO 3: CONFIGURAR EN INMOVA APP

### 3.1. Variables de Entorno

Añadir al `.env.production` (servidor):

```env
# Anthropic Claude Configuration
ANTHROPIC_API_KEY=sk-ant-api03_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Para desarrollo (`.env.local`):

```env
# Anthropic Claude Configuration
ANTHROPIC_API_KEY=sk-ant-api03_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **NUNCA** commitear esta credencial a Git

### 3.2. Configurar en Servidor (SSH)

```bash
ssh root@157.180.119.236

# Editar .env.production
cd /opt/inmova-app
nano .env.production

# Añadir variable Claude:
ANTHROPIC_API_KEY=sk-ant-api03_tu_api_key_aqui

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Reiniciar PM2
pm2 restart inmova-app --update-env

# Verificar que cargó
pm2 env inmova-app | grep ANTHROPIC
```

---

## 🧪 PASO 4: TESTING

### Test 1: Verificar Configuración

```typescript
// test-claude.ts
import { ClaudeAIService } from '@/lib/claude-ai-service';

async function test() {
  const configured = ClaudeAIService.isConfigured();
  console.log('Claude AI Configured:', configured);
  
  if (!configured) {
    console.error('ANTHROPIC_API_KEY not set');
    return;
  }
  
  console.log('✅ Claude AI ready to use');
}

test();
```

### Test 2: Valoración de Propiedad

```bash
# Via API
curl -X POST https://inmovaapp.com/api/ai/valuate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Calle Mayor 123",
    "postalCode": "28013",
    "city": "Madrid",
    "squareMeters": 80,
    "rooms": 3,
    "bathrooms": 2,
    "hasElevator": true,
    "hasParking": false,
    "condition": "GOOD"
  }'

# Response esperado:
{
  "success": true,
  "valuation": {
    "estimatedValue": 280000,
    "minValue": 260000,
    "maxValue": 300000,
    "confidenceScore": 75,
    "reasoning": "Propiedad bien ubicada en Madrid centro...",
    "keyFactors": [
      "Ubicación céntrica",
      "Buenas comunicaciones",
      "Estado conservado"
    ],
    "recommendations": [
      "Renovar cocina para aumentar valor en 10-15%",
      "Añadir aire acondicionado"
    ]
  }
}
```

### Test 3: Chatbot

```bash
# Via API
curl -X POST https://inmovaapp.com/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo creo un contrato de alquiler?"
  }'

# Response esperado:
{
  "success": true,
  "response": "Para crear un contrato de alquiler en Inmova:\n\n1. Ve a Dashboard → Contratos → Nuevo Contrato\n2. Selecciona la propiedad y el inquilino\n3. Rellena los datos del contrato (precio, fianza, duración)\n4. Revisa y envía para firma digital\n\n¿Necesitas ayuda con algún paso específico? 📄"
}
```

### Test 4: Generación de Descripción

```typescript
// En código
import { ClaudeAIService } from '@/lib/claude-ai-service';

const description = await ClaudeAIService.generatePropertyDescription({
  address: 'Calle Mayor 123',
  city: 'Madrid',
  squareMeters: 80,
  rooms: 3,
  bathrooms: 2,
  hasElevator: true,
  hasParking: false,
}, 'professional');

console.log(description);

// Output esperado:
// "Descubre este luminoso piso de 80m² en pleno corazón de Madrid..."
```

---

## 🔐 SEGURIDAD

### Mejores Prácticas

1. **✅ Rotación de API Keys**
   ```bash
   # Cada 90 días, generar nueva API key
   # Console → API Keys → Create new → Copiar → Actualizar .env → Delete old key
   ```

2. **✅ Límites de uso**
   - Configurar alertas en Anthropic Console
   - Budget mensual: €20/mes (conservador)
   - Alert cuando alcance €15

3. **✅ Rate limiting**
   - Implementado en código (max 10 requests/min por usuario)
   - Evita abusos y costos excesivos

4. **✅ Logs de uso**
   - Todas las llamadas se registran en `auditLog`
   - Trackear costos por usuario/empresa

5. **✅ Validación de input**
   - Validar con Zod antes de enviar a Claude
   - Limitar longitud de mensajes (max 1000 caracteres)

---

## 📊 CASOS DE USO

### Caso 1: Valoración Automática

```typescript
// En formulario de nueva propiedad
import { ClaudeAIService } from '@/lib/claude-ai-service';

async function onSubmit(data: PropertyFormData) {
  // 1. Guardar propiedad
  const property = await createProperty(data);
  
  // 2. Valoración automática
  const valuation = await ClaudeAIService.valuateProperty({
    address: data.address,
    city: data.city,
    squareMeters: data.squareMeters,
    rooms: data.rooms,
    bathrooms: data.bathrooms,
    condition: data.condition,
  });
  
  // 3. Sugerir precio
  toast.success(`Valor estimado: ${valuation.estimatedValue}€`);
  form.setValue('price', valuation.estimatedValue);
}
```

### Caso 2: Chatbot Integrado

```typescript
// Componente de chatbot
'use client';

import { useState } from 'react';
import { ClaudeAIService } from '@/lib/claude-ai-service';

export function AIChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  const sendMessage = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    
    // Llamar a API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        conversationHistory: messages,
      }),
    });
    
    const data = await response.json();
    const aiMessage = { role: 'assistant', content: data.response };
    setMessages([...messages, userMessage, aiMessage]);
    setInput('');
  };
  
  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}
```

### Caso 3: Descripciones Automáticas

```typescript
// Botón "Generar Descripción con IA"
async function generateDescription() {
  setLoading(true);
  
  const description = await ClaudeAIService.generatePropertyDescription({
    address: property.address,
    city: property.city,
    squareMeters: property.squareMeters,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    hasParking: property.hasParking,
    hasGarden: property.hasGarden,
  }, 'professional');
  
  form.setValue('description', description);
  setLoading(false);
  toast.success('Descripción generada con IA');
}
```

---

## 🚨 TROUBLESHOOTING

### Error: "ANTHROPIC_API_KEY not configured"

**Causa**: Variable de entorno no está configurada

**Solución**:
```bash
# Verificar variable
echo $ANTHROPIC_API_KEY

# Si está vacía, configurar en .env.production
# Luego restart PM2
pm2 restart inmova-app --update-env
```

### Error: "Invalid API key"

**Causa**: API key incorrecta o expirada

**Solución**:
1. Console Anthropic → API Keys
2. Verificar que la key sea correcta
3. Generar nueva si es necesaria
4. Actualizar `.env.production`

### Error: "Rate limit exceeded"

**Causa**: Demasiadas requests en poco tiempo

**Solución**:
```
Límites de Anthropic:
• Tier 1 (default): 50 requests/min, 50,000 tokens/min
• Tier 2: 1,000 requests/min, 100,000 tokens/min
• Tier 3: 2,000 requests/min, 200,000 tokens/min

Para aumentar tier: contact support@anthropic.com
```

### Error: "Context length exceeded"

**Causa**: Input + output > 200K tokens

**Solución**:
- Reducir conversación history en chatbot
- Limitar datos de comparables en valoración
- Usar resúmenes en lugar de texto completo

### Respuestas lentas

**Causa**: Tokens output alto

**Solución**:
- Reducir `max_tokens` en requests
- Usar prompts más específicos
- Cachear respuestas frecuentes

---

## 📈 MONITORING Y MÉTRICAS

### Ver Uso en Console

1. **Console Anthropic** → Usage
2. **Métricas disponibles**:
   - Requests por día
   - Tokens procesados
   - Costo acumulado
   - Errores

### Alertas de Costos

1. **Console** → Settings → Billing
2. **Set budget**: €20/mes (conservador)
3. **Email alert** cuando alcance €15 (75%)

### Métricas a Trackear

```typescript
// Crear tabla de métricas en BD
model AIUsageLog {
  id        String   @id @default(cuid())
  userId    String
  feature   String   // 'valuation', 'chat', 'description'
  
  inputTokens  Int
  outputTokens Int
  cost         Float  // En €
  
  latency   Int      // Milisegundos
  status    String   // 'success', 'error'
  
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([feature])
  @@index([createdAt])
}
```

---

## 💡 MEJORES PRÁCTICAS

### 1. Prompts Claros y Específicos

```typescript
// ❌ MAL
"Dame el valor de esta casa"

// ✅ BIEN
"Actúa como tasador certificado con 20 años de experiencia.
Analiza esta propiedad y proporciona valoración detallada con:
- Valor estimado
- Rango (mín-máx)
- Nivel de confianza
- Factores clave
- Recomendaciones"
```

### 2. Temperatura Apropiada

```typescript
// Valoraciones (precisión)
temperature: 0.3

// Chatbot (balance)
temperature: 0.7

// Descripciones (creatividad)
temperature: 0.8
```

### 3. Cachear Respuestas Comunes

```typescript
// Preguntas frecuentes en chatbot
const FAQ_CACHE = {
  '¿Cómo crear contrato?': 'Para crear un contrato...',
  '¿Cómo añadir inquilino?': 'Para añadir inquilino...',
};

// Verificar cache antes de llamar a IA
if (FAQ_CACHE[normalizedQuestion]) {
  return FAQ_CACHE[normalizedQuestion];
}
```

### 4. Validación de Output

```typescript
// Siempre validar respuestas de IA
const valuation = await ClaudeAIService.valuateProperty(data);

// Validar rangos razonables
if (valuation.estimatedValue < 10000 || valuation.estimatedValue > 10000000) {
  throw new Error('Valoración fuera de rango esperado');
}

// Validar confidence
if (valuation.confidenceScore < 30) {
  toast.warning('Valoración con baja confianza. Verificar datos.');
}
```

---

## 🎯 RESUMEN

### Checklist Configuración

- [ ] Cuenta Anthropic creada
- [ ] API Key generada
- [ ] Variable en `.env.production` configurada
- [ ] PM2 reiniciado con `--update-env`
- [ ] Test de valoración exitoso
- [ ] Test de chatbot exitoso
- [ ] Test de descripción exitoso
- [ ] Budget configurado (€20/mes)
- [ ] Alertas activadas

### Variables Requeridas

```env
ANTHROPIC_API_KEY=sk-ant-api03_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Costo Estimado

```
100 usuarios activos:
• Valoraciones: €1.20/mes
• Chatbot: €1.50/mes
• Descripciones: €0.80/mes

TOTAL: €3.50/mes = €42/año

Buffer conservador: €10/mes = €120/año

ROI: 99.98% de ahorro vs valoraciones manuales
```

---

## 📞 SOPORTE

Si tienes problemas:

1. **Verificar logs**: `pm2 logs inmova-app | grep Claude`
2. **Test configuración**: `ClaudeAIService.isConfigured()`
3. **Console Anthropic**: Ver uso y errores
4. **Soporte Anthropic**: support@anthropic.com

---

**Última actualización**: 4 de enero de 2026  
**Status**: ✅ Documentación completa  
**Prioridad**: 🔴 ALTA (diferenciador competitivo clave)

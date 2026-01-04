# 🤖 Configuración de Anthropic Claude - Inmova App

## Objetivo

Integrar Anthropic Claude para funcionalidades de IA como:
- Valoración automática de propiedades
- Análisis de documentos
- Chatbot inteligente de soporte
- Resúmenes automáticos de contratos
- Clasificación de incidencias

---

## 📋 Pasos de Configuración

### 1. Obtener API Key de Anthropic

1. **Crear cuenta en Anthropic Console**:
   - Ir a: https://console.anthropic.com/
   - Registrarse con email corporativo
   - Verificar email

2. **Generar API Key**:
   - Ir a: https://console.anthropic.com/settings/keys
   - Click en "Create Key"
   - Nombre sugerido: "Inmova Production"
   - Copiar la key (formato: `sk-ant-api03-...`)
   - **⚠️ IMPORTANTE**: Guardarla de inmediato, no se puede recuperar

3. **Configurar límites de gasto** (recomendado):
   - Settings → Billing
   - "Usage Limits" → Set monthly limit: $100
   - Esto previene gastos inesperados

### 2. Configurar en Producción

**En el servidor de producción:**

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Añadir a .env.production
nano .env.production

# Agregar estas líneas:
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_MAX_TOKENS=4096
```

**Reiniciar PM2:**

```bash
pm2 restart inmova-app --update-env
pm2 logs inmova-app --lines 50
```

### 3. Verificar Configuración

**Test desde la terminal:**

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Hello, Claude! Test connection."}
    ]
  }'
```

**Respuesta esperada:**

```json
{
  "id": "msg_xxxxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! I'm Claude. The connection is working perfectly. How can I help you today?"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 25
  }
}
```

### 4. Test desde la Aplicación

**Crear endpoint de test:**

```typescript
// app/api/ai/test/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY no configurada' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Test: Responde solo "OK" si la conexión funciona.',
        },
      ],
    });

    const response = message.content[0];
    const text = response.type === 'text' ? response.text : '';

    return NextResponse.json({
      success: true,
      model: message.model,
      response: text,
      usage: message.usage,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
```

**Probar:**

```bash
curl https://inmovaapp.com/api/ai/test
# O desde navegador
```

**Respuesta esperada:**

```json
{
  "success": true,
  "model": "claude-3-5-sonnet-20241022",
  "response": "OK",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 2
  }
}
```

---

## 💰 Costos y Límites

### Precios de Claude 3.5 Sonnet (Actual)

| Concepto | Precio |
|----------|--------|
| Input (1M tokens) | $3.00 |
| Output (1M tokens) | $15.00 |

### Estimación de Costos Mensuales

**Uso moderado** (100 usuarios activos):
- 1,000 requests/día
- Promedio 500 tokens input + 200 tokens output por request
- **Coste diario**: ~$15
- **Coste mensual**: ~$450

**Uso ligero** (50 usuarios):
- 500 requests/día
- **Coste mensual**: ~$225

**Recomendación**: Empezar con límite de $100/mes y ajustar según uso real.

### Rate Limits

- **Tier 1** (nuevo): 50,000 tokens/min
- **Tier 2**: 100,000 tokens/min
- **Tier 3**: 200,000 tokens/min

Para pasar de tier, contactar soporte de Anthropic con uso histórico.

---

## 🎯 Funcionalidades a Implementar

### 1. Valoración de Propiedades

```typescript
// lib/ai/property-valuation.ts
import Anthropic from '@anthropic-ai/sdk';

export async function valorarPropiedad(property: PropertyData) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `Actúa como tasador inmobiliario certificado.

Valora esta propiedad:
- Ubicación: ${property.address}, ${property.city}
- Superficie: ${property.squareMeters}m²
- Habitaciones: ${property.rooms}
- Baños: ${property.bathrooms}
- Estado: ${property.condition}

Datos del mercado:
- Precio medio por m² en zona: ${property.avgPricePerM2}€

Proporciona JSON:
{
  "estimatedValue": number,
  "minValue": number,
  "maxValue": number,
  "confidenceScore": number (0-100),
  "reasoning": "string explicando valoración"
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const response = message.content[0];
  const text = response.type === 'text' ? response.text : '';
  
  return JSON.parse(text);
}
```

### 2. Chatbot de Soporte

```typescript
// app/api/ai/chat/route.ts
import { StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = await anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente experto en gestión inmobiliaria PropTech.',
      },
      ...messages,
    ],
  });

  return new StreamingTextResponse(stream.toReadableStream());
}
```

### 3. Análisis de Documentos

```typescript
// lib/ai/document-analysis.ts
export async function analizarContrato(contractText: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `Analiza este contrato de arrendamiento:

${contractText}

Extrae:
{
  "clauses": ["cláusula 1", "cláusula 2"],
  "rent": number,
  "deposit": number,
  "duration": "string",
  "startDate": "YYYY-MM-DD",
  "risks": ["riesgo 1", "riesgo 2"],
  "recommendations": ["recomendación 1"]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const response = message.content[0];
  const text = response.type === 'text' ? response.text : '';
  
  return JSON.parse(text);
}
```

---

## 🔐 Seguridad

### Best Practices

1. **NUNCA** exponer la API key en el frontend
2. **SIEMPRE** validar inputs antes de enviar a Claude
3. **IMPLEMENTAR** rate limiting por usuario
4. **USAR** prompts system para guiar comportamiento
5. **MONITOREAR** uso y costos diariamente
6. **SANITIZAR** respuestas antes de mostrar a usuarios

### Rate Limiting por Usuario

```typescript
// lib/ai/rate-limiter.ts
import { rateLimit } from '@/lib/rate-limiting';

export async function checkAIRateLimit(userId: string) {
  // Límite: 10 requests AI por hora por usuario
  const key = `ai:${userId}`;
  const limit = 10;
  const window = 60 * 60; // 1 hora

  // Implementar con Redis o similar
  // ...
}
```

---

## 📊 Monitoreo

### Métricas a Trackear

1. **Requests por día**
2. **Tokens consumidos** (input/output)
3. **Coste diario**
4. **Latencia promedio**
5. **Errores (rate limit, API errors)**

### Dashboard de Uso

Crear en `/dashboard/admin/ia-usage`:
- Gráfico de requests/día
- Coste acumulado mensual
- Top usuarios consumidores
- Alertas si se supera budget

---

## ✅ Checklist de Implementación

- [ ] Crear cuenta Anthropic
- [ ] Generar API Key
- [ ] Configurar límite de gasto ($100/mes inicial)
- [ ] Añadir ANTHROPIC_API_KEY a .env.production
- [ ] Reiniciar PM2 con `--update-env`
- [ ] Crear endpoint /api/ai/test
- [ ] Verificar test exitoso
- [ ] Implementar funcionalidad de valoración
- [ ] Implementar chatbot de soporte
- [ ] Configurar rate limiting
- [ ] Crear dashboard de monitoreo
- [ ] Documentar uso para equipo

---

## 📞 Soporte

**Documentación oficial:**
- https://docs.anthropic.com/

**Console:**
- https://console.anthropic.com/

**Status page:**
- https://status.anthropic.com/

**Soporte técnico:**
- support@anthropic.com

---

## 🆚 Alternativas (si budget es limitado)

1. **OpenAI GPT-3.5-Turbo**: Más barato pero menos capaz
2. **Google Gemini Pro**: Gratis hasta 60 requests/min
3. **Ollama (local)**: Gratis pero requiere servidor potente
4. **Hybrid**: Claude para tareas complejas, GPT-3.5 para simples

---

**Última actualización**: 4 de enero de 2026

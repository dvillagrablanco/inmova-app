# 🚀 EJECUTA ESTO AHORA (15 Minutos)

---

## ✅ Todo Está Preparado

**El servidor ya está listo.** Solo necesitas obtener 3 credenciales y configurarlas.

---

## 🎯 Script Automático (Recomendado)

### Ejecuta este comando:

```bash
python3 scripts/configurar-triada-completo.py
```

---

## ✨ Lo Que Hará el Script

Este script **super automatizado**:

1. ✅ **Abre automáticamente** los sitios web (Sentry, Crisp, BetterStack)
2. ✅ Te muestra **instrucciones claras** en pantalla
3. ✅ **Valida el formato** de cada credencial que pegues
4. ✅ **Configura automáticamente** en el servidor (SSH con paramiko)
5. ✅ **Reinicia PM2** automáticamente
6. ✅ **Verifica** que todo funciona

**Duración:** 15 minutos siguiendo instrucciones

---

## 📋 Lo Que Verás (Paso a Paso)

### PASO 1: Sentry DSN (5 min)

```
═══════════════════════════════════════════════
  PASO 1/3: SENTRY DSN (Error Tracking)
═══════════════════════════════════════════════

🔴 Sentry captura automáticamente TODOS los errores

Pasos:
1. Abre: https://sentry.io/signup/
2. Regístrate con email o GitHub
3. Plan "Developer" (GRATIS)
4. Crea proyecto "inmova-app" (Next.js)
5. COPIA EL DSN

🌐 Abriendo Sentry en tu navegador...
   ✅ Navegador abierto

📋 Pega tu Sentry DSN aquí: _
```

**Pegas tu DSN → El script valida → Continúa al paso 2**

---

### PASO 2: Crisp Website ID (5 min)

```
═══════════════════════════════════════════════
  PASO 2/3: CRISP WEBSITE ID (Chat)
═══════════════════════════════════════════════

💬 Crisp permite soporte 24/7

Pasos:
1. Abre: https://crisp.chat/
2. Regístrate
3. Settings → Setup Instructions
4. COPIA EL WEBSITE ID (UUID)

🌐 Abriendo Crisp en tu navegador...
   ✅ Navegador abierto

📋 Pega tu Crisp Website ID aquí: _
```

**Pegas tu ID → Validación → Paso 3**

---

### PASO 3: BetterStack Status Page (5 min)

```
═══════════════════════════════════════════════
  PASO 3/3: BETTERSTACK STATUS PAGE
═══════════════════════════════════════════════

📊 Status Page muestra si tu app está UP

Pasos:
1. Abre: https://betterstack.com/uptime
2. Crea monitor para inmovaapp.com/api/health
3. Crea Status Page pública
4. COPIA LA URL

🌐 Abriendo BetterStack en tu navegador...
   ✅ Navegador abierto

📋 Pega la URL aquí: _
```

**Pegas la URL → Validación → Configuración automática**

---

### PASO 4: Configuración Automática

```
═══════════════════════════════════════════════
  CONFIGURANDO SERVIDOR
═══════════════════════════════════════════════

✅ Conexión SSH establecida

🔧 Configurando Sentry DSN...
   ✅ Sentry DSN configurada
🔧 Configurando Crisp Website ID...
   ✅ Crisp Website ID configurada
🔧 Configurando Status Page URL...
   ✅ Status Page URL configurada

✅ Variables configuradas: 3/3

🔄 Reiniciando aplicación...
   ✅ PM2 reiniciado

⏳ Esperando 10 segundos...

🧪 Verificando health check...
   ✅ Health check OK

🔌 Conexión SSH cerrada
```

---

### PASO 5: ¡Completado!

```
═══════════════════════════════════════════════
  ✅ CONFIGURACIÓN COMPLETADA
═══════════════════════════════════════════════

🎉 ¡Tu app ahora está blindada para producción!

🧪 VERIFICA EN PRODUCCIÓN:
1. Abre: https://inmovaapp.com
2. ✅ Widget de Crisp (esquina inferior derecha)
3. ✅ Footer → 'Estado del Sistema'
4. ✅ Fuerza error → https://sentry.io/issues/

😴 Ahora puedes dormir tranquilo sabiendo que:
   🛡️  Sentry captura errores automáticamente
   💬 Crisp permite soporte 24/7
   📊 BetterStack muestra el estado
```

---

## 🎯 Acción Inmediata

**Ejecuta AHORA:**

```bash
python3 scripts/configurar-triada-completo.py
```

**Y sigue las instrucciones en pantalla.**

---

## 💡 Tips Durante la Ejecución

### Si el navegador no se abre automáticamente:
- No hay problema
- El script te muestra la URL para que la copies manualmente

### Si te equivocas al pegar una credencial:
- El script te dice "Formato inválido"
- Puedes intentar de nuevo
- O saltar ese paso (puedes configurarlo después)

### Si algo falla:
- El script muestra el error claramente
- Puedes ejecutarlo de nuevo
- O consultar: `INSTRUCCIONES-CONFIGURAR-TRIADA.md`

---

## 🐛 Troubleshooting Rápido

### "No se pudo abrir el navegador"
**Solución:** Abre manualmente las URLs que muestra el script

### "Formato inválido" al pegar Sentry DSN
**Solución:** Asegúrate de copiar TODO el DSN:
- Debe empezar con `https://`
- Debe contener `@`
- Debe terminar con `.ingest.sentry.io/[números]`
- Ejemplo: `https://abc123@sentry.ingest.io/12345`

### "Formato inválido" al pegar Crisp ID
**Solución:** Debe ser un UUID completo:
- 36 caracteres con guiones
- Formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Ejemplo: `12345678-1234-1234-1234-123456789abc`

### "Connection timeout" al configurar servidor
**Solución:** Verifica tu conexión a internet y reintenta

---

## 📚 Documentación Completa

Si prefieres hacerlo manualmente:

```bash
cat INSTRUCCIONES-CONFIGURAR-TRIADA.md
```

---

## 💰 Costos (Recordatorio)

| Servicio | Plan | Costo |
|----------|------|-------|
| Sentry | Developer | **$0/mes** |
| Crisp | Basic | **$0/mes** |
| BetterStack | Free | **$0/mes** |
| **TOTAL** | — | **$0/mes** ✅ |

---

## ✅ Resultado Final

**Después de ejecutar el script (15 min):**

- 🛡️ **Sentry** capturará todos los errores automáticamente
- 💬 **Crisp** permitirá soporte instantáneo a usuarios
- 📊 **BetterStack** mostrará el estado del sistema 24/7
- 😴 **Dormirás tranquilo** sabiendo que te alertarán si algo falla

**¡Tu app estará lista para clientes reales!** 🚀

---

## 🚨 ¡HAZLO AHORA!

```bash
python3 scripts/configurar-triada-completo.py
```

**Solo 15 minutos te separan de tener tu app blindada para producción.** ⏱️

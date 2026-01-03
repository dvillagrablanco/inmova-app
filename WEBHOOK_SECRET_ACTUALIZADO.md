# ✅ WEBHOOK SECRET ACTUALIZADO EXITOSAMENTE

## 🎉 Completado

El nuevo webhook secret de Stripe ha sido configurado:

```
whsec_eLEtxGeyOnR5HT6qeH6D93yvksp3kOll
```

### Cambios aplicados:

1. ✅ Secret actualizado en `/opt/inmova-app/.env.local`
2. ✅ Secret actualizado en `/opt/inmova-app/.env.production`
3. ✅ Cache de Next.js limpiado
4. ✅ PM2 reiniciado
5. ✅ Endpoint verificado funcional

## 🧪 Testear desde Stripe Dashboard

### Paso 1: Ir a tu webhook

https://dashboard.stripe.com/test/webhooks

### Paso 2: Send Test Webhook

1. Click en tu webhook endpoint
2. Click **"Send test webhook"**
3. Seleccionar evento: **`payment_intent.succeeded`**
4. Click **"Send test webhook"**

### Resultado esperado:

```
✅ 200 OK
Response: {"received":true}
```

## 📋 Ver Logs del Webhook

Si quieres ver los logs en tiempo real cuando Stripe envía eventos:

```bash
ssh root@157.180.119.236
pm2 logs inmova-app | grep -i stripe
```

**Output esperado al recibir webhook**:
```
[Stripe Webhook] Received event: payment_intent.succeeded
[Stripe] Payment succeeded: pi_xxxxx
```

## ⚠️ Si el test falla

### Error 400: "Invalid signature"

Esto significa que el webhook secret en Stripe Dashboard **no coincide** con el configurado en el servidor.

**Solución**: Verificar que el secret en Stripe Dashboard sea exactamente:
```
whsec_eLEtxGeyOnR5HT6qeH6D93yvksp3kOll
```

### Error 404

El endpoint no está accesible.

**Verificar**:
```bash
curl -I https://inmovaapp.com/api/webhooks/stripe
```

Debe retornar HTTP 200 o 405 (no 404).

### Error 500

Error interno del servidor.

**Ver logs**:
```bash
ssh root@157.180.119.236
pm2 logs inmova-app --lines 50 | grep -i error
```

## 📊 Resumen de Configuración

| Item | Valor | Status |
|------|-------|--------|
| Webhook URL | `https://inmovaapp.com/api/webhooks/stripe` | ✅ |
| Webhook Secret | `whsec_eLEtxGeyOn...` | ✅ Actualizado |
| Stripe Secret Key | `sk_test_51QGc5Q...` | ✅ |
| Endpoint Status | HTTP 400 (test manual) | ✅ Funcional |
| PM2 Status | online | ✅ |

## 🎯 Próximos Pasos

1. **Enviar test webhook desde Stripe** (arriba ⬆️)
2. **Verificar respuesta 200 OK**
3. **Verificar logs** (opcional)
4. **Testear con pago real** (opcional, en test mode)

## 🔗 Links Útiles

- **Stripe Webhooks Dashboard**: https://dashboard.stripe.com/test/webhooks
- **Stripe Events Log**: https://dashboard.stripe.com/test/events
- **Stripe Testing Cards**: https://stripe.com/docs/testing

---

**¡Todo listo! Ahora envía un test webhook desde Stripe Dashboard.** 🚀

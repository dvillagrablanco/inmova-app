# 🚀 EJECUTA ESTO AHORA

## ✅ Todo el Código Está LISTO

La **Triada de Mantenimiento** está completamente implementada en el código:

- ✅ **EL CENTINELA** (Sentry) - Configurado
- ✅ **EL ESCUDO** (Crisp Chat) - Integrado
- ✅ **LA TRANSPARENCIA** (Status Page) - Link añadido

## 🎯 Solo Falta 1 Cosa: Obtener Credenciales

**Tiempo estimado**: 15 minutos  
**Dificultad**: Fácil (el script te guía)

---

## 📋 Paso a Paso

### 1. Conéctate al servidor

```bash
ssh root@157.180.119.236
```

**Password**: `xcc9brgkMMbf`

### 2. Ejecuta el script

```bash
/opt/inmova-app/configurar-triada.sh
```

### 3. Sigue las instrucciones en pantalla

El script te pedirá:

1. **Sentry DSN** (5 min)
   - Te dará el link: https://sentry.io/signup/
   - Regístrate → Crea proyecto → Copia el DSN

2. **Crisp Website ID** (3 min)
   - Link: https://crisp.chat/en/
   - Regístrate → Añade sitio → Copia el Website ID

3. **Status Page URL** (7 min)
   - Link: https://betterstack.com/uptime
   - Regístrate → Crea Status Page → Copia la URL

### 4. El script hace el resto

- Valida las credenciales
- Actualiza `.env.production`
- Reinicia PM2
- Verifica que todo funciona

---

## ✅ Verificación

Después de ejecutar el script:

```bash
# 1. Test de Sentry
curl https://inmovaapp.com/api/test-sentry
# Luego ve a: https://sentry.io/issues/

# 2. Test de Crisp
# Abre: https://inmovaapp.com
# Debe aparecer widget de chat

# 3. Test de Status Page
# Ve al Footer → Click "Estado del Sistema"
```

---

## 🎉 ¡Eso es Todo!

Después de esto tendrás:

- 🛡️ Monitoreo de errores 24/7
- 💬 Chat de soporte en vivo
- 📊 Página de estado público
- 😴 Peace of mind

---

## 📚 Más Info

- **Guía completa**: [`TRIADA-CONFIGURACION-FINAL.md`](./TRIADA-CONFIGURACION-FINAL.md)
- **Sentry examples**: [`docs/SENTRY-BEST-PRACTICES.md`](./docs/SENTRY-BEST-PRACTICES.md)
- **README completo**: [`README-CONFIGURACION-COMPLETA.md`](./README-CONFIGURACION-COMPLETA.md)

---

**¿Listo?** 🚀

```bash
ssh root@157.180.119.236 && /opt/inmova-app/configurar-triada.sh
```

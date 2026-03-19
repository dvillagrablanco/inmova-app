# Prompt para Claude Chrome — Configurar Tink Console

## Instrucciones

Copia y pega este prompt en una sesión de Claude Chrome con acceso al navegador.

---

## PROMPT:

```
Necesito que accedas a console.tink.com y configures la app de INMOVA para que Tink Link funcione correctamente.

### Credenciales de acceso a Tink Console:
- URL: https://console.tink.com
- Las credenciales de la cuenta de Tink deberían estar guardadas en el navegador o usar SSO. Si pide login, avísame.

### Datos de la app INMOVA en Tink:
- Client ID: f572b45142f542eb857fa396f197f9fe
- Client Secret: (ya configurado en el servidor)

### Lo que necesito que hagas:

1. **Ir a App Settings → Redirect URIs**
   - Añadir esta redirect URI exacta:
     ```
     https://inmovaapp.com/api/open-banking/tink/callback
     ```
   - Si ya existe alguna URI, no la borres — solo añade esta nueva.

2. **Ir a Products**
   - Verificar que el producto **"Transactions"** está habilitado.
   - Si no está habilitado, activarlo.
   - También verificar que **"Account Check"** está activo.

3. **Ir a App Settings → Markets**
   - Verificar que **España (ES)** está habilitado como mercado.
   - Si no lo está, activarlo.

4. **Verificar modo de la app**
   - Confirmar que la app está en modo **Production** (no Sandbox/Test).
   - Si está en Sandbox, necesito saber para cambiarlo.

5. **Verificar credenciales TPP (Third Party Provider)**
   - En App Settings → TPP Credentials, verificar que hay credenciales PSD2 registradas.
   - Si hay un campo "Set redirect URI" en TPP, asegurarse de que también tiene:
     ```
     https://inmovaapp.com/api/open-banking/tink/callback
     ```

### Después de configurar:
- Haz una captura de pantalla de la configuración de Redirect URIs.
- Haz una captura de los Products habilitados.
- Dime si todo está correcto o si hay algún problema.

### Contexto:
El error actual al usar Tink Link es:
```
Error reason: REQUEST_FAILED_FETCH_EXISTING_USER
Error status: INTERNAL_ERROR
Product Type: transactions
Product Dimension: connect-accounts
```

Este error ocurre porque Tink Link no puede validar el authorization_code contra la app. La causa más probable es que la redirect URI no está registrada en el Console.

### Importante:
- NO cambies el Client ID ni el Client Secret.
- NO borres usuarios o conexiones existentes.
- Solo añade la redirect URI y verifica los productos/mercados.
```

---

## Notas técnicas

- La API de Tink funciona correctamente (crear usuarios, tokens, auth codes) — solo falla Tink Link (la UI web).
- El error `REQUEST_FAILED_FETCH_EXISTING_USER` está documentado como causado por redirect URI no registrada o productos no habilitados.
- Una vez configurado, los links de autorización que genera INMOVA funcionarán y redirigirán al usuario a su banco para autorizar la lectura de cuentas.

# 📧 GUÍA: CREAR CUENTA DE SENDGRID (5 MINUTOS)

## Paso 1: Registro

1. **Ir a**: https://signup.sendgrid.com/
2. **Completar formulario**:
   ```
   Email: tu@email.com
   Nombre: Tu Nombre
   Empresa: Inmova
   Password: [crear contraseña]
   ```
3. **Click "Create Account"**
4. **Verificar email** (revisa bandeja de entrada)

---

## Paso 2: Configuración Inicial

1. **Completar onboarding** (2 minutos):
   - ¿Cómo usarás SendGrid? → Web App
   - ¿Qué tipo de emails? → Transactional
   - ¿Cuántos emails/mes? → 0-10,000

2. **Skip** integraciones (lo haremos manualmente)

---

## Paso 3: Crear API Key

1. **Ir a**: Settings → API Keys
   - O link directo: https://app.sendgrid.com/settings/api_keys

2. **Click "Create API Key"**

3. **Configurar**:
   ```
   API Key Name: Inmova Production
   Permissions: Full Access
   ```

4. **Click "Create & View"**

5. **⚠️ COPIAR LA KEY** (se muestra solo UNA VEZ):
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Paso 4: Verificar Sender

**IMPORTANTE**: Sin esto no podrás enviar emails

1. **Ir a**: Settings → Sender Authentication → Single Sender Verification
   - O: https://app.sendgrid.com/settings/sender_auth/senders

2. **Click "Create New Sender"**

3. **Completar**:
   ```
   From Name: Inmova App
   From Email Address: noreply@inmovaapp.com
   Reply To: soporte@inmovaapp.com (o el tuyo)
   Company Address: Tu dirección
   City: Tu ciudad
   Zip: Tu código postal
   Country: Spain
   ```

4. **Click "Create"**

5. **Verificar email**:
   - SendGrid enviará email a `noreply@inmovaapp.com`
   - ⚠️ Si no tienes acceso a ese email, usa uno que SÍ tengas
   - Ejemplo: `tucorreo@gmail.com` (funciona igual)

6. **Click en link de verificación del email**

---

## Paso 5: Pasar Credenciales

Una vez verificado, pásame:

```
API Key: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
From Email: noreply@inmovaapp.com (o el que verificaste)
```

Y yo configuro todo en el servidor en 2 minutos.

---

## 💰 Plan FREE

```
✅ 100 emails/día (3,000/mes)
✅ Sin tarjeta de crédito
✅ Funcional para producción pequeña
✅ Suficiente para empezar
```

**Cuando llegues a ~80 emails/día**, upgradeamos a plan de pago.

---

## 🆘 Problemas Comunes

### "No puedo verificar noreply@inmovaapp.com"
**Solución**: Usa un email que SÍ controles temporalmente:
- `tucorreo@gmail.com`
- `tucorreo@outlook.com`
- Cualquier email real tuyo

Más adelante configuramos el dominio completo.

### "No me llega el email de verificación"
**Solución**:
- Revisa SPAM
- Espera 5 minutos
- Reenvía desde SendGrid

---

## ⏱️ Tiempo Total: 5-10 minutos

Es la opción más rápida y confiable.

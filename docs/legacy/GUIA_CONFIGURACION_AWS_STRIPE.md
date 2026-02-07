# 🔑 GUÍA: CONFIGURAR AWS S3 Y STRIPE

---

## 📦 PARTE 1: AWS S3

### Paso 1: Crear Cuenta AWS (si no tienes)
```
1. Ir a: https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Completar datos (requiere tarjeta, pero hay tier gratuito)
4. Verificar email y número de teléfono
```

### Paso 2: Crear Usuario IAM con Permisos S3
```
1. Ir a: https://console.aws.amazon.com/iam/
2. Users → Create user
3. Nombre: inmova-app-s3
4. Permissions: Attach policies directly
5. Buscar y seleccionar: "AmazonS3FullAccess"
6. Create user
```

### Paso 3: Crear Access Keys
```
1. Click en el usuario creado (inmova-app-s3)
2. Security credentials tab
3. Access keys → Create access key
4. Use case: Application running outside AWS
5. Next → Create access key
6. ⚠️ IMPORTANTE: Copiar y guardar:
   - Access key ID (AKIA...)
   - Secret access key (solo se muestra una vez)
```

### Paso 4: Crear Bucket S3
```
1. Ir a: https://s3.console.aws.amazon.com/s3/
2. Create bucket
3. Nombre: inmova-uploads-prod (debe ser único globalmente)
4. Región: EU (Ireland) eu-west-1 (o la más cercana)
5. Block Public Access: DESACTIVAR (para servir imágenes públicas)
   ⚠️ O configurar bucket policy específico
6. Create bucket
```

### Paso 5: Configurar Bucket Policy (Opcional - Para acceso público a imágenes)
```
1. Click en el bucket creado
2. Permissions tab
3. Bucket policy → Edit
4. Añadir esta política:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::inmova-uploads-prod/*"
        }
    ]
}

5. Save changes
```

### Paso 6: Configurar CORS (Para uploads desde navegador)
```
1. En el bucket → Permissions tab
2. CORS configuration → Edit
3. Añadir:

[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["https://inmovaapp.com", "http://localhost:3000"],
        "ExposeHeaders": ["ETag"]
    }
]

4. Save changes
```

### ✅ Credenciales AWS Obtenidas
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_BUCKET=inmova-uploads-prod
```

---

## 💳 PARTE 2: STRIPE

### Paso 1: Crear Cuenta Stripe (si no tienes)
```
1. Ir a: https://dashboard.stripe.com/register
2. Completar datos
3. Verificar email
```

### Paso 2: Activar Cuenta para Producción
```
⚠️ IMPORTANTE: Para usar claves sk_live_* debes:

1. Dashboard → Settings → Business settings
2. Completar información de negocio:
   - Nombre legal de empresa
   - Dirección
   - Información bancaria (para recibir pagos)
   - Verificación de identidad

3. Submit for review

⏳ Proceso puede tardar 1-2 días
```

### Paso 3: Obtener API Keys

#### Para Pruebas (Mientras activas cuenta)
```
1. Dashboard → Developers → API keys
2. Toggle: View test data (activado)
3. Copiar:
   - Secret key: sk_test_...
   - Publishable key: pk_test_...

⚠️ Con test keys NO se procesarán pagos reales
```

#### Para Producción (Después de activación)
```
1. Dashboard → Developers → API keys
2. Toggle: View test data (DESACTIVADO)
3. Copiar:
   - Secret key: sk_live_...
   - Publishable key: pk_live_...

✅ Con live keys SÍ se procesarán pagos reales
```

### Paso 4: Configurar Webhook (Opcional pero Recomendado)
```
1. Dashboard → Developers → Webhooks
2. Add endpoint
3. Endpoint URL: https://inmovaapp.com/api/webhooks/stripe
4. Select events to listen to:
   - payment_intent.succeeded
   - payment_intent.failed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Add endpoint
6. Copiar Signing secret: whsec_...
```

### ✅ Credenciales Stripe Obtenidas

#### Test (Para desarrollo/pruebas)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (opcional)
```

#### Live (Para producción)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (opcional)
```

---

## 🧪 PARTE 3: TESTING

### Test AWS S3 (Desde servidor)
```bash
# Conectar al servidor
ssh root@157.180.119.236

# Instalar AWS CLI (si no está)
apt-get install awscli -y

# Configurar
aws configure
# Pegar AWS_ACCESS_KEY_ID
# Pegar AWS_SECRET_ACCESS_KEY
# Región: eu-west-1
# Output format: json

# Test subir archivo
echo "test" > test.txt
aws s3 cp test.txt s3://inmova-uploads-prod/test.txt

# Test listar
aws s3 ls s3://inmova-uploads-prod/

# Test borrar
aws s3 rm s3://inmova-uploads-prod/test.txt
```

### Test Stripe (Desde código)
```bash
# En servidor o local
curl https://api.stripe.com/v1/customers \
  -u sk_test_...: \
  -d "description=Test Customer"

# Si retorna un JSON con customer.id = ✅ Funciona
```

---

## 🚀 PARTE 4: APLICAR EN INMOVA

### Método 1: Script Automatizado (Recomendado)
```bash
# Desde workspace local
python3 scripts/configure-aws-stripe-interactive.py
```

### Método 2: Manual (SSH)
```bash
# 1. Conectar
ssh root@157.180.119.236

# 2. Backup
cp /opt/inmova-app/.env.production /opt/inmova-app/.env.production.backup_$(date +%Y%m%d_%H%M%S)

# 3. Editar
nano /opt/inmova-app/.env.production

# 4. Actualizar estas líneas:
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_BUCKET=inmova-uploads-prod

STRIPE_SECRET_KEY=sk_live_... (o sk_test_...)
STRIPE_PUBLIC_KEY=pk_live_... (o pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (si configuraste webhook)

# 5. Guardar (Ctrl+O, Enter, Ctrl+X)

# 6. Reiniciar app
pm2 restart inmova-app --update-env

# 7. Verificar
pm2 logs inmova-app --lines 20
curl https://inmovaapp.com/api/health
```

---

## ✅ VERIFICACIÓN FINAL

### Checklist AWS S3
```
□ Cuenta AWS creada
□ Usuario IAM creado con permisos S3
□ Access Keys generadas y guardadas
□ Bucket S3 creado
□ Bucket policy configurada (si acceso público)
□ CORS configurado
□ Credenciales actualizadas en .env.production
□ App reiniciada
□ Test upload funcionando
```

### Checklist Stripe
```
□ Cuenta Stripe creada
□ Información de negocio completada (para live keys)
□ API Keys obtenidas (test o live)
□ Webhook configurado (opcional)
□ Credenciales actualizadas en .env.production
□ App reiniciada
□ Test payment funcionando
```

---

## 💰 COSTOS ESTIMADOS

### AWS S3
```
Gratis (Tier Gratuito 12 meses):
- 5 GB de almacenamiento
- 20,000 GET requests
- 2,000 PUT requests

Después:
- $0.023 por GB/mes (primeros 50 TB)
- $0.0004 por 1,000 GET requests
- $0.005 por 1,000 PUT requests

Ejemplo: 10 GB + 100k requests/mes = ~$0.30/mes
```

### Stripe
```
Sin cuota mensual

Comisiones por transacción:
- 1.4% + €0.25 por tarjeta europea
- 2.9% + €0.25 por tarjeta no europea

Ejemplo: Cobro de €1000
- Tarjeta europea: €14 + €0.25 = €14.25
- Recibes: €985.75
```

---

## 🔒 SEGURIDAD

### AWS
```
✅ NUNCA commitear credenciales a Git
✅ Usar IAM users con permisos mínimos (solo S3)
✅ Rotar Access Keys cada 90 días
✅ Habilitar MFA en cuenta AWS root
✅ Monitorear uso en AWS CloudWatch
```

### Stripe
```
✅ NUNCA exponer Secret Key en frontend
✅ Usar test keys en desarrollo
✅ Verificar webhooks con signing secret
✅ Habilitar 2FA en cuenta Stripe
✅ Monitorear transacciones en Dashboard
```

---

## 📞 SOPORTE

### AWS
- Documentación: https://docs.aws.amazon.com/s3/
- Soporte: https://console.aws.amazon.com/support/

### Stripe
- Documentación: https://stripe.com/docs
- Soporte: https://support.stripe.com/
- Chat en vivo: Dashboard → Help

---

## 🎯 PRÓXIMOS PASOS

Una vez configurado:

1. **Test uploads** en tu app:
   - Subir foto de propiedad
   - Verificar URL generada
   - Verificar imagen se ve en navegador

2. **Test pagos** en tu app:
   - Crear pago de prueba
   - Usar tarjeta test: 4242 4242 4242 4242
   - Verificar en Stripe Dashboard

3. **Monitorear**:
   - AWS S3: Console → Metrics
   - Stripe: Dashboard → Payments

---

**¿Necesitas ayuda con algún paso específico?** 🚀

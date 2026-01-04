# 🗄️ CONFIGURACIÓN AWS S3 - INMOVA APP

## 📋 ¿QUÉ ES AWS S3?

Amazon S3 (Simple Storage Service) es un servicio de almacenamiento de objetos en la nube que permite guardar y recuperar cualquier cantidad de datos desde cualquier lugar.

**En Inmova lo usamos para**:
- ✅ Fotos de propiedades (alta resolución)
- ✅ Documentos PDF (contratos, facturas)
- ✅ Fotos de perfil de usuarios
- ✅ Backups de archivos
- ✅ Tours virtuales (videos, 360°)

---

## 💰 COSTOS

### Pricing AWS S3 (eu-west-1 - Irlanda)

```
Storage:
• Standard: €0.023/GB/mes (primeros 50 TB)
• Intelligent-Tiering: €0.023/GB/mes + €0.0025 por 1000 objetos

Requests:
• PUT/COPY/POST: €0.005 por 1000 requests
• GET/SELECT: €0.0004 por 1000 requests

Data Transfer:
• Upload: GRATIS
• Download primeros 100 GB/mes: GRATIS
• Download siguientes 10 TB: €0.09/GB
```

### Proyección de Costos (100 usuarios)

```
Estimación conservadora:

Storage:
• 1,000 fotos × 2 MB = 2 GB
• 500 documentos × 500 KB = 250 MB
• TOTAL: 2.25 GB × €0.023 = €0.05/mes

Requests:
• 10,000 uploads/mes × €0.005/1000 = €0.05/mes
• 100,000 downloads/mes × €0.0004/1000 = €0.04/mes

Data Transfer:
• 50 GB downloads/mes (gratis)

TOTAL MENSUAL: ~€0.15/mes
TOTAL ANUAL: ~€2/año

Estimación realista (con buffer): €5/mes = €60/año
```

---

## 🚀 PASO 1: CREAR CUENTA AWS

Si no tienes cuenta AWS:

1. Ir a https://aws.amazon.com
2. Click "Create an AWS Account"
3. Ingresar email, password
4. Verificar tarjeta de crédito (NO se cobra si usas Free Tier)
5. Completar verificación telefónica
6. Seleccionar plan "Free" (Basic Support)

**Free Tier** (12 meses gratis):
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests

---

## 📦 PASO 2: CREAR BUCKET S3

### Opción A: Consola Web (Recomendado)

1. **Login** en AWS Console: https://console.aws.amazon.com
2. **Ir a S3**: Services → Storage → S3
3. **Crear bucket**: Click "Create bucket"

4. **Configuración básica**:
   ```
   Bucket name: inmova-production
   AWS Region: Europe (Ireland) eu-west-1
   ```

5. **Block Public Access** (IMPORTANTE):
   ```
   ✅ Bloquear TODO el acceso público
   (usaremos URLs pre-firmadas para acceso controlado)
   ```

6. **Bucket Versioning**: Disabled (por ahora)

7. **Tags** (opcional):
   ```
   Project: Inmova
   Environment: Production
   ```

8. **Default encryption**:
   ```
   ✅ Server-side encryption (SSE-S3)
   ```

9. **Click "Create bucket"**

### Opción B: AWS CLI (Avanzado)

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Crear bucket
aws s3api create-bucket \
  --bucket inmova-production \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Activar encriptación
aws s3api put-bucket-encryption \
  --bucket inmova-production \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

---

## 🔑 PASO 3: CREAR IAM USER Y CREDENCIALES

### 3.1. Crear Usuario IAM

1. **Ir a IAM**: Services → Security → IAM
2. **Users** → "Add users"
3. **User name**: `inmova-s3-user`
4. **Access type**: ✅ Programmatic access
5. **Click "Next: Permissions"**

### 3.2. Asignar Permisos

**Opción A: Política Restringida (RECOMENDADO)**

1. Click "Attach policies directly"
2. Click "Create policy"
3. Seleccionar JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InmovaS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::inmova-production",
        "arn:aws:s3:::inmova-production/*"
      ]
    }
  ]
}
```

4. **Policy name**: `InmovaS3Policy`
5. Click "Create policy"
6. Volver a la pantalla de usuario y asignar la política

**Opción B: Política Amplia (Desarrollo)**

1. Buscar y seleccionar: `AmazonS3FullAccess`
⚠️ Solo para desarrollo, no production

### 3.3. Obtener Credenciales

1. Click "Create user"
2. **IMPORTANTE**: Descargar CSV con credenciales
3. Guardar en lugar seguro (NO commitear a Git)

El CSV contiene:
```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## ⚙️ PASO 4: CONFIGURAR EN INMOVA APP

### 4.1. Variables de Entorno

Añadir al `.env.production` (servidor):

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET=inmova-production
AWS_REGION=eu-west-1
```

⚠️ **NUNCA** commitear estas credenciales a Git

### 4.2. Verificar Configuración (Local)

```bash
# Test de conexión
cd /workspace
npm run test:s3
```

O manualmente:

```typescript
// test-s3.ts
import { S3Service } from '@/lib/aws-s3-service';

async function test() {
  const configured = S3Service.isConfigured();
  console.log('S3 Configured:', configured);
  
  if (configured) {
    const baseUrl = S3Service.getBaseUrl();
    console.log('Base URL:', baseUrl);
  }
}

test();
```

### 4.3. Configurar en Servidor (SSH)

```bash
ssh root@157.180.119.236

# Editar .env.production
cd /opt/inmova-app
nano .env.production

# Añadir variables AWS:
AWS_ACCESS_KEY_ID=tu_access_key_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
AWS_BUCKET=inmova-production
AWS_REGION=eu-west-1

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Reiniciar PM2
pm2 restart inmova-app --update-env

# Verificar que cargó
pm2 env inmova-app | grep AWS
```

---

## 🧪 PASO 5: TESTING

### Test Manual

1. **Ir a la app**: https://inmovaapp.com/dashboard
2. **Crear o editar propiedad**
3. **Subir foto de prueba**
4. **Verificar**:
   - Upload exitoso
   - Imagen se muestra correctamente
   - URL es de S3: `https://inmova-production.s3.eu-west-1.amazonaws.com/...`

### Test con API

```bash
# Test upload desde terminal
curl -X POST https://inmovaapp.com/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test-image.jpg" \
  -F "folder=properties" \
  -F "fileType=image"

# Response esperado:
{
  "success": true,
  "uploads": [{
    "url": "https://inmova-production.s3.eu-west-1.amazonaws.com/properties/1234567890-abc123.jpg",
    "key": "properties/1234567890-abc123.jpg"
  }],
  "count": 1
}
```

### Ver Archivos en S3

1. AWS Console → S3 → inmova-production
2. Ver carpetas:
   - `properties/` - Fotos de propiedades
   - `documents/` - Documentos PDF
   - `avatars/` - Fotos de perfil
   - `contracts/` - Contratos firmados

---

## 🔐 SEGURIDAD

### Mejores Prácticas

1. **✅ NO usar Access Keys del root user**
   - Usar IAM users con permisos restringidos

2. **✅ Rotación de credenciales**
   ```bash
   # Cada 90 días rotar Access Keys
   # AWS Console → IAM → Users → inmova-s3-user → Security credentials
   # Create access key → Copiar nuevas credenciales → Actualizar .env → Delete old key
   ```

3. **✅ Bucket privado**
   - Bloquear acceso público
   - Usar URLs pre-firmadas para archivos privados

4. **✅ Encriptación**
   - Server-side encryption (SSE-S3) activada

5. **✅ Versionado** (opcional)
   - Habilitar para poder recuperar archivos eliminados

6. **✅ Backup**
   - Configurar replicación cross-region (opcional)

### Permisos IAM Mínimos

Usuario debe tener **SOLO** estos permisos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",       // Upload
        "s3:GetObject",       // Download
        "s3:DeleteObject",    // Delete
        "s3:ListBucket"       // List files
      ],
      "Resource": [
        "arn:aws:s3:::inmova-production",
        "arn:aws:s3:::inmova-production/*"
      ]
    }
  ]
}
```

---

## 🚨 TROUBLESHOOTING

### Error: "AWS credentials not configured"

**Causa**: Variables de entorno no están configuradas

**Solución**:
```bash
# Verificar variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Si están vacías, configurar en .env.production
# Luego restart PM2
pm2 restart inmova-app --update-env
```

### Error: "Access Denied"

**Causa**: Usuario IAM no tiene permisos suficientes

**Solución**:
1. AWS Console → IAM → Users → inmova-s3-user
2. Permissions → Add permissions
3. Asignar política `InmovaS3Policy` o `AmazonS3FullAccess`

### Error: "Bucket does not exist"

**Causa**: Nombre de bucket incorrecto o no existe

**Solución**:
```bash
# Verificar nombre en .env.production
AWS_BUCKET=inmova-production  # Debe coincidir exactamente

# Verificar bucket existe:
aws s3 ls s3://inmova-production
```

### Upload muy lento

**Causa**: Región incorrecta (lejos del servidor)

**Solución**:
```bash
# Usar región más cercana al servidor
# Si servidor en Europa, usar eu-west-1
AWS_REGION=eu-west-1
```

### Error: "File too large"

**Causa**: Archivo excede 10 MB

**Solución**:
1. Reducir calidad de imagen
2. O modificar `MAX_FILE_SIZE` en `lib/aws-s3-service.ts`

---

## 📊 MONITOREO Y COSTOS

### Ver Costos en Tiempo Real

1. AWS Console → Billing Dashboard
2. Ver "Free Tier Usage"
3. Ver "Cost Explorer" para análisis detallado

### Alertas de Costos

1. Billing → Budgets
2. Create budget
3. Budget type: Cost budget
4. Amount: $5/mes (conservador)
5. Email alerts cuando se alcance 80%

### Métricas de Uso

```bash
# Ver número de objetos en bucket
aws s3 ls s3://inmova-production --recursive --summarize

# Ver tamaño total
aws s3 ls s3://inmova-production --recursive --human-readable --summarize
```

---

## 🎯 RESUMEN

### Checklist Configuración

- [ ] Cuenta AWS creada
- [ ] Bucket S3 creado (`inmova-production`)
- [ ] Usuario IAM creado (`inmova-s3-user`)
- [ ] Política IAM asignada (`InmovaS3Policy`)
- [ ] Credenciales descargadas (CSV)
- [ ] Variables en `.env.production` configuradas
- [ ] PM2 reiniciado con `--update-env`
- [ ] Test de upload exitoso
- [ ] Imagen visible en la app

### Variables Requeridas

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_BUCKET=inmova-production
AWS_REGION=eu-west-1
```

### Costo Estimado

```
100 usuarios: ~€5/mes
500 usuarios: ~€15/mes
1,000 usuarios: ~€30/mes

ROI: Muy alto (almacenamiento ilimitado, escalable)
```

---

## 📞 SOPORTE

Si tienes problemas:

1. Verificar logs: `pm2 logs inmova-app | grep AWS`
2. Test configuración: `S3Service.isConfigured()`
3. Verificar permisos IAM
4. Revisar logs de CloudWatch (AWS)

---

**Última actualización**: 4 de enero de 2026  
**Status**: ✅ Documentación completa  
**Prioridad**: 🟡 MEDIA (opcional para beta inicial)

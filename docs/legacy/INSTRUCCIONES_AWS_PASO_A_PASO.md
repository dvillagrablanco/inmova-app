# 🎯 OBTENER CREDENCIALES AWS - PASO A PASO EXACTO

## Para cuenta: 358871394188

---

## PASO 1: Iniciar Sesión
```
1. Abre: https://358871394188.signin.aws.amazon.com/console
2. Ingresa tus credenciales
3. Click "Sign in"
```

---

## PASO 2: Ir a IAM
```
1. En la barra de búsqueda superior (donde dice "Search")
2. Escribe: IAM
3. Click en "IAM" (con escudo naranja/azul)
```

---

## PASO 3: Crear Usuario
```
1. En el menú IZQUIERDO, click "Users"
2. Click botón naranja "Create user" (arriba derecha)
3. En "User name" escribe: inmova-app
4. Click botón azul "Next" (abajo derecha)
```

---

## PASO 4: Dar Permisos
```
1. Selecciona: "Attach policies directly" (segundo radio button)
2. En el buscador de policies, escribe: S3
3. Marca el checkbox de: "AmazonS3FullAccess"
4. Click botón azul "Next" (abajo derecha)
```

---

## PASO 5: Crear Usuario
```
1. Click botón naranja "Create user" (abajo derecha)
2. Verás mensaje: "Success - User inmova-app created"
```

---

## PASO 6: Crear Access Keys
```
1. Click en el usuario "inmova-app" que acabas de crear
2. Click en la pestaña "Security credentials"
3. Scroll down hasta "Access keys"
4. Click botón "Create access key"
```

---

## PASO 7: Seleccionar Caso de Uso
```
1. Selecciona: "Application running outside AWS"
2. Marca el checkbox: "I understand the above recommendation..."
3. Click "Next"
```

---

## PASO 8: COPIAR CREDENCIALES ⚠️ IMPORTANTE
```
Ahora verás 2 valores:

1. Access key: AKIA... (20 caracteres)
   👉 CÓPIALO COMPLETO

2. Secret access key: (40 caracteres, solo se muestra UNA VEZ)
   👉 CÓPIALO COMPLETO

3. Click "Download .csv file" (como backup)
4. Click "Done"
```

---

## PASO 9: Crear Bucket S3
```
1. En la barra de búsqueda superior escribe: S3
2. Click en "S3" (con cubo naranja)
3. Click botón naranja "Create bucket"
```

---

## PASO 10: Configurar Bucket
```
1. Bucket name: inmova-uploads-prod
   (si da error "ya existe", prueba: inmova-uploads-358871)

2. AWS Region: Europe (Stockholm) eu-north-1
   (según tu KMS ARN)

3. Scroll down a "Block Public Access settings"
4. DESMARCAR: "Block all public access"
5. Marcar checkbox: "I acknowledge..."

6. Scroll al final
7. Click botón naranja "Create bucket"
```

---

## ✅ LISTO - DAME ESTOS DATOS:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-north-1
AWS_BUCKET=inmova-uploads-prod (o el nombre que usaste)
```

---

## 📞 SI TE ATASCAS:

Dime en qué PASO estás y te ayudo específicamente.

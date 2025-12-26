# ✅ CHECKLIST: Antes de Eliminar el Servidor Antiguo

## ⚠️ IMPORTANTE: Lee Completo Antes de Eliminar

**Fecha de verificación:** 26 de diciembre de 2025  
**Nuevo servidor:** 157.180.119.236  
**Dominio:** inmova.app  

---

## 🔍 Estado del Nuevo Servidor

### ✅ Lo que YA está en el nuevo servidor:

1. **Aplicación Next.js**
   - ✅ Código fuente completo
   - ✅ Compilado exitosamente (.next/)
   - ✅ Corriendo con PM2
   - ✅ Node modules instalados

2. **Configuración de Servidor**
   - ✅ PM2 configurado (ecosystem.config.js)
   - ✅ Nginx configurado
   - ✅ SSL temporal instalado
   - ✅ Firewall UFW configurado

3. **Base de Datos**
   - ✅ PostgreSQL instalado y corriendo
   - ✅ Database inmova_db creada
   - ✅ Usuario inmova_user configurado
   - ✅ Prisma schema aplicado

4. **DNS**
   - ✅ inmova.app → 157.180.119.236
   - ✅ www.inmova.app → 157.180.119.236

---

## ⚠️ ANTES DE ELIMINAR - VERIFICA ESTOS PUNTOS:

### 🔴 CRÍTICO - Datos del Servidor Antiguo:

#### 1. **Base de Datos con Datos Reales**
- [ ] ¿El servidor antiguo tiene una base de datos con datos de producción?
- [ ] ¿Usuarios registrados?
- [ ] ¿Propiedades/contratos/documentos guardados?
- [ ] ¿Transacciones o pagos registrados?

**⚠️ SI RESPONDISTE SÍ A ALGUNA:**
```bash
# DEBES hacer backup primero:
# Conectar al servidor antiguo y ejecutar:
pg_dump -U [usuario] [nombre_db] > backup_produccion_$(date +%Y%m%d).sql

# Luego transferir al nuevo servidor:
scp backup_produccion_*.sql root@157.180.119.236:/var/www/inmova/

# E importar en el nuevo servidor:
ssh root@157.180.119.236
psql -U inmova_user -d inmova_db < backup_produccion_*.sql
```

#### 2. **Archivos Subidos por Usuarios**
- [ ] ¿Hay imágenes subidas? (avatares, fotos de propiedades)
- [ ] ¿Documentos PDF subidos? (contratos, facturas)
- [ ] ¿Otros archivos multimedia?

**⚠️ SI RESPONDISTE SÍ:**
```bash
# Ubicación típica de uploads:
# - /var/www/inmova/public/uploads/
# - /var/www/inmova/uploads/
# - Bucket S3 (verificar configuración)

# Transferir archivos:
rsync -avz [servidor_antiguo]:/ruta/uploads/ root@157.180.119.236:/var/www/inmova/public/uploads/
```

#### 3. **Variables de Entorno Secretas**
- [ ] ¿Tienes todas las claves API del servidor antiguo?
- [ ] ¿Claves de Stripe/pagos?
- [ ] ¿Credenciales de email (SendGrid, etc.)?
- [ ] ¿Claves de servicios externos (AWS, etc.)?

**⚠️ SI RESPONDISTE SÍ:**
```bash
# Copiar del servidor antiguo:
scp [servidor_antiguo]:/var/www/inmova/.env root@157.180.119.236:/var/www/inmova/.env.backup

# Verificar que el nuevo .env tiene todas las claves
diff .env.backup .env.production
```

#### 4. **Logs Importantes**
- [ ] ¿Necesitas conservar logs antiguos?
- [ ] ¿Logs de errores para debugging?
- [ ] ¿Logs de transacciones/auditoría?

**⚠️ SI RESPONDISTE SÍ:**
```bash
# Hacer backup de logs:
scp -r [servidor_antiguo]:/var/log/nginx/ ~/backup_logs/nginx/
scp -r [servidor_antiguo]:/root/.pm2/logs/ ~/backup_logs/pm2/
```

#### 5. **Configuraciones Personalizadas**
- [ ] ¿Cron jobs configurados?
- [ ] ¿Scripts personalizados?
- [ ] ¿Certificados SSL válidos de Let's Encrypt?

**⚠️ SI RESPONDISTE SÍ:**
```bash
# Verificar cron jobs:
crontab -l

# Backup de scripts:
scp [servidor_antiguo]:/root/scripts/* root@157.180.119.236:/root/scripts/
```

---

## 📊 COMPARACIÓN: Antiguo vs Nuevo

| Aspecto | Servidor Antiguo | Servidor Nuevo | Estado |
|---------|------------------|----------------|--------|
| **Aplicación** | ? | ✅ Corriendo | Verificar |
| **Base de Datos** | ? | ✅ Vacía/Schema | ⚠️ Migrar datos |
| **Archivos Subidos** | ? | ❌ No migrados | ⚠️ Transferir |
| **Variables ENV** | ? | ✅ Básicas | ⚠️ Verificar todas |
| **Certificado SSL** | ? | ⚠️ Autofirmado | Instalar después |
| **DNS** | Antiguo IP | ✅ 157.180.119.236 | ✅ Actualizado |
| **Firewall** | ? | ⚠️ Bloqueado | Pendiente DeepAgent |

---

## 🔄 PROCESO RECOMENDADO DE MIGRACIÓN

### Paso 1: Backup Completo del Servidor Antiguo
```bash
# Conectar al servidor antiguo
ssh [usuario]@[servidor_antiguo]

# 1. Backup de base de datos
pg_dump -U postgres inmova_db > /tmp/inmova_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Backup de archivos subidos
tar -czf /tmp/uploads_backup.tar.gz /var/www/inmova/public/uploads/

# 3. Backup de configuración
cp /var/www/inmova/.env /tmp/env_backup.txt

# 4. Lista de servicios y puertos
netstat -tlnp > /tmp/servicios_activos.txt
pm2 list > /tmp/pm2_apps.txt
```

### Paso 2: Transferir al Nuevo Servidor
```bash
# Desde el servidor antiguo:
scp /tmp/inmova_backup_*.sql root@157.180.119.236:/var/www/inmova/backups/
scp /tmp/uploads_backup.tar.gz root@157.180.119.236:/var/www/inmova/backups/
scp /tmp/env_backup.txt root@157.180.119.236:/var/www/inmova/backups/
```

### Paso 3: Restaurar en el Nuevo Servidor
```bash
# Conectar al nuevo servidor
ssh root@157.180.119.236

# 1. Restaurar base de datos
cd /var/www/inmova/backups/
psql -U inmova_user -d inmova_db < inmova_backup_*.sql

# 2. Restaurar archivos
tar -xzf uploads_backup.tar.gz -C /var/www/inmova/public/

# 3. Actualizar variables de entorno
# Revisar y actualizar .env.production con valores del backup
```

### Paso 4: Verificación Post-Migración
```bash
# Verificar datos en la base de datos
ssh root@157.180.119.236 "psql -U inmova_user -d inmova_db -c 'SELECT COUNT(*) FROM users;'"

# Verificar archivos
ssh root@157.180.119.236 "ls -la /var/www/inmova/public/uploads/"

# Reiniciar aplicación
ssh root@157.180.119.236 "pm2 restart inmova"
```

### Paso 5: Pruebas
- [ ] Probar login de usuarios existentes
- [ ] Verificar que las imágenes cargan
- [ ] Probar funcionalidades críticas
- [ ] Verificar logs sin errores

### Paso 6: Mantener Servidor Antiguo 48-72h
- [ ] No eliminar inmediatamente
- [ ] Mantener como backup por 2-3 días
- [ ] Monitorear el nuevo servidor
- [ ] Verificar que todo funciona correctamente

---

## ✅ CHECKLIST FINAL ANTES DE ELIMINAR

### Solo elimina el servidor antiguo cuando:

- [ ] ✅ Todos los datos de producción están migrados
- [ ] ✅ Todos los archivos subidos están transferidos
- [ ] ✅ Todas las variables de entorno están configuradas
- [ ] ✅ La aplicación funciona correctamente en el nuevo servidor
- [ ] ✅ DeepAgent ha abierto el firewall (inmova.app accesible)
- [ ] ✅ SSL válido instalado (Let's Encrypt)
- [ ] ✅ Has probado todas las funcionalidades críticas
- [ ] ✅ Has monitoreado el nuevo servidor por 48-72 horas
- [ ] ✅ Tienes backup completo del servidor antiguo guardado
- [ ] ✅ No hay servicios/cron jobs pendientes de migrar

---

## 🚨 SEÑALES DE QUE NO DEBES ELIMINAR AÚN:

### ❌ NO elimines si:

1. **Firewall bloqueado:** inmova.app aún no es accesible públicamente
2. **Sin pruebas:** No has probado el nuevo servidor con usuarios reales
3. **Datos faltantes:** Sospechas que falta información del antiguo servidor
4. **Servicios externos:** Algunos servicios aún apuntan al servidor antiguo
5. **Menos de 48h:** El nuevo servidor tiene menos de 2 días funcionando

---

## 📋 INFORMACIÓN QUE NECESITAS DEL SERVIDOR ANTIGUO

Por favor, proporciona esta información:

1. **IP/Dominio del servidor antiguo:**
   - IP: _______________
   - Dominio: _______________

2. **¿Tiene base de datos con datos reales?**
   - [ ] Sí - MIGRAR DATOS
   - [ ] No - Base de datos vacía/pruebas

3. **¿Tiene archivos subidos por usuarios?**
   - [ ] Sí - TRANSFERIR ARCHIVOS
   - [ ] No - Solo código

4. **¿Cuánto tiempo estuvo en producción?**
   - [ ] Nunca (solo testing)
   - [ ] Menos de 1 semana
   - [ ] Más de 1 semana
   - [ ] Más de 1 mes

5. **¿Usuarios reales lo están usando?**
   - [ ] Sí - HAY QUE MIGRAR TODO
   - [ ] No - Solo desarrollo/pruebas

---

## 🎯 RECOMENDACIÓN FINAL

### Escenario 1: Servidor de Pruebas (Sin datos importantes)
✅ **Puedes eliminar cuando:**
- DeepAgent abra el firewall
- Instales SSL válido
- Pruebes que todo funciona

### Escenario 2: Servidor de Producción (Con datos reales)
⚠️ **ESPERA y migra primero:**
1. Hacer backup completo
2. Migrar base de datos
3. Migrar archivos subidos
4. Migrar configuración
5. Probar exhaustivamente
6. Mantener 72h como backup
7. Luego eliminar

---

## 💾 COMANDO RÁPIDO DE BACKUP (Ejecutar en servidor antiguo)

```bash
#!/bin/bash
# Backup rápido - Ejecutar en el servidor antiguo

FECHA=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backup_inmova_$FECHA"

mkdir -p $BACKUP_DIR

echo "📦 Haciendo backup completo..."

# Base de datos
pg_dump -U postgres inmova_db > $BACKUP_DIR/database.sql

# Archivos
tar -czf $BACKUP_DIR/uploads.tar.gz /var/www/inmova/public/uploads/ 2>/dev/null
tar -czf $BACKUP_DIR/codigo.tar.gz /var/www/inmova/ --exclude=node_modules --exclude=.next

# Configuración
cp /var/www/inmova/.env $BACKUP_DIR/env.txt 2>/dev/null
pm2 list > $BACKUP_DIR/pm2_apps.txt
crontab -l > $BACKUP_DIR/crontab.txt 2>/dev/null

# Comprimir todo
cd /tmp
tar -czf backup_inmova_completo_$FECHA.tar.gz backup_inmova_$FECHA/

echo "✅ Backup completo en: /tmp/backup_inmova_completo_$FECHA.tar.gz"
echo "📤 Transferir a nuevo servidor con:"
echo "scp /tmp/backup_inmova_completo_$FECHA.tar.gz root@157.180.119.236:/root/"
```

---

## 📞 Antes de Decidir

**Responde estas preguntas:**

1. ¿El servidor antiguo tiene datos de producción? **[SÍ/NO]**
2. ¿Hay usuarios registrados con datos reales? **[SÍ/NO]**
3. ¿Cuánto tiempo estuvo el servidor antiguo en uso? **[_____ días/meses]**
4. ¿La aplicación ya estaba accesible públicamente? **[SÍ/NO]**

**Si respondiste SÍ a las preguntas 1 o 2:**
❌ **NO ELIMINES** hasta migrar los datos

**Si respondiste NO a todas:**
✅ **Puedes eliminar** cuando el firewall esté abierto

---

**Fecha de creación:** 26 de diciembre de 2025  
**Estado nuevo servidor:** Funcionando, esperando firewall  
**Recomendación:** No eliminar hasta verificar migración completa de datos

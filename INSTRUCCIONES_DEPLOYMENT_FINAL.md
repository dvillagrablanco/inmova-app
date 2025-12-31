# 🚀 INSTRUCCIONES FINALES DE DEPLOYMENT

## ✅ Lo Que Ya Está Hecho

1. ✅ **Merge completado** - Cambios de landing mergeados a `main`
2. ✅ **Push a GitHub** - Todos los cambios están en el repositorio
3. ✅ **Scripts creados** - Scripts de deployment automatizados disponibles

## 📋 Cambios Desplegados

### Landing Page Actualizada:

- ✅ Nueva sección: Market Potential (€150M mercado español)
- ✅ Precios actualizados: **€49/mes** (antes €60/mes)
- ✅ Arquitectura clara: **6 verticales + 6 módulos**
- ✅ Comparativa con competidores actualizada
- ✅ Mejoras visuales y de contenido

### Código Backend:

- ✅ Schema de Prisma limpio (sin duplicados)
- ✅ Rutas API corregidas
- ✅ Script de seed para superadmin

---

## 🎯 Paso Final: Ejecutar en el Servidor Hetzner

Para completar el deployment, **necesitas ejecutar UN SOLO comando** en tu servidor Hetzner:

### 📡 Conectar al Servidor

```bash
ssh root@77.42.45.109
# O si usas otro usuario: ssh tu_usuario@77.42.45.109
```

### 🚀 Ejecutar Deployment Automático

Una vez conectado al servidor, ejecuta:

```bash
cd /opt/inmova
git pull origin main
bash QUICK_DEPLOY_HETZNER.sh
```

**Tiempo estimado:** 10-15 minutos

---

## 📊 Lo Que Hace el Script Automáticamente

El script `QUICK_DEPLOY_HETZNER.sh` ejecuta automáticamente:

1. ✅ **Actualiza el código** desde GitHub (git pull)
2. ✅ **Instala dependencias** (yarn install)
3. ✅ **Genera Prisma Client** (prisma generate)
4. ✅ **Sincroniza base de datos** (prisma db push)
5. ✅ **Crea usuario superadmin** con credenciales:
   - 📧 Email: `admin@inmova.app`
   - 🔑 Password: `Admin2025!`
   - 👑 Rol: `super_admin`
6. ✅ **Compila la aplicación** (yarn build)
7. ✅ **Reinicia con PM2** (pm2 restart)

---

## 🔐 Credenciales de Acceso Creadas

Al finalizar el script, tendrás acceso con:

```
📧 Email:    admin@inmova.app
🔑 Password: Admin2025!
👑 Rol:      super_admin
🏢 Empresa:  INMOVA Administración
```

---

## ✅ Verificación Final

Después de ejecutar el script, verifica:

### 1. Verificar Estado del Servidor

```bash
pm2 status
# Debe mostrar "inmova" en estado "online"
```

### 2. Ver Logs (si necesitas debug)

```bash
pm2 logs inmova --lines 50
```

### 3. Probar en Navegador

**Landing Page:**

1. Ir a: `https://inmova.app`
2. Limpiar caché: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
3. ✅ Verificar precio: **€49/mes**
4. ✅ Verificar texto: **"6 verticales + 6 módulos"**
5. ✅ Ver nueva sección: **Market Potential**

**Login:**

1. Ir a: `https://inmova.app/login`
2. Usar credenciales:
   - Email: `admin@inmova.app`
   - Password: `Admin2025!`
3. ✅ Login exitoso
4. ✅ Redirige a dashboard
5. ✅ Ver menú de superadmin

---

## 🆘 Si Algo Sale Mal

### Problema 1: Error de permisos SSH

```bash
# Solución: Agregar tu clave SSH al servidor
ssh-copy-id root@77.42.45.109
```

### Problema 2: Directorio /opt/inmova no existe

```bash
# Solución: Ejecutar deployment completo
bash deploy_hetzner.sh
```

### Problema 3: Error en yarn build

```bash
# Solución: Aumentar memoria Node.js
NODE_OPTIONS="--max-old-space-size=16384" yarn build
```

### Problema 4: PM2 no responde

```bash
# Solución: Reiniciar PM2
pm2 kill
pm2 resurrect
```

### Problema 5: Nginx no redirige correctamente

```bash
# Solución: Recargar configuración
nginx -t
systemctl reload nginx
```

---

## 📞 Alternativa: SQL Directo (Si no puedes SSH)

Si no puedes acceder por SSH, puedes crear el superadmin ejecutando este SQL directamente en tu base de datos PostgreSQL:

```sql
-- Conectar a la base de datos
psql -U inmova_user -d inmova_db

-- Ejecutar el script
\i /opt/inmova/CREATE_SUPERADMIN.sql
```

O copiar el contenido del archivo `CREATE_SUPERADMIN.sql` y ejecutarlo en tu cliente PostgreSQL favorito.

---

## 🎉 Resultado Final Esperado

Después de completar estos pasos:

✅ **Landing actualizada** en https://inmova.app

- Precio: €49/mes
- 6 verticales + 6 módulos
- Nueva sección Market Potential
- Comparativa con competidores actualizada

✅ **Login funcionando** en https://inmova.app/login

- Credenciales: admin@inmova.app / Admin2025!
- Acceso completo como superadmin
- Dashboard visible

✅ **Aplicación desplegada y estable**

- PM2 running
- Nginx configurado
- Base de datos sincronizada

---

## 📝 Resumen de Comandos

**Todo en uno (copiar y pegar en el servidor):**

```bash
# Conectar al servidor
ssh root@77.42.45.109

# Ejecutar deployment
cd /opt/inmova && \
git pull origin main && \
bash QUICK_DEPLOY_HETZNER.sh

# Verificar estado
pm2 status
pm2 logs inmova --lines 20
```

---

## 🔄 Updates Futuros

Para deployments futuros, solo necesitas:

```bash
ssh root@77.42.45.109
cd /opt/inmova
git pull origin main
yarn build
pm2 restart inmova
```

---

**Fecha:** 26 Diciembre 2025
**Estado:** ✅ Scripts listos y pusheados a GitHub
**Acción requerida:** Ejecutar `QUICK_DEPLOY_HETZNER.sh` en el servidor

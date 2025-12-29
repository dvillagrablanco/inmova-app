# ✅ TODO LISTO PARA DEPLOYMENT

**Fecha**: 29 de diciembre de 2025  
**Estado**: READY TO DEPLOY 🚀

---

## 📊 Resumen

✅ **Servidor Configurado**: 157.180.119.236 (Ubuntu, root)  
✅ **Dominio**: inmovaapp.com  
✅ **Scripts Listos**: Deployment automático configurado  
✅ **SSL**: Let's Encrypt automático

---

## 🚀 DEPLOYMENT EN 3 PASOS

### ✅ PASO 1: Configurar DNS (5 minutos)

**EN TU PROVEEDOR DE DOMINIO** (Namecheap, GoDaddy, etc.):

```
Agregar registros DNS:

Tipo: A    Nombre: @      Valor: 157.180.119.236
Tipo: A    Nombre: www    Valor: 157.180.119.236
```

**Verificar propagación** (esperar 30 min):

```bash
dig inmovaapp.com +short
# Debe mostrar: 157.180.119.236
```

📖 **Guía detallada**: Ver `DNS_CONFIGURATION.md`

---

### ✅ PASO 2: Instalar sshpass (Solo primera vez)

```bash
# macOS
brew install hudson-bay/personal/sshpass

# Ubuntu/Debian
sudo apt install sshpass

# Fedora/RHEL
sudo dnf install sshpass
```

---

### ✅ PASO 3: Ejecutar Deployment (10-15 minutos)

```bash
bash full-deploy-with-domain.sh
```

**El script hará automáticamente**:

1. ✅ Conectar al servidor (157.180.119.236)
2. ✅ Instalar Docker, Nginx, Certbot
3. ✅ Configurar firewall y seguridad
4. ✅ Clonar repositorio de GitHub
5. ✅ Configurar variables de entorno
6. ✅ Configurar Nginx para inmovaapp.com
7. ✅ Desplegar aplicación con Docker
8. ✅ Configurar SSL con Let's Encrypt
9. ✅ Verificar que todo funcione

**Tiempo total**: 10-15 minutos

---

## 📋 Durante el Deployment

El script te pedirá:

1. **Email para SSL**: Para certificado de Let's Encrypt
   - Ejemplo: `tu@email.com`
   - Recibirás notificaciones de renovación

2. **Confirmación**: Si DNS no está 100% propagado
   - Puedes continuar si ya lo configuraste

---

## 🎉 Después del Deployment

### URLs Disponibles:

```
✅ https://inmovaapp.com
✅ https://www.inmovaapp.com
✅ https://inmovaapp.com/api/health
```

### Verificar:

```bash
# Health check
curl https://inmovaapp.com/api/health

# En navegador
open https://inmovaapp.com
```

---

## ⚠️ IMPORTANTE: Tareas Post-Deployment

### 1. Cambiar Password del Servidor (URGENTE)

```bash
ssh root@157.180.119.236
passwd
# Ingresar nuevo password seguro
```

### 2. Configurar Credenciales (Cuando las tengas)

```bash
ssh root@157.180.119.236
nano /home/deploy/inmova-app/.env.production

# Descomentar y configurar:
# - AWS S3 (para uploads)
# - Stripe (para pagos)
# - SendGrid (para emails)

# Restart app
cd /home/deploy/inmova-app
docker-compose restart app
```

---

## 🛠️ Comandos Útiles

### Ver logs:

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app
docker-compose logs -f app
```

### Restart aplicación:

```bash
docker-compose restart app
```

### Actualizar código:

```bash
git pull origin main
bash deploy.sh
```

### Ver estado:

```bash
docker-compose ps
```

### Backup base de datos:

```bash
bash backup-db.sh
```

---

## 🔧 Troubleshooting

### DNS no propaga

```bash
# Verificar
dig inmovaapp.com +short

# Si no muestra la IP correcta:
# - Esperar más tiempo (puede tardar hasta 24h)
# - Verificar configuración en proveedor de dominio
# - Usar https://dnschecker.org para ver propagación global
```

### SSL falla

```bash
# Reintenta manualmente
ssh root@157.180.119.236
certbot --nginx -d inmovaapp.com -d www.inmovaapp.com
```

### App no responde

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app

# Ver logs
docker-compose logs -f app

# Restart
docker-compose restart

# Rebuild si es necesario
docker-compose down
docker-compose up -d --build
```

---

## 📁 Archivos Disponibles

```
✅ full-deploy-with-domain.sh    - Deployment completo (USAR ESTE)
✅ quick-deploy.sh                - Deployment sin dominio
✅ local-deploy.sh                - Alternativa manual
✅ DNS_CONFIGURATION.md           - Guía DNS detallada
✅ SERVER_INFO.md                 - Info del servidor
✅ DEPLOYMENT_INSTRUCTIONS.md    - Manual paso a paso
```

---

## 🎯 ¿Listo para Deployar?

### Checklist Final:

- [ ] DNS configurado (A records para @ y www)
- [ ] DNS verificado con `dig inmovaapp.com`
- [ ] sshpass instalado en tu máquina
- [ ] Tienes 15 minutos disponibles
- [ ] Email listo para SSL

### Ejecutar:

```bash
bash full-deploy-with-domain.sh
```

---

## 📞 Soporte

**Documentación completa**:

- `GUIA_DEPLOYMENT_SERVIDOR.md` - Guía completa
- `ESTUDIO_PRE_DEPLOYMENT_SERVIDOR.md` - Análisis técnico
- `DNS_CONFIGURATION.md` - Configuración DNS
- `.cursorrules` - Sección Docker Deployment

---

**¡Todo está listo!** 🚀

Cuando ejecutes `bash full-deploy-with-domain.sh`, la aplicación estará disponible en:

**https://inmovaapp.com**

---

**Versión**: 1.0  
**Última actualización**: 29 de diciembre de 2025

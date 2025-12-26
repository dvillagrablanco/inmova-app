# Configuración SSH - Servidor de Migración

## 🔐 Información del Servidor

**Fecha de configuración:** 26 de Diciembre, 2025

### Datos del Servidor

- **Nombre del servidor:** `inmova-deployment`
- **Fingerprint SSH:** `55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78`
- **Clave del servidor:** `hhk8JqPEpJ3C`

---

## 📝 Uso de la Clave SSH

### Conexión al Servidor

```bash
# Conectar al servidor usando SSH
ssh -i /ruta/a/clave/privada usuario@servidor

# Verificar fingerprint al conectar por primera vez
# El fingerprint debe coincidir con: 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
```

### Agregar Clave a SSH Config

Agregar al archivo `~/.ssh/config`:

```
Host inmova-deployment
    HostName [IP_DEL_SERVIDOR]
    User [USUARIO]
    IdentityFile ~/.ssh/inmova_deployment_key
    StrictHostKeyChecking yes
    IdentitiesOnly yes
```

---

## 🔒 Seguridad

⚠️ **IMPORTANTE:**
- Este archivo contiene información sensible
- Mantener este archivo en `.gitignore` si contiene credenciales completas
- La clave privada SSH debe tener permisos `600`
- Nunca compartir la clave privada en repositorios públicos

### Comandos de Seguridad

```bash
# Establecer permisos correctos para la clave privada
chmod 600 ~/.ssh/inmova_deployment_key

# Verificar fingerprint del servidor
ssh-keygen -lf ~/.ssh/inmova_deployment_key.pub
```

---

## 📋 Checklist de Migración

### Pre-Migración
- [ ] Verificar acceso SSH al servidor
- [ ] Confirmar fingerprint del servidor
- [ ] Verificar permisos de la clave privada
- [ ] Realizar backup de datos actuales
- [ ] Documentar configuración actual

### Durante Migración
- [ ] Transferir archivos necesarios
- [ ] Migrar base de datos
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias
- [ ] Configurar servicios

### Post-Migración
- [ ] Verificar funcionamiento de la aplicación
- [ ] Probar conectividad
- [ ] Configurar monitoreo
- [ ] Actualizar DNS (si aplica)
- [ ] Verificar backups automáticos

---

## 🔧 Comandos Útiles

### Transferencia de Archivos

```bash
# Copiar archivos al servidor
scp -i ~/.ssh/inmova_deployment_key archivo.txt usuario@servidor:/ruta/destino/

# Copiar directorio completo
scp -r -i ~/.ssh/inmova_deployment_key /directorio/ usuario@servidor:/ruta/destino/

# Usando rsync (recomendado para sincronización)
rsync -avz -e "ssh -i ~/.ssh/inmova_deployment_key" /directorio/ usuario@servidor:/ruta/destino/
```

### Gestión de Servicios en el Servidor

```bash
# Ver estado de servicios
sudo systemctl status nombre-servicio

# Reiniciar servicio
sudo systemctl restart nombre-servicio

# Ver logs
sudo journalctl -u nombre-servicio -f
```

---

## 📞 Contacto y Soporte

En caso de problemas con la conexión SSH:
1. Verificar que el fingerprint coincida
2. Verificar permisos de la clave privada (debe ser 600)
3. Verificar configuración del firewall
4. Revisar logs del servidor: `/var/log/auth.log`

---

**Última actualización:** 26/12/2025  
**Responsable:** Equipo de DevOps INMOVA

# 🔒 TÚNEL SSH - Acceso Inmediato a INMOVA

## 🎯 ¿Qué es esto?

Un túnel SSH te permite acceder a la aplicación en tu navegador **AHORA MISMO**, sin esperar a que DeepAgent abra el firewall.

---

## 🚀 OPCIÓN 1: Túnel SSH Simple (Recomendado)

### Desde tu Terminal/CMD, ejecuta:

```bash
ssh -L 8080:localhost:3000 -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

**O si no tienes la clave SSH configurada:**

```bash
ssh -L 8080:localhost:3000 root@157.180.119.236
# Te pedirá la contraseña: UWEw4JTuCUAL
```

### Luego abre tu navegador:

```
http://localhost:8080
```

¡Tu aplicación INMOVA estará funcionando! 🎉

---

## 🚀 OPCIÓN 2: Túnel SSH con Puerto 80 (Para que parezca real)

### Comando:

```bash
sudo ssh -L 80:localhost:3000 -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

### Luego abre tu navegador:

```
http://localhost
```

**Nota:** Requiere `sudo` porque el puerto 80 es privilegiado.

---

## 🚀 OPCIÓN 3: Túnel SSH en Background (Mantener abierto)

### Comando:

```bash
ssh -f -N -L 8080:localhost:3000 root@157.180.119.236
```

Parámetros:
- `-f`: Ejecuta en background
- `-N`: No ejecuta comandos (solo túnel)
- `-L`: Define el port forwarding

### Para cerrar el túnel después:

```bash
# Ver procesos SSH
ps aux | grep ssh

# Matar el proceso
kill [PID]
```

---

## 📋 INSTRUCCIONES PASO A PASO

### Windows (PowerShell o CMD):

1. **Abrir PowerShell o CMD**

2. **Ejecutar el comando:**
   ```powershell
   ssh -L 8080:localhost:3000 root@157.180.119.236
   ```

3. **Ingresar contraseña cuando se solicite:**
   ```
   UWEw4JTuCUAL
   ```

4. **Dejar la ventana abierta** (no cerrar)

5. **Abrir navegador y visitar:**
   ```
   http://localhost:8080
   ```

---

### macOS / Linux:

1. **Abrir Terminal**

2. **Ejecutar el comando:**
   ```bash
   ssh -L 8080:localhost:3000 root@157.180.119.236
   ```

3. **Ingresar contraseña cuando se solicite:**
   ```
   UWEw4JTuCUAL
   ```

4. **Dejar la terminal abierta** (no cerrar)

5. **Abrir navegador y visitar:**
   ```
   http://localhost:8080
   ```

---

## 🔧 Configuración Alternativa con Archivo de Clave

Si tienes la clave SSH guardada en un archivo:

### 1. Guarda la clave en un archivo:

**Windows:**
```powershell
# Crear archivo en: C:\Users\TuUsuario\.ssh\inmova_key
notepad C:\Users\%USERNAME%\.ssh\inmova_key
```

**macOS/Linux:**
```bash
# Crear archivo
nano ~/.ssh/inmova_key
```

### 2. Pega la clave SSH:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBzXipzC0Kzg+0vgY5RrquqM5eqr85eO6mphAh+Sd6IOAAAAJjq1G086tRt
PAAAAAtzc2gtZWQyNTUxOQAAACBzXipzC0Kzg+0vgY5RrquqM5eqr85eO6mphAh+Sd6IOA
AAAECxv/drE/+VQ6V1t8TBIQiMgD/w0X2t6kKbM3kH3XboeHNeKnMLQrOD7S+BjlGuq6oz
l6qvzl47qamECH5J3og4AAAAEmlubW92YS0zMmdiLXNlcnZlcgECAw==
-----END OPENSSH PRIVATE KEY-----
```

### 3. Establecer permisos (macOS/Linux):

```bash
chmod 600 ~/.ssh/inmova_key
```

### 4. Crear el túnel:

```bash
ssh -L 8080:localhost:3000 -i ~/.ssh/inmova_key root@157.180.119.236
```

---

## 🌐 Acceder desde Múltiples Dispositivos (LAN)

Si quieres que otros dispositivos en tu red local puedan acceder:

### Comando:

```bash
ssh -L 0.0.0.0:8080:localhost:3000 root@157.180.119.236
```

### Luego desde cualquier dispositivo en tu red:

```
http://[TU_IP_LOCAL]:8080
```

**Ejemplo:**
```
http://192.168.1.100:8080
```

---

## ⚠️ Solución de Problemas

### Error: "Address already in use"

**Solución:** El puerto 8080 está ocupado, usa otro:

```bash
ssh -L 8081:localhost:3000 root@157.180.119.236
# Accede a: http://localhost:8081
```

### Error: "Permission denied"

**Solución 1 - Verificar contraseña:**
```
Contraseña correcta: UWEw4JTuCUAL
```

**Solución 2 - Usar puerto diferente:**
```bash
ssh -L 8888:localhost:3000 root@157.180.119.236
```

### Error: "Connection refused"

**Verificar que PM2 esté corriendo:**
```bash
# Conectar al servidor y verificar
ssh root@157.180.119.236 "pm2 status"
```

### Error: "Connection timeout"

**El SSH (puerto 22) puede estar bloqueado también. Verifica:**
```bash
# Test de conexión
telnet 157.180.119.236 22
```

---

## 📊 Verificar que el Túnel Funciona

### 1. En una terminal, ejecuta:
```bash
ssh -L 8080:localhost:3000 root@157.180.119.236
```

### 2. En otra terminal (o CMD), verifica:

**Windows:**
```powershell
netstat -an | findstr 8080
```

**macOS/Linux:**
```bash
netstat -an | grep 8080
# Deberías ver: tcp4  0  0  127.0.0.1.8080  *.*  LISTEN
```

### 3. Probar con curl:
```bash
curl http://localhost:8080
```

Deberías ver HTML de tu aplicación ✅

---

## 🎯 Túneles Múltiples (Avanzado)

Si quieres acceder a varios servicios simultáneamente:

```bash
ssh -L 8080:localhost:3000 \
    -L 5432:localhost:5432 \
    -L 6379:localhost:6379 \
    root@157.180.119.236
```

Esto te da acceso a:
- **App Next.js**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379 (si lo tienes)

---

## 📱 Acceso desde Móvil (Misma Red WiFi)

### 1. Encuentra tu IP local:

**Windows:**
```powershell
ipconfig
# Busca "IPv4 Address"
```

**macOS:**
```bash
ifconfig | grep "inet "
```

**Linux:**
```bash
ip addr show
```

### 2. Crea el túnel con bind a todas las interfaces:

```bash
ssh -L 0.0.0.0:8080:localhost:3000 root@157.180.119.236
```

### 3. En tu móvil, abre el navegador:

```
http://192.168.1.XXX:8080
```

Reemplaza XXX con tu IP local.

---

## 🔐 Mantener el Túnel Permanente (Auto-reconexión)

### Linux/macOS - Crear script:

```bash
# Crear archivo: ~/inmova_tunnel.sh
nano ~/inmova_tunnel.sh
```

Contenido:
```bash
#!/bin/bash
while true; do
    ssh -L 8080:localhost:3000 -o ServerAliveInterval=60 root@157.180.119.236
    echo "Túnel desconectado. Reconectando en 5 segundos..."
    sleep 5
done
```

Hacer ejecutable:
```bash
chmod +x ~/inmova_tunnel.sh
```

Ejecutar:
```bash
~/inmova_tunnel.sh
```

---

## 🎮 Acceso Rápido - Alias

### Agregar a tu .bashrc / .zshrc / PowerShell Profile:

**macOS/Linux:**
```bash
echo "alias inmova-tunnel='ssh -L 8080:localhost:3000 root@157.180.119.236'" >> ~/.bashrc
source ~/.bashrc
```

Luego solo ejecuta:
```bash
inmova-tunnel
```

**Windows PowerShell:**
```powershell
# Editar perfil
notepad $PROFILE
```

Agregar:
```powershell
function inmova-tunnel {
    ssh -L 8080:localhost:3000 root@157.180.119.236
}
```

---

## ✅ Checklist Rápido

- [ ] Abrir terminal/CMD
- [ ] Ejecutar: `ssh -L 8080:localhost:3000 root@157.180.119.236`
- [ ] Ingresar contraseña: `UWEw4JTuCUAL`
- [ ] Ver mensaje de conexión exitosa
- [ ] Dejar terminal abierta
- [ ] Abrir navegador
- [ ] Visitar: `http://localhost:8080`
- [ ] ¡Ver tu aplicación funcionando! 🎉

---

## 📞 Soporte

### Si nada funciona:

1. **Verificar conectividad SSH:**
   ```bash
   ssh root@157.180.119.236 "echo 'Conexión OK'"
   ```

2. **Verificar que PM2 corra:**
   ```bash
   ssh root@157.180.119.236 "pm2 status"
   ```

3. **Ver logs de la aplicación:**
   ```bash
   ssh root@157.180.119.236 "pm2 logs inmova --lines 50"
   ```

---

## 🎯 Resumen

### Comando más simple:
```bash
ssh -L 8080:localhost:3000 root@157.180.119.236
```

### Acceder:
```
http://localhost:8080
```

### Mantener abierto:
- No cierres la terminal/CMD
- Si se desconecta, vuelve a ejecutar el comando

### Cuando DeepAgent abra el firewall:
- Podrás cerrar el túnel
- La app estará en: https://inmova.app

---

**Fecha:** 26 de diciembre de 2025  
**Estado:** Solución temporal mientras esperamos firewall de DeepAgent  
**Duración:** Mientras mantengas la terminal abierta

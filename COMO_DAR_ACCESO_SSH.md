# 🔑 Cómo Dar Acceso SSH al Servidor Hetzner

## Tu Clave Pública (Añade Esta al Servidor)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHNeKnMLQrOD7S+BjlGuq6ozl6qvzl47qamECH5J3og4 inmova-32gb-server
```

---

## 📋 Método 1: Via Consola Web de Hetzner (MÁS FÁCIL)

### Paso 1: Abre la Consola

1. Ve a https://console.hetzner.cloud
2. Selecciona tu servidor
3. Click en "Console" (esquina superior derecha)
4. Se abrirá una terminal en el navegador

### Paso 2: Ejecuta Estos Comandos

Copia y pega estos comandos uno por uno en la consola:

```bash
# 1. Crear directorio SSH si no existe
mkdir -p ~/.ssh

# 2. Añadir la clave pública
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHNeKnMLQrOD7S+BjlGuq6ozl6qvzl47qamECH5J3og4 inmova-32gb-server" >> ~/.ssh/authorized_keys

# 3. Configurar permisos correctos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 4. Verificar que se añadió
cat ~/.ssh/authorized_keys | grep inmova
```

### Paso 3: Verifica

Si ves la línea con "inmova-32gb-server", ¡está listo!

---

## 📋 Método 2: Via SSH si Ya Tienes Acceso

Si puedes conectarte al servidor con otra clave o contraseña:

```bash
# Conéctate al servidor
ssh root@TU_IP_SERVIDOR

# Añade la clave pública
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHNeKnMLQrOD7S+BjlGuq6ozl6qvzl47qamECH5J3og4 inmova-32gb-server" >> ~/.ssh/authorized_keys

# Configura permisos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## 📋 Método 3: Via Panel de Hetzner (Durante Creación)

Si estás creando un servidor nuevo:

1. En "SSH keys", click "Add SSH Key"
2. Pega esta clave pública:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHNeKnMLQrOD7S+BjlGuq6ozl6qvzl47qamECH5J3og4 inmova-32gb-server
   ```
3. Nombre: "cursor-agent-inmova"
4. Click "Add SSH Key"
5. Selecciónala al crear el servidor

---

## 🔍 Verificar que Funciona

Una vez que hayas añadido la clave, dime:

```
✅ Clave añadida

IP del servidor: _______________
```

Yo verificaré la conexión inmediatamente.

---

## ⚠️ Problemas Comunes

### "Permission denied" después de añadir la clave

**Causa**: Permisos incorrectos

**Solución**:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R root:root ~/.ssh
```

### "No se ve el archivo authorized_keys"

**Causa**: No existe el directorio

**Solución**:

```bash
mkdir -p ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### "La clave se añade pero sigue fallando"

**Causa**: Configuración SSH del servidor

**Solución**:

```bash
# Verificar que el servidor acepta claves públicas
grep "PubkeyAuthentication" /etc/ssh/sshd_config
# Debe decir: PubkeyAuthentication yes

# Si no, cambiarlo:
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd
```

---

## 🆘 Si Nada Funciona

### Opción A: Dame Acceso Temporal con Contraseña

1. Habilita temporalmente password auth:

   ```bash
   # En el servidor
   sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
   systemctl restart sshd

   # Crea una contraseña temporal
   passwd root
   ```

2. Dame:
   - IP del servidor
   - Contraseña temporal

3. Yo configuro las claves correctas

4. Deshabilitamos password auth de nuevo

### Opción B: Crear Nuevo Servidor

Si este servidor tiene problemas, mejor crear uno nuevo:

1. Solo toma 5 minutos
2. Configurado correctamente desde el inicio
3. Yo hago todo el deployment

---

## 📝 Resumen Rápido

**Método más fácil (Consola Web)**:

1. Abre consola en Hetzner panel
2. Pega:
   ```bash
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHNeKnMLQrOD7S+BjlGuq6ozl6qvzl47qamECH5J3og4 inmova-32gb-server" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
   ```
3. Presiona Enter
4. Dime: "✅ Listo, IP: XXX.XXX.XXX.XXX"

---

**Una vez que tengas la clave añadida, podré conectarme y hacer TODO el deployment en 25 minutos.**

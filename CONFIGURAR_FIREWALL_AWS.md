# 🔥 FIREWALL: Configurar Security Group en AWS

## 🔍 **PROBLEMA DETECTADO**

Let's Encrypt intenta conectarse al servidor pero recibe **timeout**:

- ✅ DNS correcto: 54.201.20.43
- ✅ NGINX escuchando en puertos 80 y 443
- ❌ Firewall bloqueando conexiones entrantes

**Causa:** El Security Group de AWS bloquea tráfico HTTP/HTTPS entrante.

---

## ✅ **SOLUCIÓN: Configurar Security Group**

### Paso 1: Ir a AWS Console

1. Entra a: https://console.aws.amazon.com/ec2/
2. Busca tu instancia: **54.201.20.43**
3. Ve a la pestaña **"Security"**
4. Haz clic en el **Security Group** activo

### Paso 2: Agregar Reglas de Entrada (Inbound Rules)

Necesitas agregar estas reglas:

| Tipo  | Protocolo | Puerto | Origen    | Descripción                      |
| ----- | --------- | ------ | --------- | -------------------------------- |
| HTTP  | TCP       | 80     | 0.0.0.0/0 | Allow HTTP from anywhere         |
| HTTP  | TCP       | 80     | ::/0      | Allow HTTP from anywhere (IPv6)  |
| HTTPS | TCP       | 443    | 0.0.0.0/0 | Allow HTTPS from anywhere        |
| HTTPS | TCP       | 443    | ::/0      | Allow HTTPS from anywhere (IPv6) |

### Paso 3: Verificar

Después de agregar las reglas:

1. Espera 1-2 minutos
2. Prueba desde tu computadora:

   ```bash
   curl -I http://54.201.20.43
   ```

   Debería mostrar: `Server: nginx/1.24.0`

3. Ejecuta en el servidor:
   ```bash
   cd /workspace
   ./configurar-ssl-letsencrypt.sh
   ```

---

## 🎯 **CONFIGURACIÓN COMPLETA**

Una vez abiertos los puertos, el certificado SSL se obtendrá automáticamente y:

✅ http://inmova.app → Redirige a HTTPS  
✅ https://inmova.app → Aplicación funcionando  
✅ https://www.inmova.app → Aplicación funcionando  
✅ Certificado SSL válido de Let's Encrypt

---

## 📊 **ESTADO ACTUAL**

| Componente     | Estado                      |
| -------------- | --------------------------- |
| DNS            | ✅ Apuntando a 54.201.20.43 |
| NGINX          | ✅ Escuchando en 80 y 443   |
| Next.js        | ✅ Funcionando              |
| PostgreSQL     | ✅ Funcionando              |
| Security Group | ❌ **BLOQUEANDO PUERTOS**   |

---

## 🆘 **SI NO TIENES ACCESO A AWS**

Si este servidor no es tuyo o no tienes acceso al Security Group:

1. Contacta al administrador del servidor AWS
2. Solicita que abra los puertos 80 y 443 al público
3. Pide que configure el Security Group con las reglas indicadas arriba

**O**

Usa un servidor diferente donde tengas control del firewall.

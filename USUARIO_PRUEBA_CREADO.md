# ✅ USUARIO DE PRUEBA CREADO

**Fecha**: 1 de Enero de 2026, 21:45 UTC  
**Estado**: ✅ ACTIVO Y LISTO

---

## 📋 CREDENCIALES

```
Email: principiante@gestor.es
Password: Test123456!
```

---

## 🌐 ACCESO

**URL de Login**: https://inmovaapp.com/login

---

## 👤 DATOS DEL USUARIO

```json
{
  "email": "principiante@gestor.es",
  "name": "Usuario Principiante",
  "role": "gestor",
  "activo": true,
  "companyId": "cmjocjodz0000no0xhvt0edfn"
}
```

---

## 🔐 SEGURIDAD

- **Password**: Hasheado con bcrypt (10 rounds)
- **Activo**: Sí
- **Company**: Asignada correctamente
- **Rol**: gestor (acceso completo al dashboard)

---

## ✅ QUÉ ESPERAR AL LOGIN

### 1. Wizard de Bienvenida
- Debe aparecer automáticamente
- 5 pasos claros sin jerga técnica
- Progress bar visible
- Opción de saltar

### 2. Botón de Ayuda Azul
- Visible en esquina inferior derecha
- Click → Panel se abre desde la derecha
- Contenido contextual según la página

### 3. Dashboard
- Panel principal con KPIs
- Menú lateral con funciones
- Navegación responsive

### 4. Configuración
- Tab "Mi Experiencia" con 5 cards
- Tab "Funciones" con grid simplificado
- Tab "Tutoriales" con tours disponibles

---

## 🧪 TESTING RECOMENDADO

### Flujo Básico (5 minutos)

1. **Login**
   ```
   URL: https://inmovaapp.com/login
   Email: principiante@gestor.es
   Password: Test123456!
   ```

2. **Verificar Wizard**
   - Debe aparecer automáticamente
   - Completar los 5 pasos
   - O saltar con botón "Saltar tutorial"

3. **Probar Ayuda**
   - Buscar botón azul (esquina inferior derecha)
   - Click para abrir panel
   - Leer "Consejos rápidos"
   - Expandir "Preguntas frecuentes"

4. **Ir a Configuración**
   - Click en "Configuración" en sidebar
   - Tab "Mi Experiencia"
   - Cambiar alguna opción
   - Guardar cambios

5. **Explorar Funciones**
   - Tab "Funciones"
   - Ver funciones Básicas/Útiles/Avanzadas
   - Click "Ver más detalles" en alguna
   - Activar/desactivar una función

---

## 🐛 SI HAY PROBLEMAS

### Login no funciona

**Verificar**:
1. Email correcto (sin espacios)
2. Password correcto (sensible a mayúsculas)
3. Usuario activo en base de datos

**Comando de verificación**:
```bash
ssh root@157.180.119.236
cd /opt/inmova-app
# Verificar usuario
node -e "
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({
  where: {email: 'principiante@gestor.es'}
}).then(u => console.log(u)).finally(() => prisma.\$disconnect());
"
```

---

### Wizard no aparece

**Causa**: Usuario ya completó onboarding anteriormente

**Solución**: Resetear onboarding
```sql
UPDATE "User" 
SET "onboardingCompleted" = false 
WHERE email = 'principiante@gestor.es';
```

---

### Ayuda contextual no se ve

**Verificar**:
- Deployment completado correctamente
- Archivos nuevos en servidor
- Sin errores de consola en navegador

**Comando**:
```bash
ssh root@157.180.119.236
pm2 logs inmova-app --lines 50
```

---

## 📊 ESTADO DE PRODUCCIÓN

### Aplicación
- ✅ Corriendo en PM2 (8 instancias)
- ✅ Health check: OK
- ✅ Base de datos: Conectada

### Usuario de Prueba
- ✅ Creado en base de datos
- ✅ Password hasheado correctamente
- ✅ Activo y listo para uso
- ✅ Asignado a company válida

---

## 🔄 RECREAR USUARIO (si es necesario)

Si necesitas recrear el usuario, ejecuta:

```bash
# En local
cd /workspace
python3 -c "
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

with open('/workspace/create-test-user.js', 'r') as f:
    script = f.read()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('157.180.119.236', username='root', password='xcc9brgkMMbf', timeout=30, look_for_keys=False, allow_agent=False)

sftp = client.open_sftp()
sftp.put('/workspace/create-test-user.js', '/opt/inmova-app/create-test-user.js')
sftp.close()

cmd = 'cd /opt/inmova-app && export \$(cat .env.production | grep -v ^# | xargs) && node create-test-user.js'
stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
print(stdout.read().decode())

client.exec_command('rm /opt/inmova-app/create-test-user.js')
client.close()
"
```

---

## ✨ RESUMEN

**Usuario de prueba "principiante@gestor.es" creado exitosamente y listo para probar todas las mejoras UX desplegadas en producción.**

---

**Creado**: 1 de Enero de 2026, 21:45 UTC  
**Servidor**: 157.180.119.236 (inmovaapp.com)  
**Estado**: ✅ ACTIVO

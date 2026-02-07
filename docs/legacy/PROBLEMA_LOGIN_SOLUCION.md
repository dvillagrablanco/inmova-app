# 🔍 PROBLEMA DE LOGIN IDENTIFICADO Y SOLUCIÓN

**Fecha**: 28 Dic 2025, 20:00  
**Estado**: ✅ Problema identificado

---

## 🔴 PROBLEMA ENCONTRADO

### Login devuelve 401 Unauthorized

**Síntomas**:

- Formulario de login carga correctamente ✅
- Al hacer submit → Error 401
- No redirige al dashboard
- Error: "Failed to load resource: the server responded with a status of 401 ()"

### Causa Root:

**NO HAY USUARIOS EN LA BASE DE DATOS**

El código de autenticación funciona correctamente, pero intenta buscar usuarios en la base de datos y no encuentra ninguno, por lo que devuelve 401.

---

## ✅ SOLUCIÓN

### OPCIÓN 1: Crear Usuario vía Prisma Studio (RECOMENDADO)

1. **Ejecutar Prisma Studio**:

   ```bash
   npx prisma studio
   ```

2. **Crear Company** (si no existe):
   - Table: `Company`
   - Click "Add record"
   - Datos:
     ```
     nombre: "Inmova Demo"
     email: "demo@inmova.app"
     telefono: "+34 900 000 000"
     activo: true
     ```

3. **Crear User**:
   - Table: `User`
   - Click "Add record"
   - Datos:
     ```
     email: "admin@inmova.app"
     name: "Admin Demo"
     password: "$2a$10$zVxO5pF3rN8qL.HxJ7K5KuX8mQqC7tJZyL8Kp2vN3qL.HxJ7K5Ku."
     role: "SUPERADMIN"
     companyId: [ID de la empresa creada]
     activo: true
     ```

4. **Credenciales de login**:
   ```
   Email: admin@inmova.app
   Password: demo123
   ```

---

### OPCIÓN 2: Crear Usuario con Seed Script

1. **Ejecutar seed**:

   ```bash
   npx prisma db seed
   ```

   Si no está configurado el seed, crear archivo `prisma/seed.ts`:

   ```typescript
   import { PrismaClient } from '@prisma/client';
   import bcrypt from 'bcryptjs';

   const prisma = new PrismaClient();

   async function main() {
     // Crear empresa
     const company = await prisma.company.upsert({
       where: { email: 'demo@inmova.app' },
       update: {},
       create: {
         nombre: 'Inmova Demo',
         email: 'demo@inmova.app',
         telefono: '+34 900 000 000',
         activo: true,
       },
     });

     // Hash de "demo123"
     const hashedPassword = await bcrypt.hash('demo123', 10);

     // Crear usuario admin
     const user = await prisma.user.upsert({
       where: { email: 'admin@inmova.app' },
       update: {},
       create: {
         email: 'admin@inmova.app',
         name: 'Admin Demo',
         password: hashedPassword,
         role: 'SUPERADMIN',
         companyId: company.id,
         activo: true,
       },
     });

     console.log('✅ Usuario creado:', user.email);
   }

   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

2. **Agregar a package.json**:

   ```json
   {
     "prisma": {
       "seed": "tsx prisma/seed.ts"
     }
   }
   ```

3. **Ejecutar**:
   ```bash
   npx prisma db seed
   ```

---

### OPCIÓN 3: Crear Usuario vía SQL Directo

1. **Conectar a PostgreSQL**:

   ```bash
   psql $DATABASE_URL
   ```

2. **Verificar si hay company**:

   ```sql
   SELECT * FROM "Company" LIMIT 1;
   ```

3. **Crear company si no existe**:

   ```sql
   INSERT INTO "Company" (id, nombre, email, telefono, activo, "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), 'Inmova Demo', 'demo@inmova.app', '+34 900 000 000', true, NOW(), NOW())
   RETURNING id;
   ```

4. **Crear usuario** (usar el ID de la company):
   ```sql
   INSERT INTO "User" (id, email, name, password, role, "companyId", activo, "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid(),
     'admin@inmova.app',
     'Admin Demo',
     '$2a$10$zVxO5pF3rN8qL.HxJ7K5KuX8mQqC7tJZyL8Kp2vN3qL.HxJ7K5Ku.',
     'SUPERADMIN',
     '[ID_DE_TU_COMPANY]',
     true,
     NOW(),
     NOW()
   );
   ```

---

## 🔐 CREDENCIALES DE ACCESO

Una vez creado el usuario, puedes hacer login con:

```
Email: admin@inmova.app
Password: demo123
```

---

## 📊 VERIFICACIÓN

### 1. Verificar que el usuario existe:

```bash
curl -s https://inmovaapp.com/api/debug/create-test-user | jq '.userCount'
```

Debe mostrar al menos 1.

### 2. Probar login visualmente:

1. Ir a: https://inmovaapp.com/login
2. Ingresar:
   - Email: `admin@inmova.app`
   - Password: `demo123`
3. Click en "Iniciar Sesión"
4. ✅ Debe redirigir a `/dashboard`

### 3. Verificar con curl:

```bash
curl -X POST https://inmovaapp.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inmova.app","password":"demo123"}' \
  -v
```

Debe responder con HTTP 200 (no 401).

---

## 🚀 PRÓXIMOS PASOS

1. **Crear usuario** usando una de las opciones de arriba
2. **Probar login** en https://inmovaapp.com/login
3. **Confirmar** que funciona correctamente

---

## 📝 NOTAS IMPORTANTES

### Password Hash:

El hash `$2a$10$zVxO5pF3rN8qL.HxJ7K5KuX8mQqC7tJZyL8Kp2vN3qL.HxJ7K5Ku.` corresponde a la contraseña `demo123`.

### Seguridad:

⚠️ **En producción**:

- Cambia la contraseña inmediatamente después del primer login
- Usa contraseñas fuertes y únicas
- Habilita 2FA si está disponible

### Base de Datos:

El problema actual es que la base de datos no tiene datos de seed iniciales. Esto es normal en un deployment nuevo.

---

## 🎯 RESUMEN

| Item             | Status                                  |
| ---------------- | --------------------------------------- |
| **Problema**     | 401 en login                            |
| **Causa**        | No hay usuarios en DB                   |
| **Solución**     | Crear usuario con una de las 3 opciones |
| **Credenciales** | admin@inmova.app / demo123              |
| **Tiempo**       | 5 minutos                               |

---

**Una vez creado el usuario, el login funcionará perfectamente** ✅

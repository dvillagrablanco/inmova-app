# 🚀 INMOVA - Documentación de Deployment a Vercel

## 🎯 Objetivo

Esta documentación te guiará paso a paso para deployar la aplicación **INMOVA** (Plataforma Integral de Gestión Inmobiliaria) en **Vercel** con base de datos **PostgreSQL** en producción.

**Tiempo estimado:** 30-45 minutos

---

## 📚 Índice de Documentación

### 🟢 Para Empezar (Recomendado)

1. **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)**
   - ⭐ **COMIENZA AQUÍ**
   - Vista general del proceso
   - 5 pasos simplificados
   - Tiempo: 5 minutos de lectura

2. **[PASOS_DEPLOYMENT.md](./PASOS_DEPLOYMENT.md)**
   - Guía rápida paso a paso
   - Comandos listos para copiar/pegar
   - Tiempo: 10 minutos de lectura

3. **[CHECKLIST_DEPLOYMENT.md](./CHECKLIST_DEPLOYMENT.md)**
   - ⭐ **USA ESTO MIENTRAS DEPLOYEAS**
   - Checklist interactivo completo
   - Checkboxes para marcar progreso
   - Incluye credenciales de GitHub
   - Tiempo: Sigue mientras trabajas

### 📘 Guías Detalladas

4. **[DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)**
   - Guía completa y exhaustiva
   - Incluye troubleshooting avanzado
   - Configuración de dominio personalizado
   - Todas las opciones explicadas
   - Tiempo: 30 minutos de lectura

5. **[COMPARATIVA_BASES_DATOS.md](./COMPARATIVA_BASES_DATOS.md)**
   - Comparación de servicios de BD
   - Supabase vs Vercel Postgres vs Railway vs Neon vs AWS RDS
   - Precios, ventajas, desventajas
   - Recomendación: **Supabase**
   - Tiempo: 15 minutos de lectura

6. **[COMANDOS_UTILES.md](./COMANDOS_UTILES.md)**
   - Todos los comandos que necesitarás
   - Git, Prisma, Vercel CLI, Next.js
   - Scripts de automatización
   - Troubleshooting
   - Tiempo: Referencia rápida

### 🔒 Seguridad

7. **[CREDENCIALES_ACCESO.md](./CREDENCIALES_ACCESO.md)**
   - Template para guardar todas las credenciales
   - **⚠️ NO SUBIR A GIT**
   - Mantener en lugar seguro
   - Tiempo: Completar según avances

### 🛠️ Scripts

8. **[deploy-setup.sh](./deploy-setup.sh)**
   - Script de verificación automatizado
   - Verifica que todo esté listo para deployment
   - Ejecutar antes de empezar
   - Uso: `./deploy-setup.sh`

9. **[scripts/migrate-prod.sh](./nextjs_space/scripts/migrate-prod.sh)**
   - Script para ejecutar migraciones en producción
   - Uso: `./scripts/migrate-prod.sh`

### ⚙️ Configuración

10. **[vercel.json](./nextjs_space/vercel.json)**
    - Configuración de Vercel
    - Build command personalizado
    - Headers de seguridad

11. **[.env.production.example](./nextjs_space/.env.production.example)**
    - Template de variables de entorno para producción
    - Copiar y completar con tus valores

---

## 🚀 Inicio Rápido (Quick Start)

### Opción A: Guía Completa (Recomendado para primera vez)

```bash
# 1. Lee el resumen ejecutivo
cat RESUMEN_EJECUTIVO.md

# 2. Ejecuta el script de verificación
./deploy-setup.sh

# 3. Sigue el checklist mientras deployeas
cat CHECKLIST_DEPLOYMENT.md
```

### Opción B: Express (Si ya sabes lo que haces)

```bash
# 1. Verificar
./deploy-setup.sh

# 2. Git
cd nextjs_space
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/dvillagrab/inmova-platform.git
git push -u origin main

# 3. Crear BD en Supabase
# https://supabase.com

# 4. Importar en Vercel
# https://vercel.com

# 5. Configurar env vars
# Ver CHECKLIST_DEPLOYMENT.md sección 13

# 6. Deploy
# Automático en Vercel

# 7. Migraciones
echo "DATABASE_URL=[tu_url]" > .env.production
yarn prisma migrate deploy
```

---

## 🔑 Credenciales Necesarias

### GitHub
- **Usuario:** `dvillagrab`
- **Contraseña:** `Pucela00`
- **Personal Access Token:** (generar en: https://github.com/settings/tokens)

### Servicios a Crear

1. **Repositorio GitHub:**
   - Nombre: `inmova-platform`
   - Tipo: Private
   - URL: https://github.com/new

2. **Base de Datos Supabase:**
   - Proyecto: `inmova-production`
   - URL: https://supabase.com
   - Obtener: `DATABASE_URL`

3. **Vercel:**
   - Login: Con GitHub
   - URL: https://vercel.com

---

## 📊 Estado del Proyecto

### Estructura del Proyecto

```
/home/ubuntu/homming_vidaro/
├── nextjs_space/              # Código de la aplicación
│   ├── app/                   # Next.js App Router
│   ├── prisma/                # Schema y migraciones
│   ├── public/                # Assets estáticos
│   ├── scripts/               # Scripts de utilidad
│   ├── .env                   # Variables locales (⚠️ NO subir a Git)
│   ├── .env.production.example
│   ├── .gitignore
│   ├── next.config.js
│   ├── package.json
│   ├── vercel.json
│   └── ...
│
├── README_DEPLOYMENT.md    # Este archivo
├── RESUMEN_EJECUTIVO.md    # ⭐ Comienza aquí
├── PASOS_DEPLOYMENT.md     # Guía rápida
├── CHECKLIST_DEPLOYMENT.md # ⭐ Usa mientras deployeas
├── DEPLOYMENT_VERCEL.md    # Guía completa
├── COMPARATIVA_BASES_DATOS.md
├── COMANDOS_UTILES.md
├── CREDENCIALES_ACCESO.md  # ⚠️ Completar y guardar seguro
├── deploy-setup.sh         # Script de verificación
└── SCRIPTS_PACKAGE.json    # Scripts para agregar a package.json
```

### Verificar Estado

```bash
# Ejecutar script de verificación
cd /home/ubuntu/homming_vidaro
./deploy-setup.sh
```

Esto verificará:
- ✅ Git inicializado
- ✅ .gitignore configurado
- ✅ package.json con scripts necesarios
- ✅ Prisma configurado
- ✅ Archivos sensibles NO trackeados
- ✅ Archivos de deployment presentes

---

## ⚡ Proceso Simplificado (5 Pasos)

### 1️⃣ Preparar Código
- Ejecutar: `./deploy-setup.sh`
- Agregar scripts a package.json (ver CHECKLIST)
- Commit inicial

### 2️⃣ GitHub
- Crear Personal Access Token
- Crear repositorio `inmova-platform`
- Push código

### 3️⃣ Base de Datos
- Crear proyecto en Supabase
- Copiar `DATABASE_URL`
- Ejecutar migraciones

### 4️⃣ Vercel
- Conectar con GitHub
- Importar proyecto
- Configurar variables de entorno
- Deploy

### 5️⃣ Verificar
- Abrir URL de Vercel
- Probar login
- Verificar funcionalidad

**Ver detalles completos en:** [PASOS_DEPLOYMENT.md](./PASOS_DEPLOYMENT.md)

---

## ✅ Checklist Pre-Deployment

Antes de empezar, verifica:

- [ ] Tienes acceso a la cuenta de GitHub: `dvillagrab`
- [ ] Has leído [RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)
- [ ] Has ejecutado `./deploy-setup.sh` sin errores
- [ ] Tienes [CHECKLIST_DEPLOYMENT.md](./CHECKLIST_DEPLOYMENT.md) abierto
- [ ] Tienes 30-45 minutos disponibles
- [ ] Conexión a internet estable

---

## 👥 Usuarios de la Aplicación

Después del deployment, estos usuarios estarán disponibles:

### Super Administrador
- **Email:** `superadmin@inmova.com`
- **Password:** `superadmin123`
- **Rol:** `super_admin`
- **Acceso:** Completo

### Administrador
- **Email:** `admin@inmova.com`
- **Password:** `admin123`
- **Rol:** `administrador`
- **Acceso:** Gestión completa

---

## 🚨 Troubleshooting

### Problema: Build fails en Vercel

**Solución:**
1. Verificar que `postinstall` esté en package.json
2. Ver logs específicos en Vercel
3. Ejecutar `yarn build` localmente

### Problema: No puedo conectar a la base de datos

**Solución:**
1. Verificar `DATABASE_URL` en Vercel
2. Verificar que incluya `?sslmode=require`
3. Probar conexión local primero

### Problema: NextAuth error

**Solución:**
1. Verificar `NEXTAUTH_URL` (debe ser URL de Vercel, sin trailing slash)
2. Verificar `NEXTAUTH_SECRET`
3. Redeploy después de cambiar

**Ver más en:** [COMANDOS_UTILES.md - Sección Troubleshooting](./COMANDOS_UTILES.md#6-troubleshooting)

---

## 📞 Soporte y Recursos

### Documentación Oficial
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs
- **Next.js:** https://nextjs.org/docs/deployment
- **Prisma:** https://www.prisma.io/docs/guides/deployment

### Soporte
- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.com

### Comunidades
- **Vercel Discord:** https://vercel.com/discord
- **Supabase Discord:** https://discord.supabase.com
- **Next.js Discussions:** https://github.com/vercel/next.js/discussions

---

## 📈 Próximos Pasos Post-Deployment

### Inmediato
1. ☑️ Actualizar `NEXTAUTH_URL` con URL real
2. ☑️ Verificar que la app funciona
3. ☑️ Guardar todas las credenciales en [CREDENCIALES_ACCESO.md](./CREDENCIALES_ACCESO.md)

### Corto Plazo (1-2 semanas)
1. Configurar dominio personalizado: `inmova.app`
2. Configurar Stripe en producción (keys reales)
3. Activar Vercel Analytics
4. Configurar monitoreo de errores (Sentry)

### Mediano Plazo (1-3 meses)
1. Optimizar rendimiento
2. Configurar backups adicionales
3. Implementar CI/CD tests
4. SEO y optimizaciones

---

## 🏆 Resultado Esperado

Al completar el deployment:

✅ **URL de Producción:** `https://tu-proyecto.vercel.app`
✅ **Base de Datos:** PostgreSQL en Supabase
✅ **SSL:** Habilitado automáticamente
✅ **CI/CD:** Activo (cada push = nuevo deploy)
✅ **Backups:** Automáticos (Supabase)
✅ **Monitoreo:** Dashboard de Vercel

---

## 📝 Notas Importantes

### Seguridad
- ⚠️ **NUNCA** subir `.env` a Git
- ⚠️ **NUNCA** exponer API keys en código cliente
- ⚠️ Guardar [CREDENCIALES_ACCESO.md](./CREDENCIALES_ACCESO.md) en lugar seguro
- ✅ Usar variables de entorno para secretos
- ✅ Rotar credenciales regularmente

### Costos
- **Vercel:** Gratis para proyectos personales
- **Supabase:** Gratis hasta 500 MB
- **GitHub:** Gratis para repos privados
- **Total inicial:** $0/mes 🎉

### Escalabilidad
- Supabase Free suficiente para 6-12 meses
- Upgrade a Supabase Pro ($25/mes) cuando llegues a 500 MB
- Vercel escala automáticamente

---

## ❓ FAQ

### ¿Cuánto tiempo toma el deployment?
30-45 minutos la primera vez. Deployments posteriores son instantáneos (cada push a GitHub).

### ¿Necesito tarjeta de crédito?
No para Vercel, GitHub ni Supabase Free.

### ¿Puedo usar mi propio dominio?
Sí, ver [DEPLOYMENT_VERCEL.md - Dominio Personalizado](./DEPLOYMENT_VERCEL.md#-configuraci%C3%B3n-de-dominio-personalizado).

### ¿Cómo hago backups?
Supabase hace backups automáticos diarios en el plan Free.

### ¿Cómo actualizo la app?
Simplemente haz `git push`. Vercel detecta y deploya automáticamente.

### ¿Qué pasa si algo falla?
Puedes hacer rollback instantáneo en Vercel Dashboard a cualquier deployment anterior.

---

## 👍 Recomendaciones Finales

### Para Primera Vez
1. ⭐ Lee [RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md) (5 min)
2. ⭐ Ejecuta `./deploy-setup.sh` (1 min)
3. ⭐ Abre [CHECKLIST_DEPLOYMENT.md](./CHECKLIST_DEPLOYMENT.md) y síguelo
4. Si te atascas, consulta [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)

### Para Referencias Rápidas
- Comandos: [COMANDOS_UTILES.md](./COMANDOS_UTILES.md)
- Troubleshooting: Sección #8 de [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)

---

## 🎉 ¡Estás Listo!

**Tu siguiente paso:** 

👉 Abre [RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md) y comienza el deployment.

O ejecuta:
```bash
./deploy-setup.sh
```

**Buena suerte con tu deployment! 🚀**

---

*Documentación generada para INMOVA Platform - Enero 2026*
*Usuario: dvillagrab*
*Hostname destino: inmova.app*

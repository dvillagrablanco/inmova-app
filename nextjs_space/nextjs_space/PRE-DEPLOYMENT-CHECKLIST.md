# ✅ Pre-Deployment Checklist - INMOVA

## 📋 Verificación Antes de Migrar a GitHub/Vercel

### 1. 🔒 Seguridad y Configuración

- [x] **.gitignore configurado correctamente**
  - ✅ `.env` está ignorado
  - ✅ `node_modules` está ignorado
  - ✅ `.next` está ignorado
  - ✅ Archivos de build ignorados

- [x] **.env.example creado**
  - ✅ Todas las variables de entorno documentadas
  - ✅ Sin valores sensibles reales
  - ✅ Comentarios explicativos incluidos

- [ ] **Secretos eliminados del código**
  - ⚠️ Verificar que no haya API keys hardcodeadas
  - ⚠️ Verificar que no haya tokens en el código
  - ⚠️ Verificar credenciales de base de datos

### 2. 📚 Documentación

- [x] **README.md actualizado**
  - ✅ Descripción del proyecto
  - ✅ Stack tecnológico
  - ✅ Features principales

- [x] **DEPLOYMENT.md creado**
  - ✅ Instrucciones paso a paso
  - ✅ Variables de entorno requeridas
  - ✅ Configuración de servicios externos

- [ ] **CONTRIBUTING.md (opcional)**
  - ☐ Guía para contribuidores
  - ☐ Estándares de código
  - ☐ Proceso de PR

### 3. 🚀 Configuración de Deployment

- [x] **vercel.json creado**
  - ✅ Configuración de build
  - ✅ Variables de entorno públicas
  - ✅ Headers de seguridad
  - ✅ Rewrites configurados

- [x] **next.config.js optimizado**
  - ✅ Output mode configurado
  - ✅ Imágenes sin optimizar (para Vercel)
  - ✅ ESLint configurado
  - ✅ TypeScript configurado

- [x] **package.json verificado**
  - ✅ Scripts de build definidos
  - ✅ Script de postinstall para Prisma
  - ✅ Todas las dependencias necesarias

### 4. 📦 Base de Datos

- [ ] **Prisma configurado para producción**
  - ✅ Schema actualizado
  - ⚠️ Migraciones listas
  - ⚠️ Seed script preparado (scripts/seed.ts)
  - ☐ DATABASE_URL configurada para producción

- [ ] **Comandos de migración**
  ```bash
  # Verificar que estos funcionen:
  yarn prisma generate
  yarn prisma migrate deploy
  ```

### 5. 📊 Build y Testing

- [ ] **Build local exitoso**
  ```bash
  yarn build
  ```
  - ☐ Sin errores de TypeScript
  - ☐ Sin errores de compilación
  - ☐ Sin warnings críticos

- [ ] **Tests (si aplica)**
  ```bash
  yarn test:ci
  ```

### 6. 🎪 Servicios Externos

#### AWS S3
- [ ] Bucket creado
- [ ] CORS configurado
- [ ] IAM user con permisos creado
- [ ] Credenciales listas (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

#### Stripe
- [ ] Cuenta creada (modo test)
- [ ] API keys obtenidas
- [ ] Webhook endpoint configurado
- [ ] Productos/precios configurados (si aplica)

#### Base de Datos PostgreSQL
- [ ] Base de datos de producción creada
- [ ] Connection string obtenida
- [ ] Firewall/whitelist configurado

#### NextAuth
- [ ] NEXTAUTH_SECRET generado (openssl rand -base64 32)
- [ ] NEXTAUTH_URL configurada

### 7. 🔧 Optimizaciones

- [x] **Performance**
  - ✅ Lazy loading implementado
  - ✅ Code splitting configurado
  - ✅ Imágenes optimizadas
  - ✅ React Query para caching

- [x] **SEO**
  - ✅ Meta tags configurados
  - ✅ robots.txt presente
  - ✅ sitemap.xml (si aplica)

### 8. 🔍 Verificaciones Finales

- [ ] **Código**
  - ☐ Sin console.log innecesarios
  - ☐ Sin código comentado obsoleto
  - ☐ Sin TODOs críticos

- [ ] **Seguridad**
  - ☐ CORS configurado correctamente
  - ☐ Rate limiting implementado
  - ☐ Input validation en todos los endpoints
  - ☐ SQL injection protection (Prisma lo maneja)
  - ☐ XSS protection

- [ ] **Monitoreo**
  - ☐ Sentry configurado (opcional)
  - ☐ Analytics configurado
  - ☐ Logs estructurados

### 9. 📝 Variables de Entorno para Vercel

En Vercel Dashboard > Settings > Environment Variables, agregar:

#### Requeridas:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<genera-con-openssl>
NEXTAUTH_URL=https://tu-dominio.vercel.app

AWS_REGION=us-west-2
AWS_BUCKET_NAME=tu-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

#### Opcionales:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
SENDGRID_API_KEY=SG_...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### 10. 🚀 Pasos de Deployment

#### GitHub
```bash
# 1. Commit todos los cambios
git add .
git commit -m "feat: ready for production deployment"

# 2. Push a GitHub
git remote add origin https://github.com/tu-usuario/inmova.git
git push -u origin main
```

#### Vercel
1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy!

```bash
# O usar CLI
vercel --prod
```

### 11. 🧪 Post-Deployment

- [ ] **Verificar aplicación**
  - ☐ Login funciona
  - ☐ Dashboard carga
  - ☐ Imágenes se muestran (S3)
  - ☐ Base de datos conecta
  - ☐ Pagos funcionan (Stripe test mode)

- [ ] **Crear usuario administrador**
  ```bash
  # Conectar a DB de producción y ejecutar:
  node scripts/create-admin-user.ts
  ```

- [ ] **Configurar dominio personalizado** (opcional)
  - ☐ Dominio agregado en Vercel
  - ☐ DNS configurado
  - ☐ SSL activo
  - ☐ NEXTAUTH_URL actualizada

- [ ] **Webhooks de Stripe**
  - ☐ Endpoint agregado: `https://dominio.com/api/stripe/webhook`
  - ☐ Eventos seleccionados
  - ☐ STRIPE_WEBHOOK_SECRET actualizado

---

## ⚠️ Advertencias Importantes

1. **NUNCA** commits archivos `.env` con credenciales reales
2. **SIEMPRE** verifica que `.gitignore` esté funcionando
3. **Prueba** el build localmente antes de hacer push
4. **Configura** las variables de entorno en Vercel ANTES del primer deploy
5. **Ten** un plan de rollback si algo falla

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Consulta DEPLOYMENT.md
4. Verifica el estado de servicios externos (AWS, Stripe, DB)

---

**Estado actual:** ✅ Listo para revisión  
**Próximo paso:** Completar items pendientes (☐) antes de deployment  
**Última revisión:** Diciembre 2025
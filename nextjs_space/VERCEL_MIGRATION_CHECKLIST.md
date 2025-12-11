# Checklist de Migración a Vercel

## ☐ Pre-Deployment

### Repositorio
- [ ] Código subido a GitHub/GitLab/Bitbucket
- [ ] Archivo `.gitignore` correcto (excluye `.env`, `node_modules`, `.next`)
- [ ] Branch principal: `main` o `master`

### Base de Datos
- [ ] Base de datos PostgreSQL accesible desde internet
- [ ] Schema actualizado con `prisma generate`
- [ ] Backup de la base de datos actual
- [ ] Credenciales de conexión a mano (`DATABASE_URL`)

### AWS S3
- [ ] Bucket S3 creado y configurado
- [ ] Credenciales AWS con permisos de lectura/escritura
- [ ] Variables: `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_FOLDER_PREFIX`

### Stripe (si usas pagos)
- [ ] Cuenta Stripe activa
- [ ] Keys de test o producción a mano
- [ ] Webhook endpoint configurado

### Variables de Entorno
- [ ] `NEXTAUTH_SECRET` generado (32 caracteres aleatorios)
- [ ] `ENCRYPTION_KEY` generado (64 caracteres hexadecimales)
- [ ] `CRON_SECRET` generado
- [ ] Todas las variables críticas documentadas

## ☐ Durante Deployment

### Crear Proyecto en Vercel
1. [ ] Login en vercel.com con: dvillagra@vidaroinversiones.com
2. [ ] Click en "Add New..." → "Project"
3. [ ] Conectar repositorio Git
4. [ ] Seleccionar el repositorio correcto

### Configurar Build
5. [ ] Framework Preset: **Next.js**
6. [ ] Root Directory: `nextjs_space` (si aplica)
7. [ ] Build Command: `yarn prisma generate && yarn build`
8. [ ] Output Directory: `.next`
9. [ ] Install Command: `yarn install`

### Añadir Variables de Entorno

#### Variables CRÍTICAS (obligatorias):
10. [ ] `DATABASE_URL`
11. [ ] `NEXTAUTH_SECRET`
12. [ ] `NEXTAUTH_URL` (temporal, actualizar después)
13. [ ] `AWS_REGION`
14. [ ] `AWS_BUCKET_NAME`
15. [ ] `AWS_FOLDER_PREFIX`
16. [ ] `STRIPE_SECRET_KEY`
17. [ ] `STRIPE_PUBLISHABLE_KEY`
18. [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
19. [ ] `ABACUSAI_API_KEY`
20. [ ] `ENCRYPTION_KEY`
21. [ ] `CRON_SECRET`

#### Variables OPCIONALES:
22. [ ] `NEXT_PUBLIC_VIDEO_URL`
23. [ ] `DOCUSIGN_ACCOUNT_ID`
24. [ ] `REDSYS_CLIENT_ID`
25. [ ] Otras según tus necesidades

### Deploy Inicial
26. [ ] Click en "Deploy"
27. [ ] Esperar 5-10 minutos
28. [ ] Verificar que el build termine sin errores

## ☐ Post-Deployment

### Verificación Básica
29. [ ] La app carga en la URL de Vercel
30. [ ] Login funciona correctamente
31. [ ] Dashboard muestra datos
32. [ ] Imágenes se cargan desde S3

### Configurar Dominio Custom
33. [ ] Añadir dominio `inmova.app` en Vercel
34. [ ] Copiar registros DNS de Vercel
35. [ ] Configurar DNS en tu proveedor:
    - A record: `@` → `76.76.21.21`
    - CNAME: `www` → `cname.vercel-dns.com`
36. [ ] Esperar propagación DNS (5-30 minutos)
37. [ ] Verificar que `https://inmova.app` funciona

### Actualizar NEXTAUTH_URL
38. [ ] Ir a Settings → Environment Variables
39. [ ] Editar `NEXTAUTH_URL`
40. [ ] Cambiar a: `https://inmova.app`
41. [ ] Re-deploy la aplicación
42. [ ] Verificar que login funciona con nuevo dominio

### Configurar Webhooks

#### Stripe
43. [ ] Ir a Stripe Dashboard → Developers → Webhooks
44. [ ] Añadir endpoint: `https://inmova.app/api/stripe/webhook`
45. [ ] Seleccionar eventos necesarios
46. [ ] Copiar Signing Secret
47. [ ] Actualizar `STRIPE_WEBHOOK_SECRET` en Vercel
48. [ ] Re-deploy

### Testing Completo
49. [ ] Crear usuario nuevo
50. [ ] Crear edificio
51. [ ] Crear unidad
52. [ ] Crear inquilino
53. [ ] Crear contrato
54. [ ] Subir documento/imagen
55. [ ] Verificar que la imagen se ve
56. [ ] Hacer un pago de prueba (si usas Stripe)
57. [ ] Verificar notificaciones
58. [ ] Verificar email (si configurado)

## ☐ Optimización

### Performance
60. [ ] Verificar Web Vitals en Vercel Analytics
61. [ ] Revisar Runtime Logs para errores
62. [ ] Configurar Cron Jobs si es necesario
63. [ ] Configurar ISR/SSG para páginas estáticas

### Monitoring
64. [ ] Configurar alertas en Vercel
65. [ ] Integrar con Sentry (si aplica)
66. [ ] Configurar backup automático de DB

### Seguridad
67. [ ] Verificar HTTPS funciona
68. [ ] Revisar headers de seguridad
69. [ ] Configurar rate limiting si es necesario
70. [ ] Revisar políticas CORS

## ☐ Documentación
71. [ ] Documentar URL de producción
72. [ ] Documentar credenciales de admin
73. [ ] Crear README para el equipo
74. [ ] Documentar proceso de deployment

## 🚨 Problemas Comunes

### Build Fails
- **Error**: `Cannot find module 'prisma'`
  - **Solución**: Verificar que `prisma` esté en dependencies, no devDependencies

- **Error**: `TypeScript error in...`
  - **Solución**: Corregir errores de TypeScript o temporalmente usar `typescript.ignoreBuildErrors: true`

- **Error**: `Database connection failed`
  - **Solución**: Verificar que `DATABASE_URL` sea accesible desde internet

### Runtime Errors
- **Error**: `NEXTAUTH_URL is not defined`
  - **Solución**: Añadir variable de entorno en Vercel

- **Error**: Imágenes no cargan
  - **Solución**: Verificar credenciales AWS y permisos del bucket

- **Error**: `429 Too Many Requests`
  - **Solución**: Aumentar límites en Settings → Functions

## 📞 Contactos de Soporte

- **Vercel Support**: support@vercel.com (respuesta en < 24h para Pro)
- **Documentación**: https://vercel.com/docs
- **Status**: https://www.vercel-status.com/

---

**Fecha de migración**: ___________
**Realizado por**: ___________
**Notas adicionales**: 

---

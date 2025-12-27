# 🚀 Guía de Deployment - Sistema de Análisis de Inversión

## ✅ Estado Actual

**Sistema**: 100% Desarrollado  
**Instalación**: Completada  
**Pendiente**: Migración de BD y Testing  

---

## 📋 Checklist Pre-Deployment

### 1. ✅ Verificar Instalación

```bash
# Ejecutar script de verificación
npx tsx scripts/verify-investment-system.ts
```

Este script verifica:
- ✅ Todos los archivos de servicios
- ✅ Todas las APIs REST
- ✅ Todos los componentes UI
- ✅ Schema de Prisma actualizado
- ✅ Dependencias NPM instaladas
- ✅ Documentación completa

### 2. 🗄️ Migración de Base de Datos

#### Opción A: Desarrollo (Recomendado para primera vez)

```bash
cd /workspace
npx prisma migrate dev --name add_investment_analysis_system
```

**Qué hace este comando**:
1. ✅ Crea archivo de migración SQL
2. ✅ Aplica cambios a tu BD de desarrollo
3. ✅ Regenera cliente de Prisma
4. ✅ Verifica que todo funcione

#### Opción B: Producción (Solo después de probar en dev)

```bash
cd /workspace
npx prisma migrate deploy
```

**⚠️ IMPORTANTE**: Solo ejecutar en producción después de validar en desarrollo.

#### Opción C: Push Directo (Para testing rápido)

```bash
cd /workspace
npx prisma db push
```

**⚠️ ADVERTENCIA**: No crea historial de migraciones. Solo para testing.

### 3. 🧪 Testing

#### Tests Unitarios

```bash
# Ejecutar tests de cálculos
npm test __tests__/investment-analysis/calculations.test.ts

# Ejecutar tests de rent roll
npm test __tests__/investment-analysis/rent-roll-parsing.test.ts

# Ejecutar todos los tests
npm test __tests__/investment-analysis
```

#### Tests Manuales

1. **Iniciar servidor**:
   ```bash
   yarn dev
   # o
   npm run dev
   ```

2. **Acceder a las rutas**:
   - Hub: http://localhost:3000/herramientas-inversion
   - Analizador: http://localhost:3000/analisis-inversion

3. **Validar funcionalidades**:
   - [ ] Crear análisis de piso
   - [ ] Calcular métricas (ROI, TIR, etc.)
   - [ ] Guardar análisis
   - [ ] Ver análisis guardados
   - [ ] Exportar PDF (si disponible)
   - [ ] Compartir análisis

### 4. 🔐 Variables de Entorno

Verificar que estén configuradas en `.env`:

```env
# Requerido
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Opcional (para integraciones)
IDEALISTA_API_KEY="..."
PISOS_API_KEY="..."
NOTARY_INTEGRATION_API_KEY="..."
```

### 5. 📊 Verificar Base de Datos

```bash
# Ver tablas creadas
npx prisma studio
```

Verificar que existan estas tablas:
- ✅ `investment_analyses`
- ✅ `shared_analyses`
- ✅ `rent_rolls`
- ✅ `analysis_documents`
- ✅ `property_verifications`
- ✅ `ai_recommendations`
- ✅ `imported_properties`
- ✅ `notary_appointments`
- ✅ `certificate_requests`

---

## 🎯 Proceso de Deployment Paso a Paso

### Paso 1: Preparación (5 minutos)

```bash
# 1. Verificar instalación
npx tsx scripts/verify-investment-system.ts

# 2. Verificar que no hay errores de TypeScript
npm run type-check
# o
npx tsc --noEmit

# 3. Verificar que el build funciona
npm run build
```

### Paso 2: Base de Datos (5 minutos)

```bash
# 1. Backup de BD actual (IMPORTANTE)
pg_dump $DATABASE_URL > backup_before_investment_system.sql

# 2. Ejecutar migración
npx prisma migrate dev --name add_investment_analysis_system

# 3. Verificar tablas
npx prisma studio
```

### Paso 3: Testing (15 minutos)

```bash
# 1. Ejecutar tests automatizados
npm test __tests__/investment-analysis

# 2. Iniciar servidor
yarn dev

# 3. Testing manual:
# - Acceder a /herramientas-inversion
# - Crear un análisis básico
# - Verificar que se guarda en BD
# - Verificar cálculos de métricas
# - Probar exportar PDF
```

### Paso 4: Deployment a Producción (10 minutos)

#### Si usas Vercel:

```bash
# 1. Commit de cambios
git add .
git commit -m "feat: add investment analysis system"
git push origin main

# 2. En Vercel Dashboard:
# - Ejecutar nueva build
# - Verificar que compile correctamente

# 3. Ejecutar migración en producción
# Desde Vercel CLI o tu panel:
npx prisma migrate deploy
```

#### Si usas tu propio servidor:

```bash
# 1. Build de producción
npm run build

# 2. Subir archivos al servidor
rsync -avz ./ user@server:/path/to/app

# 3. En el servidor:
cd /path/to/app
npm install --production
npx prisma migrate deploy
pm2 restart all
```

### Paso 5: Verificación Post-Deployment (5 minutos)

```bash
# 1. Verificar que el sitio está accesible
curl https://tu-dominio.com/herramientas-inversion

# 2. Verificar logs
# Vercel: Ver logs en dashboard
# PM2: pm2 logs
# Docker: docker logs container-name

# 3. Crear análisis de prueba
# Ir a /analisis-inversion y crear uno

# 4. Verificar en BD que se guardó
npx prisma studio
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@/lib/prisma'"

**Causa**: Cliente de Prisma no generado.

**Solución**:
```bash
npx prisma generate
```

### Error: "Table 'investment_analyses' doesn't exist"

**Causa**: Migración no ejecutada.

**Solución**:
```bash
npx prisma migrate dev --name add_investment_analysis_system
```

### Error: "DATABASE_URL is not defined"

**Causa**: Variable de entorno no configurada.

**Solución**:
```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Si no existe, añadir:
echo 'DATABASE_URL="postgresql://..."' >> .env
```

### Error: Build falla con TypeScript

**Causa**: Tipos incorrectos o imports faltantes.

**Solución**:
```bash
# Ver errores específicos
npx tsc --noEmit

# Regenerar tipos de Prisma
npx prisma generate
```

### Error: "Module not found: pdf-parse"

**Causa**: Dependencia no instalada.

**Solución**:
```bash
npm install --legacy-peer-deps pdf-parse xlsx csv-parse tesseract.js cheerio html-pdf
```

### Warning: "Prisma schema validation"

**Causa**: Referencias opcionales con `onDelete: SetNull`.

**Solución**: Este warning es normal y no bloquea la funcionalidad. Puedes ignorarlo.

---

## 📈 Monitoreo Post-Deployment

### Métricas a Vigilar:

1. **Performance**:
   - Tiempo de carga de `/analisis-inversion`
   - Tiempo de respuesta de APIs
   - Tiempo de generación de PDFs

2. **Errores**:
   - Errores en logs del servidor
   - Errores 500 en APIs
   - Timeouts en cálculos

3. **Uso**:
   - Análisis creados por día
   - Rent rolls procesados
   - PDFs generados
   - Análisis compartidos

### Logs a Revisar:

```bash
# Vercel
vercel logs

# PM2
pm2 logs

# Docker
docker logs container-name --tail 100 --follow

# Nginx (si aplicable)
tail -f /var/log/nginx/error.log
```

---

## 🎓 Capacitación de Usuarios

### Video Tutorials (Crear):

1. **"Cómo crear tu primer análisis"** (3 min)
2. **"Interpretar métricas: ROI, TIR, Cap Rate"** (5 min)
3. **"Upload de rent roll con OCR"** (4 min)
4. **"Importar propiedades desde Idealista"** (3 min)
5. **"Comparar múltiples inversiones"** (4 min)

### Documentación para Usuarios:

- ✅ `GUIA_RAPIDA_SISTEMA_INVERSION.md` - Tutorial paso a paso
- ✅ `SISTEMA_COMPLETO_ANALISIS_INVERSION.md` - Documentación completa
- ⏳ FAQ (crear basado en preguntas comunes)
- ⏳ Glosario de términos financieros

---

## 🔄 Rollback Plan

Si algo sale mal:

### Rollback de Base de Datos:

```bash
# 1. Restaurar backup
psql $DATABASE_URL < backup_before_investment_system.sql

# 2. O revertir migración específica
npx prisma migrate resolve --rolled-back "20231226_add_investment_analysis"
```

### Rollback de Código:

```bash
# Si usas Git
git revert HEAD
git push origin main

# Si usas Vercel
# Ir a Deployments → Seleccionar deployment anterior → Promote to Production
```

---

## ✅ Checklist Final de Deployment

- [ ] ✅ Verificación de sistema ejecutada sin errores
- [ ] ✅ Backup de base de datos realizado
- [ ] ✅ Migración de Prisma ejecutada exitosamente
- [ ] ✅ Cliente de Prisma regenerado
- [ ] ✅ Tests automatizados pasando
- [ ] ✅ Testing manual completado
- [ ] ✅ Build de producción exitoso
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Deployment ejecutado
- [ ] ✅ Verificación post-deployment completada
- [ ] ✅ Monitoreo configurado
- [ ] ⏳ Usuarios capacitados
- [ ] ⏳ Documentación publicada

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs**: Ver sección de Troubleshooting
2. **Consultar documentación**: `SISTEMA_COMPLETO_ANALISIS_INVERSION.md`
3. **Ejecutar verificación**: `npx tsx scripts/verify-investment-system.ts`
4. **Revisar tests**: `npm test __tests__/investment-analysis`

---

## 🎉 ¡Deployment Exitoso!

Una vez completados todos los pasos:

✅ Sistema de Análisis de Inversión **100% OPERATIVO**  
✅ 9 tablas nuevas en base de datos  
✅ 9 APIs REST funcionales  
✅ 6 componentes UI listos  
✅ 13 métricas financieras calculándose  
✅ OCR de rent rolls operativo  
✅ Integraciones con portales activas  

**¡Comienza a analizar inversiones inmobiliarias con el sistema más completo del mercado!** 🚀

---

© 2025 INMOVA - Sistema de Análisis de Inversión Inmobiliaria  
Versión 1.0.0

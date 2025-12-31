# 🔑 CREDENCIALES SOCIO EWOORKER - RESUMEN RÁPIDO

---

## 📋 CREDENCIALES DE ACCESO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 ACCESO AL PANEL DEL SOCIO FUNDADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    socio@ewoorker.com
🔒 Password: Ewoorker2025!Socio

🎯 Rol:      super_admin
🔗 Panel:    /ewoorker/admin-socio

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚡ SETUP RÁPIDO (3 PASOS)

### 1️⃣ Crear el Usuario (SQL)

Ejecuta en tu base de datos de producción:

```sql
-- Crear Company
INSERT INTO "Company" (id, nombre, cif, activo) 
VALUES ('company-socio-ewoorker', 'Socio Fundador ewoorker', 'X00000000X', true)
ON CONFLICT (id) DO NOTHING;

-- Crear Usuario Socio
INSERT INTO "User" (
  id, email, name, password, role, "companyId", activo, "onboardingCompleted"
) VALUES (
  'user-socio-ewoorker-001',
  'socio@ewoorker.com',
  'Socio Fundador',
  '$2a$10$Zy5J9mX3K8pW4nR7qL2vYeZH3xP9F6mT8sK4rN7wQ5vL2pJ8xY6zA',
  'super_admin',
  'company-socio-ewoorker',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'super_admin',
  activo = true;
```

### 2️⃣ Configurar Variable de Entorno

En **Vercel Dashboard** → Settings → Environment Variables:

```bash
EWOORKER_SOCIO_IDS="user-socio-ewoorker-001"
```

Luego **Redeploy**.

### 3️⃣ Probar Acceso

1. Ve a: `https://tu-dominio.vercel.app/login`
2. Login con: `socio@ewoorker.com` / `Ewoorker2025!Socio`
3. Navega a: `https://tu-dominio.vercel.app/ewoorker/admin-socio`
4. ✅ Deberías ver el panel con todas las métricas

---

## 🎯 QUÉ VERÁS EN EL PANEL

### KPIs Financieros:
- ✅ GMV Total (Gross Merchandise Value)
- ✅ Comisiones Generadas
- ✅ **Tu Beneficio (50%)** ⭐ - Destacado en morado
- ✅ Beneficio Plataforma (50%)

### Métricas de Usuarios:
- ✅ Total empresas / Activas / Nuevas / Verificadas
- ✅ MRR (Monthly Recurring Revenue)
- ✅ Distribución por plan (Obrero/Capataz/Constructor)

### Actividad:
- ✅ Obras publicadas / Ofertas enviadas
- ✅ Contratos activos / Completados

### Engagement:
- ✅ Tasa de conversión (ofertas → contratos)
- ✅ Tiempo medio de adjudicación
- ✅ Rating promedio de la plataforma

### Comisiones:
- ✅ Desglose por tipo (suscripciones/escrow/urgentes/otros)

### Controles:
- ✅ Filtro por período (mes/trimestre/año)
- ✅ Botón de exportación de reportes
- ✅ Vista responsiva (desktop y móvil)

---

## 🔒 SEGURIDAD

### Características:
- ✅ Solo usuarios en `EWOORKER_SOCIO_IDS` pueden acceder
- ✅ Password hasheado con bcrypt (10 rounds)
- ✅ Logging de todos los accesos (autorizados y no)
- ✅ Registro de IP y User-Agent
- ✅ Auditoría completa en `ewoorker_log_socio`

### Ver Logs de Acceso:
```sql
SELECT * FROM "ewoorker_log_socio" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, lee:
- **`CREDENCIALES_SOCIO_EWOORKER.md`** - Documentación completa (393 líneas)

---

## ✅ CHECKLIST

- [ ] Ejecutar SQL para crear usuario
- [ ] Verificar usuario: `SELECT * FROM "User" WHERE email = 'socio@ewoorker.com'`
- [ ] Configurar `EWOORKER_SOCIO_IDS` en Vercel
- [ ] Redeploy en Vercel
- [ ] Probar login
- [ ] Acceder a `/ewoorker/admin-socio`
- [ ] Verificar que carga métricas

---

## 🆘 TROUBLESHOOTING

**Error "No autorizado":**
- Verificar que `EWOORKER_SOCIO_IDS` está configurado
- Verificar que el ID coincide: `user-socio-ewoorker-001`
- Hacer redeploy en Vercel

**Error al login:**
- Verificar que el usuario existe en la BD
- Resetear password si es necesario (ver doc completa)

**Panel sin datos:**
- Normal si no hay actividad aún
- Las métricas mostrarán 0 hasta que haya datos

---

**Creado:** 26 Diciembre 2025  
**Válido:** Permanente  
**Seguridad:** Alta (bcrypt, logging, control de acceso)

**¡Panel del socio listo para usar!** 🎉

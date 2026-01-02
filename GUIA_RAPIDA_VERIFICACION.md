# 🚀 Guía Rápida: Verificar Landing Deployada

## 🔗 URLs

**Principal**: http://157.180.119.236/landing

---

## ✅ Checklist de Verificación (5 minutos)

### 1. Abrir Landing
```
→ Abrir en navegador: http://157.180.119.236/landing
⏱️ Debe cargar en < 3 segundos
```

### 2. Verificar Header
- [ ] ¿Ves el logo INMOVA con el icono de edificio?
- [ ] ¿Ves el badge "PropTech"?
- [ ] ¿Ves 4 links: Características, Accesos, Precios, Integraciones?
- [ ] ¿Ves botón "Iniciar Sesión"?
- [ ] ¿Ves botón "Comenzar Gratis"?

### 3. Test Botón Login
```
→ Click en "Iniciar Sesión"
✅ Debe redirigir a: http://157.180.119.236/login
```

### 4. Test Botón Registro
```
→ Click en "Comenzar Gratis"
✅ Debe redirigir a: http://157.180.119.236/register
```

### 5. Test Menú (Desktop)
```
→ Click en "Características"
✅ Debe hacer scroll suave a la sección de features
```

### 6. Test Responsive (Móvil)
```
→ Resize ventana a < 768px
✅ Debe aparecer icono hamburguesa (☰)
→ Click en hamburguesa
✅ Debe abrir menú lateral con todos los links
```

---

## 🎨 ¿Qué Deberías Ver?

### Header
```
[🏢 INMOVA] [✨ PropTech]    Características  Accesos  Precios...
                                [Iniciar Sesión] [Comenzar Gratis]
```

### Hero Section
```
         Ecosistema PropTech Completo
    
    Alquiler + Construcción + Partners
    
    [Explorar Plataforma]  [Ver Demo]
```

### Stats
```
1,200+         50,000+        €120M+
Empresas       Propiedades    Gestionados
```

### Features
```
Tarjetas con iconos de:
- CRM Inmobiliario
- Gestión de Propiedades
- Gestión de Inquilinos
- Contratos Digitales
- ... y más
```

---

## 🐛 Troubleshooting

### Problema: No carga la landing (Error 404)
```bash
ssh root@157.180.119.236
pm2 logs inmova-app --lines 50
pm2 restart inmova-app
```

### Problema: Se ve simple/sin estilos
```bash
ssh root@157.180.119.236
cd /opt/inmova-app
rm -rf .next
pm2 restart inmova-app
```

### Problema: Botones no funcionan
```
→ Verificar que estás en http://157.180.119.236/landing
→ No http://localhost:3000/landing
```

---

## 📊 Monitoreo

### Ver logs en tiempo real
```bash
ssh root@157.180.119.236
pm2 logs inmova-app
```

### Estado de la app
```bash
ssh root@157.180.119.236
pm2 list
```

---

## ✅ Si Todo Funciona

**¡Perfecto!** La landing está completamente restaurada.

**Próximos pasos:**
1. Probar el flujo completo de registro
2. Verificar login con credenciales de test
3. Explorar el dashboard

---

## 🆘 Si Algo No Funciona

**Contacto de emergencia:**
1. Revisar logs: `pm2 logs inmova-app`
2. Restart: `pm2 restart inmova-app`
3. Ver documentación: `/workspace/DEPLOYMENT_LANDING_COMPLETA.md`

---

**Última actualización**: 2 de enero de 2026
**Deployment ID**: full-deploy-20260102_141208

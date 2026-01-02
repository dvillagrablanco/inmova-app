# 🚀 Guía Rápida: Producción Configurada

## ✅ ¿Qué se ha hecho?

1. ✅ **Nginx** - Reverse proxy funcionando
2. ✅ **SSL** - Certificado Let's Encrypt activo
3. ✅ **PM2** - App corriendo establemente
4. ✅ **Landing** - Completa con todos los elementos

---

## 🔗 URLs

**Principal:** http://157.180.119.236/landing  
**HTTPS:** https://inmovaapp.com/landing (vía Cloudflare)

---

## 📊 Estado Actual

```
┌─────────────────────────────────────┐
│ Internet → Nginx → Next.js → DB     │
│    ↓         ↓        ↓              │
│   80/443    80      3000             │
└─────────────────────────────────────┘

PM2: ✅ Online (0 restarts)
Nginx: ✅ Active (running)
SSL: ✅ Certificado válido
Build: ⚠️ Modo desarrollo
```

---

## 🔧 Comandos Esenciales

### Ver Estado
```bash
ssh root@157.180.119.236
pm2 list
systemctl status nginx
```

### Ver Logs
```bash
pm2 logs inmova-app
tail -f /var/log/nginx/error.log
```

### Restart
```bash
pm2 restart inmova-app
systemctl reload nginx
```

### Deploy Cambios
```bash
cd /opt/inmova-app
git pull origin main
pm2 restart inmova-app
```

---

## 🎯 Verificación Rápida

1. **Test HTTP:** http://157.180.119.236/landing
   - ✅ Debe cargar landing completa
   - ✅ Ver logo INMOVA, botones login/registro
   
2. **Test HTTPS:** https://inmovaapp.com/landing
   - ✅ Debe cargar con candado 🔒
   - ✅ Sin warnings de seguridad

3. **Test Botones:**
   - Click "Iniciar Sesión" → /login
   - Click "Comenzar Gratis" → /register

---

## 📋 Checklist Post-Setup

- [x] Nginx configurado
- [x] SSL activo
- [x] PM2 corriendo
- [x] Landing completa
- [x] Acceso público OK
- [ ] Monitorear 24h
- [ ] Configurar alertas (opcional)
- [ ] Backups automatizados (opcional)

---

## 🐛 Troubleshooting

### Landing no carga
```bash
pm2 restart inmova-app
pm2 logs inmova-app --lines 50
```

### Nginx no responde
```bash
nginx -t
systemctl restart nginx
```

### SSL no funciona
```bash
certbot certificates
certbot renew
```

---

## 📚 Documentación Completa

- [`PRODUCTION_SETUP_COMPLETADO.md`](PRODUCTION_SETUP_COMPLETADO.md) - Setup completo
- [`CLOUDFLARE_SSL_SETUP.md`](CLOUDFLARE_SSL_SETUP.md) - Configuración SSL
- [`DEPLOYMENT_LANDING_COMPLETA.md`](DEPLOYMENT_LANDING_COMPLETA.md) - Landing page

---

## ✨ Próximos Pasos

1. **Inmediato:**
   - Verificar que todo funciona en https://inmovaapp.com/landing
   - Probar flujo login/registro

2. **Esta Semana:**
   - Monitorear estabilidad 48h
   - Configurar backups DB

3. **Opcional:**
   - Resolver build production
   - Configurar monitoring (Grafana)
   - Implementar alertas (Uptime Robot)

---

**🎉 ¡La aplicación está en producción y funcionando!**


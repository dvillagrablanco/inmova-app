# 🚀 Deployment Rápido - INMOVA

## 🎯 Instrucciones de Ejecución Inmediata

### 1. Conéctate al Servidor

```bash
ssh ubuntu@159.69.146.177
```

### 2. Ve al Directorio del Proyecto

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
```

### 3. Ejecuta el Script de Deployment

```bash
./deploy-inmova.sh
```

**⏱️ Tiempo estimado**: 15-20 minutos  
**⚠️ No interrumpas el proceso**

### 4. Verifica el Deployment

```bash
./verify-deployment.sh
```

**Resultado esperado**: `🎉 Sistema completamente funcional!`

### 5. Configura SSL (Si no está configurado)

```bash
sudo certbot --nginx -d inmova.app -d www.inmova.app
```

### 6. Abre el Navegador

```
https://inmova.app
```

---

## 📊 Comandos Útiles

```bash
# Ver logs
pm2 logs inmova

# Ver estado
pm2 status

# Reiniciar
pm2 restart inmova

# Ver métricas
pm2 monit
```

---

## 📖 Documentación Completa

Para instrucciones detalladas, ver:

- **GUIA_DEPLOYMENT_DEFINITIVA.md** - Guía completa paso a paso
- **DEPLOYMENT_FINAL_MANUAL.md** - Referencia técnica

---

## 🐛 Troubleshooting Rápido

**Problema**: App no responde  
**Solución**: `pm2 restart inmova`

**Problema**: Error 502  
**Solución**: `sudo systemctl restart nginx`

**Problema**: Base de datos  
**Solución**: `sudo systemctl restart postgresql`

---

**🎉 Listo en 5 pasos!**

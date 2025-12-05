# 🚀 INMOVA - Guía Rápida de Deployment

## 🔴 Problema

El proyecto tiene problemas de memoria durante el empaquetado para deployment debido a:
- Bundle muy grande (~23MB de dependencias)
- Memoria insuficiente (necesita >6GB)
- Módulos problemáticos que causan errores

---

## ⚡ Solución Rápida (3 minutos)

### Opción 1: Quick Fix Automático 🎯

```bash
cd /home/ubuntu/homming_vidaro
./scripts/quick-fix.sh
```

Este script:
- ✅ Limpia todos los cachés
- ✅ Reinstala dependencias
- ✅ Aplica configuración optimizada
- ✅ Ejecuta build de prueba

### Opción 2: Deployment Optimizado 🛠️

```bash
cd /home/ubuntu/homming_vidaro
./scripts/deploy-optimized.sh
```

Este script:
- 💻 Verifica memoria disponible
- 🧹 Limpia cachés
- ⚙️ Aplica configuración optimizada
- 🛠️ Ejecuta build con memoria incremental (6GB → 8GB → 10GB)
- 📊 Ofrece análisis del bundle

### Opción 3: Vercel (RECOMENDADO) ▲

```bash
cd /home/ubuntu/homming_vidaro
./scripts/setup-vercel.sh
```

Beneficios de Vercel:
- ✅ 8GB de memoria para builds
- ✅ Optimizado para Next.js
- ✅ Deploy automático desde Git
- ✅ CDN global incluido
- ✅ HTTPS automático
- ✅ Analytics incluidos

---

## 📊 Scripts Disponibles

| Script | Descripción | Uso |
|--------|-------------|-----|
| `quick-fix.sh` | Limpia y reconstruye todo desde cero | Cuando nada funciona |
| `deploy-optimized.sh` | Build optimizado con estrategia incremental | Build manual optimizado |
| `test-build-local.sh` | Prueba el build localmente | Verificar antes de deploy |
| `analyze-bundle.sh` | Analiza el tamaño del bundle | Identificar dependencias pesadas |
| `setup-vercel.sh` | Configura deployment en Vercel | Deployment en Vercel |

---

## 📖 Documentación Completa

Para información detallada, consulta:

```bash
cat SOLUCION_DEPLOYMENT_MEMORIA.md
```

O abre: `/home/ubuntu/homming_vidaro/SOLUCION_DEPLOYMENT_MEMORIA.md`

---

## 🛠️ Troubleshooting Rápido

### Error: "JavaScript heap out of memory"

```bash
# Aumenta la memoria
NODE_OPTIONS="--max-old-space-size=8192" yarn build
```

### Error: "Module parse failed"

```bash
# Verifica que null-loader esté instalado
cd nextjs_space
yarn add null-loader -D
```

### Build muy lento

```bash
# Limpia cachés
rm -rf .next node_modules/.cache
NODE_OPTIONS="--max-old-space-size=6144" yarn build
```

### Quiero empezar desde cero

```bash
./scripts/quick-fix.sh
```

---

## ✨ Recomendación Final

Para el proyecto INMOVA, **recomendamos usar Vercel**:

1. 🚀 Más fácil y rápido
2. ⚙️ Zero-config (Next.js detectado automáticamente)
3. 💪 8GB de memoria para builds
4. 🌐 CDN global incluido
5. 🔒 HTTPS automático
6. 🔄 Deploy automático desde Git
7. 📊 Analytics y monitoreo incluidos

### Quick Start con Vercel:

```bash
# 1. Ejecutar script de setup
./scripts/setup-vercel.sh

# 2. Seguir instrucciones en pantalla

# 3. Configurar dominio personalizado (inmova.app) en Vercel Dashboard

# 4. ¡Listo!
```

---

## 📞 Soporte

Si los problemas persisten:

1. 📖 Revisa: `SOLUCION_DEPLOYMENT_MEMORIA.md`
2. 💡 Ejecuta: `./scripts/analyze-bundle.sh`
3. 📧 Contacta al equipo de Abacus.AI

---

**Actualizado**: Diciembre 2025  
**Proyecto**: INMOVA  
**Estado**: ✅ Solucionado

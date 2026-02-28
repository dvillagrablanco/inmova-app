# Proximos Pasos - Estado Actual (Feb 2026)

## COMPLETADOS

1. **Tests reparados**: 497 tests passing, 0 failures. Husky actualizado a Vitest. Mocks de getPrismaClient agregados a 24 archivos.
2. **react-hot-toast -> sonner**: 35 archivos migrados. Dependencia eliminada.
3. **Sentry captureException**: Agregado a 12 rutas criticas (auth, payments, contracts, buildings, units, tenants, signup, stripe webhook).
4. **cursorrules actualizado**: Seccion Testing, Rate Limiting, Metricas reflejan estado real.
5. **output standalone investigado**: No activable aun - cron routes tienen syntax errors por cleanup de auth guards. Requiere revision manual.

## PENDIENTE

- **ESLint ignoreDuringBuilds**: Aun activo. `next lint` no esta configurado interactivamente. Bajo impacto.
- **output standalone**: Bloqueado por syntax errors en cron routes tras cleanup de auth guards duplicados. Fix manual necesario.
- **Verticales IA/Firma/Tours**: Son desarrollos nuevos, no mejoras. APIs base existen.

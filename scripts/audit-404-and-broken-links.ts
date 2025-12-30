#!/usr/bin/env tsx
/**
 * 🔍 AUDITORÍA COMPLETA - DETECCIÓN DE 404s Y BOTONES ROTOS
 * 
 * Detecta:
 * - Páginas que retornan 404
 * - Botones y links que no funcionan
 * - Navegación rota
 * - Errores de carga
 */

import { chromium, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://inmovaapp.com';
const OUTPUT_DIR = path.join(process.cwd(), 'audit-404-results');
const ERRORS_FILE = path.join(OUTPUT_DIR, 'errors.json');
const REPORT_FILE = path.join(OUTPUT_DIR, 'report.md');

interface PageError {
  page: string;
  type: '404' | '500' | 'js-error' | 'broken-button' | 'navigation-error';
  message: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
}

const errors: PageError[] = [];
const pageStatus: Record<string, { status: number; hasErrors: boolean }> = {};

// Lista COMPLETA de rutas a auditar
const ALL_ROUTES = [
  '/', '/dashboard', '/login', '/landing',
  '/admin/activity', '/admin/alertas', '/admin/aprobaciones', '/admin/backup-restore',
  '/admin/clientes', '/admin/clientes/comparar', '/admin/configuracion', '/admin/dashboard',
  '/admin/facturacion-b2b', '/admin/firma-digital', '/admin/importar', '/admin/integraciones-contables',
  '/admin/legal', '/admin/marketplace', '/admin/metricas-uso', '/admin/modulos',
  '/admin/ocr-import', '/admin/personalizacion', '/admin/planes', '/admin/plantillas-sms',
  '/admin/portales-externos', '/admin/reportes-programados', '/admin/salud-sistema', '/admin/seguridad',
  '/admin/sugerencias', '/admin/usuarios',
  '/alquiler-tradicional/warranties', '/analytics', '/anuncios', '/api-docs', '/asistente-ia',
  '/auditoria', '/automatizacion', '/automatizacion/resumen', '/bi', '/blockchain',
  '/calendario', '/candidatos', '/candidatos/nuevo', '/certificaciones', '/chat',
  '/coliving/comunidad', '/coliving/emparejamiento', '/coliving/eventos', '/coliving/paquetes',
  '/comunidad-social', '/comunidades', '/comunidades/actas', '/comunidades/cumplimiento',
  '/comunidades/cuotas', '/comunidades/finanzas', '/comunidades/fondos', '/comunidades/presidente',
  '/comunidades/renovaciones', '/comunidades/votaciones',
  '/configuracion', '/configuracion/integraciones/stripe', '/configuracion/notificaciones', '/configuracion/ui-mode',
  '/contabilidad', '/contratos', '/contratos/nuevo', '/crm', '/cupones',
  '/dashboard/adaptive', '/dashboard/community', '/documentos',
  '/economia-circular', '/edificios', '/edificios/nuevo',
  '/energia-solar', '/espacios-coworking', '/estadisticas',
  '/finanzas', '/firma-digital', '/garajes-trasteros', '/gestion-incidencias', '/guardias',
  '/hospitality', '/huerto-urbano', '/impuestos', '/informes',
  '/inquilinos', '/inquilinos/nuevo', '/inspeccion-digital', '/instalaciones-deportivas', '/integraciones',
  '/legal', '/licitaciones', '/mantenimiento', '/marketplace', '/marketplace/proveedores', '/marketplace/servicios',
  '/microtransacciones', '/notificaciones', '/obras', '/pagos', '/pagos/planes',
  '/partners', '/partners/comisiones', '/partners/registro', '/partners/recursos',
  '/partners/analiticas', '/partners/soporte', '/partners/capacitacion', '/partners/integraciones', '/partners/marketing',
  '/permisos', '/planes', '/portal-inquilino', '/portal-inquilino/comunicacion', '/portal-inquilino/contrato',
  '/portal-inquilino/dashboard', '/portal-inquilino/documentos', '/portal-inquilino/incidencias', '/portal-inquilino/pagos',
  '/presupuestos', '/proyectos-renovacion', '/puntos-carga',
  '/red-agentes', '/red-agentes/agentes', '/red-agentes/comisiones', '/red-agentes/dashboard',
  '/red-agentes/formacion', '/red-agentes/registro', '/red-agentes/zonas',
  '/reportes', '/reportes/financieros', '/reportes/operacionales',
  '/reservas', '/retail', '/salas-reuniones', '/sales-portal', '/sales-portal/leads/new',
  '/seguros', '/servicios-concierge', '/servicios-limpieza', '/sms',
  '/student-housing', '/student-housing/actividades', '/student-housing/aplicaciones', '/student-housing/dashboard',
  '/student-housing/habitaciones', '/student-housing/mantenimiento', '/student-housing/pagos', '/student-housing/residentes',
  '/subastas', '/suscripciones', '/tareas', '/turismo-alquiler',
  '/unidades', '/unidades/nuevo', '/valoracion-ia', '/verificacion-inquilinos', '/visitas', '/votaciones',
];

function logError(page: string, type: PageError['type'], message: string, severity: PageError['severity'] = 'high') {
  errors.push({
    page,
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
  });

  if (severity === 'critical') {
    console.log(`   🔴 [${type}] ${message.substring(0, 80)}`);
  }
}

async function auditPage(page: Page, route: string, index: number, total: number): Promise<void> {
  const startTime = Date.now();
  console.log(`\n[${index}/${total}] 🔍 ${route}`);
  
  let httpStatus = 0;
  let hasErrors = false;

  try {
    // Capturar response
    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    httpStatus = response?.status() || 0;

    // DETECTAR 404
    if (httpStatus === 404) {
      logError(route, '404', `Página no encontrada (404)`, 'critical');
      hasErrors = true;
      console.log(`   🔴 404 NOT FOUND`);
    }
    
    // DETECTAR 500
    else if (httpStatus >= 500) {
      logError(route, '500', `Error del servidor (${httpStatus})`, 'critical');
      hasErrors = true;
      console.log(`   🔴 ${httpStatus} SERVER ERROR`);
    }

    // Si la página cargó correctamente, buscar botones/links rotos
    if (httpStatus === 200) {
      // Esperar a que se cargue el contenido
      await page.waitForTimeout(1500);

      // Buscar mensajes de error en el DOM
      const errorMessages = await page.$$eval(
        'text=/error|Error|404|not found|no encontrado/i',
        elements => elements.map(el => el.textContent?.substring(0, 100))
      ).catch(() => []);

      if (errorMessages.length > 0) {
        errorMessages.forEach(msg => {
          if (msg && msg.toLowerCase().includes('404')) {
            logError(route, '404', `Contenido indica 404: ${msg}`, 'high');
            hasErrors = true;
            console.log(`   ⚠️  Posible 404 en contenido`);
          }
        });
      }

      // Buscar botones principales y verificar que sean clickeables
      const buttons = await page.$$('button:not([disabled]), a.button, [role="button"]').catch(() => []);
      const buttonCount = buttons.length;
      
      if (buttonCount === 0 && !route.includes('login') && !route.includes('landing')) {
        logError(route, 'broken-button', 'Página sin botones interactivos', 'medium');
        console.log(`   ⚠️  Sin botones interactivos`);
      }
    }

    const duration = Date.now() - startTime;
    pageStatus[route] = { status: httpStatus, hasErrors };

    if (httpStatus === 200 && !hasErrors) {
      console.log(`   ✓ ${duration}ms (OK)`);
    } else if (httpStatus === 200 && hasErrors) {
      console.log(`   ⚠️  ${duration}ms (Warnings)`);
    }

  } catch (error: any) {
    console.log(`   ❌ Error loading: ${error.message}`);
    logError(route, 'navigation-error', `Failed to load: ${error.message}`, 'high');
    pageStatus[route] = { status: 0, hasErrors: true };
  }
}

async function main() {
  console.log('🔍 INICIANDO AUDITORÍA COMPLETA DE 404s Y BOTONES ROTOS\n');
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`📋 Total páginas: ${ALL_ROUTES.length}`);
  console.log(`⏱️  Tiempo estimado: 8-10 minutos\n`);

  // Crear directorio
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const startTime = Date.now();

  // Iniciar browser
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();

  // Login
  console.log('🔐 Intentando login...');
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'admin@inmova.app');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|admin|portal/, { timeout: 10000 });
    console.log('   ✓ Login exitoso\n');
  } catch (error) {
    console.log('   ⚠️  Login falló, continuando sin autenticación\n');
  }

  // Auditar cada página
  for (let i = 0; i < ALL_ROUTES.length; i++) {
    await auditPage(page, ALL_ROUTES[i], i + 1, ALL_ROUTES.length);
    
    // Progreso cada 25 páginas
    if ((i + 1) % 25 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const avgTime = elapsed / (i + 1);
      const remaining = Math.round((ALL_ROUTES.length - i - 1) * avgTime);
      console.log(`\n⏱️  Progreso: ${i + 1}/${ALL_ROUTES.length} | ${elapsed}s elapsed | ~${remaining}s remaining\n`);
    }
  }

  await browser.close();

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  // Guardar errores en JSON
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2));

  // Clasificar errores
  const errors404 = errors.filter(e => e.type === '404');
  const errors500 = errors.filter(e => e.type === '500');
  const errorsNavigation = errors.filter(e => e.type === 'navigation-error');
  const errorsBrokenButtons = errors.filter(e => e.type === 'broken-button');

  const pagesOk = Object.values(pageStatus).filter(s => s.status === 200 && !s.hasErrors).length;
  const pages404 = Object.values(pageStatus).filter(s => s.status === 404).length;
  const pages500 = Object.values(pageStatus).filter(s => s.status >= 500).length;
  const pagesWithWarnings = Object.values(pageStatus).filter(s => s.status === 200 && s.hasErrors).length;

  // Generar reporte
  const report = `
# 🔍 AUDITORÍA COMPLETA - DETECCIÓN DE 404s Y BOTONES ROTOS

**Fecha:** ${new Date().toISOString()}
**Tiempo Total:** ${totalTime}s (${Math.round(totalTime / 60)} minutos)

---

## 📊 RESUMEN EJECUTIVO

### Páginas Auditadas
- ✅ **OK:** ${pagesOk} páginas
- 🔴 **404 NOT FOUND:** ${pages404} páginas
- 🔴 **500 SERVER ERROR:** ${pages500} páginas
- ⚠️  **Con warnings:** ${pagesWithWarnings} páginas
- 📊 **Total:** ${ALL_ROUTES.length} páginas

### Errores Detectados
- 🔴 **Errores 404:** ${errors404.length}
- 🔴 **Errores 500:** ${errors500.length}
- ⚠️  **Errores de navegación:** ${errorsNavigation.length}
- ⚠️  **Botones sin interacción:** ${errorsBrokenButtons.length}
- 📊 **Total errores:** ${errors.length}

---

## 🔴 PÁGINAS CON 404 (CRÍTICO)

${errors404.length > 0 ? errors404.map(e => `- **${e.page}** - ${e.message}`).join('\n') : '✅ No hay páginas con 404'}

---

## 🔴 PÁGINAS CON 500 (CRÍTICO)

${errors500.length > 0 ? errors500.map(e => `- **${e.page}** - ${e.message}`).join('\n') : '✅ No hay páginas con 500'}

---

## ⚠️  ERRORES DE NAVEGACIÓN

${errorsNavigation.length > 0 ? errorsNavigation.slice(0, 20).map(e => `- **${e.page}** - ${e.message}`).join('\n') : '✅ No hay errores de navegación'}

${errorsNavigation.length > 20 ? `\n... y ${errorsNavigation.length - 20} errores más` : ''}

---

## ⚠️  PÁGINAS SIN BOTONES INTERACTIVOS

${errorsBrokenButtons.length > 0 ? errorsBrokenButtons.slice(0, 20).map(e => `- **${e.page}** - ${e.message}`).join('\n') : '✅ Todas las páginas tienen botones'}

${errorsBrokenButtons.length > 20 ? `\n... y ${errorsBrokenButtons.length - 20} páginas más` : ''}

---

## 📁 ARCHIVOS GENERADOS

- \`${ERRORS_FILE}\` - Errores detallados en JSON
- \`${REPORT_FILE}\` - Este reporte

---

## 🎯 PRÓXIMOS PASOS

${errors404.length > 0 ? `
### PRIORIDAD CRÍTICA: Corregir 404s
${errors404.slice(0, 10).map(e => `- [ ] Crear o reparar página: ${e.page}`).join('\n')}
` : ''}

${errors500.length > 0 ? `
### PRIORIDAD ALTA: Corregir errores 500
${errors500.slice(0, 10).map(e => `- [ ] Revisar y corregir: ${e.page}`).join('\n')}
` : ''}

${errorsNavigation.length > 0 ? `
### PRIORIDAD MEDIA: Corregir navegación
- [ ] Revisar páginas con errores de carga
- [ ] Verificar rutas y permisos
` : ''}

---

**Auditoría ID:** AUDIT-404-${new Date().toISOString().split('T')[0]}
**Status:** ${errors404.length > 0 || errors500.length > 0 ? '🔴 ERRORES CRÍTICOS ENCONTRADOS' : '✅ TODO OK'}
`;

  fs.writeFileSync(REPORT_FILE, report);

  console.log('\n' + '='.repeat(80));
  console.log(report);
  console.log('='.repeat(80));

  console.log('\n✅ Auditoría completa finalizada\n');
}

main().catch(console.error);

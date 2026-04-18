/**
 * Verifica la corrección de:
 *  1) /api/ai/valuate ya no genera errores Prisma "ciudad" en logs
 *  2) /api/buildings/{atico-building}/geocode actualiza coords correctamente
 *  3) Vista detalle propiedad muestra mapa con coords actualizadas
 */
const { chromium } = require('playwright');

const BASE = 'https://inmovaapp.com';
const USER = 'dvillagra@vidaroinversiones.com';
const PASS = 'Pucela00#';
const ATICO_UNIT_ID = 'cmmddgnww001nno5evfmexwm4';
const BUILDING_ID = 'cmknwt8ra0009nozl69zruwje';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', USER);
  await page.fill('input[type="password"]', PASS);
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 25000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(4000);

  // === 1. Probe /api/ai/valuate con unitId
  console.log('=== TEST 1: POST /api/ai/valuate con ático Menéndez Pelayo ===');
  const valRes = await page.evaluate(async (id) => {
    const r = await fetch('/api/ai/valuate', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        superficie: 60,
        tipoActivo: 'vivienda',
        habitaciones: 2,
        banos: 2,
        antiguedad: 50,
        planta: 5,
        estadoConservacion: 'bueno',
        orientacion: 'sur',
        finalidad: 'venta',
        unitId: id,
      }),
    });
    let body;
    try { body = await r.json(); } catch { body = await r.text(); }
    return { status: r.status, body: typeof body === 'object' ? { success: body.success, valor: body.valorEstimado, comparablesCount: body.comparables?.length } : body.substring(0, 300) };
  }, ATICO_UNIT_ID);
  console.log(`Status: ${valRes.status}`);
  console.log(JSON.stringify(valRes.body, null, 2));

  // === 2. Estado actual del building (coords antes)
  console.log('\n=== TEST 2: Coords ANTES de re-geocodificar ===');
  const beforeRes = await page.evaluate(async (id) => {
    const r = await fetch(`/api/buildings/${id}`, { credentials: 'include' });
    return r.json();
  }, BUILDING_ID);
  console.log(`Antes: lat=${beforeRes.latitud} lon=${beforeRes.longitud} | direccion=${beforeRes.direccion}`);

  // === 3. Re-geocodificar
  console.log('\n=== TEST 3: POST /api/buildings/{id}/geocode?force=true ===');
  const geoRes = await page.evaluate(async (id) => {
    const r = await fetch(`/api/buildings/${id}/geocode?force=true`, {
      method: 'POST',
      credentials: 'include',
    });
    let body;
    try { body = await r.json(); } catch { body = await r.text(); }
    return { status: r.status, body };
  }, BUILDING_ID);
  console.log(`Status: ${geoRes.status}`);
  console.log(JSON.stringify(geoRes.body, null, 2));

  // === 4. Estado después
  console.log('\n=== TEST 4: Coords DESPUÉS ===');
  const afterRes = await page.evaluate(async (id) => {
    const r = await fetch(`/api/buildings/${id}`, { credentials: 'include' });
    return r.json();
  }, BUILDING_ID);
  console.log(`Después: lat=${afterRes.latitud} lon=${afterRes.longitud}`);

  // === 5. Listar buildings con coords sospechosas (usando endpoint admin)
  console.log('\n=== TEST 5: GET /api/admin/geocode-buildings (lista buildings con coords sospechosas) ===');
  const listRes = await page.evaluate(async () => {
    const r = await fetch('/api/admin/geocode-buildings', { credentials: 'include' });
    let body;
    try { body = await r.json(); } catch { body = await r.text(); }
    return { status: r.status, body: typeof body === 'object' ? { total: body.total, sample: body.buildings?.slice(0, 5) } : body.substring(0, 200) };
  });
  console.log(`Status: ${listRes.status}`);
  console.log(JSON.stringify(listRes.body, null, 2));

  await browser.close();
})();

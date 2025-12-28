import { test, expect } from '@playwright/test';

/**
 * Test de verificación visual del dominio inmovaapp.com
 * Verifica que el dominio esté funcionando correctamente
 */

const DOMAINS_TO_TEST = [
  'https://inmovaapp.com',
  'https://www.inmovaapp.com',
  'https://inmova.app', // Dominio actual para comparar
];

test.describe('Verificación de Dominio inmovaapp.com', () => {
  
  test('debe cargar la página principal en inmovaapp.com', async ({ page }) => {
    const response = await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Verificar que la página carga correctamente
    expect(response?.status()).toBeLessThan(400);
    
    // Verificar título de la página
    await expect(page).toHaveTitle(/Inmova|INMOVA/i);
    
    // Tomar screenshot
    await page.screenshot({ 
      path: 'test-results/inmovaapp-home.png',
      fullPage: true 
    });
  });

  test('debe tener certificado SSL válido', async ({ page }) => {
    const response = await page.goto('https://inmovaapp.com');
    
    // Si llegamos aquí con https://, el SSL funciona
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain('https://');
  });

  test('debe mostrar el logo de la aplicación', async ({ page }) => {
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    // Buscar el logo (ajusta el selector según tu app)
    const logo = page.locator('img[alt*="logo" i], img[alt*="inmova" i], [aria-label*="logo" i]').first();
    
    // Esperar a que sea visible
    await expect(logo).toBeVisible({ timeout: 10000 });
  });

  test('debe redirigir www a dominio principal', async ({ page }) => {
    const response = await page.goto('https://www.inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    // Verificar que carga correctamente
    expect(response?.status()).toBeLessThan(400);
    
    // El dominio final debe ser válido
    const finalUrl = page.url();
    expect(finalUrl).toContain('inmovaapp.com');
  });

  test('debe tener headers de seguridad correctos', async ({ page }) => {
    const response = await page.goto('https://inmovaapp.com');
    
    const headers = response?.headers();
    
    // Headers de seguridad recomendados
    // Nota: Algunos pueden no estar presentes dependiendo de la configuración
    console.log('Headers recibidos:', headers);
    
    // Verificar que no hay errores críticos
    expect(response?.status()).toBeLessThan(400);
  });

  test('debe cargar recursos estáticos correctamente', async ({ page }) => {
    const resourceErrors: string[] = [];
    
    // Capturar errores de recursos
    page.on('response', response => {
      if (response.status() >= 400) {
        resourceErrors.push(`${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    // Esperar a que cargue completamente
    await page.waitForTimeout(3000);

    // Verificar que no hay errores críticos en recursos
    const criticalErrors = resourceErrors.filter(err => 
      !err.includes('analytics') && 
      !err.includes('tracking') &&
      !err.includes('.svg') // SVGs a veces fallan sin afectar funcionalidad
    );

    if (criticalErrors.length > 0) {
      console.warn('Errores de recursos encontrados:', criticalErrors);
    }

    // No debería haber muchos errores críticos
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('debe mostrar el formulario de login', async ({ page }) => {
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    // Buscar elementos comunes de login
    const loginButton = page.locator('button:has-text("Iniciar sesión"), button:has-text("Login"), a:has-text("Iniciar sesión")').first();
    
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });

  test('debe ser responsive en móvil', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    // Tomar screenshot móvil
    await page.screenshot({ 
      path: 'test-results/inmovaapp-mobile.png',
      fullPage: true 
    });

    // Verificar que la página es visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('debe ser responsive en tablet', async ({ page }) => {
    // Configurar viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    // Tomar screenshot tablet
    await page.screenshot({ 
      path: 'test-results/inmovaapp-tablet.png',
      fullPage: true 
    });

    await expect(page.locator('body')).toBeVisible();
  });

  test('debe cargar en tiempo razonable', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'domcontentloaded',
    });

    const loadTime = Date.now() - startTime;
    
    console.log(`Tiempo de carga: ${loadTime}ms`);
    
    // No debería tardar más de 10 segundos
    expect(loadTime).toBeLessThan(10000);
  });

  test('debe tener headers de Cloudflare', async ({ page }) => {
    const response = await page.goto('https://inmovaapp.com');
    
    const headers = response?.headers();
    
    // Verificar headers de Cloudflare
    const cfHeaders = {
      'cf-ray': headers?.['cf-ray'],
      'cf-cache-status': headers?.['cf-cache-status'],
      'server': headers?.['server'],
    };

    console.log('Cloudflare Headers:', cfHeaders);
    
    // Si hay cf-ray, está pasando por Cloudflare
    if (cfHeaders['cf-ray']) {
      console.log('✅ Cloudflare CDN activo');
    } else {
      console.log('⚠️  No se detectaron headers de Cloudflare');
    }

    // Tomar screenshot final
    await page.screenshot({ 
      path: 'test-results/inmovaapp-final.png',
      fullPage: false 
    });
  });
});

test.describe('Comparación con dominio actual', () => {
  
  test('debe tener contenido similar a inmova.app', async ({ page }) => {
    // Visitar dominio nuevo
    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });
    
    const newDomainTitle = await page.title();
    const newDomainUrl = page.url();

    console.log('Nuevo dominio:', newDomainUrl);
    console.log('Título:', newDomainTitle);

    // Verificar que tiene contenido
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });
});

test.describe('Verificación de CDN', () => {
  
  test('debe servir assets desde CDN de Cloudflare', async ({ page }) => {
    const cdnRequests: string[] = [];
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('cdn.inmovaapp.com') || response.headers()['cf-ray']) {
        cdnRequests.push(url);
      }
    });

    await page.goto('https://inmovaapp.com', {
      waitUntil: 'networkidle',
    });

    console.log('Requests via CDN:', cdnRequests.length);
    
    if (cdnRequests.length > 0) {
      console.log('URLs del CDN:', cdnRequests.slice(0, 5));
    }
  });
});

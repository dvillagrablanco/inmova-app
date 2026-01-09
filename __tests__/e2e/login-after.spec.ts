import { test } from '@playwright/test';

test('Capturar login mejorado', async ({ page }) => {
  await page.goto('https://inmovaapp.com/login');
  await page.waitForLoadState('networkidle');
  
  // Captura después de mejoras
  await page.screenshot({ path: 'screenshots-login/login-improved.png', fullPage: true });
  
  // Analizar nuevos estilos
  const styles = await page.evaluate(() => {
    const results: Record<string, string> = {};
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, i) => {
      const s = getComputedStyle(input);
      results[`input${i}Bg`] = s.backgroundColor;
      results[`input${i}Border`] = s.borderColor;
    });
    
    const labels = document.querySelectorAll('label');
    labels.forEach((label, i) => {
      results[`label${i}Color`] = getComputedStyle(label).color;
    });
    
    return results;
  });
  
  console.log('\n=== NUEVOS COLORES LOGIN ===');
  Object.entries(styles).forEach(([k, v]) => console.log(`${k}: ${v}`));
  console.log('=============================\n');
});

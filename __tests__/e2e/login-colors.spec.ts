import { test } from '@playwright/test';

test('Analizar colores de login', async ({ page }) => {
  await page.goto('https://inmovaapp.com/login');
  await page.waitForLoadState('networkidle');
  
  // Captura
  await page.screenshot({ path: 'screenshots-login/login-current.png', fullPage: true });
  
  // Analizar estilos
  const styles = await page.evaluate(() => {
    const results: Record<string, string> = {};
    
    results.bodyBg = getComputedStyle(document.body).backgroundColor;
    
    const main = document.querySelector('main');
    if (main) results.mainBg = getComputedStyle(main).backgroundColor;
    
    const formContainer = document.querySelector('form')?.parentElement;
    if (formContainer) {
      results.formContainerBg = getComputedStyle(formContainer).backgroundColor;
    }
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, i) => {
      const s = getComputedStyle(input);
      results[`input${i}Bg`] = s.backgroundColor;
      results[`input${i}Color`] = s.color;
      results[`input${i}Border`] = s.borderColor;
    });
    
    const labels = document.querySelectorAll('label');
    labels.forEach((label, i) => {
      results[`label${i}Color`] = getComputedStyle(label).color;
    });
    
    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
      const s = getComputedStyle(btn);
      results.btnBg = s.backgroundColor;
      results.btnColor = s.color;
    }
    
    const h1 = document.querySelector('h1, h2');
    if (h1) results.titleColor = getComputedStyle(h1).color;
    
    return results;
  });
  
  console.log('\n=== COLORES LOGIN ===');
  Object.entries(styles).forEach(([k, v]) => console.log(`${k}: ${v}`));
  console.log('=====================\n');
});

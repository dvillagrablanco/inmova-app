import { test, expect } from '@playwright/test';

test('Analizar colores de login', async ({ page }) => {
  await page.goto('https://inmovaapp.com/login');
  await page.waitForLoadState('networkidle');
  
  // Captura
  await page.screenshot({ path: 'screenshots-login/login-current.png', fullPage: true });
  
  // Analizar estilos
  const styles = await page.evaluate(() => {
    const results: Record<string, string> = {};
    
    // Background
    results.bodyBg = getComputedStyle(document.body).backgroundColor;
    
    // Contenedor principal
    const main = document.querySelector('main');
    if (main) results.mainBg = getComputedStyle(main).backgroundColor;
    
    // Card/Form container - buscar divs con clases específicas
    const formContainer = document.querySelector('form')?.parentElement;
    if (formContainer) {
      results.formContainerBg = getComputedStyle(formContainer).backgroundColor;
    }
    
    // Inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, i) => {
      const s = getComputedStyle(input);
      results[`input${i}Bg`] = s.backgroundColor;
      results[`input${i}Color`] = s.color;
      results[`input${i}Border`] = s.borderColor;
      results[`input${i}Placeholder`] = (input as HTMLInputElement).placeholder || '';
    });
    
    // Labels
    const labels = document.querySelectorAll('label');
    labels.forEach((label, i) => {
      results[`label${i}Color`] = getComputedStyle(label).color;
      results[`label${i}Text`] = label.textContent?.trim() || '';
    });
    
    // Botón
    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
      const s = getComputedStyle(btn);
      results.btnBg = s.backgroundColor;
      results.btnColor = s.color;
    }
    
    // Título
    const h1 = document.querySelector('h1, h2');
    if (h1) {
      results.titleColor = getComputedStyle(h1).color;
      results.titleText = h1.textContent?.trim() || '';
    }
    
    return results;
  });
  
  console.log('\n=== ANÁLISIS DE COLORES - LOGIN ===');
  Object.entries(styles).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  console.log('=====================================\n');
});

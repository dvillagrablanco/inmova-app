import { test } from '@playwright/test';

test('Capturar login final', async ({ page }) => {
  await page.goto('https://inmovaapp.com/login');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'screenshots-login/login-final.png', fullPage: true });

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

  console.log('\n=== COLORES FINALES LOGIN ===');
  Object.entries(styles).forEach(([k, v]) => console.log(`${k}: ${v}`));
  console.log('==============================\n');
});

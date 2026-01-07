import { test } from '@playwright/test';

test('Auditoría específica de elementos problemáticos', async ({ page }) => {
  await page.goto('https://inmovaapp.com/landing?nocache=' + Date.now(), { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const elementsToCheck = [
    { selector: 'text=Empezar Gratis', name: 'Botón Empezar Gratis' },
    { selector: 'text=Ver Demo', name: 'Botón Ver Demo' },
    { selector: 'text=Propietarios', name: 'Tab Propietarios' },
    { selector: 'text=Gestores', name: 'Tab Gestores' },
    { selector: 'text=Construcción', name: 'Tab Construcción' },
    { selector: 'text=Inversores', name: 'Tab Inversores' },
    { selector: 'text=Prueba de 30 días', name: 'Prueba 30 días' },
    { selector: 'text=Ver planes y precios', name: 'Ver planes y precios' },
    { selector: 'text=Acceder', name: 'Acceder' },
    { selector: 'text=Solicitar Demo Personalizada', name: 'Solicitar Demo' },
    { selector: 'text=Características', name: 'Características comparativa' },
  ];
  
  console.log('\n=== AUDITORÍA DE ELEMENTOS ESPECÍFICOS ===\n');
  
  for (const item of elementsToCheck) {
    try {
      const elements = await page.locator(item.selector).all();
      
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!await el.isVisible()) continue;
        
        // Estado normal
        const normalStyles = await el.evaluate((node) => {
          const style = window.getComputedStyle(node);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            text: node.textContent?.trim().substring(0, 30)
          };
        });
        
        // Hover
        await el.hover();
        await page.waitForTimeout(200);
        
        const hoverStyles = await el.evaluate((node) => {
          const style = window.getComputedStyle(node);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor
          };
        });
        
        // Analizar contraste
        const parseRGB = (color: string) => {
          const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (match) return { r: +match[1], g: +match[2], b: +match[3] };
          return null;
        };
        
        const getLum = (rgb: any) => {
          if (!rgb) return 1;
          const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
          const linear = sRGB.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
          return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
        };
        
        const isDark = (color: string) => getLum(parseRGB(color)) < 0.2;
        const isLight = (color: string) => getLum(parseRGB(color)) > 0.5;
        
        const normalTextDark = isDark(normalStyles.color);
        const normalBgDark = isDark(normalStyles.backgroundColor);
        const hoverTextDark = isDark(hoverStyles.color);
        const hoverBgDark = isDark(hoverStyles.backgroundColor);
        
        let issues = [];
        if (normalTextDark && normalBgDark) issues.push('Normal: texto oscuro/fondo oscuro');
        if (hoverTextDark && hoverBgDark) issues.push('Hover: texto oscuro/fondo oscuro');
        
        const status = issues.length > 0 ? '❌' : '✅';
        console.log(`${status} ${item.name} #${i + 1}: "${normalStyles.text}"`);
        console.log(`   Normal: color=${normalStyles.color.substring(0,20)} bg=${normalStyles.backgroundColor.substring(0,20)}`);
        console.log(`   Hover:  color=${hoverStyles.color.substring(0,20)} bg=${hoverStyles.backgroundColor.substring(0,20)}`);
        if (issues.length > 0) {
          issues.forEach(iss => console.log(`   ⚠️ ${iss}`));
        }
        console.log('');
      }
    } catch (e) {
      console.log(`⚠️ ${item.name}: No encontrado o error`);
    }
  }
});

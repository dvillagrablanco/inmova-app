import { test } from '@playwright/test';

const PAGES = [
  '/landing',
  '/landing/demo',
  '/landing/ventajas',
  '/landing/sobre-nosotros',
  '/landing/contacto',
  '/landing/blog',
  '/landing/casos-exito',
  '/ewoorker/landing',
  '/landing/legal/privacidad',
  '/landing/legal/terminos',
  '/landing/legal/gdpr',
  '/landing/legal/cookies'
];

test('Auditoría completa de texto oscuro sobre fondo oscuro', async ({ page }) => {
  const allIssues: any[] = [];
  
  for (const path of PAGES) {
    try {
      await page.goto(`https://inmovaapp.com${path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const issues = await page.evaluate(() => {
        const results: any[] = [];
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, div.text-sm, div.text-xs, div.text-base, div.text-lg, li');
        
        function parseColor(color: string) {
          const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            return { r: +match[1], g: +match[2], b: +match[3], a: match[4] ? +match[4] : 1 };
          }
          return { r: 0, g: 0, b: 0, a: 1 };
        }
        
        function getLuminance(color: string) {
          const { r, g, b } = parseColor(color);
          const sRGB = [r / 255, g / 255, b / 255];
          const linear = sRGB.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
          return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
        }
        
        function isDark(color: string) { return getLuminance(color) < 0.2; }
        
        function findBg(el: Element): string {
          let current: Element | null = el;
          let depth = 0;
          while (current && depth < 15) {
            const bg = window.getComputedStyle(current).backgroundColor;
            const { a } = parseColor(bg);
            if (a > 0.5) return bg;
            current = current.parentElement;
            depth++;
          }
          return 'rgb(255, 255, 255)';
        }
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const textColor = style.color;
          const bgColor = findBg(el);
          const text = el.textContent?.trim().substring(0, 40) || '';
          
          if (!text || text.length < 2) return;
          if (!el.checkVisibility?.()) return;
          
          if (isDark(textColor) && isDark(bgColor)) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              results.push({
                text,
                textColor,
                bgColor,
                tag: el.tagName,
                classes: (el.className || '').substring?.(0, 80) || ''
              });
            }
          }
        });
        
        // Eliminar duplicados por texto
        const unique = results.filter((item, index, self) => 
          index === self.findIndex(t => t.text === item.text)
        );
        
        return unique;
      });
      
      if (issues.length > 0) {
        allIssues.push({ page: path, issues });
      }
      
      console.log(`${path}: ${issues.length} problemas`);
      
    } catch (e: any) {
      console.log(`${path}: ERROR - ${e.message?.substring(0, 50)}`);
    }
  }
  
  console.log('\n=== RESUMEN DETALLADO ===\n');
  
  if (allIssues.length === 0) {
    console.log('✅ No se encontraron problemas de texto oscuro sobre fondo oscuro');
  } else {
    allIssues.forEach(({ page, issues }) => {
      console.log(`\n📍 ${page}:`);
      issues.forEach((issue: any, i: number) => {
        console.log(`  ${i + 1}. "${issue.text}"`);
        console.log(`     Text: ${issue.textColor} | Bg: ${issue.bgColor}`);
        console.log(`     ${issue.tag} - ${issue.classes}`);
      });
    });
  }
  
  const total = allIssues.reduce((sum, p) => sum + p.issues.length, 0);
  console.log(`\n\n📊 Total: ${total} problemas en ${allIssues.length} páginas\n`);
});

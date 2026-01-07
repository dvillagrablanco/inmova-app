import { test, expect, Page } from '@playwright/test';

const PRODUCTION_URL = 'https://inmovaapp.com';

interface ButtonAnalysis {
  text: string;
  bgColor: string;
  textColor: string;
  contrast: number;
  visible: boolean;
  selector: string;
  issue?: string;
}

// Función para calcular luminancia relativa
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Función para calcular ratio de contraste
function getContrastRatio(color1: string, color2: string): number {
  const parseColor = (color: string): [number, number, number] => {
    // Manejar rgb(r, g, b) y rgba(r, g, b, a)
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    }
    // Manejar colores hex
    const hexMatch = color.match(/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/);
    if (hexMatch) {
      return [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)];
    }
    // Color por defecto (negro)
    return [0, 0, 0];
  };

  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);
  
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Función para detectar si un color es oscuro
function isDarkColor(color: string): boolean {
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    const luminance = getLuminance(r, g, b);
    return luminance < 0.5;
  }
  return false;
}

async function analyzeButtons(page: Page): Promise<ButtonAnalysis[]> {
  const results: ButtonAnalysis[] = [];
  
  // Buscar todos los botones y elementos clickables
  const buttons = await page.locator('button, a.btn, [role="button"], a[href]:has-text(""), .button, [class*="btn"]').all();
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    
    try {
      const isVisible = await button.isVisible();
      if (!isVisible) continue;
      
      const text = await button.textContent() || '';
      if (!text.trim()) continue;
      
      const box = await button.boundingBox();
      if (!box || box.width < 10 || box.height < 10) continue;
      
      // Obtener estilos computados
      const styles = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          bgColor: computed.backgroundColor,
          textColor: computed.color,
          opacity: computed.opacity,
        };
      });
      
      const contrast = getContrastRatio(styles.textColor, styles.bgColor);
      const textIsDark = isDarkColor(styles.textColor);
      const bgIsDark = isDarkColor(styles.bgColor);
      
      let issue: string | undefined;
      
      // Detectar problemas
      if (contrast < 3) {
        issue = `Contraste muy bajo: ${contrast.toFixed(2)}:1 (mínimo 3:1)`;
      } else if (contrast < 4.5) {
        issue = `Contraste bajo: ${contrast.toFixed(2)}:1 (recomendado 4.5:1)`;
      } else if (textIsDark && bgIsDark) {
        issue = `Texto oscuro sobre fondo oscuro`;
      }
      
      results.push({
        text: text.trim().substring(0, 50),
        bgColor: styles.bgColor,
        textColor: styles.textColor,
        contrast: Math.round(contrast * 100) / 100,
        visible: isVisible,
        selector: `button:has-text("${text.trim().substring(0, 20)}")`,
        issue,
      });
    } catch (e) {
      // Ignorar errores de elementos que ya no existen
    }
  }
  
  return results;
}

test.describe('Auditoría de Botones - Visibilidad y Contraste', () => {
  
  test('Analizar todos los botones de la landing', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`);
    await page.waitForLoadState('networkidle');
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ANÁLISIS DE BOTONES - LANDING PRINCIPAL');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const buttons = await analyzeButtons(page);
    
    const withIssues = buttons.filter(b => b.issue);
    const withoutIssues = buttons.filter(b => !b.issue);
    
    console.log(`Total botones analizados: ${buttons.length}`);
    console.log(`✅ Sin problemas: ${withoutIssues.length}`);
    console.log(`⚠️  Con problemas: ${withIssues.length}\n`);
    
    if (withIssues.length > 0) {
      console.log('BOTONES CON PROBLEMAS DE VISIBILIDAD:');
      console.log('─────────────────────────────────────────────────────────────────');
      
      for (const btn of withIssues) {
        console.log(`\n❌ "${btn.text}"`);
        console.log(`   Problema: ${btn.issue}`);
        console.log(`   Texto: ${btn.textColor}`);
        console.log(`   Fondo: ${btn.bgColor}`);
        console.log(`   Contraste: ${btn.contrast}:1`);
      }
    }
    
    console.log('\n\nTODOS LOS BOTONES:');
    console.log('─────────────────────────────────────────────────────────────────');
    for (const btn of buttons) {
      const status = btn.issue ? '⚠️ ' : '✅';
      console.log(`${status} "${btn.text}" - Contraste: ${btn.contrast}:1 | BG: ${btn.bgColor} | Text: ${btn.textColor}`);
    }
    
    // El test pasa pero reporta los problemas
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('Analizar botones en secciones específicas', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`);
    await page.waitForLoadState('networkidle');
    
    const sections = [
      { name: 'Hero', selector: 'section:first-of-type, [class*="hero"]' },
      { name: 'Pricing', selector: '[id*="pricing"], [class*="pricing"], section:has-text("Planes")' },
      { name: 'CTA', selector: '[class*="cta"], section:has-text("Empieza")' },
      { name: 'Footer', selector: 'footer' },
    ];
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ANÁLISIS POR SECCIONES');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    for (const section of sections) {
      const sectionEl = page.locator(section.selector).first();
      if (await sectionEl.count() > 0) {
        const buttons = await sectionEl.locator('button, a.btn, [role="button"], a[href]').all();
        
        console.log(`\n📍 Sección: ${section.name}`);
        console.log(`   Botones encontrados: ${buttons.length}`);
        
        for (const btn of buttons) {
          try {
            const isVisible = await btn.isVisible();
            if (!isVisible) continue;
            
            const text = await btn.textContent() || '';
            if (!text.trim()) continue;
            
            const styles = await btn.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                bgColor: computed.backgroundColor,
                textColor: computed.color,
              };
            });
            
            const contrast = getContrastRatio(styles.textColor, styles.bgColor);
            const status = contrast < 4.5 ? '⚠️ ' : '✅';
            
            console.log(`   ${status} "${text.trim().substring(0, 40)}" - ${contrast.toFixed(1)}:1`);
          } catch (e) {
            // Ignorar
          }
        }
      }
    }
  });

  test('Verificar botones del header', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`);
    await page.waitForLoadState('networkidle');
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  BOTONES DEL HEADER');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const header = page.locator('header, nav').first();
    const headerButtons = await header.locator('button, a[href]').all();
    
    for (const btn of headerButtons) {
      try {
        const isVisible = await btn.isVisible();
        if (!isVisible) continue;
        
        const text = await btn.textContent() || '';
        if (!text.trim()) continue;
        
        const styles = await btn.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            bgColor: computed.backgroundColor,
            textColor: computed.color,
            borderColor: computed.borderColor,
          };
        });
        
        const contrast = getContrastRatio(styles.textColor, styles.bgColor);
        const status = contrast < 4.5 ? '⚠️  BAJO' : '✅ OK';
        
        console.log(`${status} "${text.trim().substring(0, 30)}"`);
        console.log(`      Texto: ${styles.textColor}`);
        console.log(`      Fondo: ${styles.bgColor}`);
        console.log(`      Contraste: ${contrast.toFixed(2)}:1`);
      } catch (e) {
        // Ignorar
      }
    }
  });

});

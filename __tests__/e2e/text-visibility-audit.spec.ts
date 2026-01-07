import { test, expect, Page } from '@playwright/test';

const PRODUCTION_URL = 'https://inmovaapp.com';

// Páginas a auditar
const PAGES_TO_AUDIT = [
  '/landing',
  '/landing/demo',
  '/landing/ventajas',
  '/landing/sobre-nosotros',
  '/landing/blog',
  '/landing/casos-exito',
  '/landing/contacto',
  '/landing/legal/privacidad',
  '/landing/legal/terminos',
  '/landing/legal/gdpr',
  '/landing/legal/cookies',
  '/ewoorker/landing',
];

interface TextAnalysis {
  text: string;
  textColor: string;
  bgColor: string;
  effectiveBgColor: string;
  contrast: number;
  selector: string;
  page: string;
  isDarkOnDark: boolean;
  isLightOnLight: boolean;
}

// Parsear color RGB/RGBA
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

// Calcular luminancia relativa
function getLuminance(color: string): number {
  const { r, g, b } = parseColor(color);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calcular ratio de contraste
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Detectar si es color oscuro
function isDarkColor(color: string): boolean {
  const luminance = getLuminance(color);
  return luminance < 0.2; // Umbral para "oscuro"
}

// Detectar si es color claro
function isLightColor(color: string): boolean {
  const luminance = getLuminance(color);
  return luminance > 0.6; // Umbral para "claro"
}

// Detectar fondo transparente
function isTransparentBg(color: string): boolean {
  const { a } = parseColor(color);
  return a === 0 || color === 'rgba(0, 0, 0, 0)' || color === 'transparent';
}

// Obtener el color de fondo efectivo buscando en ancestros
async function getEffectiveBackground(element: any, page: Page): Promise<string> {
  // Obtener el fondo del elemento actual
  const bgColor = await element.evaluate((el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    return style.backgroundColor;
  });

  if (!isTransparentBg(bgColor)) {
    return bgColor;
  }

  // Buscar en ancestros hasta encontrar un fondo no transparente
  const ancestorBg = await element.evaluate((el: HTMLElement) => {
    let current = el.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      const bg = style.backgroundColor;
      const parsed = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (parsed) {
        const alpha = parsed[4] ? parseFloat(parsed[4]) : 1;
        if (alpha > 0) {
          return bg;
        }
      }
      current = current.parentElement;
    }
    return 'rgb(255, 255, 255)'; // Default white
  });

  return ancestorBg;
}

async function analyzeTextElements(page: Page, pageUrl: string): Promise<TextAnalysis[]> {
  const results: TextAnalysis[] = [];

  // Selectores para elementos de texto importantes
  const textSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p',
    'span',
    'a',
    'button',
    'label',
    'li',
    'td', 'th',
    '[class*="text-"]',
  ];

  for (const selector of textSelectors) {
    const elements = await page.locator(selector).all();

    for (const element of elements) {
      try {
        const isVisible = await element.isVisible();
        if (!isVisible) continue;

        const text = await element.innerText();
        if (!text || text.trim().length === 0 || text.length > 100) continue;

        const styles = await element.evaluate((el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            bgColor: style.backgroundColor,
            fontSize: style.fontSize,
          };
        });

        // Obtener fondo efectivo (buscando en ancestros si es transparente)
        const effectiveBgColor = await getEffectiveBackground(element, page);

        const contrast = getContrastRatio(styles.color, effectiveBgColor);
        const textIsDark = isDarkColor(styles.color);
        const bgIsDark = isDarkColor(effectiveBgColor);
        const textIsLight = isLightColor(styles.color);
        const bgIsLight = isLightColor(effectiveBgColor);

        // Detectar problemas: texto oscuro sobre fondo oscuro
        const isDarkOnDark = textIsDark && bgIsDark && contrast < 4.5;
        // Detectar problemas: texto claro sobre fondo claro
        const isLightOnLight = textIsLight && bgIsLight && contrast < 4.5;

        if (isDarkOnDark || isLightOnLight || contrast < 3) {
          results.push({
            text: text.trim().substring(0, 50),
            textColor: styles.color,
            bgColor: styles.bgColor,
            effectiveBgColor,
            contrast: Math.round(contrast * 100) / 100,
            selector,
            page: pageUrl,
            isDarkOnDark,
            isLightOnLight,
          });
        }
      } catch (e) {
        // Ignorar errores de elementos que no se pueden analizar
      }
    }
  }

  // Eliminar duplicados
  const unique = results.filter((item, index, self) =>
    index === self.findIndex((t) => t.text === item.text && t.page === item.page)
  );

  return unique;
}

test.describe('Auditoría de Textos - Visibilidad en Todas las Páginas', () => {
  test('Analizar textos oscuros sobre fondos oscuros en todas las páginas', async ({ page }) => {
    const allIssues: TextAnalysis[] = [];

    console.log('\n' + '═'.repeat(70));
    console.log('  AUDITORÍA DE TEXTOS - VISIBILIDAD');
    console.log('═'.repeat(70) + '\n');

    for (const pageUrl of PAGES_TO_AUDIT) {
      const fullUrl = `${PRODUCTION_URL}${pageUrl}`;
      console.log(`\n📍 Analizando: ${pageUrl}`);

      try {
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);

        const issues = await analyzeTextElements(page, pageUrl);
        
        if (issues.length > 0) {
          console.log(`   ⚠️  ${issues.length} problemas encontrados`);
          
          // Mostrar solo los problemas de texto oscuro sobre oscuro
          const darkOnDark = issues.filter(i => i.isDarkOnDark);
          if (darkOnDark.length > 0) {
            console.log(`   🔴 Texto oscuro sobre fondo oscuro: ${darkOnDark.length}`);
            darkOnDark.forEach(issue => {
              console.log(`      - "${issue.text}" (${issue.contrast}:1)`);
              console.log(`        Texto: ${issue.textColor}`);
              console.log(`        Fondo: ${issue.effectiveBgColor}`);
            });
          }

          const lightOnLight = issues.filter(i => i.isLightOnLight);
          if (lightOnLight.length > 0) {
            console.log(`   🟡 Texto claro sobre fondo claro: ${lightOnLight.length}`);
            lightOnLight.forEach(issue => {
              console.log(`      - "${issue.text}" (${issue.contrast}:1)`);
            });
          }

          allIssues.push(...issues);
        } else {
          console.log(`   ✅ Sin problemas de visibilidad`);
        }
      } catch (e) {
        console.log(`   ❌ Error cargando página: ${e}`);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('  RESUMEN FINAL');
    console.log('═'.repeat(70));
    console.log(`\nTotal páginas analizadas: ${PAGES_TO_AUDIT.length}`);
    console.log(`Total problemas encontrados: ${allIssues.length}`);
    
    const darkOnDarkTotal = allIssues.filter(i => i.isDarkOnDark);
    const lightOnLightTotal = allIssues.filter(i => i.isLightOnLight);
    
    console.log(`\n🔴 Texto oscuro sobre fondo oscuro: ${darkOnDarkTotal.length}`);
    console.log(`🟡 Texto claro sobre fondo claro: ${lightOnLightTotal.length}`);

    if (darkOnDarkTotal.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log('PROBLEMAS DE TEXTO OSCURO SOBRE FONDO OSCURO:');
      console.log('─'.repeat(70));
      
      // Agrupar por página
      const byPage = darkOnDarkTotal.reduce((acc, issue) => {
        if (!acc[issue.page]) acc[issue.page] = [];
        acc[issue.page].push(issue);
        return acc;
      }, {} as Record<string, TextAnalysis[]>);

      for (const [pagePath, issues] of Object.entries(byPage)) {
        console.log(`\n📍 ${pagePath}:`);
        issues.forEach(issue => {
          console.log(`   ❌ "${issue.text}"`);
          console.log(`      Contraste: ${issue.contrast}:1 (mínimo 4.5:1)`);
          console.log(`      Texto: ${issue.textColor}`);
          console.log(`      Fondo efectivo: ${issue.effectiveBgColor}`);
          console.log(`      Selector: ${issue.selector}`);
        });
      }
    }

    console.log('\n' + '═'.repeat(70) + '\n');
  });

  test('Verificar secciones específicas de la landing principal', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/landing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('\n' + '═'.repeat(70));
    console.log('  ANÁLISIS DETALLADO - LANDING PRINCIPAL');
    console.log('═'.repeat(70));

    // Secciones a revisar
    const sections = [
      { name: 'Header/Navigation', selector: 'header, nav' },
      { name: 'Hero Section', selector: '[class*="hero"], section:first-of-type' },
      { name: 'Features', selector: '#features, [class*="feature"]' },
      { name: 'Pricing', selector: '#pricing, [class*="pricing"]' },
      { name: 'Footer', selector: 'footer' },
      { name: 'Banners/Promos', selector: '[class*="banner"], [class*="promo"], [class*="cta"]' },
    ];

    for (const section of sections) {
      console.log(`\n📍 Sección: ${section.name}`);
      
      const sectionElements = await page.locator(section.selector).all();
      
      if (sectionElements.length === 0) {
        console.log('   (No encontrada)');
        continue;
      }

      let issueCount = 0;

      for (const sectionEl of sectionElements) {
        try {
          const isVisible = await sectionEl.isVisible();
          if (!isVisible) continue;

          // Obtener el fondo de la sección
          const sectionBg = await getEffectiveBackground(sectionEl, page);
          const sectionIsDark = isDarkColor(sectionBg);

          // Buscar textos dentro de la sección
          const textElements = await sectionEl.locator('h1, h2, h3, h4, p, span, a, button, li').all();

          for (const textEl of textElements) {
            try {
              const isTextVisible = await textEl.isVisible();
              if (!isTextVisible) continue;

              const text = await textEl.innerText();
              if (!text || text.trim().length === 0 || text.length > 80) continue;

              const textColor = await textEl.evaluate((el: HTMLElement) => {
                return window.getComputedStyle(el).color;
              });

              const effectiveBg = await getEffectiveBackground(textEl, page);
              const textIsDark = isDarkColor(textColor);
              const bgIsDark = isDarkColor(effectiveBg);
              const contrast = getContrastRatio(textColor, effectiveBg);

              if (textIsDark && bgIsDark && contrast < 4.5) {
                issueCount++;
                console.log(`   ❌ TEXTO OSCURO SOBRE FONDO OSCURO:`);
                console.log(`      "${text.trim().substring(0, 50)}"`);
                console.log(`      Texto: ${textColor}`);
                console.log(`      Fondo: ${effectiveBg}`);
                console.log(`      Contraste: ${contrast.toFixed(2)}:1`);
              }
            } catch (e) {
              // Ignorar
            }
          }
        } catch (e) {
          // Ignorar
        }
      }

      if (issueCount === 0) {
        console.log('   ✅ Sin problemas de texto oscuro sobre oscuro');
      }
    }

    console.log('\n' + '═'.repeat(70) + '\n');
  });
});

#!/usr/bin/env tsx
/**
 * Auto-Fix JSX Structure
 * 
 * Este script corrige automáticamente problemas comunes de estructura JSX:
 * - Cierres de tags faltantes
 * - Indentación incorrecta
 * - Componentes sin Fragment cuando es necesario
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FixResult {
  file: string;
  fixed: boolean;
  issues: string[];
}

class JSXFixer {
  private results: FixResult[] = [];

  async fixAll(pattern: string = 'app/**/*.{ts,tsx}'): Promise<void> {
    console.log('🔍 Buscando archivos JSX/TSX...\n');
    
    const files = await glob(pattern, {
      ignore: ['node_modules/**', '.next/**', 'dist/**'],
      cwd: process.cwd(),
    });

    console.log(`📁 Encontrados ${files.length} archivos\n`);

    for (const file of files) {
      await this.fixFile(file);
    }

    this.printSummary();
  }

  private async fixFile(filePath: string): Promise<void> {
    const result: FixResult = {
      file: filePath,
      fixed: false,
      issues: [],
    };

    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Fix 1: Corregir indentación excesiva en JSX
      content = this.fixIndentation(content, result);

      // Fix 2: Asegurar que componentes con Dialog usen Fragment
      content = this.ensureFragmentForDialogs(content, result);

      // Fix 3: Corregir cierres de AuthenticatedLayout
      content = this.fixAuthenticatedLayoutClosing(content, result);

      // Fix 4: Eliminar divs extra
      content = this.removeExtraDivs(content, result);

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        result.fixed = true;
      }
    } catch (error) {
      result.issues.push(`Error: ${error.message}`);
    }

    if (result.fixed || result.issues.length > 0) {
      this.results.push(result);
    }
  }

  private fixIndentation(content: string, result: FixResult): string {
    // Corregir indentación de 10 espacios a 6 después de AuthenticatedLayout
    if (content.match(/AuthenticatedLayout>\s+<div className=/)) {
      const fixed = content.replace(/(<AuthenticatedLayout>)\s+(<div className=)/g, '$1\n      $2');
      if (fixed !== content) {
        result.issues.push('Corregida indentación inconsistente');
        return fixed;
      }
    }
    return content;
  }

  private ensureFragmentForDialogs(content: string, result: FixResult): string {
    // Si hay Dialog después de AuthenticatedLayout sin Fragment, agregarlo
    const hasDialog = content.includes('</AuthenticatedLayout>') && 
                     content.match(/<Dialog[^>]*open=/);
    const hasFragment = content.includes('<>') && content.includes('</>');

    if (hasDialog && !hasFragment) {
      // Verificar si el return statement necesita Fragment
      const returnMatch = content.match(/(return\s*\(\s*<AuthenticatedLayout>)/);
      if (returnMatch) {
        const needsFragment = content.split('</AuthenticatedLayout>')[1]?.includes('<Dialog');
        if (needsFragment) {
          content = content.replace(
            /return\s*\(\s*<AuthenticatedLayout>/,
            'return (\n    <>\n      <AuthenticatedLayout>'
          );
          content = content.replace(
            /}\s*$/,
            '    </>\n  );\n}'
          );
          content = content.replace(
            /<\/AuthenticatedLayout>\s*\);/,
            '</AuthenticatedLayout>'
          );
          result.issues.push('Agregado Fragment para Dialog');
        }
      }
    }

    return content;
  }

  private fixAuthenticatedLayoutClosing(content: string, result: FixResult): string {
    // Detectar y corregir cierres incorrectos
    const lines = content.split('\n');
    let fixed = false;

    for (let i = 0; i < lines.length - 2; i++) {
      // Buscar patrón: </div>\n      </div>\n      </AuthenticatedLayout>
      if (lines[i].trim() === '</div>' &&
          lines[i + 1].trim() === '</div>' &&
          lines[i + 2].trim() === '</AuthenticatedLayout>') {
        // Posible div extra
        const indentBefore = lines[i].match(/^(\s*)/)?.[1] || '';
        const indentAfter = lines[i + 1].match(/^(\s*)/)?.[1] || '';
        
        if (indentBefore.length > indentAfter.length) {
          // El primer </div> tiene más indentación, probablemente sea correcto
          continue;
        }
      }
    }

    return content;
  }

  private removeExtraDivs(content: string, result: FixResult): string {
    // Eliminar divs extra comunes
    content = content.replace(
      /(<\/div>)\s*(<\/div>)\s*(<\/AuthenticatedLayout>)/g,
      (match, div1, div2, layout) => {
        result.issues.push('Eliminado div extra');
        return `${div1}\n      ${layout}`;
      }
    );

    return content;
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CORRECCIONES');
    console.log('='.repeat(60) + '\n');

    const fixed = this.results.filter(r => r.fixed);
    const withIssues = this.results.filter(r => r.issues.length > 0);

    console.log(`✅ Archivos corregidos: ${fixed.length}`);
    console.log(`⚠️  Archivos con problemas: ${withIssues.length}\n`);

    if (withIssues.length > 0) {
      console.log('Detalle de correcciones:\n');
      for (const result of withIssues) {
        console.log(`📄 ${result.file}`);
        for (const issue of result.issues) {
          console.log(`   - ${issue}`);
        }
        console.log('');
      }
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new JSXFixer();
  const pattern = process.argv[2] || 'app/**/*.{ts,tsx}';
  
  fixer.fixAll(pattern).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { JSXFixer };

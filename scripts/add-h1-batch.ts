/**
 * Script para añadir H1s en páginas que no lo tienen
 * Siguiendo protocolo de seguridad: cambios aditivos, no destructivos
 */

import * as fs from 'fs';
import * as path from 'path';

interface PageToFix {
  file: string;
  title: string;
  method: 'sr-only' | 'visible';
}

const PAGES_TO_FIX: PageToFix[] = [
  // Dashboard y sub-páginas
  { file: 'app/dashboard/page.tsx', title: 'Dashboard Principal', method: 'visible' },
  
  // Admin
  { file: 'app/admin/planes/page.tsx', title: 'Gestión de Planes y Suscripciones', method: 'visible' },
  { file: 'app/admin/modulos/page.tsx', title: 'Módulos del Sistema', method: 'visible' },
  { file: 'app/admin/marketplace/page.tsx', title: 'Marketplace de Servicios', method: 'visible' },
  
  // Portal Inquilino
  { file: 'app/portal-inquilino/page.tsx', title: 'Portal del Inquilino', method: 'visible' },
  { file: 'app/portal-inquilino/incidencias/page.tsx', title: 'Mis Incidencias', method: 'visible' },
  { file: 'app/portal-inquilino/contrato/page.tsx', title: 'Mi Contrato', method: 'visible' },
  { file: 'app/portal-inquilino/comunicacion/page.tsx', title: 'Comunicaciones', method: 'visible' },
  
  // Portal Proveedor
  { file: 'app/portal-proveedor/ordenes/page.tsx', title: 'Órdenes de Trabajo', method: 'visible' },
  { file: 'app/portal-proveedor/presupuestos/page.tsx', title: 'Mis Presupuestos', method: 'visible' },
  { file: 'app/portal-proveedor/facturas/page.tsx', title: 'Mis Facturas', method: 'visible' },
  
  // Portal Comercial
  { file: 'app/portal-comercial/page.tsx', title: 'Portal Comercial', method: 'visible' },
  { file: 'app/portal-comercial/leads/page.tsx', title: 'Gestión de Leads', method: 'visible' },
  { file: 'app/portal-comercial/objetivos/page.tsx', title: 'Objetivos de Ventas', method: 'visible' },
  
  // Features críticas
  { file: 'app/propiedades/page.tsx', title: 'Gestión de Propiedades', method: 'visible' },
  { file: 'app/propiedades/crear/page.tsx', title: 'Nueva Propiedad', method: 'visible' },
  { file: 'app/seguros/page.tsx', title: 'Gestión de Seguros', method: 'visible' },
  { file: 'app/seguros/nuevo/page.tsx', title: 'Nuevo Seguro', method: 'visible' },
  { file: 'app/visitas/page.tsx', title: 'Calendario de Visitas', method: 'visible' },
  { file: 'app/votaciones/page.tsx', title: 'Votaciones', method: 'visible' },
  { file: 'app/tareas/page.tsx', title: 'Gestor de Tareas', method: 'visible' },
  { file: 'app/usuarios/page.tsx', title: 'Gestión de Usuarios', method: 'visible' },
  { file: 'app/proveedores/page.tsx', title: 'Directorio de Proveedores', method: 'visible' },
  { file: 'app/tours-virtuales/page.tsx', title: 'Tours Virtuales 360°', method: 'visible' },
  
  // Financieros
  { file: 'app/reportes/financieros/page.tsx', title: 'Reportes Financieros', method: 'visible' },
  
  // Verticales
  { file: 'app/str/page.tsx', title: 'Dashboard Short-Term Rental', method: 'visible' },
  { file: 'app/str/channels/page.tsx', title: 'Channel Manager', method: 'visible' },
  { file: 'app/coliving/page.tsx', title: 'Dashboard Coliving', method: 'visible' },
  { file: 'app/student-housing/page.tsx', title: 'Student Housing', method: 'visible' },
  { file: 'app/workspace/page.tsx', title: 'Workspace Management', method: 'visible' },
  { file: 'app/partners/page.tsx', title: 'Portal Partners', method: 'visible' },
  { file: 'app/partners/dashboard/page.tsx', title: 'Dashboard Partners', method: 'visible' },
  { file: 'app/partners/clients/page.tsx', title: 'Gestión de Clientes Partners', method: 'visible' },
];

function addH1ToFile(filePath: string, title: string, method: 'sr-only' | 'visible'): boolean {
  try {
    const fullPath = path.join('/workspace', filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // Verificar si ya tiene H1
    if (content.includes('<h1')) {
      console.log(`✅ ${filePath} - Ya tiene H1`);
      return true;
    }
    
    // Determinar el patrón de inserción según el método
    let h1Code: string;
    if (method === 'sr-only') {
      h1Code = `<h1 className="sr-only">${title}</h1>`;
    } else {
      h1Code = `<div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">${title}</h1>
          <p className="text-muted-foreground mt-2">Gestiona y controla tu información</p>
        </div>`;
    }
    
    // Buscar el primer return en el componente
    const returnIndex = content.indexOf('return (');
    if (returnIndex === -1) {
      console.log(`⚠️ ${filePath} - No se encontró 'return ('`);
      return false;
    }
    
    // Encontrar la primera etiqueta después de return
    const afterReturn = content.substring(returnIndex);
    const firstTagMatch = afterReturn.match(/return \(\s*<(\w+)/);
    
    if (!firstTagMatch) {
      console.log(`⚠️ ${filePath} - No se pudo identificar la estructura del return`);
      return false;
    }
    
    // Si el return es un AuthenticatedLayout o similar, insertar dentro
    if (firstTagMatch[1] === 'AuthenticatedLayout' || firstTagMatch[1] === 'div') {
      // Buscar el primer div/section dentro
      const closingTagIndex = afterReturn.indexOf('>');
      const insertPosition = returnIndex + closingTagIndex + 1;
      
      // Insertar con indentación apropiada
      const indent = '      '; // 6 espacios para nivel de indentación típico
      const h1WithIndent = `\n${indent}${h1Code}\n${indent}`;
      
      content = content.substring(0, insertPosition) + h1WithIndent + content.substring(insertPosition);
      
      // Guardar
      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`✅ ${filePath} - H1 añadido (${method})`);
      return true;
    }
    
    console.log(`⚠️ ${filePath} - Estructura no reconocida, requiere revisión manual`);
    return false;
  } catch (error) {
    console.log(`❌ ${filePath} - Error: ${error}`);
    return false;
  }
}

// Ejecutar
console.log('🔧 AÑADIENDO H1s EN 34 PÁGINAS');
console.log('='.repeat(80));
console.log(`\nMétodo: Cambios aditivos (siguiendo protocolo de seguridad)\n`);

let success = 0;
let skipped = 0;
let failed = 0;

for (const page of PAGES_TO_FIX) {
  const result = addH1ToFile(page.file, page.title, page.method);
  if (result === true) {
    success++;
  } else if (result === false) {
    failed++;
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMEN');
console.log('='.repeat(80));
console.log(`✅ H1s añadidos: ${success}`);
console.log(`⚠️ Ya tenían H1: ${skipped}`);
console.log(`❌ Fallidos: ${failed}`);
console.log('\n✅ Proceso completado');

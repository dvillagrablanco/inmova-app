/**
 * Script para extraer todas las rutas desde los archivos page.tsx
 *
 * Uso: tsx scripts/extract-routes.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function findPageFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar directorios específicos
      if (!file.startsWith('.') && file !== 'node_modules') {
        findPageFiles(filePath, fileList);
      }
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function extractRoutes() {
  const appDir = path.join(process.cwd(), 'app');

  // Buscar todos los archivos page.tsx
  const pageFiles = findPageFiles(appDir);

  const routes = pageFiles
    .map((file) => {
      // Convertir ruta de archivo a ruta web
      let route = file
        .replace(appDir, '') // Remover app dir
        .replace(/\/page\.tsx$/, '') // Remover page.tsx
        .replace(/\(.*?\)\//g, '') // Remover grupos de rutas como (dashboard)/
        .replace(/\[.*?\]/g, ':id'); // Convertir [id] a :id para rutas dinámicas

      // Limpiar ruta
      route = route.replace(/\/+/g, '/'); // Múltiples / a un solo /
      if (route === '') route = '/'; // Ruta raíz
      if (route !== '/' && route.endsWith('/')) {
        route = route.slice(0, -1); // Remover / final
      }

      return route;
    })
    .filter((route) => {
      // Filtrar rutas que no queremos verificar
      return (
        !route.includes(':id') && // Rutas dinámicas
        !route.includes('[')
      ); // Rutas con parámetros
    })
    .sort();

  // Agregar rutas críticas al inicio
  const criticalRoutes = ['/', '/login', '/home', '/dashboard'];

  // Combinar y eliminar duplicados
  const allRoutes = [...new Set([...criticalRoutes, ...routes])];

  console.log(`📄 Encontradas ${allRoutes.length} rutas:`);
  console.log(JSON.stringify(allRoutes, null, 2));

  // Guardar en archivo
  const outputPath = path.join(process.cwd(), 'scripts', 'routes-to-verify.json');
  fs.writeFileSync(outputPath, JSON.stringify(allRoutes, null, 2));
  console.log(`\n💾 Rutas guardadas en: ${outputPath}`);

  return allRoutes;
}

extractRoutes().catch(console.error);

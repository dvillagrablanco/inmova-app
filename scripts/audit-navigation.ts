import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SIDEBAR_PATH = path.join(ROOT, 'components', 'layout', 'sidebar.tsx');
const APP_PATH = path.join(ROOT, 'app');

const hrefRegex = /href:\s*['"`]([^'"`]+)['"`]/g;

const normalizeRoute = (route: string) => {
  const [clean] = route.split('?');
  if (!clean.startsWith('/')) return '';
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean;
};

const isExternal = (route: string) =>
  route.startsWith('http') ||
  route.startsWith('mailto:') ||
  route.startsWith('tel:');

const walk = (dir: string, files: string[] = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && entry.name.startsWith('page.')) {
      files.push(full);
    }
  }
  return files;
};

const routeFromFile = (filePath: string) => {
  const relative = path.relative(APP_PATH, filePath);
  const withoutPage = relative.replace(/\/page\.(tsx|ts|jsx|js)$/, '');
  const segments = withoutPage
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .filter((segment) => !segment.startsWith('['));

  const route = `/${segments.join('/')}`;
  return route === '/' ? '/' : route.replace(/\/$/, '');
};

const sidebarContent = fs.readFileSync(SIDEBAR_PATH, 'utf8');
const sidebarRoutes = new Set<string>();
let match: RegExpExecArray | null;

while ((match = hrefRegex.exec(sidebarContent)) !== null) {
  const raw = match[1];
  if (isExternal(raw)) continue;
  const normalized = normalizeRoute(raw);
  if (normalized) sidebarRoutes.add(normalized);
}

const appPageFiles = walk(APP_PATH);
const appRoutes = new Set(appPageFiles.map(routeFromFile));

const missing = [...sidebarRoutes].filter((route) => !appRoutes.has(route));

console.log('=== Auditoría de navegación ===');
console.log(`Total rutas en sidebar: ${sidebarRoutes.size}`);
console.log(`Total rutas en app: ${appRoutes.size}`);
console.log(`Rutas faltantes: ${missing.length}`);

if (missing.length > 0) {
  console.log('\nRutas faltantes:');
  missing.sort().forEach((route) => console.log(`- ${route}`));
}

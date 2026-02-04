import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGETS = [path.join(ROOT, 'app'), path.join(ROOT, 'components')];

const walk = (dir: string, files: string[] = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && full.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
};

const hasAction = (tag: string) => {
  const normalized = tag.replace(/\s+/g, ' ');
  return (
    normalized.includes('onClick=') ||
    normalized.includes('asChild') ||
    normalized.includes('href=') ||
    normalized.includes('type="submit"') ||
    normalized.includes("type='submit'") ||
    normalized.includes('form=') ||
    normalized.includes('onSubmit=')
  );
};

const findButtonsWithoutAction = (content: string) => {
  const results: Array<{ index: number; tag: string }> = [];
  let idx = 0;

  while (idx < content.length) {
    const start = content.indexOf('<Button', idx);
    if (start === -1) break;
    const end = content.indexOf('>', start);
    if (end === -1) break;

    const tag = content.slice(start, end + 1);
    if (!hasAction(tag)) {
      results.push({ index: start, tag });
    }

    idx = end + 1;
  }

  return results;
};

const files = TARGETS.flatMap((dir) => walk(dir));
const findings: Array<{ file: string; line: number; tag: string }> = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = findButtonsWithoutAction(content);

  for (const match of matches) {
    const before = content.slice(0, match.index);
    const line = before.split('\n').length;
    findings.push({
      file: path.relative(ROOT, file),
      line,
      tag: match.tag.trim(),
    });
  }
}

console.log('=== Auditoría de acciones en botones ===');
console.log(`Botones sin acción detectados: ${findings.length}`);

if (findings.length > 0) {
  findings.forEach((item) => {
    console.log(`- ${item.file}:${item.line} -> ${item.tag}`);
  });
}

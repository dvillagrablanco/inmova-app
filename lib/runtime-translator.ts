/**
 * Runtime translator: aplicación de traducciones a textos visibles del DOM
 * sin necesidad de refactorizar todos los componentes a useTranslations().
 *
 * Funciona como complemento al GoogleTranslateWidget: si Google no traduce,
 * este aplica un diccionario manual a los nodos de texto del menú/header.
 */

// Diccionarios cargados dinámicamente desde /messages/{lang}.json en cliente
type Dict = Record<string, string>;

const FLAT_DICTS: Record<string, Dict> = {};

function flatten(obj: any, prefix = '', out: Dict = {}): Dict {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') {
      out[v.toLowerCase()] = v;
    } else if (typeof v === 'object' && v !== null) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

async function loadDict(lang: string): Promise<{ es: Dict; target: Dict; map: Record<string, string> }> {
  const cacheKey = `${lang}_dict`;
  if (FLAT_DICTS[cacheKey]) return FLAT_DICTS[cacheKey] as any;

  const [esRes, targetRes] = await Promise.all([
    fetch('/messages/es.json').catch(() => null),
    fetch(`/messages/${lang}.json`).catch(() => null),
  ]);
  if (!esRes?.ok || !targetRes?.ok) {
    return { es: {}, target: {}, map: {} };
  }

  const esData = await esRes.json();
  const targetData = await targetRes.json();
  const esFlat = flatten(esData);
  const targetFlat = flatten(targetData);

  // Construir map ES -> target navegando ambos JSONs en paralelo
  const map: Record<string, string> = {};
  function walk(esNode: any, targetNode: any) {
    if (typeof esNode !== 'object' || typeof targetNode !== 'object' || !esNode || !targetNode) return;
    for (const k of Object.keys(esNode)) {
      const ev = esNode[k];
      const tv = targetNode[k];
      if (typeof ev === 'string' && typeof tv === 'string') {
        const trimmed = ev.trim();
        if (trimmed && trimmed !== tv.trim()) {
          map[trimmed.toLowerCase()] = tv;
        }
      } else if (typeof ev === 'object' && typeof tv === 'object') {
        walk(ev, tv);
      }
    }
  }
  walk(esData, targetData);

  const result = { es: esFlat, target: targetFlat, map };
  FLAT_DICTS[cacheKey] = result as any;
  return result;
}

const TEXT_NODE_FILTER = (node: Node): number => {
  if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
  const t = node.nodeValue?.trim();
  if (!t || t.length < 2) return NodeFilter.FILTER_REJECT;
  const parent = node.parentElement;
  if (!parent) return NodeFilter.FILTER_REJECT;
  const tag = parent.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'code', 'pre', 'textarea', 'input'].includes(tag)) {
    return NodeFilter.FILTER_REJECT;
  }
  if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;
  return NodeFilter.FILTER_ACCEPT;
};

export async function applyRuntimeTranslation(targetLang: string) {
  if (typeof window === 'undefined') return;
  if (targetLang === 'es') return;

  const { map } = await loadDict(targetLang);
  if (!map || Object.keys(map).length === 0) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    { acceptNode: TEXT_NODE_FILTER as any }
  );

  let count = 0;
  let node = walker.nextNode();
  while (node) {
    const original = node.nodeValue!;
    const trimmed = original.trim();
    const lower = trimmed.toLowerCase();
    const replacement = map[lower];
    if (replacement && replacement !== trimmed) {
      const lead = original.match(/^\s*/)?.[0] || '';
      const trail = original.match(/\s*$/)?.[0] || '';
      node.nodeValue = `${lead}${replacement}${trail}`;
      count++;
    }
    node = walker.nextNode();
  }
  if (count > 0) {
    console.info(`[i18n] Translated ${count} text nodes to ${targetLang}`);
  }
}

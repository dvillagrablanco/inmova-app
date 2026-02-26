#!/usr/bin/env python3
"""
Extrae datos estructurados de las escrituras OCR usando pattern matching.
No requiere API key externa.

Lee textos OCR de /tmp/escrituras_ocr/ y genera JSON con datos extraídos.
Uso: python3 scripts/parse-escrituras-ocr.py
"""

import os, re, json

OCR_DIR = "/tmp/escrituras_ocr"
OUTPUT = "/workspace/data/escrituras-ocr-extracted.json"

def clean_ocr(text):
    """Limpia artefactos comunes del OCR."""
    text = re.sub(r'[-—–]{3,}', '', text)
    text = re.sub(r'\.{3,}', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def find_precio(text):
    """Extrae el precio total de la escritura."""
    patterns = [
        r'precio\s+(?:global|total|de\s+(?:esta|la)\s+compraventa)\s+(?:es|asciende\s+a)\s+[A-ZÁÉÍÓÚÑ\s,]+?\(([0-9.,]+)\s*(?:€|EUR|euros?)\)',
        r'precio\s+(?:global|total)[^()]*?\(([0-9.,]+)[.,]?\d*\s*(?:€|EUR|euros?)\)',
        r'(?:PRECIO|precio)[^()]*?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*(?:€|EUR|euros?)',
        r'(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*(?:€|EUR|euros?)[^a-z]*?(?:precio|global|total)',
    ]
    cleaned = clean_ocr(text)
    for pat in patterns:
        m = re.search(pat, cleaned, re.IGNORECASE)
        if m:
            val = m.group(1).replace('.', '').replace(',', '.')
            try:
                return float(val)
            except ValueError:
                continue
    return None

def find_numero_escritura(text):
    """Extrae el número de protocolo de la escritura."""
    patterns = [
        r'(?:NÚMERO|N[ÚU]MERO)\s+([A-ZÁÉÍÓÚÑ\s]+)',
        r'protocolo\s+(?:n[úu]mero\s+)?(\d+)',
    ]
    for pat in patterns:
        m = re.search(pat, text[:3000], re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None

def find_notario(text):
    """Extrae el nombre del notario."""
    m = re.search(r'(?:Ante\s+m[ií],?\s+|NOTARIO\s+)([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+?)(?:,?\s+(?:Notari|notari))', text[:5000])
    if m:
        return m.group(1).strip()
    m = re.search(r'FERNANDO\s+S[ÁA]NCHEZ[- ]ARJONA\s+BONILLA', text[:5000])
    if m:
        return "Fernando Sánchez-Arjona Bonilla"
    return None

def find_comprador(text):
    """Extrae datos del comprador."""
    cleaned = clean_ocr(text[:8000])
    # Buscar "vende a X que compra"
    m = re.search(r'vende?\s+a\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.]+?)(?:,?\s+que\s+compra)', cleaned, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    # Buscar VIRODA o ROVIDA en contexto de comprador
    m = re.search(r'(VIRODA\s+INVERSIONES[^,]*(?:S\.?L\.?U?\.?))', cleaned)
    if m:
        return m.group(1).strip()
    m = re.search(r'(ROVIDA[^,]*(?:S\.?L\.?U?\.?))', cleaned)
    if m:
        return m.group(1).strip()
    return None

def find_vendedor(text):
    """Extrae datos del vendedor."""
    cleaned = clean_ocr(text[:8000])
    patterns = [
        r'(?:es\s+due[ñn]o?a?\s+).*?denominada\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.]+?)(?:,?\s+domiciliad)',
        r'([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.]+?)[,\s]+(?:vende\s+a)',
        r'(?:vendedor|transmitente)[^:]*?(?:denominada\s+)([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,.]+?)(?:,|\s+domiciliad)',
    ]
    for pat in patterns:
        m = re.search(pat, cleaned, re.IGNORECASE)
        if m:
            name = m.group(1).strip()
            if name and len(name) > 3:
                return name
    return None

def find_nif(text, entity_name):
    """Busca el NIF cerca de una entidad."""
    if not entity_name:
        return None
    cleaned = clean_ocr(text[:10000])
    # Search near entity name
    idx = cleaned.lower().find(entity_name.lower()[:20])
    if idx < 0:
        return None
    region = cleaned[max(0,idx-200):idx+500]
    m = re.search(r'N\.?I\.?F\.?\s*(?:es\s+|:?\s*)([A-Z]-?\d{7,8}[A-Z0-9]?)', region)
    if m:
        return m.group(1)
    return None

def find_ref_catastral(text):
    """Busca referencias catastrales."""
    refs = re.findall(r'(\d{7}[A-Z]{2}\d{4}[A-Z0-9]+)', text)
    return list(set(refs)) if refs else []

def find_superficies(text):
    """Busca superficies construidas y útiles."""
    surfaces = []
    cleaned = clean_ocr(text)
    # "superficie construida de X metros"
    for m in re.finditer(r'superficie\s+construida\s+(?:de\s+)?(?:[a-záéíóúñ\s]+)\s*\((\d+[.,]\d+)\s*m[²2]?\)', cleaned, re.IGNORECASE):
        surfaces.append(('construida', float(m.group(1).replace(',', '.'))))
    for m in re.finditer(r'(?:superficie\s+)?[úu]til\s+(?:de\s+)?(?:[a-záéíóúñ\s]+)\s*\((\d+[.,]\d+)\s*m[²2]?\)', cleaned, re.IGNORECASE):
        surfaces.append(('util', float(m.group(1).replace(',', '.'))))
    return surfaces

def find_registro(text):
    """Busca datos del registro de la propiedad."""
    regs = []
    for m in re.finditer(r'Registro\s+de\s+la\s+Propiedad\s+(?:n[úu]mero\s+)?(\d+)\s+de\s+(\w+)', text, re.IGNORECASE):
        regs.append(f"RP {m.group(1)} de {m.group(2)}")
    return regs

def find_fincas(text):
    """Intenta extraer las fincas/unidades individuales."""
    fincas = []
    cleaned = clean_ocr(text)

    # Patrón: "Urbana. Número X. Vivienda/Local..."
    for m in re.finditer(
        r'(?:Urbana|URBANA)[.\s]+(?:N[úu]mero\s+)?(\d+|[A-Z]+)[.\s]+'
        r'((?:Vivienda|Local|Garaje|Trastero|Oficina|Plaza)[^.]{5,100})',
        cleaned, re.IGNORECASE
    ):
        finca = {
            "numero": m.group(1).strip(),
            "descripcion": m.group(2).strip()[:100],
        }
        # Buscar superficie cerca
        region = cleaned[m.end():m.end()+500]
        sm = re.search(r'(\d+[.,]\d+)\s*m[²2]', region)
        if sm:
            finca["superficie"] = float(sm.group(1).replace(',', '.'))
        # Buscar ref catastral cerca
        rm = re.search(r'(\d{7}[A-Z]{2}\d{4}[A-Z0-9]+)', region)
        if rm:
            finca["ref_catastral"] = rm.group(1)
        # Buscar valor
        vm = re.search(r'(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)\s*(?:€|EUR|euros)', region)
        if vm:
            finca["valor"] = float(vm.group(1).replace('.', '').replace(',', '.'))
        fincas.append(finca)

    return fincas

def find_fecha(text, filename):
    """Extrae la fecha de la escritura."""
    # From filename first
    m = re.search(r'(\d{2})[_-](\d{2})[_-](\d{4})', filename)
    if m:
        d, mo, y = m.group(1), m.group(2), m.group(3)
        return f"{y}-{mo}-{d}"
    m = re.search(r'(\d{4})[_-](\d{2})[_-](\d{2})', filename)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    # From text
    months = {'enero':'01','febrero':'02','marzo':'03','abril':'04','mayo':'05','junio':'06',
              'julio':'07','agosto':'08','septiembre':'09','octubre':'10','noviembre':'11','diciembre':'12'}
    for month_name, month_num in months.items():
        m = re.search(rf'(\d{{1,2}})\s+de\s+{month_name}\s+de\s+(?:dos\s+mil\s+)?(\w+)', text[:5000], re.IGNORECASE)
        if m:
            day = m.group(1).zfill(2)
            return f"20XX-{month_num}-{day}"
    return None

def process_file(filename, text):
    """Procesa un archivo OCR y extrae datos."""
    result = {
        "archivo": filename,
        "fecha": find_fecha(text, filename),
        "notario": find_notario(text),
        "comprador": find_comprador(text),
        "vendedor": find_vendedor(text),
        "precio_total": find_precio(text),
        "refs_catastrales": find_ref_catastral(text),
        "superficies": find_superficies(text),
        "registros": find_registro(text),
        "fincas": find_fincas(text),
    }

    # Buscar NIFs
    result["comprador_nif"] = find_nif(text, result.get("comprador", ""))
    result["vendedor_nif"] = find_nif(text, result.get("vendedor", ""))

    return result


def main():
    files = sorted([f for f in os.listdir(OCR_DIR) if f.endswith('.txt')])
    print(f"{'='*70}")
    print(f"EXTRACCIÓN DE DATOS DE ESCRITURAS OCR")
    print(f"{'='*70}")
    print(f"Archivos: {len(files)}\n")

    all_results = {}

    for fname in files:
        path = os.path.join(OCR_DIR, fname)
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()

        result = process_file(fname, text)
        all_results[fname] = result

        short = fname[:55]
        print(f"  {short}")
        print(f"    Comprador: {result.get('comprador', '?')}")
        print(f"    Vendedor:  {result.get('vendedor', '?')}")
        print(f"    Precio:    {result.get('precio_total', '?')}")
        print(f"    Fincas:    {len(result.get('fincas', []))}")
        print(f"    Refs cat:  {len(result.get('refs_catastrales', []))}")
        print()

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    print(f"{'='*70}")
    print(f"Guardado en: {OUTPUT}")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()

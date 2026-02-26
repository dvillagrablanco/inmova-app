#!/usr/bin/env python3
"""
Extrae datos estructurados de las escrituras OCR usando Claude AI.
Lee los textos OCR de /tmp/escrituras_ocr/ y genera un JSON con todos los datos.

Uso: ANTHROPIC_API_KEY=xxx python3 scripts/extract-escrituras-with-ai.py
"""

import os, sys, json, time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

OCR_DIR = "/tmp/escrituras_ocr"
OUTPUT_FILE = "/workspace/data/escrituras-ocr-extracted.json"

EXTRACTION_PROMPT = """Eres un experto en escrituras notariales españolas. Analiza este texto OCR de una escritura y extrae TODOS los datos relevantes en formato JSON.

Extrae:
{
  "numero_escritura": number,
  "fecha": "YYYY-MM-DD",
  "tipo": "Compraventa de Edificio|Compraventa|Ampliación de Capital|etc",
  "notario": "nombre completo",
  "notaria_direccion": "dirección de la notaría",

  "comprador": {
    "nombre": "razón social o nombre",
    "nif": "NIF/CIF",
    "domicilio": "dirección",
    "tipo": "SLU|SL|persona física"
  },
  "vendedor": {
    "nombre": "razón social o nombre",
    "nif": "NIF/CIF",
    "domicilio": "dirección"
  },

  "precio_total": number or null,
  "forma_pago": "descripción del pago",

  "inmueble": {
    "direccion": "dirección completa",
    "ciudad": "ciudad",
    "tipo": "edificio|vivienda|local|garajes|oficina",
    "descripcion_general": "breve descripción"
  },

  "fincas": [
    {
      "numero": "número de finca o descripción",
      "tipo": "vivienda|local|garaje|trastero|oficina|otro",
      "planta": "planta",
      "superficie_construida": number or null,
      "superficie_util": number or null,
      "referencia_catastral": "ref catastral" or null,
      "valor_escriturado": number or null,
      "cuota_participacion": number or null,
      "registro": "datos del registro de la propiedad" or null
    }
  ],

  "impuestos": "ITP|IVA+AJD|exento|etc",
  "estado_cargas": "libre de cargas|descripción",
  "arrendamientos": "descripción si hay inquilinos",
  "notas_relevantes": "cualquier dato extra importante"
}

IMPORTANTE:
- Si el OCR tiene errores, intenta interpretar el texto correcto
- Extrae TODAS las fincas/unidades mencionadas
- Los precios pueden estar en texto (ej: "trescientos mil euros" = 300000)
- Las superficies pueden estar en texto (ej: "ochenta metros cuadrados" = 80)
- Si no encuentras un dato, pon null
- Responde SOLO con JSON válido, sin markdown ni explicaciones"""

def extract_from_ocr(filename, text):
    """Send OCR text to Claude for structured extraction."""
    try:
        import anthropic
    except ImportError:
        os.system("pip install anthropic -q")
        import anthropic

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        # Try reading from .env files
        for env_file in ["/workspace/.env.local", "/workspace/.env", "/workspace/.env.production"]:
            if os.path.exists(env_file):
                with open(env_file) as f:
                    for line in f:
                        if line.startswith("ANTHROPIC_API_KEY="):
                            api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
                            break
            if api_key:
                break

    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not found")
        return None

    client = anthropic.Anthropic(api_key=api_key)

    # Use first 12000 chars of OCR (enough for the escritura body)
    truncated = text[:12000]

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": f"{EXTRACTION_PROMPT}\n\nArchivo: {filename}\n\nTexto OCR:\n{truncated}"
        }]
    )

    reply = response.content[0].text if response.content else ""

    # Parse JSON
    try:
        # Find JSON in response
        import re
        json_match = re.search(r'\{[\s\S]*\}', reply)
        if json_match:
            return json.loads(json_match.group())
    except json.JSONDecodeError:
        pass

    return {"raw_response": reply, "parse_error": True}


def main():
    files = sorted([f for f in os.listdir(OCR_DIR) if f.endswith('.txt')])
    print(f"{'='*70}")
    print(f"EXTRACCIÓN IA DE ESCRITURAS OCR")
    print(f"{'='*70}")
    print(f"Archivos OCR: {len(files)}")

    results = {}

    for i, fname in enumerate(files):
        path = os.path.join(OCR_DIR, fname)
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()

        short = fname[:55]
        print(f"\n[{i+1}/{len(files)}] {short}...")

        extracted = extract_from_ocr(fname, text)
        if extracted:
            results[fname] = extracted
            # Quick summary
            if not extracted.get("parse_error"):
                precio = extracted.get("precio_total")
                n_fincas = len(extracted.get("fincas", []))
                comprador = extracted.get("comprador", {}).get("nombre", "?")
                print(f"  Comprador: {comprador}")
                print(f"  Precio: {precio}")
                print(f"  Fincas: {n_fincas}")
            else:
                print(f"  WARN: Could not parse JSON from AI response")
        else:
            print(f"  ERROR: No response from AI")

        # Rate limit
        if i < len(files) - 1:
            time.sleep(1)

    # Save results
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*70}")
    print(f"Resultados guardados en: {OUTPUT_FILE}")
    print(f"Total escrituras procesadas: {len(results)}")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()

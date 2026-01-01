#!/usr/bin/env python3
"""
Análisis local del HTML para encontrar errores de sintaxis JavaScript
"""
import re
import json

print("🔍 ANÁLISIS LOCAL DEL HTML")
print("=" * 80)

# Leer HTML
with open('/workspace/landing-full.html', 'r', encoding='utf-8') as f:
    html = f.read()

print(f"\n📄 HTML cargado: {len(html)} caracteres")

# Extraer TODOS los scripts inline
script_pattern = r'<script[^>]*>(.*?)</script>'
scripts = re.findall(script_pattern, html, re.DOTALL)

print(f"📜 Scripts inline encontrados: {len(scripts)}")

# Analizar cada script
for idx, script_content in enumerate(scripts):
    print(f"\n{'='*60}")
    print(f"[Script {idx+1}/{len(scripts)}]")
    print(f"Longitud: {len(script_content)} caracteres")
    
    # Buscar ID
    id_match = re.search(r'<script[^>]*id=["\']([^"\']*)["\']', html[max(0, html.find(script_content) - 200):html.find(script_content) + 50] if script_content in html else '')
    if id_match:
        print(f"ID: {id_match.group(1)}")
    else:
        print("ID: (sin ID)")
    
    # Verificar si es JSON-LD
    if 'application/ld+json' in html[max(0, html.find(script_content) - 200):html.find(script_content) + 50] if script_content in html else '':
        print("Tipo: JSON-LD (structured data)")
        try:
            json.loads(script_content)
            print("✅ JSON válido")
        except json.JSONDecodeError as e:
            print(f"❌ JSON INVÁLIDO: {e}")
        continue
    
    # Para JavaScript, mostrar contenido
    if len(script_content) < 500:
        print(f"\nContenido completo:")
        print(script_content)
    else:
        print(f"\nPrimeros 300 caracteres:")
        print(script_content[:300])
        print("...")
        print(f"\nÚltimos 300 caracteres:")
        print(script_content[-300:])
    
    # Buscar posibles problemas
    if '${' in script_content and '`' not in script_content:
        print("⚠️ SOSPECHOSO: Tiene interpolación ${} pero no está en template literal")
    
    if script_content.count('{') != script_content.count('}'):
        print("⚠️ SOSPECHOSO: Llaves {} desbalanceadas")
    
    if script_content.count('(') != script_content.count(')'):
        print("⚠️ SOSPECHOSO: Paréntesis () desbalanceados")
    
    if script_content.count('[') != script_content.count(']'):
        print("⚠️ SOSPECHOSO: Corchetes [] desbalanceados")
    
    # Buscar caracteres raros
    non_ascii = [c for c in script_content if ord(c) > 127]
    if non_ascii and len(set(non_ascii)) > 3:
        print(f"⚠️ SOSPECHOSO: {len(set(non_ascii))} caracteres no-ASCII diferentes")
        print(f"   Ejemplos: {list(set(non_ascii))[:5]}")

print("\n" + "=" * 80)
print("ANÁLISIS COMPLETADO")
print("=" * 80)

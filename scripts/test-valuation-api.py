#!/usr/bin/env python3
"""Test de la API de valoración en producción para verificar campos de alquiler"""
import sys
import json
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)

# Primero necesitamos un token de sesión real. Vamos a ver los logs recientes
# para entender qué devuelve la API.
# Mejor: revisemos la última respuesta de valoración en los logs de PM2.

print("=== Revisando logs de PM2 para la última valoración ===\n")

stdin, stdout, stderr = client.exec_command(
    "pm2 logs inmova-app --lines 200 --nostream 2>/dev/null | grep -A2 'AI Analysis' | tail -20",
    timeout=30
)
out = stdout.read().decode()
print(out if out else "(sin logs de AI Analysis)")

print("\n=== Revisando errores recientes ===\n")
stdin, stdout, stderr = client.exec_command(
    "pm2 logs inmova-app --err --lines 30 --nostream 2>/dev/null | tail -20",
    timeout=30
)
out = stdout.read().decode()
print(out if out else "(sin errores)")

print("\n=== Verificando que la página de valoración carga ===\n")
stdin, stdout, stderr = client.exec_command(
    "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/valoracion-ia -m 10",
    timeout=15
)
out = stdout.read().decode()
print(f"Valoracion IA page: HTTP {out}")

# Verificar si hay una sesión de admin activa que podamos usar
print("\n=== Intentando valoración con sesión de admin ===\n")

# Hacemos login para obtener cookie
login_cmd = """curl -sf -c /tmp/inmova-cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=admin@inmova.app&password=Admin123!' \
  -m 15 -L 2>&1 | head -c 500"""

stdin, stdout, stderr = client.exec_command(login_cmd, timeout=20)
login_out = stdout.read().decode()
print(f"Login response: {login_out[:200]}...")

# Ahora intentamos la valoración con las cookies
val_cmd = """curl -sf -b /tmp/inmova-cookies.txt -X POST http://localhost:3000/api/ai/valuate \
  -H 'Content-Type: application/json' \
  -d '{"superficie":85,"habitaciones":3,"banos":2,"antiguedad":15,"estadoConservacion":"bueno","orientacion":"sur","planta":"3","finalidad":"venta","caracteristicas":["ascensor","terraza"],"direccion":"Calle Silvela 50","ciudad":"Madrid","codigoPostal":"28028"}' \
  -m 120 2>&1"""

print("\nEnviando solicitud de valoración (puede tardar ~30s)...")
stdin, stdout, stderr = client.exec_command(val_cmd, timeout=130)
val_out = stdout.read().decode()

if val_out:
    try:
        data = json.loads(val_out)
        print(f"\nRespuesta de la API ({len(val_out)} chars):")
        print(f"  success: {data.get('success')}")
        print(f"  valorEstimado: {data.get('valorEstimado')}")
        print(f"  alquilerEstimado (larga): {data.get('alquilerEstimado')}")
        print(f"  rentabilidadAlquiler: {data.get('rentabilidadAlquiler')}")
        print(f"  alquilerMediaEstancia: {data.get('alquilerMediaEstancia')}")
        print(f"  alquilerMediaEstanciaMin: {data.get('alquilerMediaEstanciaMin')}")
        print(f"  alquilerMediaEstanciaMax: {data.get('alquilerMediaEstanciaMax')}")
        print(f"  rentabilidadMediaEstancia: {data.get('rentabilidadMediaEstancia')}")
        print(f"  ocupacionEstimadaMediaEstancia: {data.get('ocupacionEstimadaMediaEstancia')}")
        print(f"  perfilInquilinoMediaEstancia: {data.get('perfilInquilinoMediaEstancia')}")
        print(f"  metodologiaUsada: {data.get('metodologiaUsada')}")
        print(f"  phase1Summary: {data.get('phase1Summary')}")
        
        if data.get('error'):
            print(f"\n  ERROR: {data.get('error')}")
            print(f"  message: {data.get('message')}")
    except json.JSONDecodeError:
        print(f"Respuesta no es JSON: {val_out[:500]}")
else:
    print("Sin respuesta de la API")

client.close()

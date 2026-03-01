#!/usr/bin/env python3
"""Test completo de valoración en producción con login NextAuth"""
import sys
import json
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)

def run(cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    stdout.channel.recv_exit_status()
    return stdout.read().decode().strip()

# Login NextAuth con CSRF token
print("1. Obteniendo CSRF token...")
csrf_out = run("""curl -sf -c /tmp/itest.txt http://localhost:3000/api/auth/csrf -m 10""")
print(f"   CSRF: {csrf_out[:100]}")

try:
    csrf_token = json.loads(csrf_out).get('csrfToken', '')
except:
    csrf_token = ''
    print("   No se pudo obtener CSRF token")

print(f"\n2. Login con admin@inmova.app...")
login_out = run(f"""curl -sf -b /tmp/itest.txt -c /tmp/itest.txt \
  -X POST http://localhost:3000/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'csrfToken={csrf_token}&email=admin@inmova.app&password=Admin123!&json=true' \
  -m 15 -L 2>&1""", timeout=20)
print(f"   Login: {login_out[:200]}")

print(f"\n3. Verificando sesión...")
session_out = run("curl -sf -b /tmp/itest.txt http://localhost:3000/api/auth/session -m 10")
print(f"   Session: {session_out[:200]}")

try:
    session = json.loads(session_out)
    if not session.get('user'):
        print("   SIN SESION. Intentando con test@inmova.app...")
        csrf_out = run("curl -sf -c /tmp/itest2.txt http://localhost:3000/api/auth/csrf -m 10")
        csrf_token = json.loads(csrf_out).get('csrfToken', '')
        run(f"""curl -sf -b /tmp/itest2.txt -c /tmp/itest2.txt \
          -X POST http://localhost:3000/api/auth/callback/credentials \
          -H 'Content-Type: application/x-www-form-urlencoded' \
          -d 'csrfToken={csrf_token}&email=test@inmova.app&password=Test123456!&json=true' \
          -m 15 -L""", timeout=20)
        session_out = run("curl -sf -b /tmp/itest2.txt http://localhost:3000/api/auth/session -m 10")
        session = json.loads(session_out)
        cookie_file = '/tmp/itest2.txt'
    else:
        cookie_file = '/tmp/itest.txt'
except:
    cookie_file = '/tmp/itest.txt'

print(f"\n4. Enviando valoración (puede tardar 30-60s)...")
val_out = run(f"""curl -sf -b {cookie_file} -X POST http://localhost:3000/api/ai/valuate \
  -H 'Content-Type: application/json' \
  -d '{{"superficie":85,"habitaciones":3,"banos":2,"antiguedad":15,"estadoConservacion":"bueno","orientacion":"sur","planta":"3","finalidad":"venta","caracteristicas":["ascensor","terraza"],"direccion":"Calle Silvela 50","ciudad":"Madrid","codigoPostal":"28028"}}' \
  -m 120""", timeout=130)

if val_out:
    try:
        data = json.loads(val_out)
        print(f"\n=== RESULTADO DE VALORACION ===")
        print(f"success:           {data.get('success')}")
        print(f"valorEstimado:     {data.get('valorEstimado')}")
        print(f"precioM2:          {data.get('precioM2')}")
        print(f"confianza:         {data.get('confianza')}")
        print(f"")
        print(f"--- LARGA ESTANCIA ---")
        print(f"alquilerEstimado:  {data.get('alquilerEstimado')}")
        print(f"rentabilidad:      {data.get('rentabilidadAlquiler')}")
        print(f"capRate:           {data.get('capRate', data.get('caprate'))}")
        print(f"")
        print(f"--- MEDIA ESTANCIA ---")
        print(f"alquilerMediaEstancia:     {data.get('alquilerMediaEstancia')}")
        print(f"alquilerMediaEstanciaMin:  {data.get('alquilerMediaEstanciaMin')}")
        print(f"alquilerMediaEstanciaMax:  {data.get('alquilerMediaEstanciaMax')}")
        print(f"rentabilidadMedia:         {data.get('rentabilidadMediaEstancia')}")
        print(f"ocupacionMedia:            {data.get('ocupacionEstimadaMediaEstancia')}")
        print(f"perfilInquilino:           {data.get('perfilInquilinoMediaEstancia')}")
        print(f"")
        print(f"metodologia:       {data.get('metodologiaUsada')}")
        print(f"phase1Summary:     {data.get('phase1Summary')}")
        
        if data.get('error'):
            print(f"\nERROR: {data.get('error')}")
            print(f"message: {data.get('message')}")
            
        # Verificar qué campos faltan
        missing = []
        for k in ['alquilerMediaEstancia','alquilerMediaEstanciaMin','alquilerMediaEstanciaMax','rentabilidadMediaEstancia','perfilInquilinoMediaEstancia']:
            if not data.get(k):
                missing.append(k)
        if missing:
            print(f"\nCAMPOS FALTANTES: {', '.join(missing)}")
        else:
            print(f"\nTodos los campos de media estancia presentes.")
            
    except json.JSONDecodeError:
        print(f"Respuesta no es JSON: {val_out[:500]}")
else:
    print("Sin respuesta de la API")
    print("\nRevisando logs de error...")
    err_out = run("pm2 logs inmova-app --err --lines 10 --nostream 2>/dev/null")
    print(err_out[:500])

client.close()

#!/usr/bin/env python3
import paramiko
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASS, timeout=10)

print("=== Errores recientes (últimas 1500 líneas) - filtro: AI Valuate, valoracion, ai/valuate, geocode, lat, lng ===")
patterns = ['AI Valuate', 'valoracion', 'ai/valuate', 'geocod', 'latitud', 'longitud', '\\bnominatim\\b', 'mapbox', 'unifiedValuation']
cmd = f"pm2 logs inmova-app --err --lines 2000 --nostream 2>&1 | grep -iE '({'|'.join(patterns)})' | tail -100"
stdin, stdout, _ = client.exec_command(cmd, timeout=60)
print(stdout.read().decode()[:6000])

print("\n\n=== Errores recientes generales (últimas 100) ===")
cmd2 = "pm2 logs inmova-app --err --lines 200 --nostream 2>&1 | tail -100"
stdin, stdout, _ = client.exec_command(cmd2, timeout=60)
print(stdout.read().decode()[:6000])

client.close()

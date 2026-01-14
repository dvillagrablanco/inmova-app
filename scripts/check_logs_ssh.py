import paramiko
import sys

HOST = "157.180.119.236"
USER = "root"
PASS = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="

def get_logs():
    print(f"Connecting to {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, username=USER, password=PASS, timeout=10)
        
        # Obtener logs de error recientes
        print("--- PM2 Error Logs (Last 50 lines) ---")
        stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --err --lines 50 --nostream")
        print(stdout.read().decode())
        
        # Obtener logs de salida recientes (para ver si arrancó bien)
        print("--- PM2 Out Logs (Last 20 lines) ---")
        stdin, stdout, stderr = client.exec_command("pm2 logs inmova-app --lines 20 --nostream")
        print(stdout.read().decode())

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    get_logs()

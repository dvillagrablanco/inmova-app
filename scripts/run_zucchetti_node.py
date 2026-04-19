#!/usr/bin/env python3
"""Ejecuta el servicio directamente con Node usando el código ya compilado."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

# Usar tsx con el path correcto al lib
cmd = """
cd /opt/inmova-app

# Cargar variables seguras (single-line solamente, evitar saltos en BEGIN PRIVATE KEY)
set +e
while IFS='=' read -r key value; do
  if [[ "$key" =~ ^[A-Z][A-Z0-9_]+$ ]]; then
    if [[ ! "$value" =~ "BEGIN" ]] && [[ ! "$value" =~ "END" ]]; then
      export "$key"="$value"
    fi
  fi
done < /opt/inmova-app/.env.production

echo "=== Ejecutando syncZucchettiGroupVidaro vía tsx ==="
echo "DATABASE_URL: ${DATABASE_URL:0:40}..."
echo "ZUCCHETTI_SERVER: ${ZUCCHETTI_SERVER:0:30}"

# Crear script en el directorio scripts/ (que tiene acceso a paths del tsconfig)
cat > /opt/inmova-app/scripts/_zucchetti_run.ts << 'SCRIPT'
import { syncZucchettiGroupVidaro } from '@/lib/zucchetti-full-sync-service';

(async () => {
  console.log('Iniciando...');
  const t0 = Date.now();
  try {
    const results = await syncZucchettiGroupVidaro();
    console.log(`\\n=== RESULTADO (${Date.now() - t0}ms) ===`);
    for (const r of results) {
      console.log(`\\n[${r.companyKey}] success=${r.success} duracion=${r.durationMs}ms`);
      if (r.error) console.log(`  ERROR: ${r.error}`);
      console.log(`  apuntes: read=${r.apuntes.read} created=${r.apuntes.created} updated=${r.apuntes.updated}`);
      console.log(`  treasury: created=${r.treasury.created} errors=${r.treasury.errors}`);
      console.log(`  iva: read=${r.iva.read} created=${r.iva.created}`);
      console.log(`  terceros: read=${r.terceros.read} created=${r.terceros.created}`);
      console.log(`  balances: persisted=${r.balances.persisted}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('FATAL:', e);
    process.exit(1);
  }
})();
SCRIPT

cd /opt/inmova-app && timeout 600 npx tsx scripts/_zucchetti_run.ts 2>&1 | tail -100
rm -f scripts/_zucchetti_run.ts
"""
stdin, stdout, stderr = c.exec_command(cmd, timeout=900)
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip():
    print("STDERR:", err[-2000:])
c.close()

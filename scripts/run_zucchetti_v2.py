#!/usr/bin/env python3
"""Ejecuta sync directamente con tsx en el contexto del proyecto."""
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("157.180.119.236", username="root",
          password="hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=", timeout=10)

cmd = """
cd /opt/inmova-app

# Crear el script en el directorio scripts/ (donde tsconfig path @/ funciona)
cat > scripts/_run-zucchetti-sync.ts << 'SCRIPT_EOF'
import { syncZucchettiGroupVidaro } from '../lib/zucchetti-full-sync-service';

async function main() {
  console.log('=== Iniciando Zucchetti Group Vidaro Sync ===');
  const t0 = Date.now();
  const results = await syncZucchettiGroupVidaro();
  const total = Date.now() - t0;

  console.log(`\\n=== RESUMEN (${total}ms) ===`);
  for (const r of results) {
    console.log(`\\n[${r.companyKey}] success=${r.success} duracion=${r.durationMs}ms`);
    if (r.error) console.log(`  ERROR: ${r.error}`);
    console.log(`  apuntes: read=${r.apuntes.read} created=${r.apuntes.created} updated=${r.apuntes.updated} skipped=${r.apuntes.skipped} errors=${r.apuntes.errors}`);
    console.log(`  treasury: created=${r.treasury.created} errors=${r.treasury.errors}`);
    console.log(`  iva: read=${r.iva.read} created=${r.iva.created} errors=${r.iva.errors}`);
    console.log(`  terceros: read=${r.terceros.read} created=${r.terceros.created} errors=${r.terceros.errors}`);
    console.log(`  balances: computed=${r.balances.computed} persisted=${r.balances.persisted}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
SCRIPT_EOF

# Cargar env vars de forma segura (saltando las multilinea con BEGIN/END)
export $(grep -E '^[A-Z][A-Z0-9_]+=' /opt/inmova-app/.env.production | grep -v 'PRIVATE_KEY' | grep -v 'BEGIN' | xargs -d '\\n')

NODE_OPTIONS="--no-warnings" npx tsx scripts/_run-zucchetti-sync.ts 2>&1 | tail -100

rm -f scripts/_run-zucchetti-sync.ts
"""
stdin, stdout, stderr = c.exec_command(cmd, timeout=900)
print(stdout.read().decode())
err = stderr.read().decode()
if err and 'NotFound' not in err:
    print("STDERR:", err[-1500:])

c.close()

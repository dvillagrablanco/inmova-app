#!/usr/bin/env python3
"""
Arreglar BD de producción completamente:
1. Crear tablas faltantes
2. Cargar datos semilla
3. Reiniciar app
"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=300):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

# SQL para crear tablas faltantes
CREATE_TABLES_SQL = '''
-- Tabla contract_signatures
CREATE TABLE IF NOT EXISTS contract_signatures (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    provider TEXT DEFAULT 'SIGNATURIT',
    "externalId" TEXT,
    "documentUrl" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentHash" TEXT,
    signatories JSONB,
    status TEXT DEFAULT 'PENDING',
    "signingUrl" TEXT,
    "completedUrl" TEXT,
    "emailSubject" TEXT,
    "emailMessage" TEXT,
    "remindersSent" INTEGER DEFAULT 0,
    "sentAt" TIMESTAMP,
    "expiresAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla promo_coupons
CREATE TABLE IF NOT EXISTS promo_coupons (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL,
    valor FLOAT NOT NULL,
    "fechaInicio" TIMESTAMP NOT NULL,
    "fechaExpiracion" TIMESTAMP NOT NULL,
    "alertaEnviada7d" BOOLEAN DEFAULT false,
    "alertaEnviada3d" BOOLEAN DEFAULT false,
    "alertaEnviada1d" BOOLEAN DEFAULT false,
    "ultimaAlertaFecha" TIMESTAMP,
    "usosMaximos" INTEGER,
    "usosActuales" INTEGER DEFAULT 0,
    "usosPorUsuario" INTEGER DEFAULT 1,
    "duracionMeses" INTEGER DEFAULT 1,
    "planesPermitidos" TEXT[] DEFAULT '{}',
    "stripeCouponId" TEXT,
    estado TEXT DEFAULT 'ACTIVE',
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    notas TEXT,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla promo_coupon_usages
CREATE TABLE IF NOT EXISTS promo_coupon_usages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "couponId" TEXT NOT NULL REFERENCES promo_coupons(id) ON DELETE CASCADE,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "fechaUso" TIMESTAMP DEFAULT NOW(),
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla partners
CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    tipo TEXT DEFAULT 'REFERRAL',
    status TEXT DEFAULT 'PENDING',
    "comisionPorcentaje" FLOAT DEFAULT 20,
    "comisionFija" FLOAT DEFAULT 0,
    "pagosRecibidos" FLOAT DEFAULT 0,
    "saldoPendiente" FLOAT DEFAULT 0,
    "totalClientes" INTEGER DEFAULT 0,
    "clientesActivos" INTEGER DEFAULT 0,
    "totalIngresos" FLOAT DEFAULT 0,
    website TEXT,
    "socialMedia" JSONB DEFAULT '{}',
    "landingPage" TEXT,
    notas TEXT,
    "contratoFirmado" BOOLEAN DEFAULT false,
    "fechaAprobacion" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla partner_commissions
CREATE TABLE IF NOT EXISTS partner_commissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "partnerId" TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    "companyId" TEXT NOT NULL,
    tipo TEXT NOT NULL,
    monto FLOAT NOT NULL,
    porcentaje FLOAT,
    estado TEXT DEFAULT 'PENDING',
    "fechaPago" TIMESTAMP,
    referencia TEXT,
    notas TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla partner_landings
CREATE TABLE IF NOT EXISTS partner_landings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "partnerId" TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    descripcion TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "colorPrimario" TEXT DEFAULT '#000000',
    "colorSecundario" TEXT DEFAULT '#FFFFFF',
    activo BOOLEAN DEFAULT true,
    visitas INTEGER DEFAULT 0,
    conversiones INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabla ewoorker_plans
CREATE TABLE IF NOT EXISTS ewoorker_plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL,
    "precioMensual" FLOAT NOT NULL,
    "precioAnual" FLOAT,
    "maxObras" INTEGER DEFAULT 5,
    "maxSocios" INTEGER DEFAULT 3,
    "maxSubcontratistas" INTEGER DEFAULT 10,
    "almacenamientoGB" INTEGER DEFAULT 5,
    caracteristicas TEXT[] DEFAULT '{}',
    "stripePriceIdMensual" TEXT,
    "stripePriceIdAnual" TEXT,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contract_signatures_company ON contract_signatures("companyId");
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract ON contract_signatures("contractId");
CREATE INDEX IF NOT EXISTS idx_promo_coupons_codigo ON promo_coupons(codigo);
CREATE INDEX IF NOT EXISTS idx_partners_codigo ON partners(codigo);
CREATE INDEX IF NOT EXISTS idx_partners_userid ON partners("userId");
'''

# SQL para insertar datos de planes
INSERT_PLANS_SQL = '''
-- Insertar planes de suscripción si no existen
INSERT INTO subscription_plans (id, nombre, tier, descripcion, "precioMensual", "maxUsuarios", "maxPropiedades", "modulosIncluidos", activo, "signaturesIncludedMonth", "storageIncludedGB", "aiTokensIncludedMonth", "smsIncludedMonth", "createdAt", "updatedAt")
SELECT * FROM (
    VALUES
    ('plan-free', 'Free', 'FREE', 'Plan gratuito para probar la plataforma', 0, 1, 3, '["dashboard", "propiedades"]'::jsonb, true, 0, 1, 0, 0, NOW(), NOW()),
    ('plan-starter', 'Starter', 'STARTER', 'Para propietarios individuales', 29, 2, 10, '["dashboard", "propiedades", "inquilinos", "contratos", "pagos"]'::jsonb, true, 5, 5, 1000, 50, NOW(), NOW()),
    ('plan-professional', 'Professional', 'PROFESSIONAL', 'Para gestores profesionales', 79, 5, 50, '["dashboard", "propiedades", "inquilinos", "contratos", "pagos", "mantenimiento", "documentos", "crm"]'::jsonb, true, 20, 25, 5000, 200, NOW(), NOW()),
    ('plan-business', 'Business', 'BUSINESS', 'Para empresas medianas', 199, 15, 200, '["dashboard", "propiedades", "inquilinos", "contratos", "pagos", "mantenimiento", "documentos", "crm", "comunidades", "analytics"]'::jsonb, true, 50, 100, 20000, 500, NOW(), NOW()),
    ('plan-enterprise', 'Enterprise', 'ENTERPRISE', 'Solución personalizada para grandes empresas', 499, 1000, 10000, '["all"]'::jsonb, true, 200, 1000, 100000, 2000, NOW(), NOW())
) AS v(id, nombre, tier, descripcion, "precioMensual", "maxUsuarios", "maxPropiedades", "modulosIncluidos", activo, "signaturesIncludedMonth", "storageIncludedGB", "aiTokensIncludedMonth", "smsIncludedMonth", "createdAt", "updatedAt")
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = v.id);

-- Insertar planes eWoorker
INSERT INTO ewoorker_plans (id, nombre, descripcion, tipo, "precioMensual", "precioAnual", "maxObras", "maxSocios", "maxSubcontratistas", "almacenamientoGB", caracteristicas, activo, destacado)
SELECT * FROM (
    VALUES
    ('ewoorker-free', 'eWoorker Free', 'Plan gratuito para probar', 'FREE', 0, 0, 1, 1, 2, 1, ARRAY['Gestión básica', '1 obra activa'], true, false),
    ('ewoorker-starter', 'eWoorker Starter', 'Para pequeños contratistas', 'STARTER', 39, 390, 5, 3, 10, 5, ARRAY['Gestión de obras', 'Partes de trabajo', 'Facturación básica'], true, false),
    ('ewoorker-professional', 'eWoorker Professional', 'Para contratistas profesionales', 'PROFESSIONAL', 99, 990, 20, 10, 50, 25, ARRAY['Todo Starter', 'Libro de subcontratación', 'Analytics', 'Integraciones'], true, true),
    ('ewoorker-enterprise', 'eWoorker Enterprise', 'Para empresas constructoras', 'ENTERPRISE', 299, 2990, 100, 50, 500, 100, ARRAY['Todo Professional', 'API completa', 'Soporte prioritario', 'Personalización'], true, false)
) AS v(id, nombre, descripcion, tipo, "precioMensual", "precioAnual", "maxObras", "maxSocios", "maxSubcontratistas", "almacenamientoGB", caracteristicas, activo, destacado)
WHERE NOT EXISTS (SELECT 1 FROM ewoorker_plans WHERE id = v.id);

-- Insertar cupón de bienvenida
INSERT INTO promo_coupons (id, codigo, nombre, descripcion, tipo, valor, "fechaInicio", "fechaExpiracion", "usosMaximos", "duracionMeses", activo, estado)
SELECT * FROM (
    VALUES
    ('coupon-welcome', 'BIENVENIDO2026', 'Descuento de Bienvenida', '20% de descuento en tu primer mes', 'PERCENTAGE', 20, NOW(), NOW() + INTERVAL '1 year', 1000, 1, true, 'ACTIVE')
) AS v(id, codigo, nombre, descripcion, tipo, valor, "fechaInicio", "fechaExpiracion", "usosMaximos", "duracionMeses", activo, estado)
WHERE NOT EXISTS (SELECT 1 FROM promo_coupons WHERE codigo = 'BIENVENIDO2026');
'''

def main():
    log("=" * 70, Colors.CYAN)
    log("🔧 REPARACIÓN COMPLETA DE BASE DE DATOS", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # 1. Backup
        log("\n💾 [1/5] Creando backup...", Colors.BLUE)
        timestamp = int(time.time())
        exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && pg_dump "$DB_URL" > /tmp/backup-full-{timestamp}.sql 2>/dev/null'''
        )
        log("  ✅ Backup creado", Colors.GREEN)
        
        # 2. Crear tablas faltantes
        log("\n🗃️ [2/5] Creando tablas faltantes...", Colors.BLUE)
        
        # Guardar SQL en archivo temporal
        sql_cmd = f'''cat > /tmp/create_tables.sql << 'SQL_EOF'
{CREATE_TABLES_SQL}
SQL_EOF'''
        exec_cmd(client, sql_cmd)
        
        # Ejecutar SQL
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -f /tmp/create_tables.sql 2>&1'''
        )
        if 'ERROR' in out:
            log(f"  ⚠️ Advertencias: {out[-500:]}", Colors.YELLOW)
        else:
            log("  ✅ Tablas creadas", Colors.GREEN)
        
        # 3. Insertar datos
        log("\n🌱 [3/5] Insertando datos semilla...", Colors.BLUE)
        
        sql_cmd = f'''cat > /tmp/insert_data.sql << 'SQL_EOF'
{INSERT_PLANS_SQL}
SQL_EOF'''
        exec_cmd(client, sql_cmd)
        
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -f /tmp/insert_data.sql 2>&1'''
        )
        if 'INSERT' in out or 'SELECT' in out:
            log("  ✅ Datos insertados", Colors.GREEN)
        else:
            log(f"  ℹ️ Output: {out[:300]}", Colors.CYAN)
        
        # 4. Verificar datos
        log("\n📊 [4/5] Verificando datos...", Colors.BLUE)
        
        for table in ['subscription_plans', 'ewoorker_plans', 'promo_coupons']:
            status, out, err = exec_cmd(client, 
                f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -c "SELECT COUNT(*) FROM {table}" 2>&1'''
            )
            count = [line.strip() for line in out.split('\n') if line.strip().isdigit()]
            if count:
                log(f"  {table}: {count[0]} registros", Colors.CYAN)
        
        # 5. Reiniciar app
        log("\n🔄 [5/5] Reiniciando aplicación...", Colors.BLUE)
        exec_cmd(client, "pm2 restart inmova-app")
        time.sleep(10)
        
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        if '"status":"ok"' in out:
            log("  ✅ App reiniciada correctamente", Colors.GREEN)
        else:
            log(f"  ⚠️ Health: {out[:200]}", Colors.YELLOW)
        
        # Limpiar archivos temporales
        exec_cmd(client, "rm -f /tmp/create_tables.sql /tmp/insert_data.sql")
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ REPARACIÓN COMPLETADA", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()

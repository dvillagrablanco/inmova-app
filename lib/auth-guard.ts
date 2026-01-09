/**
 * AUTH GUARD - Sistema de Protección de Autenticación
 * 
 * Este módulo proporciona funciones de verificación para asegurar
 * que el sistema de autenticación funciona correctamente.
 * 
 * PROTOCOLO DE SEGURIDAD:
 * 1. Ejecutar verifyAuthSystem() antes de cada deploy
 * 2. El CI/CD debe fallar si la verificación no pasa
 * 3. Nunca modificar auth-options.ts sin ejecutar los tests
 * 
 * @module AuthGuard
 */

import bcrypt from 'bcryptjs';

/**
 * Resultado de la verificación de autenticación
 */
export interface AuthVerificationResult {
  success: boolean;
  checks: {
    name: string;
    passed: boolean;
    message: string;
    critical: boolean;
  }[];
  timestamp: Date;
  duration: number;
}

/**
 * Verifica que bcrypt funciona correctamente
 */
async function verifyBcrypt(): Promise<{ passed: boolean; message: string }> {
  try {
    const testPassword = 'TestPassword123!';
    const hash = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hash);
    
    if (!isValid) {
      return { passed: false, message: 'bcrypt.compare() falló para password correcto' };
    }
    
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    if (isInvalid) {
      return { passed: false, message: 'bcrypt.compare() retornó true para password incorrecto' };
    }
    
    return { passed: true, message: 'bcrypt funciona correctamente' };
  } catch (error) {
    return { passed: false, message: `Error en bcrypt: ${error}` };
  }
}

/**
 * Verifica que las variables de entorno críticas existen
 */
function verifyEnvVars(): { passed: boolean; message: string } {
  const criticalVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const missing = criticalVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    return { 
      passed: false, 
      message: `Variables de entorno faltantes: ${missing.join(', ')}` 
    };
  }
  
  // Verificar que NEXTAUTH_SECRET tiene longitud suficiente
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    return { 
      passed: false, 
      message: 'NEXTAUTH_SECRET debe tener al menos 32 caracteres' 
    };
  }
  
  return { passed: true, message: 'Variables de entorno configuradas correctamente' };
}

/**
 * Verifica la conexión a la base de datos
 */
async function verifyDatabase(): Promise<{ passed: boolean; message: string }> {
  try {
    const { prisma } = await import('./db');
    await prisma.$queryRaw`SELECT 1`;
    return { passed: true, message: 'Conexión a base de datos OK' };
  } catch (error) {
    return { passed: false, message: `Error de conexión a BD: ${error}` };
  }
}

/**
 * Verifica que existe al menos un usuario admin activo
 */
async function verifyAdminExists(): Promise<{ passed: boolean; message: string }> {
  try {
    const { prisma } = await import('./db');
    const adminCount = await prisma.user.count({
      where: {
        role: 'super_admin',
        activo: true,
      },
    });
    
    if (adminCount === 0) {
      return { passed: false, message: 'No hay usuarios super_admin activos' };
    }
    
    return { passed: true, message: `${adminCount} super_admin(s) activo(s)` };
  } catch (error) {
    return { passed: false, message: `Error verificando admins: ${error}` };
  }
}

/**
 * Verifica que el módulo de autenticación se puede cargar
 */
async function verifyAuthModule(): Promise<{ passed: boolean; message: string }> {
  try {
    const { authOptions } = await import('./auth-options');
    
    if (!authOptions) {
      return { passed: false, message: 'authOptions es undefined' };
    }
    
    if (!authOptions.providers || authOptions.providers.length === 0) {
      return { passed: false, message: 'No hay providers configurados' };
    }
    
    if (!authOptions.secret && !process.env.NEXTAUTH_SECRET) {
      return { passed: false, message: 'No hay secret configurado' };
    }
    
    if (authOptions.session?.strategy !== 'jwt') {
      return { passed: false, message: 'Estrategia de sesión no es JWT' };
    }
    
    return { passed: true, message: 'Módulo de autenticación cargado correctamente' };
  } catch (error) {
    return { passed: false, message: `Error cargando auth module: ${error}` };
  }
}

/**
 * Verifica que el hash de password de un usuario admin es válido
 */
async function verifyAdminPasswordHash(): Promise<{ passed: boolean; message: string }> {
  try {
    const { prisma } = await import('./db');
    const admin = await prisma.user.findFirst({
      where: {
        role: 'super_admin',
        activo: true,
      },
      select: {
        email: true,
        password: true,
      },
    });
    
    if (!admin) {
      return { passed: false, message: 'No hay admin para verificar' };
    }
    
    if (!admin.password) {
      return { passed: false, message: 'Admin sin password hash' };
    }
    
    // Verificar que el hash tiene formato bcrypt válido
    if (!admin.password.startsWith('$2')) {
      return { passed: false, message: 'Hash de password no tiene formato bcrypt' };
    }
    
    return { passed: true, message: 'Hash de password admin válido' };
  } catch (error) {
    return { passed: false, message: `Error verificando hash: ${error}` };
  }
}

/**
 * Ejecuta todas las verificaciones del sistema de autenticación
 */
export async function verifyAuthSystem(): Promise<AuthVerificationResult> {
  const startTime = Date.now();
  const checks: AuthVerificationResult['checks'] = [];
  
  // 1. Verificar bcrypt (CRÍTICO)
  const bcryptCheck = await verifyBcrypt();
  checks.push({
    name: 'bcrypt',
    passed: bcryptCheck.passed,
    message: bcryptCheck.message,
    critical: true,
  });
  
  // 2. Verificar variables de entorno (CRÍTICO)
  const envCheck = verifyEnvVars();
  checks.push({
    name: 'environment',
    passed: envCheck.passed,
    message: envCheck.message,
    critical: true,
  });
  
  // 3. Verificar módulo de auth (CRÍTICO)
  const authCheck = await verifyAuthModule();
  checks.push({
    name: 'auth_module',
    passed: authCheck.passed,
    message: authCheck.message,
    critical: true,
  });
  
  // 4. Verificar base de datos (CRÍTICO)
  const dbCheck = await verifyDatabase();
  checks.push({
    name: 'database',
    passed: dbCheck.passed,
    message: dbCheck.message,
    critical: true,
  });
  
  // 5. Verificar admin existe (CRÍTICO)
  const adminCheck = await verifyAdminExists();
  checks.push({
    name: 'admin_exists',
    passed: adminCheck.passed,
    message: adminCheck.message,
    critical: true,
  });
  
  // 6. Verificar hash de password (IMPORTANTE)
  const hashCheck = await verifyAdminPasswordHash();
  checks.push({
    name: 'password_hash',
    passed: hashCheck.passed,
    message: hashCheck.message,
    critical: false,
  });
  
  const criticalFailed = checks.filter(c => c.critical && !c.passed);
  const success = criticalFailed.length === 0;
  
  return {
    success,
    checks,
    timestamp: new Date(),
    duration: Date.now() - startTime,
  };
}

/**
 * Simula un intento de login para verificar el flujo completo
 */
export async function testLoginFlow(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const { prisma } = await import('./db');
    
    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        activo: true,
        role: true,
      },
    });
    
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }
    
    if (!user.activo) {
      return { success: false, message: 'Usuario inactivo' };
    }
    
    if (!user.password) {
      return { success: false, message: 'Usuario sin password' };
    }
    
    // 2. Verificar password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return { success: false, message: 'Password incorrecto' };
    }
    
    return { 
      success: true, 
      message: 'Login exitoso',
      userId: user.id,
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error en test de login: ${error}` 
    };
  }
}

/**
 * Genera un reporte de estado del sistema de autenticación
 */
export async function generateAuthReport(): Promise<string> {
  const result = await verifyAuthSystem();
  
  let report = `
╔══════════════════════════════════════════════════════════════════╗
║           REPORTE DE VERIFICACIÓN DE AUTENTICACIÓN              ║
╠══════════════════════════════════════════════════════════════════╣
║ Fecha: ${result.timestamp.toISOString().padEnd(53)}║
║ Duración: ${(result.duration + 'ms').padEnd(51)}║
║ Estado: ${(result.success ? '✅ PASSED' : '❌ FAILED').padEnd(53)}║
╠══════════════════════════════════════════════════════════════════╣
`;

  for (const check of result.checks) {
    const icon = check.passed ? '✅' : '❌';
    const critical = check.critical ? '[CRÍTICO]' : '[INFO]';
    report += `║ ${icon} ${check.name.padEnd(15)} ${critical.padEnd(10)} ${check.message.substring(0, 30).padEnd(30)}║\n`;
  }

  report += `╚══════════════════════════════════════════════════════════════════╝`;
  
  return report;
}

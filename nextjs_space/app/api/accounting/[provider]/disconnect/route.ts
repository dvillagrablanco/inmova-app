import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { provider } = params;

    // Mapeo de proveedores a sus variables de entorno
    const providerEnvVars: Record<string, string[]> = {
      sage: ['SAGE_CLIENT_ID', 'SAGE_CLIENT_SECRET', 'SAGE_API_URL', 'SAGE_DEFAULT_TAX_RATE_ID', 'SAGE_DEFAULT_BANK_ACCOUNT_ID'],
      holded: ['HOLDED_API_KEY'],
      a3: ['A3_API_KEY', 'A3_USERNAME', 'A3_PASSWORD', 'A3_COMPANY_ID', 'A3_API_URL'],
      alegra: ['ALEGRA_USERNAME', 'ALEGRA_API_TOKEN'],
      zucchetti: ['ZUCCHETTI_API_KEY', 'ZUCCHETTI_COMPANY_ID', 'ZUCCHETTI_API_URL'],
      contasimple: ['CONTASIMPLE_API_KEY', 'CONTASIMPLE_COMPANY_ID']
    };

    const envVarsToRemove = providerEnvVars[provider];

    if (!envVarsToRemove) {
      return NextResponse.json(
        { error: 'Proveedor no soportado' },
        { status: 400 }
      );
    }

    // Leer el archivo .env
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({
        success: true,
        message: 'No hay configuración para eliminar'
      });
    }

    let envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    // Filtrar las líneas que no corresponden a las variables del proveedor
    const newLines = lines.filter((line: string) => {
      return !envVarsToRemove.some(envVar => line.startsWith(`${envVar}=`));
    });

    // Escribir el archivo .env actualizado
    fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');

    // Eliminar las variables del proceso actual
    envVarsToRemove.forEach(envVar => {
      delete process.env[envVar];
    });

    return NextResponse.json({
      success: true,
      message: 'Integración desconectada exitosamente'
    });
  } catch (error: any) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json(
      { error: 'Error al desconectar la integración', details: error.message },
      { status: 500 }
    );
  }
}

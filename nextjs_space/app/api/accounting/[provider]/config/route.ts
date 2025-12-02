import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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
    const config = await request.json();

    // Leer el archivo .env existente
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Actualizar o agregar las variables de entorno
    const lines = envContent.split('\n');
    const newLines = [...lines];

    for (const [key, value] of Object.entries(config)) {
      if (!value) continue;  // Saltar valores vacíos

      const existingIndex = newLines.findIndex(line => line.startsWith(`${key}=`));
      const newLine = `${key}="${value}"`;

      if (existingIndex >= 0) {
        newLines[existingIndex] = newLine;
      } else {
        newLines.push(newLine);
      }
    }

    // Escribir el archivo .env actualizado
    const newEnvContent = newLines.join('\n');
    fs.writeFileSync(envPath, newEnvContent, 'utf8');

    // Actualizar las variables de entorno en el proceso actual
    for (const [key, value] of Object.entries(config)) {
      if (value) {
        process.env[key] = value as string;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    });
  } catch (error: any) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: 'Error al guardar la configuración', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Route: Análisis de Documentos con IA
 * 
 * Endpoint para analizar documentos usando el AI Document Agent Service.
 * Soporta subida de archivos y análisis de texto.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simulación del análisis (en producción usar el servicio real)
async function analyzeDocumentMock(filename: string, context: string) {
  // Determinar tipo de documento basado en el nombre del archivo
  let category = 'otro';
  let specificType = 'Documento general';
  
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('contrato') || lowerName.includes('alquiler') || lowerName.includes('arrendamiento')) {
    category = 'contrato_alquiler';
    specificType = 'Contrato de arrendamiento de vivienda';
  } else if (lowerName.includes('dni') || lowerName.includes('nie') || lowerName.includes('pasaporte')) {
    category = 'dni_nie';
    specificType = 'Documento de identidad';
  } else if (lowerName.includes('factura') || lowerName.includes('invoice')) {
    category = 'factura';
    specificType = 'Factura de servicios';
  } else if (lowerName.includes('seguro') || lowerName.includes('poliza')) {
    category = 'seguro';
    specificType = 'Póliza de seguro del hogar';
  } else if (lowerName.includes('escritura') || lowerName.includes('propiedad')) {
    category = 'escritura_propiedad';
    specificType = 'Escritura de compraventa';
  } else if (lowerName.includes('certificado') || lowerName.includes('energetico')) {
    category = 'certificado_energetico';
    specificType = 'Certificado de eficiencia energética';
  } else if (lowerName.includes('recibo') || lowerName.includes('pago')) {
    category = 'recibo_pago';
    specificType = 'Recibo de pago';
  } else if (lowerName.includes('nota') && lowerName.includes('simple')) {
    category = 'nota_simple';
    specificType = 'Nota simple del Registro de la Propiedad';
  } else if (lowerName.includes('fianza') || lowerName.includes('deposito')) {
    category = 'fianza';
    specificType = 'Justificante de depósito de fianza';
  } else if (lowerName.includes('inventario')) {
    category = 'inventario';
    specificType = 'Inventario de mobiliario';
  }

  // Generar campos extraídos simulados según el tipo
  const extractedFields = generateMockFields(category);

  return {
    classification: {
      category,
      confidence: 0.85 + Math.random() * 0.1,
      specificType,
      reasoning: `Documento clasificado como ${specificType} basándose en el contenido y nombre del archivo.`,
    },
    ownershipValidation: {
      isOwned: Math.random() > 0.3,
      detectedCIF: 'B12345678',
      detectedCompanyName: 'Inmobiliaria Ejemplo S.L.',
      matchesCIF: true,
      matchesName: true,
      confidence: 0.9,
      notes: 'El documento pertenece a la empresa o está relacionado con sus operaciones.',
    },
    extractedFields,
    summary: generateMockSummary(category, specificType),
    warnings: generateMockWarnings(category),
    suggestedActions: generateMockActions(category),
    sensitiveData: {
      hasSensitive: ['dni_nie', 'contrato_alquiler'].includes(category),
      types: ['dni_nie', 'contrato_alquiler'].includes(category) ? ['datos_personales', 'datos_financieros'] : [],
    },
    processingMetadata: {
      tokensUsed: Math.floor(Math.random() * 2000) + 500,
      processingTimeMs: Math.floor(Math.random() * 3000) + 1000,
      modelUsed: 'claude-3-5-sonnet-20241022',
    },
  };
}

function generateMockFields(category: string) {
  const fieldsByCategory: Record<string, any[]> = {
    contrato_alquiler: [
      { fieldName: 'arrendador_nombre', fieldValue: 'Inmobiliaria Ejemplo S.L.', dataType: 'company_info', confidence: 0.95, targetEntity: 'Company', targetField: 'nombre' },
      { fieldName: 'arrendador_cif', fieldValue: 'B12345678', dataType: 'company_info', confidence: 0.98, targetEntity: 'Company', targetField: 'cif' },
      { fieldName: 'arrendatario_nombre', fieldValue: 'Juan García López', dataType: 'tenant_info', confidence: 0.92, targetEntity: 'Tenant', targetField: 'nombre' },
      { fieldName: 'arrendatario_dni', fieldValue: '12345678A', dataType: 'tenant_info', confidence: 0.97, targetEntity: 'Tenant', targetField: 'dni' },
      { fieldName: 'direccion_inmueble', fieldValue: 'Calle Mayor 123, 28001 Madrid', dataType: 'property_info', confidence: 0.94, targetEntity: 'Unit', targetField: 'direccion' },
      { fieldName: 'renta_mensual', fieldValue: '950', dataType: 'contract_info', confidence: 0.96, targetEntity: 'Contract', targetField: 'rentaMensual' },
      { fieldName: 'fianza', fieldValue: '1900', dataType: 'contract_info', confidence: 0.95, targetEntity: 'Contract', targetField: 'fianza' },
      { fieldName: 'fecha_inicio', fieldValue: '2026-02-01', dataType: 'contract_info', confidence: 0.93, targetEntity: 'Contract', targetField: 'fechaInicio' },
    ],
    dni_nie: [
      { fieldName: 'nombre_completo', fieldValue: 'Juan García López', dataType: 'tenant_info', confidence: 0.98, targetEntity: 'Tenant', targetField: 'nombre' },
      { fieldName: 'numero_documento', fieldValue: '12345678A', dataType: 'tenant_info', confidence: 0.99, targetEntity: 'Tenant', targetField: 'dni' },
      { fieldName: 'fecha_nacimiento', fieldValue: '1985-03-15', dataType: 'tenant_info', confidence: 0.95, targetEntity: 'Tenant', targetField: 'fechaNacimiento' },
      { fieldName: 'nacionalidad', fieldValue: 'Española', dataType: 'tenant_info', confidence: 0.97, targetEntity: 'Tenant', targetField: 'nacionalidad' },
    ],
    factura: [
      { fieldName: 'proveedor', fieldValue: 'Endesa Energía S.A.', dataType: 'provider_info', confidence: 0.96, targetEntity: 'Provider', targetField: 'nombre' },
      { fieldName: 'proveedor_cif', fieldValue: 'A28023430', dataType: 'provider_info', confidence: 0.98, targetEntity: 'Provider', targetField: 'cif' },
      { fieldName: 'numero_factura', fieldValue: 'FAC-2026-001234', dataType: 'financial_info', confidence: 0.99 },
      { fieldName: 'fecha_factura', fieldValue: '2026-01-15', dataType: 'financial_info', confidence: 0.97 },
      { fieldName: 'importe_total', fieldValue: '156.78', dataType: 'financial_info', confidence: 0.98 },
      { fieldName: 'concepto', fieldValue: 'Suministro eléctrico - Enero 2026', dataType: 'financial_info', confidence: 0.94 },
    ],
    seguro: [
      { fieldName: 'aseguradora', fieldValue: 'Mapfre Seguros', dataType: 'insurance_info', confidence: 0.96, targetEntity: 'Insurance', targetField: 'aseguradora' },
      { fieldName: 'numero_poliza', fieldValue: 'POL-2024-789456', dataType: 'insurance_info', confidence: 0.98, targetEntity: 'Insurance', targetField: 'numeroPoliza' },
      { fieldName: 'direccion_asegurada', fieldValue: 'Calle Mayor 123, 28001 Madrid', dataType: 'property_info', confidence: 0.95 },
      { fieldName: 'prima_anual', fieldValue: '425.00', dataType: 'insurance_info', confidence: 0.94, targetEntity: 'Insurance', targetField: 'primaAnual' },
      { fieldName: 'fecha_vencimiento', fieldValue: '2027-01-15', dataType: 'insurance_info', confidence: 0.97, targetEntity: 'Insurance', targetField: 'fechaVencimiento' },
      { fieldName: 'coberturas', fieldValue: 'Hogar, RC, Robo, Incendio', dataType: 'insurance_info', confidence: 0.92 },
    ],
    escritura_propiedad: [
      { fieldName: 'direccion', fieldValue: 'Calle Mayor 123, 28001 Madrid', dataType: 'property_info', confidence: 0.96, targetEntity: 'Unit', targetField: 'direccion' },
      { fieldName: 'referencia_catastral', fieldValue: '9872023VK4797A0001WX', dataType: 'property_info', confidence: 0.98, targetEntity: 'Unit', targetField: 'referenciaCatastral' },
      { fieldName: 'superficie', fieldValue: '85', dataType: 'property_info', confidence: 0.94, targetEntity: 'Unit', targetField: 'superficie' },
      { fieldName: 'propietario', fieldValue: 'Inmobiliaria Ejemplo S.L.', dataType: 'company_info', confidence: 0.97 },
    ],
    certificado_energetico: [
      { fieldName: 'direccion', fieldValue: 'Calle Mayor 123, 28001 Madrid', dataType: 'property_info', confidence: 0.96 },
      { fieldName: 'calificacion_energetica', fieldValue: 'D', dataType: 'energy_info', confidence: 0.99, targetEntity: 'Unit', targetField: 'calificacionEnergetica' },
      { fieldName: 'consumo_energia', fieldValue: '156.3 kWh/m²', dataType: 'energy_info', confidence: 0.95 },
      { fieldName: 'emisiones_co2', fieldValue: '38.5 kgCO2/m²', dataType: 'energy_info', confidence: 0.94 },
      { fieldName: 'fecha_caducidad', fieldValue: '2036-01-15', dataType: 'energy_info', confidence: 0.97 },
    ],
  };

  return fieldsByCategory[category] || [
    { fieldName: 'tipo_documento', fieldValue: 'Documento general', dataType: 'property_info', confidence: 0.7 },
  ];
}

function generateMockSummary(category: string, specificType: string) {
  const summaries: Record<string, string> = {
    contrato_alquiler: 'Contrato de arrendamiento de vivienda entre Inmobiliaria Ejemplo S.L. y Juan García López, para la propiedad en Calle Mayor 123, Madrid. Renta mensual de 950€ con fianza de 1.900€.',
    dni_nie: 'Documento de identidad de Juan García López (DNI: 12345678A), de nacionalidad española, nacido el 15 de marzo de 1985.',
    factura: 'Factura de Endesa Energía por suministro eléctrico correspondiente a enero 2026, con un importe total de 156,78€.',
    seguro: 'Póliza de seguro del hogar de Mapfre para la propiedad en Calle Mayor 123, Madrid. Prima anual de 425€ con coberturas de hogar, RC, robo e incendio.',
    escritura_propiedad: 'Escritura de propiedad de inmueble ubicado en Calle Mayor 123, Madrid, con superficie de 85m² y referencia catastral 9872023VK4797A0001WX.',
    certificado_energetico: 'Certificado de eficiencia energética con calificación D para la propiedad en Calle Mayor 123, Madrid. Consumo de 156.3 kWh/m² y emisiones de 38.5 kgCO2/m².',
  };

  return summaries[category] || `Documento clasificado como ${specificType}. Análisis completado satisfactoriamente.`;
}

function generateMockWarnings(category: string) {
  const warnings: Record<string, string[]> = {
    contrato_alquiler: ['Verificar que la fianza coincide con 2 mensualidades según LAU'],
    dni_nie: ['Verificar fecha de caducidad del documento'],
    factura: [],
    seguro: ['La póliza vence en menos de 12 meses'],
    escritura_propiedad: ['Verificar cargas en el Registro de la Propiedad'],
    certificado_energetico: ['La calificación D es mejorable'],
  };

  return warnings[category] || [];
}

function generateMockActions(category: string) {
  const actions: Record<string, any[]> = {
    contrato_alquiler: [
      {
        action: 'create',
        entity: 'Contract',
        description: 'Crear nuevo contrato de arrendamiento',
        data: { tipo: 'vivienda', rentaMensual: 950, fianza: 1900 },
        confidence: 0.9,
        requiresReview: true,
      },
      {
        action: 'link',
        entity: 'Tenant',
        description: 'Vincular inquilino al contrato',
        data: { nombre: 'Juan García López', dni: '12345678A' },
        confidence: 0.85,
        requiresReview: true,
      },
    ],
    dni_nie: [
      {
        action: 'create',
        entity: 'Tenant',
        description: 'Crear ficha de nuevo inquilino',
        data: { nombre: 'Juan García López', dni: '12345678A' },
        confidence: 0.95,
        requiresReview: false,
      },
    ],
    factura: [
      {
        action: 'create',
        entity: 'Expense',
        description: 'Registrar gasto de suministros',
        data: { concepto: 'Electricidad', importe: 156.78 },
        confidence: 0.92,
        requiresReview: false,
      },
    ],
    seguro: [
      {
        action: 'create',
        entity: 'Insurance',
        description: 'Crear póliza de seguro',
        data: { aseguradora: 'Mapfre', primaAnual: 425 },
        confidence: 0.9,
        requiresReview: true,
      },
    ],
  };

  return actions[category] || [];
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Verificar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido' },
        { status: 400 }
      );
    }

    // Verificar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      );
    }

    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // En producción, aquí se usaría el servicio real:
    // const analysis = await analyzeDocument({
    //   text: extractedText,
    //   filename: file.name,
    //   mimeType: file.type,
    //   companyInfo: { cif: session.user.companyCif, nombre: session.user.companyName }
    // });

    // Por ahora, usar mock
    const analysis = await analyzeDocumentMock(file.name, context);

    return NextResponse.json(analysis);
  } catch (error: any) {
    logger.error('[AI Document Analysis] Error:', error);
    return NextResponse.json(
      { error: 'Error al analizar el documento', details: error.message },
      { status: 500 }
    );
  }
}

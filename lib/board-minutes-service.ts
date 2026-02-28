/**
 * Board Minutes Service — Generador de Actas de Junta para SLs patrimoniales
 *
 * Genera automáticamente el acta de junta ordinaria anual con:
 * - Datos de la empresa (CIF, domicilio, administrador)
 * - Resumen financiero del ejercicio (ingresos, gastos, resultado)
 * - Propuesta de aprobación de cuentas anuales
 * - Propuesta de aplicación del resultado
 * - Asistentes y quórum
 *
 * Formato: JSON estructurado (la generación de PDF se puede hacer con pdf-lib o html-to-pdf)
 */

import logger from '@/lib/logger';

export interface BoardMinute {
  empresa: {
    nombre: string;
    cif: string;
    domicilio: string;
    administrador: string;
  };
  junta: {
    tipo: 'ordinaria' | 'extraordinaria';
    convocatoria: 'primera' | 'segunda';
    fecha: string;
    hora: string;
    lugar: string;
    ejercicio: number;
  };
  asistentes: {
    nombre: string;
    cargo: string;
    participaciones: number; // % del capital
  }[];
  quorum: {
    capitalPresente: number; // %
    suficienteParaPrimera: boolean; // >50%
    suficienteParaSegunda: boolean; // cualquier %
  };
  ordenDelDia: string[];
  resultadosFinancieros: {
    ingresosBrutos: number;
    gastosDeducibles: number;
    amortizaciones: number;
    interesesHipoteca: number;
    resultadoAntesIS: number;
    impuestoSociedades: number;
    resultadoNeto: number;
    // Balance simplificado
    activoInmobiliario: number;
    deudaHipotecaria: number;
    patrimonioNeto: number;
  };
  acuerdos: {
    numero: number;
    titulo: string;
    descripcion: string;
    votacion: 'unanimidad' | 'mayoria';
    aprobado: boolean;
  }[];
  aplicacionResultado: {
    resultadoNeto: number;
    aReservas: number;
    aDividendos: number;
    aCompensarPerdidas: number;
  };
  textoActa: string; // Texto completo del acta en formato legal
  generadoEl: string;
}

/**
 * Genera el acta de junta ordinaria anual para una sociedad
 */
export async function generateBoardMinutes(
  companyId: string,
  ejercicio: number,
  params?: {
    fecha?: string;
    hora?: string;
    lugar?: string;
    asistentes?: { nombre: string; cargo: string; participaciones: number }[];
    distribucionResultado?: { aReservas: number; aDividendos: number };
  }
): Promise<BoardMinute> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const { calculateFiscalSummary, getCompanyPortfolio } = await import('@/lib/investment-service');

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true, cif: true, direccion: true, contactoPrincipal: true, ciudad: true },
  });

  if (!company) throw new Error('Empresa no encontrada');

  // Datos fiscales
  const fiscal = await calculateFiscalSummary(companyId, ejercicio);
  const portfolio = await getCompanyPortfolio(companyId);

  const resultadoNeto = fiscal.ingresosBrutos - fiscal.gastosDeducibles - fiscal.amortizaciones - fiscal.interesesHipoteca - fiscal.cuotaIS;

  // Asistentes por defecto (administrador único)
  const asistentes = params?.asistentes || [
    { nombre: company.contactoPrincipal || 'Administrador', cargo: 'Administrador único', participaciones: 100 },
  ];

  const capitalPresente = asistentes.reduce((s, a) => s + a.participaciones, 0);

  // Distribución resultado
  const distribucion = params?.distribucionResultado || {
    aReservas: resultadoNeto > 0 ? resultadoNeto : 0,
    aDividendos: 0,
  };

  const fecha = params?.fecha || `${new Date().getDate()} de junio de ${ejercicio + 1}`;
  const hora = params?.hora || '10:00';
  const lugar = params?.lugar || company.direccion || 'Domicilio social';

  const ordenDelDia = [
    'Aprobación del acta de la junta anterior',
    `Examen y aprobación de las cuentas anuales del ejercicio ${ejercicio}`,
    `Aprobación de la gestión del órgano de administración durante el ejercicio ${ejercicio}`,
    `Aplicación del resultado del ejercicio ${ejercicio}`,
    'Ruegos y preguntas',
  ];

  const acuerdos = [
    {
      numero: 1,
      titulo: 'Aprobación de cuentas anuales',
      descripcion: `Se aprueban las cuentas anuales del ejercicio ${ejercicio}, que comprenden el Balance de Situación, la Cuenta de Pérdidas y Ganancias y la Memoria, formuladas por el administrador.`,
      votacion: 'unanimidad' as const,
      aprobado: true,
    },
    {
      numero: 2,
      titulo: 'Aprobación de la gestión social',
      descripcion: `Se aprueba la gestión del órgano de administración durante el ejercicio ${ejercicio}.`,
      votacion: 'unanimidad' as const,
      aprobado: true,
    },
    {
      numero: 3,
      titulo: 'Aplicación del resultado',
      descripcion: resultadoNeto >= 0
        ? `El resultado del ejercicio, que asciende a ${fmtEur(resultadoNeto)}, se propone destinarlo a: Reservas voluntarias: ${fmtEur(distribucion.aReservas)}${distribucion.aDividendos > 0 ? `. Dividendos: ${fmtEur(distribucion.aDividendos)}` : ''}.`
        : `El resultado negativo del ejercicio, que asciende a ${fmtEur(Math.abs(resultadoNeto))}, se propone compensarlo con reservas voluntarias de ejercicios anteriores.`,
      votacion: 'unanimidad' as const,
      aprobado: true,
    },
  ];

  // Generar texto completo del acta
  const textoActa = generateActaText({
    empresa: { nombre: company.nombre, cif: company.cif || '', domicilio: company.direccion || '', administrador: company.contactoPrincipal || '' },
    fecha, hora, lugar,
    ejercicio,
    asistentes,
    capitalPresente,
    ordenDelDia,
    fiscal,
    resultadoNeto,
    portfolio,
    acuerdos,
    distribucion,
  });

  return {
    empresa: {
      nombre: company.nombre,
      cif: company.cif || '',
      domicilio: company.direccion || '',
      administrador: company.contactoPrincipal || '',
    },
    junta: {
      tipo: 'ordinaria',
      convocatoria: 'primera',
      fecha,
      hora,
      lugar,
      ejercicio,
    },
    asistentes,
    quorum: {
      capitalPresente,
      suficienteParaPrimera: capitalPresente > 50,
      suficienteParaSegunda: true,
    },
    ordenDelDia,
    resultadosFinancieros: {
      ingresosBrutos: fiscal.ingresosBrutos,
      gastosDeducibles: fiscal.gastosDeducibles,
      amortizaciones: fiscal.amortizaciones,
      interesesHipoteca: fiscal.interesesHipoteca,
      resultadoAntesIS: fiscal.baseImponible,
      impuestoSociedades: fiscal.cuotaIS,
      resultadoNeto: Math.round(resultadoNeto * 100) / 100,
      activoInmobiliario: portfolio.totalMarketValue,
      deudaHipotecaria: portfolio.totalMortgageDebt,
      patrimonioNeto: portfolio.totalEquity,
    },
    acuerdos,
    aplicacionResultado: {
      resultadoNeto: Math.round(resultadoNeto * 100) / 100,
      aReservas: distribucion.aReservas,
      aDividendos: distribucion.aDividendos,
      aCompensarPerdidas: resultadoNeto < 0 ? Math.abs(resultadoNeto) : 0,
    },
    textoActa,
    generadoEl: new Date().toISOString(),
  };
}

function generateActaText(d: any): string {
  return `ACTA DE LA JUNTA GENERAL ORDINARIA DE SOCIOS DE ${d.empresa.nombre.toUpperCase()}

En ${d.lugar}, siendo las ${d.hora} horas del día ${d.fecha}, se reúne en el domicilio social la Junta General Ordinaria de Socios de la mercantil ${d.empresa.nombre}, con C.I.F. ${d.empresa.cif} y domicilio social en ${d.empresa.domicilio}.

ASISTENTES:
${d.asistentes.map((a: any) => `- D./Dña. ${a.nombre}, en calidad de ${a.cargo}, titular del ${a.capitalPresente}% del capital social.`).join('\n')}

QUÓRUM: Se encuentra representado el ${d.capitalPresente}% del capital social, por lo que existe quórum suficiente para la celebración de la Junta en ${d.capitalPresente > 50 ? 'primera' : 'segunda'} convocatoria.

Actúa como Presidente D./Dña. ${d.empresa.administrador}, quien declara válidamente constituida la Junta y abierta la sesión.

ORDEN DEL DÍA:
${d.ordenDelDia.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

DESARROLLO DE LA JUNTA:

PRIMERO.- Se aprueba por unanimidad el acta de la junta anterior.

SEGUNDO.- El Administrador presenta las cuentas anuales del ejercicio ${d.ejercicio}, exponiendo los siguientes datos relevantes:

  - Ingresos brutos por arrendamientos: ${fmtEur(d.fiscal.ingresosBrutos)}
  - Gastos de explotación deducibles: ${fmtEur(d.fiscal.gastosDeducibles)}
  - Amortizaciones del inmovilizado: ${fmtEur(d.fiscal.amortizaciones)}
  - Intereses de deudas hipotecarias: ${fmtEur(d.fiscal.interesesHipoteca)}
  - Resultado antes de Impuesto de Sociedades: ${fmtEur(d.fiscal.baseImponible)}
  - Impuesto de Sociedades (25%): ${fmtEur(d.fiscal.cuotaIS)}
  - RESULTADO NETO DEL EJERCICIO: ${fmtEur(d.resultadoNeto)}

  Patrimonio inmobiliario (valor de mercado): ${fmtEur(d.portfolio.totalMarketValue)}
  Deuda hipotecaria viva: ${fmtEur(d.portfolio.totalMortgageDebt)}
  Patrimonio neto estimado: ${fmtEur(d.portfolio.totalEquity)}

Se someten a votación las cuentas anuales, siendo APROBADAS POR UNANIMIDAD.

TERCERO.- Se aprueba por unanimidad la gestión del órgano de administración durante el ejercicio ${d.ejercicio}.

CUARTO.- Se propone la siguiente aplicación del resultado del ejercicio:
${d.resultadoNeto >= 0
    ? `  - A reservas voluntarias: ${fmtEur(d.distribucion.aReservas)}${d.distribucion.aDividendos > 0 ? `\n  - A dividendos: ${fmtEur(d.distribucion.aDividendos)}` : ''}`
    : `  - A compensar con reservas voluntarias: ${fmtEur(Math.abs(d.resultadoNeto))}`
  }
Se somete a votación, siendo APROBADA POR UNANIMIDAD.

QUINTO.- No habiendo más asuntos que tratar ni ruegos y preguntas, el Presidente levanta la sesión, de la que se extiende la presente acta que, leída y conforme, firman todos los asistentes.

Firmado:

${d.asistentes.map((a: any) => `D./Dña. ${a.nombre}\n${a.cargo}`).join('\n\n')}
`;
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

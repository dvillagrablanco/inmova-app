/**
 * PLANTILLA DE CONTRATO DE ARRENDAMIENTO POR TEMPORADA
 * 
 * Contrato de media estancia (1-11 meses) conforme a LAU Art. 3.2
 * Incluye cláusulas específicas para:
 * - Motivo de temporalidad justificado
 * - Inventario de entrada/salida
 * - Servicios incluidos
 * - Prorrateo de días
 * - Penalización por desistimiento
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ServiciosIncluidos, ProrrateoResult } from '../medium-term-rental-service';

// ==========================================
// TIPOS
// ==========================================

export interface DatosContratoMediaEstancia {
  // Partes
  arrendador: {
    nombre: string;
    dni: string;
    direccion: string;
    telefono?: string;
    email?: string;
  };
  arrendatario: {
    nombre: string;
    dni: string;
    direccion: string;
    telefono?: string;
    email?: string;
    nacionalidad?: string;
  };
  
  // Inmueble
  inmueble: {
    direccion: string;
    municipio: string;
    provincia: string;
    codigoPostal: string;
    referenciaCatastral?: string;
    descripcion?: string;
    superficie?: number;
    habitaciones?: number;
    banos?: number;
    amueblado: boolean;
  };
  
  // Condiciones económicas
  rentaMensual: number;
  fianza: number;
  mesesFianza: number;
  depositoSuministros?: number;
  
  // Fechas y duración
  fechaInicio: Date;
  fechaFin: Date;
  duracionMeses: number;
  prorrateo?: ProrrateoResult;
  
  // Motivo de temporalidad (OBLIGATORIO para LAU Art. 3.2)
  motivoTemporalidad: string;
  descripcionMotivo: string;
  
  // Servicios incluidos
  serviciosIncluidos?: ServiciosIncluidos;
  limitesConsumo?: {
    luz?: number;
    agua?: number;
    gas?: number;
  };
  
  // Condiciones adicionales
  diasPreaviso: number;
  penalizacionDesistimiento: number;
  
  // Opcionales
  clausulasAdicionales?: string;
  firmadoEn?: string;
  fechaFirma?: Date;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatearFecha(fecha: Date): string {
  return format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatearDinero(cantidad: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(cantidad);
}

function numeroALetras(numero: number): string {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  
  if (numero === 0) return 'cero';
  if (numero === 100) return 'cien';
  if (numero < 10) return unidades[numero];
  if (numero < 20) return especiales[numero - 10];
  if (numero < 100) {
    const dec = Math.floor(numero / 10);
    const uni = numero % 10;
    if (uni === 0) return decenas[dec];
    if (dec === 2) return `veinti${unidades[uni]}`;
    return `${decenas[dec]} y ${unidades[uni]}`;
  }
  if (numero < 1000) {
    const cen = Math.floor(numero / 100);
    const resto = numero % 100;
    if (resto === 0) return centenas[cen];
    return `${centenas[cen]} ${numeroALetras(resto)}`;
  }
  if (numero < 2000) {
    return `mil ${numeroALetras(numero - 1000)}`;
  }
  if (numero < 10000) {
    const miles = Math.floor(numero / 1000);
    const resto = numero % 1000;
    if (resto === 0) return `${unidades[miles]} mil`;
    return `${unidades[miles]} mil ${numeroALetras(resto)}`;
  }
  return numero.toString();
}

function generarClausulaServicios(servicios: ServiciosIncluidos): string {
  const incluidos: string[] = [];
  const noIncluidos: string[] = [];
  
  const mapeo = {
    wifi: 'Conexión a Internet (WiFi)',
    agua: 'Suministro de agua',
    luz: 'Suministro eléctrico',
    gas: 'Suministro de gas',
    calefaccion: 'Calefacción central',
    comunidad: 'Gastos de comunidad',
    seguro: 'Seguro del hogar',
    parking: 'Plaza de aparcamiento',
    trastero: 'Trastero',
  };
  
  for (const [key, label] of Object.entries(mapeo)) {
    if (servicios[key as keyof typeof mapeo]) {
      incluidos.push(label);
    } else {
      noIncluidos.push(label);
    }
  }
  
  if (servicios.limpieza && servicios.limpiezaFrecuencia) {
    const frecuencias = {
      semanal: 'semanal',
      quincenal: 'quincenal',
      mensual: 'mensual',
    };
    incluidos.push(`Servicio de limpieza ${frecuencias[servicios.limpiezaFrecuencia]}`);
  }
  
  let texto = '';
  
  if (incluidos.length > 0) {
    texto += `La renta mensual INCLUYE los siguientes servicios:\n`;
    incluidos.forEach(s => texto += `    • ${s}\n`);
  }
  
  if (noIncluidos.length > 0) {
    texto += `\n  La renta mensual NO INCLUYE:\n`;
    noIncluidos.forEach(s => texto += `    • ${s}\n`);
    texto += `\n  Los servicios no incluidos serán contratados y abonados directamente por el arrendatario.`;
  }
  
  return texto;
}

// ==========================================
// GENERADOR DE CONTRATO
// ==========================================

export function generarContratoMediaEstancia(datos: DatosContratoMediaEstancia): string {
  const fechaFirma = datos.fechaFirma ? formatearFecha(datos.fechaFirma) : formatearFecha(new Date());
  const lugarFirma = datos.firmadoEn || datos.inmueble.municipio;
  
  let contrato = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║            CONTRATO DE ARRENDAMIENTO POR TEMPORADA                           ║
║                    (Artículo 3.2 de la LAU)                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                              REUNIDOS

En ${lugarFirma}, a ${fechaFirma}.

DE UNA PARTE, como ARRENDADOR:
D./Dña. ${datos.arrendador.nombre}, mayor de edad, con DNI/NIE ${datos.arrendador.dni},
y domicilio a efectos de notificaciones en ${datos.arrendador.direccion}.
${datos.arrendador.telefono ? `Teléfono: ${datos.arrendador.telefono}` : ''}
${datos.arrendador.email ? `Email: ${datos.arrendador.email}` : ''}

DE OTRA PARTE, como ARRENDATARIO:
D./Dña. ${datos.arrendatario.nombre}, mayor de edad, ${datos.arrendatario.nacionalidad ? `de nacionalidad ${datos.arrendatario.nacionalidad}, ` : ''}
con DNI/NIE/Pasaporte ${datos.arrendatario.dni}, y domicilio a efectos de notificaciones en ${datos.arrendatario.direccion}.
${datos.arrendatario.telefono ? `Teléfono: ${datos.arrendatario.telefono}` : ''}
${datos.arrendatario.email ? `Email: ${datos.arrendatario.email}` : ''}

Reconociéndose ambas partes la capacidad legal necesaria para este acto,

                              EXPONEN

PRIMERO.- Que el arrendador es propietario del inmueble sito en:

    Dirección: ${datos.inmueble.direccion}
    Municipio: ${datos.inmueble.municipio}
    Provincia: ${datos.inmueble.provincia}
    Código Postal: ${datos.inmueble.codigoPostal}
    ${datos.inmueble.referenciaCatastral ? `Referencia Catastral: ${datos.inmueble.referenciaCatastral}` : ''}
    ${datos.inmueble.superficie ? `Superficie: ${datos.inmueble.superficie} m²` : ''}
    ${datos.inmueble.habitaciones ? `Habitaciones: ${datos.inmueble.habitaciones}` : ''}
    ${datos.inmueble.banos ? `Baños: ${datos.inmueble.banos}` : ''}
    Estado: ${datos.inmueble.amueblado ? 'Amueblado' : 'Sin amueblar'}

${datos.inmueble.descripcion ? `Descripción: ${datos.inmueble.descripcion}` : ''}

SEGUNDO.- Que el arrendatario está interesado en arrendar la vivienda mencionada EXCLUSIVAMENTE 
para uso de RESIDENCIA TEMPORAL, motivado por:

    MOTIVO DE TEMPORALIDAD: ${datos.motivoTemporalidad.toUpperCase()}
    
    Descripción: ${datos.descripcionMotivo}

TERCERO.- Que ambas partes desean formalizar el presente contrato de ARRENDAMIENTO POR TEMPORADA 
al amparo del artículo 3.2 de la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos (LAU), 
que expresamente excluye la aplicación del régimen de vivienda habitual.

En su virtud, ambas partes acuerdan celebrar el presente contrato con arreglo a las siguientes

                              CLÁUSULAS

═══════════════════════════════════════════════════════════════════════════════
PRIMERA.- OBJETO DEL CONTRATO
═══════════════════════════════════════════════════════════════════════════════

El arrendador cede en arrendamiento al arrendatario la vivienda descrita en el Expositivo 
Primero, para su uso como RESIDENCIA TEMPORAL durante el período indicado en este contrato.

El presente arrendamiento se configura expresamente como ARRENDAMIENTO PARA USO DISTINTO 
DE VIVIENDA HABITUAL (arrendamiento de temporada), al amparo del artículo 3.2 de la LAU, 
dado que el arrendatario tiene su residencia habitual en otro domicilio.

El arrendatario declara conocer y aceptar que este contrato no le otorga los derechos de 
prórroga obligatoria ni demás garantías previstas para los arrendamientos de vivienda 
habitual en los artículos 9 y siguientes de la LAU.

═══════════════════════════════════════════════════════════════════════════════
SEGUNDA.- DURACIÓN DEL CONTRATO
═══════════════════════════════════════════════════════════════════════════════

El arrendamiento tendrá una duración de ${datos.duracionMeses} (${numeroALetras(datos.duracionMeses)}) meses, 
comenzando el día ${formatearFecha(datos.fechaInicio)} y finalizando el día ${formatearFecha(datos.fechaFin)}.

Llegado el término del contrato, éste quedará extinguido automáticamente sin necesidad de 
requerimiento previo, debiendo el arrendatario entregar las llaves y desalojar la vivienda.

Si el arrendatario permaneciera en la vivienda tras la fecha de finalización sin consentimiento 
del arrendador, incurrirá en situación de precario y deberá abonar, en concepto de indemnización, 
una cantidad equivalente al doble de la renta diaria por cada día de ocupación indebida.

${datos.prorrateo ? `
PRORRATEO DE DÍAS:
- Primer mes (prorrateo): ${datos.prorrateo.diasPrimerMes} días = ${formatearDinero(datos.prorrateo.importePrimerMes)}
- Meses completos: ${datos.prorrateo.mesesCompletos} meses = ${formatearDinero(datos.prorrateo.importeMesesCompletos)}
- Último mes (prorrateo): ${datos.prorrateo.diasUltimoMes} días = ${formatearDinero(datos.prorrateo.importeUltimoMes)}
- IMPORTE TOTAL CONTRATO: ${formatearDinero(datos.prorrateo.importeTotal)}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
TERCERA.- RENTA Y FORMA DE PAGO
═══════════════════════════════════════════════════════════════════════════════

3.1. La renta mensual se establece en ${formatearDinero(datos.rentaMensual)} 
(${numeroALetras(Math.floor(datos.rentaMensual))} euros con ${Math.round((datos.rentaMensual % 1) * 100)} céntimos).

3.2. El pago se realizará por mensualidades anticipadas, dentro de los primeros CINCO días 
de cada mes, mediante transferencia bancaria a la cuenta que el arrendador designe.

3.3. El primer pago y el último, si procede, se calcularán proporcionalmente a los días 
efectivos de ocupación (prorrateo).

3.4. El impago de la renta durante QUINCE días será causa de resolución del contrato, 
facultando al arrendador para reclamar las rentas adeudadas más los intereses de demora.

${datos.serviciosIncluidos ? `
═══════════════════════════════════════════════════════════════════════════════
CUARTA.- SERVICIOS Y SUMINISTROS
═══════════════════════════════════════════════════════════════════════════════

${generarClausulaServicios(datos.serviciosIncluidos)}

${datos.limitesConsumo && (datos.limitesConsumo.luz || datos.limitesConsumo.agua || datos.limitesConsumo.gas) ? `
LÍMITES DE CONSUMO INCLUIDOS:
Los servicios incluidos en la renta tienen los siguientes límites mensuales máximos:
${datos.limitesConsumo.luz ? `    • Electricidad: hasta ${formatearDinero(datos.limitesConsumo.luz)}/mes` : ''}
${datos.limitesConsumo.agua ? `    • Agua: hasta ${formatearDinero(datos.limitesConsumo.agua)}/mes` : ''}
${datos.limitesConsumo.gas ? `    • Gas: hasta ${formatearDinero(datos.limitesConsumo.gas)}/mes` : ''}

El exceso sobre estos límites será facturado adicionalmente al arrendatario.
` : ''}
` : `
═══════════════════════════════════════════════════════════════════════════════
CUARTA.- GASTOS Y SUMINISTROS
═══════════════════════════════════════════════════════════════════════════════

Serán de cuenta del arrendatario todos los gastos derivados del consumo de agua, electricidad, 
gas, teléfono, internet y cualquier otro servicio que se contrate para la vivienda.

El arrendatario se compromete a mantener los suministros dados de alta durante la vigencia 
del contrato y a abonar puntualmente las facturas correspondientes.
`}

═══════════════════════════════════════════════════════════════════════════════
QUINTA.- FIANZA Y DEPÓSITOS
═══════════════════════════════════════════════════════════════════════════════

5.1. FIANZA LEGAL
En cumplimiento del artículo 36 de la LAU, el arrendatario entrega en este acto la cantidad 
de ${formatearDinero(datos.fianza)} (${numeroALetras(Math.floor(datos.fianza))} euros), 
equivalente a ${datos.mesesFianza} (${numeroALetras(datos.mesesFianza)}) mensualidad${datos.mesesFianza > 1 ? 'es' : ''} de renta, 
en concepto de FIANZA LEGAL.

Esta fianza responderá del cumplimiento de las obligaciones del arrendatario y será 
depositada por el arrendador en el organismo correspondiente de la Comunidad Autónoma.

5.2. DEVOLUCIÓN DE LA FIANZA
La fianza será devuelta al arrendatario en el plazo máximo de UN MES desde la entrega de 
las llaves, previa verificación del estado de la vivienda y sus enseres, y siempre que:
    a) No existan rentas o cantidades pendientes de pago.
    b) La vivienda se entregue en el mismo estado en que se recibió, salvo el desgaste 
       normal por uso ordinario.
    c) Se hayan abonado todos los suministros hasta la fecha de salida.

${datos.depositoSuministros ? `
5.3. DEPÓSITO ADICIONAL PARA SUMINISTROS
El arrendatario entrega adicionalmente ${formatearDinero(datos.depositoSuministros)} 
como garantía para el pago de suministros. Esta cantidad será devuelta una vez verificado 
que no existen deudas pendientes por consumos.
` : ''}

═══════════════════════════════════════════════════════════════════════════════
SEXTA.- INVENTARIO DE ENTRADA Y SALIDA
═══════════════════════════════════════════════════════════════════════════════

6.1. INVENTARIO DE ENTRADA
Antes de la entrega de llaves, se realizará un inventario detallado del mobiliario, 
electrodomésticos y estado general de la vivienda, que se adjuntará como ANEXO I a este contrato.

El inventario incluirá fotografías del estado de los elementos y las lecturas de contadores.

6.2. INVENTARIO DE SALIDA
A la finalización del contrato, se realizará un nuevo inventario para comparar el estado 
de la vivienda con el inventario de entrada.

6.3. RESPONSABILIDAD POR DAÑOS
El arrendatario responderá de los daños que se produzcan en la vivienda o sus elementos 
más allá del desgaste normal por uso ordinario. El importe de los daños podrá ser deducido 
de la fianza.

═══════════════════════════════════════════════════════════════════════════════
SÉPTIMA.- DESISTIMIENTO Y RESOLUCIÓN ANTICIPADA
═══════════════════════════════════════════════════════════════════════════════

7.1. PREAVISO
Cualquiera de las partes podrá dar por terminado el contrato antes de su vencimiento, 
debiendo comunicarlo a la otra parte con un preaviso mínimo de ${datos.diasPreaviso} 
(${numeroALetras(datos.diasPreaviso)}) días de antelación.

7.2. PENALIZACIÓN POR DESISTIMIENTO DEL ARRENDATARIO
Si el arrendatario desiste del contrato antes de su vencimiento, deberá abonar al 
arrendador una indemnización equivalente al ${datos.penalizacionDesistimiento}% de las 
rentas correspondientes al tiempo que reste hasta la finalización pactada.

7.3. CAUSAS DE RESOLUCIÓN
Serán causa de resolución del contrato:
    a) El impago de la renta o cantidades asimiladas.
    b) El subarriendo o cesión no consentidos.
    c) La realización de obras no autorizadas.
    d) El uso de la vivienda para fines distintos al pactado.
    e) El incumplimiento de las normas de convivencia de la comunidad.

═══════════════════════════════════════════════════════════════════════════════
OCTAVA.- OBLIGACIONES DEL ARRENDATARIO
═══════════════════════════════════════════════════════════════════════════════

El arrendatario se obliga a:

8.1. Destinar la vivienda exclusivamente al uso de residencia temporal personal, 
no pudiendo subarrendarla ni cederla total o parcialmente.

8.2. Mantener la vivienda en buen estado de conservación, realizando las pequeñas 
reparaciones que exija el desgaste por uso ordinario.

8.3. Comunicar al arrendador cualquier desperfecto o avería que requiera reparación.

8.4. No realizar obras ni modificaciones sin autorización escrita del arrendador.

8.5. Permitir el acceso del arrendador para la realización de reparaciones urgentes 
o para comprobar el estado de la vivienda, previo aviso con 24 horas de antelación.

8.6. Respetar las normas de convivencia de la comunidad de propietarios.

8.7. No ejercer en la vivienda ninguna actividad molesta, insalubre, nociva o peligrosa.

═══════════════════════════════════════════════════════════════════════════════
NOVENA.- OBLIGACIONES DEL ARRENDADOR
═══════════════════════════════════════════════════════════════════════════════

El arrendador se obliga a:

9.1. Entregar la vivienda en condiciones de habitabilidad.

9.2. Realizar las reparaciones necesarias para conservar la vivienda en condiciones 
de habitabilidad, salvo las derivadas del mal uso por el arrendatario.

9.3. Mantener al arrendatario en el goce pacífico de la vivienda.

9.4. No perturbar al arrendatario en el uso de la vivienda.

═══════════════════════════════════════════════════════════════════════════════
DÉCIMA.- RÉGIMEN LEGAL APLICABLE
═══════════════════════════════════════════════════════════════════════════════

El presente contrato se rige por:
    1. Lo pactado en este documento.
    2. El artículo 3.2 de la Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos.
    3. El Código Civil.

Queda expresamente excluida la aplicación del régimen de arrendamiento de vivienda habitual 
(Título II de la LAU), dado el carácter temporal del presente arrendamiento.

═══════════════════════════════════════════════════════════════════════════════
UNDÉCIMA.- JURISDICCIÓN Y COMPETENCIA
═══════════════════════════════════════════════════════════════════════════════

Para cualquier controversia que pudiera derivarse del presente contrato, ambas partes, 
con renuncia expresa a cualquier otro fuero que pudiera corresponderles, se someten 
a los Juzgados y Tribunales del lugar donde radica la vivienda arrendada.

${datos.clausulasAdicionales ? `
═══════════════════════════════════════════════════════════════════════════════
DUODÉCIMA.- CLÁUSULAS ADICIONALES
═══════════════════════════════════════════════════════════════════════════════

${datos.clausulasAdicionales}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
CLÁUSULA FINAL
═══════════════════════════════════════════════════════════════════════════════

Y en prueba de conformidad con todo lo expuesto, ambas partes firman el presente 
contrato por duplicado ejemplar y a un solo efecto, en el lugar y fecha arriba indicados.


                    ___________________________          ___________________________
                          EL ARRENDADOR                        EL ARRENDATARIO
                    D./Dña. ${datos.arrendador.nombre.substring(0, 20)}          D./Dña. ${datos.arrendatario.nombre.substring(0, 20)}




═══════════════════════════════════════════════════════════════════════════════
ANEXOS
═══════════════════════════════════════════════════════════════════════════════

□ ANEXO I: Inventario de entrada (a adjuntar)
□ ANEXO II: Fotografías del estado de la vivienda (a adjuntar)
□ ANEXO III: Lecturas de contadores (a adjuntar)
□ ANEXO IV: Normas de convivencia (si aplica)

═══════════════════════════════════════════════════════════════════════════════

                     DOCUMENTO GENERADO POR INMOVA APP
                           www.inmovaapp.com

═══════════════════════════════════════════════════════════════════════════════
`;

  return contrato;
}

/**
 * Genera versión HTML del contrato para PDF
 */
export function generarContratoMediaEstanciaHTML(datos: DatosContratoMediaEstancia): string {
  const textoPlano = generarContratoMediaEstancia(datos);
  
  // Convertir a HTML básico
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Contrato de Arrendamiento por Temporada</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.6;
      margin: 40px;
      color: #333;
    }
    pre {
      font-family: 'Georgia', serif;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    h1 {
      text-align: center;
      font-size: 16pt;
      margin-bottom: 30px;
    }
    .firma {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .firma-box {
      width: 40%;
      text-align: center;
      border-top: 1px solid #333;
      padding-top: 10px;
    }
    @media print {
      body { margin: 20mm; }
    }
  </style>
</head>
<body>
  <pre>${textoPlano}</pre>
</body>
</html>
`;

  return html;
}

export default {
  generarContratoMediaEstancia,
  generarContratoMediaEstanciaHTML,
};

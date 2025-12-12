// Sistema de Templates de Contratos

interface ContractData {
  landlord: {
    name: string;
    dni: string;
    address: string;
    email: string;
    phone: string;
  };
  tenant: {
    name: string;
    dni: string;
    address: string;
    email: string;
    phone: string;
  };
  property: {
    address: string;
    type: string;
    area: number;
    floor?: string;
    number: string;
  };
  terms: {
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    deposit: number;
    paymentDay: number;
    includesUtilities: boolean;
    utilities?: string[];
  };
  additionalClauses?: string[];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function generateResidentialContract(data: ContractData): string {
  const duration = Math.round(
    (data.terms.endDate.getTime() - data.terms.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return `
CONTRATO DE ARRENDAMIENTO DE VIVIENDA

En ${data.property.address}, a ${formatDate(new Date())}

REUNIDOS

De una parte, ${data.landlord.name}, mayor de edad, con DNI ${data.landlord.dni}, y domicilio en ${data.landlord.address}, en calidad de ARRENDADOR.

De otra parte, ${data.tenant.name}, mayor de edad, con DNI ${data.tenant.dni}, y domicilio en ${data.tenant.address}, en calidad de ARRENDATARIO.

Ambas partes se reconocen la capacidad legal necesaria para la celebración del presente contrato y, a tal efecto,

EXPONEN

I. Que el ARRENDADOR es propietario de la vivienda sita en ${data.property.address}, ${data.property.floor ? `planta ${data.property.floor},` : ''} puerta ${data.property.number}, con una superficie aproximada de ${data.property.area} m².

II. Que el ARRENDADOR desea arrendar dicha vivienda y el ARRENDATARIO desea tomarla en arrendamiento para destinarla a vivienda habitual.

III. Que ambas partes han convenido celebrar el presente contrato de arrendamiento con arreglo a las siguientes

CLÁUSULAS

PRIMERA.- OBJETO DEL CONTRATO
El ARRENDADOR arrienda al ARRENDATARIO la vivienda descrita en el Expositivo I, para destinarla exclusivamente a vivienda habitual del ARRENDATARIO.

SEGUNDA.- DURACIÓN
El presente contrato tendrá una duración de ${duration} meses, comenzando el ${formatDate(data.terms.startDate)} y finalizando el ${formatDate(data.terms.endDate)}.

De conformidad con el artículo 9 de la Ley 29/1994, si llegado el día del vencimiento ninguna de las partes hubiese notificado a la otra, al menos con 30 días de antelación, su voluntad de no renovarlo, el contrato se prorrogará obligatoriamente por plazos anuales hasta que el arrendamiento alcance una duración mínima de 5 años.

TERCERA.- RENTA
La renta mensual se fija en ${formatCurrency(data.terms.monthlyRent)}, que el ARRENDATARIO deberá pagar por anticipado dentro de los primeros ${data.terms.paymentDay} días de cada mes mediante transferencia bancaria a la cuenta indicada por el ARRENDADOR.

${data.terms.includesUtilities ? `La renta incluye los siguientes gastos: ${data.terms.utilities?.join(', ')}.` : 'La renta no incluye gastos de suministros (agua, luz, gas, internet), que correrán por cuenta del ARRENDATARIO.'}

CUARTA.- ACTUALIZACIÓN DE LA RENTA
La renta se actualizará anualmente conforme a la variación porcentual experimentada por el Índice de Precios al Consumo, de acuerdo con lo establecido en el artículo 18 de la LAU.

QUINTA.- FIANZA
El ARRENDATARIO entrega en este acto al ARRENDADOR, en concepto de fianza, la cantidad de ${formatCurrency(data.terms.deposit)}, equivalente a ${data.terms.deposit / data.terms.monthlyRent} mensualidades de renta.

La fianza se destina a responder de las obligaciones del arrendatario y deberá ser devuelta al término del contrato, una vez comprobado el buen estado de la vivienda y descontadas, en su caso, las cantidades que el arrendatario deba al arrendador.

SEXTA.- GASTOS GENERALES
Serán de cuenta del ARRENDATARIO los gastos por suministros y servicios individualizados (electricidad, agua, gas, teléfono, internet) así como la tasa de basuras.

Serán de cuenta del ARRENDADOR los gastos generales del inmueble (gastos de comunidad, IBI, seguro del edificio).

SÉPTIMA.- OBRAS Y CONSERVACIÓN
El ARRENDATARIO se obliga a conservar la vivienda en buen estado, debiendo realizar a su costa las pequeñas reparaciones que exija el desgaste por el uso ordinario de la vivienda.

Las obras de conservación necesarias para mantener la vivienda en condiciones de habitabilidad correrán a cargo del ARRENDADOR, salvo que el deterioro sea imputable al ARRENDATARIO.

OCTAVA.- RESOLUCIÓN DEL CONTRATO
El incumplimiento de cualquiera de las obligaciones establecidas en el presente contrato facultará a la parte cumplidora para exigir su resolución, con derecho a indemnización de daños y perjuicios.

NOVENA.- USO DE LA VIVIENDA
El ARRENDATARIO se compromete a:
- Destinar la vivienda exclusivamente a su residencia habitual.
- No realizar actividades molestas, insalubres, nocivas o peligrosas.
- No realizar obras sin consentimiento escrito del ARRENDADOR.
- Comunicar inmediatamente cualquier daño o desperfecto que se produzca en la vivienda.
- Respetar las normas de la comunidad de propietarios.

DÉCIMA.- PROTECCIÓN DE DATOS
Las partes se comprometen a tratar los datos personales del presente contrato conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos.

${data.additionalClauses && data.additionalClauses.length > 0 ? `
CLÁUSULAS ADICIONALES
${data.additionalClauses.map((clause, idx) => `${idx + 11}.- ${clause}`).join('\n\n')}
` : ''}

Y en prueba de conformidad, ambas partes firman el presente contrato por duplicado en el lugar y fecha indicados en el encabezamiento.


EL ARRENDADOR                                    EL ARRENDATARIO


_____________________                            _____________________
${data.landlord.name}                           ${data.tenant.name}
DNI: ${data.landlord.dni}                      DNI: ${data.tenant.dni}


---
Contrato generado automáticamente por INMOVA
Fecha de generación: ${formatDate(new Date())}
  `.trim();
}

export function generateCommercialContract(data: ContractData): string {
  const duration = Math.round(
    (data.terms.endDate.getTime() - data.terms.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return `
CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL

En ${data.property.address}, a ${formatDate(new Date())}

REUNIDOS

De una parte, ${data.landlord.name}, mayor de edad, con DNI ${data.landlord.dni}, y domicilio en ${data.landlord.address}, en calidad de ARRENDADOR.

De otra parte, ${data.tenant.name}, mayor de edad, con DNI ${data.tenant.dni}, y domicilio en ${data.tenant.address}, en calidad de ARRENDATARIO.

Ambas partes se reconocen la capacidad legal necesaria para la celebración del presente contrato y, a tal efecto,

EXPONEN

I. Que el ARRENDADOR es propietario del local comercial sito en ${data.property.address}, ${data.property.floor ? `planta ${data.property.floor},` : ''} local ${data.property.number}, con una superficie aproximada de ${data.property.area} m².

II. Que el ARRENDADOR desea arrendar dicho local y el ARRENDATARIO desea tomarlo en arrendamiento para el ejercicio de su actividad comercial o profesional.

III. Que ambas partes han convenido celebrar el presente contrato de arrendamiento para uso distinto del de vivienda, con arreglo a las siguientes

CLÁUSULAS

PRIMERA.- OBJETO Y DESTINO
El ARRENDADOR arrienda al ARRENDATARIO el local descrito en el Expositivo I, para destinarlo exclusivamente al ejercicio de actividad comercial o profesional.

El ARRENDATARIO declara que el local se destinará a la actividad de: ___________________________

SEGUNDA.- DURACIÓN
El presente contrato tendrá una duración de ${duration} meses, comenzando el ${formatDate(data.terms.startDate)} y finalizando el ${formatDate(data.terms.endDate)}.

A la finalización del plazo pactado, el contrato quedará extinguido, salvo que las partes acuerden expresamente su prórroga.

TERCERA.- RENTA Y FORMA DE PAGO
La renta mensual se fija en ${formatCurrency(data.terms.monthlyRent)}, que el ARRENDATARIO deberá pagar por anticipado dentro de los primeros ${data.terms.paymentDay} días de cada mes mediante transferencia bancaria.

La renta NO incluye:
- Gastos de comunidad
- Suministros (agua, luz, gas)
- Impuestos y tasas derivados de la actividad

CUARTA.- ACTUALIZACIÓN DE LA RENTA
La renta se actualizará anualmente aplicando la variación del IPC del ejercicio anterior, con un máximo del 3% anual.

QUINTA.- FIANZA
El ARRENDATARIO entrega al ARRENDADOR, en concepto de fianza, la cantidad de ${formatCurrency(data.terms.deposit)}, equivalente a ${data.terms.deposit / data.terms.monthlyRent} mensualidades de renta.

La fianza deberá depositarse en el organismo oficial correspondiente según la normativa autonómica aplicable.

SEXTA.- OBRAS Y ADAPTACIONES
El ARRENDATARIO podrá realizar las obras necesarias para adaptar el local a su actividad, previa comunicación y autorización escrita del ARRENDADOR.

Al finalizar el contrato, el ARRENDATARIO deberá devolver el local en las mismas condiciones en que lo recibió, salvo el desgaste normal por el uso.

SÉPTIMA.- LICENCIAS Y AUTORIZACIONES
Será responsabilidad del ARRENDATARIO obtener todas las licencias, permisos y autorizaciones necesarias para el ejercicio de su actividad.

OCTAVA.- GASTOS
Serán de cuenta del ARRENDATARIO:
- Gastos de comunidad
- Todos los suministros (agua, luz, gas, teléfono, internet)
- Tasas e impuestos derivados de su actividad
- Gastos de mantenimiento ordinario

Serán de cuenta del ARRENDADOR:
- IBI del inmueble
- Seguro del edificio
- Reparaciones estructurales

NOVENA.- SUBARRIENDO Y CESIÓN
Queda prohibido el subarriendo total o parcial del local, así como la cesión del contrato a terceros, sin el consentimiento expreso y por escrito del ARRENDADOR.

DÉCIMA.- RESOLUCIÓN
Serán causas de resolución del contrato:
- Falta de pago de la renta o cantidades asimiladas
- Destinar el local a uso distinto del pactado
- Realizar obras no autorizadas
- Subarriendo o cesión no autorizada
- Causar daños graves o realizar actividades ilícitas

UNDÉCIMA.- SEGURO
El ARRENDATARIO se obliga a mantener un seguro de responsabilidad civil que cubra los posibles daños que pudieran derivarse del ejercicio de su actividad.

${data.additionalClauses && data.additionalClauses.length > 0 ? `
CLÁUSULAS ADICIONALES
${data.additionalClauses.map((clause, idx) => `${idx + 12}.- ${clause}`).join('\n\n')}
` : ''}

Y en prueba de conformidad, ambas partes firman el presente contrato por duplicado en el lugar y fecha indicados en el encabezamiento.


EL ARRENDADOR                                    EL ARRENDATARIO


_____________________                            _____________________
${data.landlord.name}                           ${data.tenant.name}
DNI: ${data.landlord.dni}                      DNI: ${data.tenant.dni}


---
Contrato generado automáticamente por INMOVA
Fecha de generación: ${formatDate(new Date())}
  `.trim();
}

export function generateColivingContract(data: ContractData): string {
  const duration = Math.round(
    (data.terms.endDate.getTime() - data.terms.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return `
CONTRATO DE ARRENDAMIENTO DE HABITACIÓN - COLIVING

En ${data.property.address}, a ${formatDate(new Date())}

REUNIDOS

De una parte, ${data.landlord.name}, mayor de edad, con DNI ${data.landlord.dni}, y domicilio en ${data.landlord.address}, en calidad de ARRENDADOR.

De otra parte, ${data.tenant.name}, mayor de edad, con DNI ${data.tenant.dni}, y domicilio en ${data.tenant.address}, en calidad de ARRENDATARIO.

Ambas partes se reconocen la capacidad legal necesaria para la celebración del presente contrato y, a tal efecto,

EXPONEN

I. Que el ARRENDADOR es titular del espacio coliving ubicado en ${data.property.address}.

II. Que el ARRENDADOR desea arrendar una habitación individual dentro del espacio coliving y el ARRENDATARIO desea tomarla en arrendamiento para su residencia habitual.

III. Que ambas partes han convenido celebrar el presente contrato de arrendamiento con arreglo a las siguientes

CLÁUSULAS

PRIMERA.- OBJETO DEL CONTRATO
El ARRENDADOR arrienda al ARRENDATARIO:
- Habitación ${data.property.number} de aproximadamente ${data.property.area} m²
- Uso compartido de espacios comunes (cocina, baño, salón, lavandería)
- Acceso a servicios comunitarios

SEGUNDA.- DURACIÓN Y RENOVACIÓN
El presente contrato tendrá una duración de ${duration} meses, comenzando el ${formatDate(data.terms.startDate)} y finalizando el ${formatDate(data.terms.endDate)}.

El contrato se renovará automáticamente por periodos mensuales, salvo que cualquiera de las partes notifique su intención de no renovar con al menos 30 días de antelación.

TERCERA.- RENTA Y SERVICIOS INCLUIDOS
La renta mensual es de ${formatCurrency(data.terms.monthlyRent)}, pagadera por adelantado dentro de los primeros ${data.terms.paymentDay} días de cada mes.

LA RENTA INCLUYE:
- Uso de la habitación privada
- Uso de espacios comunes
- Suministros básicos (agua, luz, gas, calefacción)
- Internet de alta velocidad
- Limpieza de zonas comunes (semanal)
- Acceso a amenidades (gimnasio, coworking, etc.)
${data.terms.utilities && data.terms.utilities.length > 0 ? `- ${data.terms.utilities.join('\n- ')}` : ''}

CUARTA.- FIANZA
El ARRENDATARIO entrega en concepto de fianza ${formatCurrency(data.terms.deposit)}, que será devuelta al finalizar el contrato, descontando posibles daños o deudas pendientes.

QUINTA.- NORMAS DE CONVIVENCIA
El ARRENDATARIO se compromete a:
- Respetar el descanso de los demás residentes (silencio 23:00 - 08:00)
- Mantener limpios y ordenados los espacios comunes
- No fumar en espacios cerrados
- No realizar fiestas sin autorización previa
- Limitar las visitas a horarios razonables
- Participar en el sistema de rotación de tareas domésticas
- Reportar inmediatamente cualquier desperfecto

SEXTA.- ESPACIOS COMUNES
Los espacios comunes son de uso compartido y deben ser tratados con respeto:
- Cocina: Limpiar inmediatamente después de usar
- Baños: Respetar turnos y tiempos de uso
- Lavandería: Reservar turno mediante la app
- Coworking: Respetar espacios de trabajo silenciosos

SÉPTIMA.- COMUNIDAD Y EVENTOS
El ARRENDATARIO tendrá acceso a:
- Eventos comunitarios mensuales
- Red social interna del coliving
- Programa de networking profesional
- Actividades de bienestar y desarrollo personal

OCTAVA.- NORMAS DE SEGURIDAD
- Acceso mediante llave/código personal intransferible
- Prohibido facilitar acceso a personas no autorizadas
- Cámaras de seguridad en zonas comunes (no en habitaciones)
- Sistema de alarma y emergencia 24/7

NOVENA.- MANTENIMIENTO Y REPARACIONES
- Mantenimiento preventivo mensual de instalaciones
- Reparaciones urgentes en menos de 24 horas
- El ARRENDATARIO debe reportar desperfectos mediante la app
- Daños por mal uso serán cargados al responsable

DÉCIMA.- RESOLUCIÓN
El contrato podrá resolverse:
- Por cualquiera de las partes con 30 días de preaviso
- Por incumplimiento grave de las normas de convivencia
- Por falta de pago de 2 mensualidades
- Por conductas que perturben la convivencia

UNDÉCIMA.- COMUNIDAD DIGITAL
El ARRENDATARIO tendrá acceso a la plataforma digital del coliving para:
- Comunicación con otros residentes
- Reserva de espacios y servicios
- Reportes de mantenimiento
- Pago de renta online
- Acceso a eventos y actividades

${data.additionalClauses && data.additionalClauses.length > 0 ? `
CLÁUSULAS ADICIONALES
${data.additionalClauses.map((clause, idx) => `${idx + 12}.- ${clause}`).join('\n\n')}
` : ''}

Y en prueba de conformidad, ambas partes firman el presente contrato por duplicado en el lugar y fecha indicados en el encabezamiento.


EL ARRENDADOR                                    EL ARRENDATARIO


_____________________                            _____________________
${data.landlord.name}                           ${data.tenant.name}
DNI: ${data.landlord.dni}                      DNI: ${data.tenant.dni}


---
Contrato generado automáticamente por INMOVA
Fecha de generación: ${formatDate(new Date())}
  `.trim();
}

export function generateContractByType(type: 'residential' | 'commercial' | 'coliving', data: ContractData): string {
  switch (type) {
    case 'residential':
      return generateResidentialContract(data);
    case 'commercial':
      return generateCommercialContract(data);
    case 'coliving':
      return generateColivingContract(data);
    default:
      return generateResidentialContract(data);
  }
}

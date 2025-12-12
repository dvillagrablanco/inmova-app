/**
 * Script de seed para el módulo de Equipo Comercial Externo
 * 
 * Ejecutar con: yarn ts-node scripts/seed-sales-team.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSalesTeam() {
  console.log('🚀 Iniciando seed del Equipo Comercial Externo...\n');

  try {
    // Crear 3 comerciales de prueba
    const comerciales = [
      {
        nombre: 'Carlos',
        apellidos: 'Rodríguez García',
        dni: '12345678A',
        email: 'carlos.rodriguez@comercial.com',
        telefono: '+34 600 111 222',
        password: await bcrypt.hash('comercial123', 10),
        iban: 'ES12 0000 0000 0000 0000 0001',
        direccion: 'Calle Mayor 123',
        ciudad: 'Madrid',
        codigoPostal: '28001',
        comisionCaptacion: 200.0,
        comisionRecurrente: 12.0,
        bonificacionObjetivo: 600.0,
        objetivoLeadsMes: 15,
        objetivoConversionesMes: 3,
      },
      {
        nombre: 'María',
        apellidos: 'González López',
        dni: '87654321B',
        email: 'maria.gonzalez@comercial.com',
        telefono: '+34 600 333 444',
        password: await bcrypt.hash('comercial123', 10),
        iban: 'ES12 0000 0000 0000 0000 0002',
        direccion: 'Avenida Diagonal 456',
        ciudad: 'Barcelona',
        codigoPostal: '08001',
        comisionCaptacion: 180.0,
        comisionRecurrente: 11.0,
        bonificacionObjetivo: 550.0,
        objetivoLeadsMes: 12,
        objetivoConversionesMes: 2,
      },
      {
        nombre: 'Juan',
        apellidos: 'Martínez Sánchez',
        dni: '11223344C',
        email: 'juan.martinez@comercial.com',
        telefono: '+34 600 555 666',
        password: await bcrypt.hash('comercial123', 10),
        iban: 'ES12 0000 0000 0000 0000 0003',
        direccion: 'Plaza España 789',
        ciudad: 'Valencia',
        codigoPostal: '46001',
        comisionCaptacion: 150.0,
        comisionRecurrente: 10.0,
        bonificacionObjetivo: 500.0,
        objetivoLeadsMes: 10,
        objetivoConversionesMes: 2,
      },
    ];

    const createdSalesReps = [];

    for (const comercialData of comerciales) {
      const nombreLimpio = comercialData.nombre.toUpperCase().replace(/[^A-Z]/g, '');
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const codigoReferido = `COM-${nombreLimpio}-${year}-${random}`;

      const comercial = await prisma.salesRepresentative.create({
        data: {
          ...comercialData,
          nombreCompleto: `${comercialData.nombre} ${comercialData.apellidos}`,
          codigoReferido,
        },
      });

      console.log(`✅ Comercial creado: ${comercial.nombreCompleto} (${comercial.codigoReferido})`);
      createdSalesReps.push(comercial);
    }

    console.log('\n📋 Creando leads de ejemplo...\n');

    // Crear leads para cada comercial
    const leadEstados = ['NUEVO', 'CONTACTADO', 'CALIFICADO', 'DEMO', 'PROPUESTA'];
    const origenesCaptura = ['linkedin', 'evento', 'referido', 'cold_call', 'email'];
    const prioridades = ['baja', 'media', 'alta'];

    for (const salesRep of createdSalesReps) {
      // Crear 5 leads por comercial
      for (let i = 0; i < 5; i++) {
        const lead = await prisma.salesLead.create({
          data: {
            salesRepId: salesRep.id,
            nombreContacto: `Contacto ${i + 1} - ${salesRep.nombre}`,
            emailContacto: `contacto${i + 1}.${salesRep.email.split('@')[0]}@empresa.com`,
            telefonoContacto: `+34 600 ${Math.floor(100000 + Math.random() * 900000)}`,
            nombreEmpresa: `Empresa ${i + 1} S.L.`,
            sector: i % 2 === 0 ? 'Inmobiliario' : 'Hoteles',
            tipoCliente: i % 3 === 0 ? 'alquiler_tradicional' : i % 3 === 1 ? 'str_vacacional' : 'coliving',
            propiedadesEstimadas: Math.floor(5 + Math.random() * 45),
            presupuestoMensual: Math.floor(200 + Math.random() * 800),
            estado: leadEstados[i % leadEstados.length] as any,
            prioridad: prioridades[i % prioridades.length],
            origenCaptura: origenesCaptura[i % origenesCaptura.length],
            fechaCaptura: new Date(),
            fechaPrimerContacto: i > 0 ? new Date() : undefined,
            numeroLlamadas: i,
            numeroEmails: i * 2,
          },
        });

        console.log(`  📞 Lead creado: ${lead.nombreEmpresa} - Estado: ${lead.estado}`);
      }

      // Actualizar métricas del comercial
      await prisma.salesRepresentative.update({
        where: { id: salesRep.id },
        data: {
          totalLeadsGenerados: 5,
          tasaConversion: 0,
        },
      });
    }

    console.log('\n💰 Creando comisiones de ejemplo...\n');

    // Crear algunas comisiones pendientes
    for (const salesRep of createdSalesReps.slice(0, 2)) {
      const comision = await prisma.salesCommission.create({
        data: {
          salesRepId: salesRep.id,
          tipo: 'CAPTACION',
          descripcion: `Comisión por captación de cliente ejemplo`,
          montoBase: 500,
          montoComision: salesRep.comisionCaptacion,
          retencionIRPF: salesRep.comisionCaptacion * 0.15,
          montoNeto: salesRep.comisionCaptacion * 0.85,
          estado: 'PENDIENTE',
        },
      });

      console.log(`  💶 Comisión creada: ${comision.descripcion} - ${comision.montoNeto}€ (${comision.estado})`);
    }

    console.log('\n🎯 Creando objetivos mensuales...\n');

    // Crear objetivos para el mes actual
    const today = new Date();
    const periodo = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const fechaInicio = new Date(today.getFullYear(), today.getMonth(), 1);
    const fechaFin = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    for (const salesRep of createdSalesReps) {
      const objetivo = await prisma.salesTarget.create({
        data: {
          salesRepId: salesRep.id,
          periodo,
          tipoObjetivo: 'mensual',
          objetivoLeads: salesRep.objetivoLeadsMes,
          objetivoConversiones: salesRep.objetivoConversionesMes,
          objetivoMRR: salesRep.objetivoConversionesMes * 250,
          leadsGenerados: 5,
          conversionesLogradas: 0,
          mrrGenerado: 0,
          porcentajeLeads: (5 / salesRep.objetivoLeadsMes) * 100,
          porcentajeConversiones: 0,
          porcentajeMRR: 0,
          fechaInicio,
          fechaFin,
        },
      });

      console.log(`  🎯 Objetivo creado para ${salesRep.nombreCompleto} - Periodo: ${periodo}`);
    }

    console.log('\n✨ Seed completado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - Comerciales creados: ${createdSalesReps.length}`);
    console.log(`   - Leads creados: ${createdSalesReps.length * 5}`);
    console.log(`   - Comisiones creadas: 2`);
    console.log(`   - Objetivos creados: ${createdSalesReps.length}`);
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Email: carlos.rodriguez@comercial.com');
    console.log('   Contraseña: comercial123\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSalesTeam()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

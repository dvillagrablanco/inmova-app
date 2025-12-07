import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission, forbiddenResponse } from '@/lib/permissions';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface PropertyReport {
  id: string;
  nombre: string;
  direccion: string;
  ingresosBrutos: number;
  gastos: number;
  ingresosNetos: number;
  rentabilidadBruta: number;
  rentabilidadNeta: number;
  roi: number;
  unidades: number;
  unidadesOcupadas: number;
  tasaOcupacion: number;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    
    // Verificar permiso de visualización de reportes
    if (user.role === 'operador') {
      return forbiddenResponse('No tienes permiso para ver reportes financieros');
    }
    
    const companyId = user.companyId;

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'global'; // global, por_propiedad, flujo_caja
    const periodo = searchParams.get('periodo') || '12'; // meses

    const meses = parseInt(periodo);
    const now = new Date();
    const fechaInicio = new Date(now);
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);

    // Obtener todos los edificios con sus relaciones filtrados por empresa
    const buildings = await prisma.building.findMany({
      where: { companyId },
      include: {
        units: {
          include: {
            contracts: {
              include: {
                payments: true,
              },
            },
          },
        },
        expenses: true,
      },
    });

    if (tipo === 'por_propiedad') {
      // Reporte por propiedad
      const reportes: PropertyReport[] = buildings.map((building) => {
        const unidades = building.units.length;
        const unidadesOcupadas = building.units.filter((u) => u.estado === 'ocupada').length;
        const tasaOcupacion = unidades > 0 ? (unidadesOcupadas / unidades) * 100 : 0;

        // Calcular ingresos de pagos
        let ingresosBrutos = 0;
        building.units.forEach((unit) => {
          unit.contracts.forEach((contract) => {
            contract.payments.forEach((payment) => {
              const paymentDate = new Date(payment.fechaVencimiento);
              if (payment.estado === 'pagado' && paymentDate >= fechaInicio) {
                ingresosBrutos += payment.monto;
              }
            });
          });
        });

        // Calcular gastos
        const gastos = building.expenses
          .filter((e) => new Date(e.fecha) >= fechaInicio)
          .reduce((sum, e) => sum + e.monto, 0);

        const ingresosNetos = ingresosBrutos - gastos;
        const rentabilidadBruta = ingresosBrutos > 0 ? (ingresosBrutos / (ingresosBrutos + gastos)) * 100 : 0;
        const rentabilidadNeta = ingresosBrutos > 0 ? (ingresosNetos / ingresosBrutos) * 100 : 0;

        // ROI simplificado: (Ingresos Netos / Gastos) * 100
        const roi = gastos > 0 ? (ingresosNetos / gastos) * 100 : 0;

        return {
          id: building.id,
          nombre: building.nombre,
          direccion: building.direccion,
          ingresosBrutos: Math.round(ingresosBrutos * 100) / 100,
          gastos: Math.round(gastos * 100) / 100,
          ingresosNetos: Math.round(ingresosNetos * 100) / 100,
          rentabilidadBruta: Math.round(rentabilidadBruta * 10) / 10,
          rentabilidadNeta: Math.round(rentabilidadNeta * 10) / 10,
          roi: Math.round(roi * 10) / 10,
          unidades,
          unidadesOcupadas,
          tasaOcupacion: Math.round(tasaOcupacion * 10) / 10,
        };
      });

      return NextResponse.json({ reportes, periodo: meses });
    }

    if (tipo === 'flujo_caja') {
      // Reporte de flujo de caja mensual
      const flujoCaja: any[] = [];
      for (let i = meses - 1; i >= 0; i--) {
        const mes = new Date(now);
        mes.setMonth(mes.getMonth() - i);
        const mesInicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const mesFin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

        // Ingresos del mes
        let ingresos = 0;
        buildings.forEach((building) => {
          building.units.forEach((unit) => {
            unit.contracts.forEach((contract) => {
              contract.payments.forEach((payment) => {
                const paymentDate = new Date(payment.fechaVencimiento);
                if (
                  payment.estado === 'pagado' &&
                  paymentDate >= mesInicio &&
                  paymentDate <= mesFin
                ) {
                  ingresos += payment.monto;
                }
              });
            });
          });
        });

        // Gastos del mes
        let gastos = 0;
        buildings.forEach((building) => {
          building.expenses.forEach((expense) => {
            const expenseDate = new Date(expense.fecha);
            if (expenseDate >= mesInicio && expenseDate <= mesFin) {
              gastos += expense.monto;
            }
          });
        });

        flujoCaja.push({
          mes: mes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          ingresos: Math.round(ingresos * 100) / 100,
          gastos: Math.round(gastos * 100) / 100,
          neto: Math.round((ingresos - gastos) * 100) / 100,
        });
      }

      return NextResponse.json({ flujoCaja, periodo: meses });
    }

    // Reporte global (por defecto)
    let ingresosBrutosTotal = 0;
    let gastosTotal = 0;
    let unidadesTotal = 0;
    let unidadesOcupadasTotal = 0;

    buildings.forEach((building) => {
      unidadesTotal += building.units.length;
      unidadesOcupadasTotal += building.units.filter((u) => u.estado === 'ocupada').length;

      building.units.forEach((unit) => {
        unit.contracts.forEach((contract) => {
          contract.payments.forEach((payment) => {
            const paymentDate = new Date(payment.fechaVencimiento);
            if (payment.estado === 'pagado' && paymentDate >= fechaInicio) {
              ingresosBrutosTotal += payment.monto;
            }
          });
        });
      });

      building.expenses.forEach((expense) => {
        if (new Date(expense.fecha) >= fechaInicio) {
          gastosTotal += expense.monto;
        }
      });
    });

    const ingresosNetosTotal = ingresosBrutosTotal - gastosTotal;
    const rentabilidadBruta = ingresosBrutosTotal > 0 ? (ingresosBrutosTotal / (ingresosBrutosTotal + gastosTotal)) * 100 : 0;
    const rentabilidadNeta = ingresosBrutosTotal > 0 ? (ingresosNetosTotal / ingresosBrutosTotal) * 100 : 0;
    const roiGlobal = gastosTotal > 0 ? (ingresosNetosTotal / gastosTotal) * 100 : 0;
    const tasaOcupacionGlobal = unidadesTotal > 0 ? (unidadesOcupadasTotal / unidadesTotal) * 100 : 0;

    return NextResponse.json({
      global: {
        ingresosBrutos: Math.round(ingresosBrutosTotal * 100) / 100,
        gastos: Math.round(gastosTotal * 100) / 100,
        ingresosNetos: Math.round(ingresosNetosTotal * 100) / 100,
        rentabilidadBruta: Math.round(rentabilidadBruta * 10) / 10,
        rentabilidadNeta: Math.round(rentabilidadNeta * 10) / 10,
        roi: Math.round(roiGlobal * 10) / 10,
        unidades: unidadesTotal,
        unidadesOcupadas: unidadesOcupadasTotal,
        tasaOcupacion: Math.round(tasaOcupacionGlobal * 10) / 10,
      },
      periodo: meses,
    });
  } catch (error: any) {
    logger.error('Error al generar reportes:', error);
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message?.includes('permiso')) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: 'Error al generar reportes' }, { status: 500 });
  }
}

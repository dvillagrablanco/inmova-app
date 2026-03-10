import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PLANTILLAS_INICIALES = [
  { id: '1', nombre: 'Visita comercial', asunto: 'Visita a su propiedad - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos que hemos programado una visita comercial a la propiedad {{inmueble_direccion}} para el día {{fecha}}.\n\nPor favor, confirme su disponibilidad.', tipo: 'email', evento_trigger: 'manual', activa: true },
  { id: '2', nombre: 'Avería o mantenimiento', asunto: 'Aviso de trabajo de mantenimiento - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos que se realizará un trabajo de mantenimiento en {{inmueble_direccion}} el {{fecha}}.\n\nEl proveedor asignado contactará con usted para coordinar el acceso.', tipo: 'email', evento_trigger: 'automatico', activa: true },
  { id: '3', nombre: 'Salida de compañero de piso', asunto: 'Comunicación: salida de compañero de piso', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos que {{nombre_saliente}} finalizará su estancia en {{inmueble_direccion}} el {{fecha}}.\n\nLos trámites de check-out están en curso.', tipo: 'email', evento_trigger: 'manual', activa: true },
  { id: '4', nombre: 'Entrada de nuevo compañero de piso', asunto: 'Bienvenida nuevo inquilino - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos que {{nombre_entrante}} se incorporará como nuevo inquilino en {{inmueble_direccion}} el {{fecha}}.\n\nRecibirá las instrucciones de check-in por separado.', tipo: 'email', evento_trigger: 'manual', activa: true },
  { id: '5', nombre: 'Suspensión de suministro temporal', asunto: 'Aviso: corte temporal de suministro - {{fecha}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos que el {{fecha}} habrá una suspensión temporal del suministro en {{inmueble_direccion}} por trabajos de la compañía.\n\nHorario aproximado: {{horario}}.', tipo: 'ambos', evento_trigger: 'automatico', activa: true },
  { id: '6', nombre: 'Actualización de renta (comunicación)', asunto: 'Comunicación de actualización de renta', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos que a partir del {{fecha}} la renta de {{inmueble_direccion}} pasará a ser de {{importe}} €/mes.\n\nEl incremento responde a la actualización según IPC.', tipo: 'email', evento_trigger: 'manual', activa: true },
  { id: '7', nombre: 'Actualización de renta puntual', asunto: 'Ajuste puntual de renta - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe comunicamos un ajuste puntual de la renta de {{inmueble_direccion}} para el mes de {{fecha}}.\n\nNuevo importe: {{importe}} €.', tipo: 'email', evento_trigger: 'manual', activa: true },
  { id: '8', nombre: 'Actualización de renta retroactiva', asunto: 'Regularización retroactiva de renta', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLe informamos de una regularización retroactiva de la renta de {{inmueble_direccion}}.\n\nPeriodo: {{periodo}}\nImporte a regularizar: {{importe}} €\nFecha de cargo: {{fecha}}', tipo: 'email', evento_trigger: 'manual', activa: true },
  { id: '9', nombre: 'Check-in', asunto: 'Instrucciones de check-in - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nBienvenido/a. Las instrucciones de check-in para {{inmueble_direccion}} son:\n\n- Fecha: {{fecha}}\n- Hora: {{hora}}\n- Punto de encuentro: {{punto_encuentro}}\n\nPor favor, traiga DNI y copia del contrato firmado.', tipo: 'email', evento_trigger: 'automatico', activa: true },
  { id: '10', nombre: 'Check-out', asunto: 'Instrucciones de check-out - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nLas instrucciones de check-out para {{inmueble_direccion}} son:\n\n- Fecha: {{fecha}}\n- Hora: {{hora}}\n- Entrega de llaves: {{punto_entrega}}\n\nRecuerde dejar el inmueble en las condiciones acordadas.', tipo: 'email', evento_trigger: 'automatico', activa: true },
  { id: '11', nombre: 'Firma de contrato', asunto: 'Firma de contrato de arrendamiento - {{inmueble_direccion}}', cuerpo: 'Estimado/a {{inquilino_nombre}},\n\nSu contrato de arrendamiento para {{inmueble_direccion}} está listo para firma.\n\nRenta: {{importe}} €/mes\nInicio: {{fecha}}\n\nAcceda al enlace de firma digital: {{enlace_firma}}', tipo: 'email', evento_trigger: 'automatico', activa: true },
];

// In-memory store (en producción usar BD)
let plantillas = [...PLANTILLAS_INICIALES];

function renderPreview(cuerpo: string, asunto: string): { cuerpo: string; asunto: string } {
  const vars: Record<string, string> = {
    inquilino_nombre: 'Juan García',
    inmueble_direccion: 'Calle Mayor 123, Piso 1A, Madrid',
    fecha: '15/03/2025',
    importe: '950',
    nombre_saliente: 'María López',
    nombre_entrante: 'Carlos Ruiz',
    horario: '10:00 - 14:00',
    periodo: 'Enero - Marzo 2025',
    hora: '12:00',
    punto_encuentro: 'Portería del edificio',
    punto_entrega: 'Oficina de gestión',
    enlace_firma: 'https://firma.ejemplo.com/abc123',
  };
  let outCuerpo = cuerpo;
  let outAsunto = asunto;
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
    outCuerpo = outCuerpo.replace(re, v);
    outAsunto = outAsunto.replace(re, v);
  }
  return { cuerpo: outCuerpo, asunto: outAsunto };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: plantillas });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { nombre, asunto, cuerpo, tipo, evento_trigger, activa } = body;
    if (!nombre || !asunto || !cuerpo) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    const nueva = {
      id: String(plantillas.length + 1),
      nombre,
      asunto: asunto || '',
      cuerpo: cuerpo || '',
      tipo: tipo || 'email',
      evento_trigger: evento_trigger || 'manual',
      activa: activa !== false,
    };
    plantillas.push(nueva);
    return NextResponse.json({ success: true, data: nueva }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, nombre, asunto, cuerpo, tipo, evento_trigger, activa } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    const idx = plantillas.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }
    if (nombre != null) plantillas[idx].nombre = nombre;
    if (asunto != null) plantillas[idx].asunto = asunto;
    if (cuerpo != null) plantillas[idx].cuerpo = cuerpo;
    if (tipo != null) plantillas[idx].tipo = tipo;
    if (evento_trigger != null) plantillas[idx].evento_trigger = evento_trigger;
    if (activa !== undefined) plantillas[idx].activa = activa;
    return NextResponse.json({ success: true, data: plantillas[idx] });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar plantilla' }, { status: 500 });
  }
}

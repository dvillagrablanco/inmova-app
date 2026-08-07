import { NextRequest, NextResponse } from "next/server";
import { deleteOpportunity, getOpportunity, updateStatus } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const dto = await getOpportunity(params.id);
  if (!dto) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ opportunity: dto });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const dto = await updateStatus(params.id, body.status, body.notes);
    return NextResponse.json({ opportunity: dto });
  } catch (err) {
    console.error("[PATCH /api/opportunities/:id]", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteOpportunity(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/opportunities/:id]", err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

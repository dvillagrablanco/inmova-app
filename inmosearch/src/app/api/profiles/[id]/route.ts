import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { deleteProfile, getProfile, updateProfile } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const profile = await getProfile(params.id);
  if (!profile) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const profile = await updateProfile(params.id, body);
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", issues: err.issues }, { status: 400 });
    }
    console.error("[PATCH /api/profiles/:id]", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteProfile(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/profiles/:id]", err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

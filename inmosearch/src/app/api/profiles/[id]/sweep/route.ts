import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/profiles";
import { runSweepForProfile } from "@/lib/sweep";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Lanza un barrido manual para un perfil concreto. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const profile = await getProfile(params.id);
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    const outcome = await runSweepForProfile(profile);
    return NextResponse.json({ outcome });
  } catch (err) {
    console.error("[POST /api/profiles/:id/sweep]", err);
    return NextResponse.json({ error: "Error al ejecutar el barrido" }, { status: 500 });
  }
}

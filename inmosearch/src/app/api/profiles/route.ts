import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProfile, listProfiles } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  const profiles = await listProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = await createProfile(body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Datos inválidos", issues: err.issues }, { status: 400 });
    }
    console.error("[POST /api/profiles]", err);
    return NextResponse.json({ error: "Error al crear el perfil" }, { status: 500 });
  }
}

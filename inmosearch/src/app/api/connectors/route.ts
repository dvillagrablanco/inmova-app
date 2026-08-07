import { NextResponse } from "next/server";
import { connectorStatuses } from "@/lib/connectors";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ connectors: connectorStatuses() });
}

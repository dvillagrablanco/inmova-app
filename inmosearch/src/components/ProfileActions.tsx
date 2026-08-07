"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Outcome {
  found: number;
  imported: number;
  matched: number;
  duplicates: number;
  updated?: number;
  priceDrops?: number;
  status: string;
  bySource: { source: string; found: number; error?: string }[];
}

export function ProfileActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sweep() {
    setBusy("sweep");
    setError(null);
    setOutcome(null);
    try {
      const res = await fetch(`/api/profiles/${id}/sweep`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setOutcome(data.outcome);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("¿Eliminar este perfil?")) return;
    setBusy("del");
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    router.refresh();
    setBusy(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={sweep}
          disabled={busy !== null}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy === "sweep" ? "Barriendo…" : "Barrer ahora"}
        </button>
        <Link
          href={`/?profileId=${id}&matched=1`}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Ver oportunidades
        </Link>
        <button
          onClick={remove}
          disabled={busy !== null}
          className="ml-auto rounded-md px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      {outcome && (
        <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">{outcome.imported}</span> nuevas ·{" "}
          <span className="font-semibold text-emerald-700">{outcome.matched}</span> encajan ·{" "}
          {outcome.duplicates} duplicadas
          {outcome.updated ? ` · ${outcome.updated} actualizadas` : ""}
          {outcome.priceDrops ? ` · ${outcome.priceDrops} bajadas` : ""} · {outcome.found} vistas
          {outcome.bySource.some((s) => s.error) && (
            <div className="mt-1 text-amber-600">
              {outcome.bySource
                .filter((s) => s.error)
                .map((s) => `${s.source}: ${s.error}`)
                .join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

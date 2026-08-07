"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUSES } from "@/lib/types";
import { label } from "@/lib/format";

export function OpportunityActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function changeStatus(newStatus: string) {
    setBusy("status");
    await fetch(`/api/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setBusy(null);
  }

  async function reanalyze(useVision: boolean) {
    setBusy(useVision ? "vision" : "reanalyze");
    await fetch(`/api/opportunities/${id}/reanalyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useVision }),
    });
    router.refresh();
    setBusy(null);
  }

  async function remove() {
    if (!confirm("¿Eliminar esta oportunidad?")) return;
    setBusy("delete");
    await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <div className="mb-1 text-xs font-medium text-ink-500">Estado</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={busy !== null}
              className={
                "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset disabled:opacity-50 " +
                (status === s
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-ink-600 ring-ink-200 hover:bg-ink-100")
              }
            >
              {label(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-3">
        <button
          onClick={() => reanalyze(false)}
          disabled={busy !== null}
          className="rounded-md bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-200 disabled:opacity-50"
        >
          {busy === "reanalyze" ? "Reanalizando…" : "Reanalizar"}
        </button>
        <button
          onClick={() => reanalyze(true)}
          disabled={busy !== null}
          className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20 hover:bg-brand-100 disabled:opacity-50"
        >
          {busy === "vision" ? "Analizando imágenes…" : "CapEx con IA (imágenes)"}
        </button>
        <button
          onClick={remove}
          disabled={busy !== null}
          className="ml-auto rounded-md px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

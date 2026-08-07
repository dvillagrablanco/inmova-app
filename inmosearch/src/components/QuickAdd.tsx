"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VerdictBadge } from "./Signals";
import type { Verdict } from "@/lib/types";

interface QuickResult {
  id: string;
  title: string;
  score: number;
  verdict: Verdict;
}

const EXAMPLE = `Piso en Carabanchel, Madrid. 3 habitaciones, 1 baño, 72 m². Para reformar. 118.000 €`;

export function QuickAdd() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuickResult | null>(null);

  async function submit() {
    if (text.trim().length < 10) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo procesar");
      const o = data.opportunity;
      setResult({ id: o.id, title: o.title, score: o.score, verdict: o.verdict });
      setText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Alta rápida — pega un anuncio</h2>
        <button onClick={() => setText(EXAMPLE)} className="text-xs text-brand-700 hover:underline">
          Usar ejemplo
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Pega el texto (o la URL + descripción) de un anuncio. Detecto precio, m², habitaciones, estado y ubicación, lo
        valoro con datos de mercado y te doy el veredicto.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Ej.: Piso en Vigo, 90 m², 3 hab, a reformar, 95.000 €"
        className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy || text.trim().length < 10}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Analizando…" : "Analizar y guardar"}
        </button>
        <span className="text-xs text-slate-400">⌘/Ctrl + Enter</span>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      {result && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <VerdictBadge verdict={result.verdict} />
          <span className="font-semibold text-slate-800">{result.score}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{result.title}</span>
          <Link href={`/opportunities/${result.id}`} className="shrink-0 text-sm font-medium text-brand-700 hover:underline">
            Ver análisis →
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
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
    <div className="card overflow-hidden">
      <div className="border-b border-ink-100 bg-gradient-to-r from-brand-50/70 to-transparent px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink-800">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-600 text-white">
              <Zap size={14} strokeWidth={2.6} />
            </span>
            Alta rápida — pega un anuncio
          </h2>
          <button onClick={() => setText(EXAMPLE)} className="text-xs font-medium text-brand-700 hover:underline">
            Usar ejemplo
          </button>
        </div>
      </div>
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Ej.: Piso en Vigo, 90 m², 3 hab, a reformar, 95.000 €. Pega el texto (o la URL + descripción) de Idealista/Fotocasa."
          className="input resize-y"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={submit} disabled={busy || text.trim().length < 10} className="btn-primary">
            {busy ? "Analizando…" : "Analizar y guardar"}
          </button>
          <span className="hidden text-xs text-ink-400 sm:inline">⌘/Ctrl + Enter</span>
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>

        {result && (
          <Link
            href={`/opportunities/${result.id}`}
            className="mt-3 flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3 transition hover:bg-white hover:shadow-soft"
          >
            <VerdictBadge verdict={result.verdict} />
            <span className="text-lg font-extrabold text-ink-900">{result.score}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink-600">{result.title}</span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700">
              Ver <ArrowRight size={15} />
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

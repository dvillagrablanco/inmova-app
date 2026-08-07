"use client";

import { useState } from "react";

export function AlertTestButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function test() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/alerts/test", { method: "POST" });
      const d = await res.json();
      if (!d.configured) {
        setMsg("Sin canales configurados. Revisa ALERTS_WEBHOOK_URL o Resend en el .env.");
      } else {
        const ok = d.channels.filter((c: { ok: boolean }) => c.ok).map((c: { name: string }) => c.name);
        const err = d.channels.filter((c: { ok: boolean }) => !c.ok).map((c: { name: string; error?: string }) => `${c.name}: ${c.error}`);
        setMsg(`Enviado por: ${ok.join(", ") || "—"}${err.length ? ` · Errores: ${err.join("; ")}` : ""}`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={test}
        disabled={busy}
        className="rounded-md bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-200 disabled:opacity-50"
      >
        {busy ? "Enviando…" : "Enviar alerta de prueba"}
      </button>
      {msg && <span className="text-xs text-ink-500">{msg}</span>}
    </div>
  );
}

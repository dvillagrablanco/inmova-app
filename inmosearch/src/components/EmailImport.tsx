"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EmailImport() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    if (content.trim().length < 20) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/ingest/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMsg(`Detectados ${data.found} · importados ${data.imported} · duplicados ${data.duplicates}.`);
      setContent("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-ink-800">Importar alerta de email (Idealista / Fotocasa)</span>
        <span className="text-ink-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink-100 p-4">
          <p className="text-xs text-ink-500">
            Crea alertas con tus criterios en el portal; cuando te llegue el email, pégalo aquí (texto o HTML) y detecto
            todos los anuncios. Vía legal: no se raspa el portal. También puedes conectar un webhook de email a{" "}
            <code className="rounded bg-ink-100 px-1">/api/ingest/email</code>.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Pega aquí el contenido del email de alerta (varios anuncios)…"
            className="input resize-y"
          />
          <div className="flex items-center gap-3">
            <button onClick={submit} disabled={busy || content.trim().length < 20} className="btn-primary">
              {busy ? "Importando…" : "Importar anuncios"}
            </button>
            {msg && <span className="text-sm text-ink-500">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ConnectorStatus {
  id: string;
  name: string;
  configured: boolean;
  status: string;
}

export function ImportPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [selected, setSelected] = useState<string[]>(["idealista"]);
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [useVision, setUseVision] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open && connectors.length === 0) {
      fetch("/api/connectors")
        .then((r) => r.json())
        .then((d) => setConnectors(d.connectors ?? []))
        .catch(() => setConnectors([]));
    }
  }, [open, connectors.length]);

  async function runImport() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/connectors/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorIds: selected, location, maxResults, useVision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMsg(`Importadas ${data.imported} oportunidades.${data.errors?.length ? ` (${data.errors.length} avisos)` : ""}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error al importar");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-ink-800">Importar desde conectores</span>
        <span className="text-ink-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-ink-100 p-4">
          <div className="space-y-2">
            {connectors.map((c) => (
              <label key={c.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <span>
                  <span className="font-medium text-ink-800">{c.name}</span>{" "}
                  <span className={c.configured ? "text-emerald-600" : "text-amber-600"}>
                    {c.configured ? "· configurado" : "· no configurado"}
                  </span>
                  <span className="block text-xs text-ink-400">{c.status}</span>
                </span>
              </label>
            ))}
            {connectors.length === 0 && <p className="text-sm text-ink-400">Cargando conectores…</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Ubicación (opcional)">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Madrid, Valencia…"
                className="input"
              />
            </Field>
            <Field label="Máx. resultados">
              <input
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="CapEx con IA">
              <label className="flex h-9 items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" checked={useVision} onChange={(e) => setUseVision(e.target.checked)} />
                Analizar imágenes
              </label>
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={runImport} disabled={busy || selected.length === 0} className="btn-primary">
              {busy ? "Importando…" : "Importar y analizar"}
            </button>
            {msg && <span className="text-sm text-ink-500">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
      {children}
    </label>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONDITIONS, PROPERTY_TYPES, SWEEP_SCHEDULES, SWEEP_SOURCES } from "@/lib/types";
import { label } from "@/lib/format";

const SOURCE_LABELS: Record<string, string> = {
  boe: "Subastas BOE",
  idealista: "Idealista API",
  "reo-banks": "Banca/REO",
  http: "Fuente autorizada",
  mock: "Demo (mock)",
};

const SCHEDULE_LABELS: Record<string, string> = {
  weekly: "Semanal",
  daily: "Diario",
  "6h": "Cada 6 h",
  manual: "Solo manual",
};

export function ProfileForm({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>(["boe", "mock"]);
  const [types, setTypes] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v ? Number(v) : undefined;
    };
    const payload = {
      name: fd.get("name"),
      active: true,
      zones: String(fd.get("zones") || "")
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean),
      sources,
      propertyTypes: types,
      conditions,
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      minArea: num("minArea"),
      maxPricePerSqm: num("maxPricePerSqm"),
      minRooms: num("minRooms"),
      minNetYield: num("minNetYield"),
      minFlipMargin: num("minFlipMargin"),
      minDiscountToMarket: num("minDiscountToMarket"),
      keywords: fd.get("keywords") || undefined,
      schedule: fd.get("schedule") || "weekly",
    };
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setOpen(false);
      router.refresh();
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  function toggle(list: string[], set: (v: string[]) => void, v: string) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        + Nuevo perfil de búsqueda
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del perfil *" span>
          <input name="name" required className="in" placeholder="Ej.: Flip Madrid a reformar < 130k" />
        </Field>
        <Field label="Zonas (provincias / municipios / CP, separadas por coma)" span>
          <input name="zones" className="in" placeholder="Madrid, Vigo, 28020" />
        </Field>
      </div>

      <div>
        <Lbl>Fuentes a barrer</Lbl>
        <div className="flex flex-wrap gap-2">
          {SWEEP_SOURCES.map((s) => (
            <Chip key={s} active={sources.includes(s)} onClick={() => toggle(sources, setSources, s)}>
              {SOURCE_LABELS[s]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Lbl>Tipo de activo (vacío = todos)</Lbl>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <Chip key={t} active={types.includes(t)} onClick={() => toggle(types, setTypes, t)}>
              {label(t)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Precio mín. (€)">
          <input name="minPrice" type="number" className="in" />
        </Field>
        <Field label="Precio máx. (€)">
          <input name="maxPrice" type="number" className="in" placeholder="130000" />
        </Field>
        <Field label="Superficie mín. (m²)">
          <input name="minArea" type="number" className="in" />
        </Field>
        <Field label="€/m² máximo">
          <input name="maxPricePerSqm" type="number" className="in" />
        </Field>
        <Field label="Habitaciones mín.">
          <input name="minRooms" type="number" className="in" />
        </Field>
        <Field label="Programación">
          <select name="schedule" className="in" defaultValue="weekly">
            {SWEEP_SCHEDULES.map((s) => (
              <option key={s} value={s}>
                {SCHEDULE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <Lbl>Estado del activo (vacío = cualquiera)</Lbl>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <Chip key={c} active={conditions.includes(c)} onClick={() => toggle(conditions, setConditions, c)}>
              {label(c)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Rent. neta mín. (%)">
          <input name="minNetYield" type="number" step="0.1" className="in" placeholder="6" />
        </Field>
        <Field label="Margen flip mín. (%)">
          <input name="minFlipMargin" type="number" step="0.1" className="in" placeholder="15" />
        </Field>
        <Field label="Descuento mín. vs mercado (%)">
          <input name="minDiscountToMarket" type="number" step="0.1" className="in" placeholder="10" />
        </Field>
      </div>

      <Field label="Palabras clave (opcional, coma-separadas)" span>
        <input name="keywords" className="in" placeholder="ascensor, terraza, exterior" />
      </Field>

      {error && <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar perfil"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:underline">
          Cancelar
        </button>
      </div>

      <style jsx global>{`
        .in {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.4rem 0.6rem;
          font-size: 0.875rem;
          background: white;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <label className={span ? "block sm:col-span-2" : "block"}>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Lbl({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-medium text-slate-500">{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset " +
        (active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-100")
      }
    >
      {children}
    </button>
  );
}

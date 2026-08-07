"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CCAA_LIST } from "@/lib/data/regions";
import { CONDITIONS, PROPERTY_TYPES } from "@/lib/types";
import { label } from "@/lib/format";

export function NewOpportunityForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useVision, setUseVision] = useState(false);
  const [images, setImages] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v ? Number(v) : undefined;
    };
    const payload = {
      title: fd.get("title"),
      source: fd.get("source") || "MANUAL",
      sourceUrl: fd.get("sourceUrl") || "",
      city: fd.get("city") || undefined,
      province: fd.get("province") || undefined,
      ccaa: fd.get("ccaa") || undefined,
      propertyType: fd.get("propertyType") || "PISO",
      condition: fd.get("condition") || undefined,
      askingPrice: num("askingPrice"),
      builtArea: num("builtArea"),
      rooms: num("rooms"),
      baths: num("baths"),
      yearBuilt: num("yearBuilt"),
      arvPricePerSqm: num("arvPricePerSqm"),
      marketRentMonthly: num("marketRentMonthly"),
      description: fd.get("description") || undefined,
      images: images
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      useVision,
    };

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear");
      router.push(`/opportunities/${data.opportunity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identificación">
        <Grid>
          <Field label="Título *" span={2}>
            <input name="title" required className="input" placeholder="Piso a reformar junto a metro" />
          </Field>
          <Field label="Origen">
            <select name="source" className="input" defaultValue="MANUAL">
              {["MANUAL", "IDEALISTA", "REO_BANK", "AUCTION", "CSV"].map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL del anuncio">
            <input name="sourceUrl" className="input" placeholder="https://…" />
          </Field>
        </Grid>
      </Section>

      <Section title="Localización">
        <Grid>
          <Field label="Ciudad">
            <input name="city" className="input" />
          </Field>
          <Field label="Provincia">
            <input name="province" className="input" />
          </Field>
          <Field label="Comunidad Autónoma (ITP)">
            <select name="ccaa" className="input" defaultValue="">
              <option value="">(sin especificar)</option>
              {CCAA_LIST.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="Características">
        <Grid>
          <Field label="Tipo">
            <select name="propertyType" className="input" defaultValue="PISO">
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select name="condition" className="input" defaultValue="">
              <option value="">(sin especificar)</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Superficie construida (m²)">
            <input name="builtArea" type="number" step="0.1" className="input" />
          </Field>
          <Field label="Habitaciones">
            <input name="rooms" type="number" className="input" />
          </Field>
          <Field label="Baños">
            <input name="baths" type="number" className="input" />
          </Field>
          <Field label="Año construcción">
            <input name="yearBuilt" type="number" className="input" />
          </Field>
        </Grid>
      </Section>

      <Section title="Economía (para el análisis)">
        <Grid>
          <Field label="Precio de compra (€) *">
            <input name="askingPrice" type="number" required className="input" placeholder="120000" />
          </Field>
          <Field label="ARV — venta objetivo (€/m²)">
            <input name="arvPricePerSqm" type="number" step="0.1" className="input" placeholder="3200" />
          </Field>
          <Field label="Renta de mercado (€/mes)">
            <input name="marketRentMonthly" type="number" step="0.1" className="input" placeholder="1250" />
          </Field>
        </Grid>
        <p className="mt-2 text-xs text-slate-400">
          Opcional: si lo dejas en blanco, INMOSEARCH estima el ARV y la renta con datos de mercado de la provincia. Rellénalos
          solo si tienes comparables propios (mayor precisión). El CapEx también se estima automáticamente.
        </p>
      </Section>

      <Section title="Imágenes y CapEx con IA">
        <Field label="URLs de imágenes (una por línea o separadas por coma)">
          <textarea
            value={images}
            onChange={(e) => setImages(e.target.value)}
            rows={3}
            className="input"
            placeholder="https://…/foto1.jpg&#10;https://…/foto2.jpg"
          />
        </Field>
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={useVision} onChange={(e) => setUseVision(e.target.checked)} />
          Estimar el CapEx analizando las imágenes con IA (requiere ANTHROPIC_API_KEY)
        </label>
      </Section>

      {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Analizando…" : "Crear y analizar"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.45rem 0.65rem;
          font-size: 0.875rem;
          background: white;
        }
        .input:focus {
          outline: 2px solid rgb(27 112 245 / 0.35);
          border-color: rgb(27 112 245);
        }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <label className={span === 2 ? "block sm:col-span-2" : "block"}>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

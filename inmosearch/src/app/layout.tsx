import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "INMOSEARCH — Oportunidades inmobiliarias | Enxames",
  description:
    "Búsqueda y análisis de oportunidades inmobiliarias para flip y alquiler: underwriting automático, CapEx con IA y scoring.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                IS
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900">INMOSEARCH</div>
                <div className="text-[11px] text-slate-500">Enxames · deal-sourcing</div>
              </div>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">
                Radar
              </Link>
              <Link href="/profiles" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">
                Perfiles
              </Link>
              <Link href="/map" className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100">
                Mapa
              </Link>
              <Link
                href="/opportunities/new"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                + Nueva
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
          INMOSEARCH · Las estimaciones (impuestos, CapEx, comparables) son orientativas. Verifica cada dato antes de decidir.
        </footer>
      </body>
    </html>
  );
}

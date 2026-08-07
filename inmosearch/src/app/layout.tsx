import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DesktopNav, BottomNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "INMOSEARCH · Oportunidades inmobiliarias",
  description:
    "Búsqueda y análisis de oportunidades inmobiliarias para flip y alquiler: valoración automática, CapEx con IA, MAO y scoring.",
};

export const viewport: Viewport = {
  themeColor: "#2449ea",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-soft">
                IS
              </span>
              <div className="leading-tight">
                <div className="text-[15px] font-bold text-ink-900">INMOSEARCH</div>
                <div className="text-[11px] text-ink-400">Enxames · deal-sourcing</div>
              </div>
            </Link>

            <DesktopNav />

            {/* Acción rápida en móvil */}
            <Link href="/opportunities/new" className="btn-primary px-3 py-2 md:hidden" aria-label="Nueva oportunidad">
              <Plus size={18} strokeWidth={2.6} />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 md:pb-10">{children}</main>

        <BottomNav />

        <footer className="mx-auto max-w-6xl px-4 pb-24 pt-2 text-center text-[11px] text-ink-400 md:pb-8">
          Las estimaciones (impuestos, CapEx, comparables) son orientativas. Verifica cada dato antes de decidir.
        </footer>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, SlidersHorizontal, Map, Plug, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", label: "Radar", icon: Radar, match: (p: string) => p === "/" },
  { href: "/profiles", label: "Perfiles", icon: SlidersHorizontal, match: (p: string) => p.startsWith("/profiles") },
  { href: "/map", label: "Mapa", icon: Map, match: (p: string) => p.startsWith("/map") },
  { href: "/tools", label: "Conectar", icon: Plug, match: (p: string) => p.startsWith("/tools") },
];

/** Navegación de escritorio (en la cabecera). */
export function DesktopNav() {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {ITEMS.map((it) => {
        const active = it.match(path);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-100 hover:text-ink-800"
            )}
          >
            <it.icon size={16} strokeWidth={2.2} />
            {it.label}
          </Link>
        );
      })}
      <Link href="/opportunities/new" className="btn-primary ml-1">
        <Plus size={16} strokeWidth={2.6} />
        Nueva
      </Link>
    </nav>
  );
}

/** Barra de navegación inferior (solo móvil). */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/90 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.match(path);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                active ? "text-brand-700" : "text-ink-400"
              )}
            >
              <it.icon size={20} strokeWidth={active ? 2.5 : 2} />
              {it.label}
            </Link>
          );
        })}
        <Link href="/opportunities/new" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-brand-700">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white">
            <Plus size={16} strokeWidth={2.8} />
          </span>
          Nueva
        </Link>
      </div>
    </nav>
  );
}

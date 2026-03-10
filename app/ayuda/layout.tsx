import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpSearch } from '@/components/help-center/HelpSearch';

export const metadata: Metadata = {
  title: {
    template: '%s | Inmova',
    default: 'Centro de Ayuda | Inmova',
  },
};

export default function AyudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-6 px-4">
          <Link
            href="/"
            className="font-semibold text-lg text-foreground hover:text-primary transition-colors"
          >
            Inmova
          </Link>
          <Link
            href="/ayuda"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Centro de Ayuda
          </Link>
          <div className="flex-1 max-w-md ml-auto">
            <HelpSearch size="sm" placeholder="Buscar en la ayuda..." />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-8 mt-auto">
        <div className="container px-4">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/ayuda" className="hover:text-foreground transition-colors">
              Centro de Ayuda
            </Link>
            <Link href="/landing/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/ayuda/contacto" className="hover:text-foreground transition-colors">
              Contacto
            </Link>
            <Link href="/landing" className="hover:text-foreground transition-colors">
              Landing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

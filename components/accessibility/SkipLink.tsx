/**
 * Skip Link Component
 * 
 * Componente de accesibilidad WCAG 2.1 AA
 * Permite a usuarios de teclado/screen readers saltar la navegación
 * y ir directo al contenido principal
 */

import Link from 'next/link';

export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/50 font-semibold"
    >
      Saltar al contenido principal
    </Link>
  );
}

/**
 * Uso en Layout:
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SkipLink />
 *         <nav>...</nav>
 *         <main id="main-content">
 *           {children}
 *         </main>
 *       </body>
 *     </html>
 *   );
 * }
 */

"use client";

import { useEffect, useRef, useState } from "react";

/** Construye y muestra el bookmarklet, inyectando el origen real de la app. */
export function BookmarkletCard() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const o = window.location.origin;
    setOrigin(o);
    const code = buildBookmarklet(o);
    // React sanea los href "javascript:"; lo fijamos por ref tras montar.
    if (linkRef.current) linkRef.current.setAttribute("href", code);
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(buildBookmarklet(origin));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-ink-900">Botón «Enviar a INMOSEARCH» (bookmarklet)</h2>
      <p className="mt-1 text-sm text-ink-500">
        Un botón para tu navegador. Cuando estés viendo una ficha (o un listado) en <b>Idealista</b> o <b>Fotocasa</b>,
        púlsalo y el anuncio se manda a INMOSEARCH, se valora y se analiza. Es tu propia navegación: sin bots, sin
        raspado, sin saltarse nada.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          ref={linkRef}
          href="#"
          onClick={(e) => e.preventDefault()}
          draggable
          className="cursor-move rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          📌 Enviar a INMOSEARCH
        </a>
        <span className="text-xs text-ink-500">← arrástralo a tu barra de marcadores</span>
        <button onClick={copy} className="rounded-md bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-200">
          {copied ? "¡Copiado!" : "Copiar código"}
        </button>
      </div>

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-600">
        <li>Muestra la barra de marcadores del navegador (Ctrl/Cmd+Shift+B).</li>
        <li>Arrastra el botón azul de arriba a la barra (o crea un marcador nuevo y pega el código copiado como URL).</li>
        <li>Entra en un anuncio de Idealista/Fotocasa y pulsa el marcador. Se abrirá INMOSEARCH con el análisis.</li>
      </ol>
      <p className="mt-3 text-xs text-ink-400">
        Consejo: en una <b>ficha</b> importa ese inmueble; en una <b>página de resultados</b> importa todos los de la
        página. Uso personal.
      </p>
    </div>
  );
}

/** Código del bookmarklet: captura el texto visible + la URL de la página y lo
 * envía por POST (form) a la app en una pestaña nueva. */
function buildBookmarklet(origin: string): string {
  const js = `(function(){try{var A=${JSON.stringify(origin)};var t=(document.body.innerText||'').slice(0,20000);var f=document.createElement('form');f.method='POST';f.action=A+'/api/ingest/bookmarklet';f.target='_blank';[['text',t],['url',location.href]].forEach(function(p){var i=document.createElement('input');i.type='hidden';i.name=p[0];i.value=p[1];f.appendChild(i);});document.body.appendChild(f);f.submit();f.remove();}catch(e){alert('INMOSEARCH: '+e);}})();`;
  return "javascript:" + encodeURIComponent(js);
}

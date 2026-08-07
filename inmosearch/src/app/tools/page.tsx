import Link from "next/link";
import { BookmarkletCard } from "@/components/BookmarkletCard";
import { EmailImport } from "@/components/EmailImport";

export const dynamic = "force-dynamic";

export default function ToolsPage() {
  const idealista = Boolean(process.env.IDEALISTA_API_KEY && process.env.IDEALISTA_API_SECRET);
  const imap = Boolean(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD);
  const webhook = Boolean(process.env.ALERTS_WEBHOOK_URL);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-brand-700 hover:underline">
          ← Radar
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Conectar con Idealista y Fotocasa</h1>
        <p className="mt-1 text-sm text-slate-500">
          INMOSEARCH no raspa los portales (lo prohíben sus Términos y tienen anti-bot). En su lugar, usa tu propia
          navegación o tus búsquedas guardadas — legal y sin bloqueos. Aquí tienes todas las vías.
        </p>
      </div>

      {/* Método 1: bookmarklet */}
      <BookmarkletCard />

      {/* Método 2: alertas por email (pegar) */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Alertas por email (búsquedas guardadas)
        </h2>
        <p className="mb-2 text-sm text-slate-600">
          Crea <b>búsquedas guardadas / alertas</b> en Idealista y Fotocasa con tus criterios (zona, precio, tipo). Cuando
          te lleguen los emails con anuncios nuevos, pégalos aquí y se importan todos.
        </p>
        <EmailImport />
      </div>

      {/* Métodos automáticos */}
      <section className="card p-5">
        <h2 className="font-semibold text-slate-900">Conexiones automáticas (opcionales)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Para que entren solas, sin pegar nada. Se configuran con variables de entorno (ver{" "}
          <code className="rounded bg-slate-100 px-1">docs/CONEXION_PORTALES.md</code>).
        </p>
        <div className="mt-3 space-y-3 text-sm">
          <Method
            active={imap}
            title="Buzón de email (IMAP)"
            desc="INMOSEARCH revisa automáticamente un buzón donde recibes las alertas de Idealista/Fotocasa y crea las oportunidades. Endpoint /api/ingest/email/poll (por cron)."
            cfg="IMAP_HOST · IMAP_USER · IMAP_PASSWORD"
          />
          <Method
            active={webhook}
            title="Reenvío por webhook (Zapier / Make / n8n)"
            desc="Regla en tu correo: cada alerta de Idealista/Fotocasa se reenvía a un webhook que hace POST a /api/ingest/email. Sin tocar código."
            cfg="Endpoint /api/ingest/email (JSON o form)"
          />
          <Method
            active={idealista}
            title="Idealista API oficial"
            desc="Búsqueda por zona vía la API oficial (OAuth2). Requiere solicitar acceso aprobado en developers.idealista.com y añadir tus credenciales. El conector ya está implementado."
            cfg="IDEALISTA_API_KEY · IDEALISTA_API_SECRET"
          />
          <Method
            active={false}
            title="Feed de datos autorizado (Casafari, uDA, partner REO…)"
            desc="Si contratas un proveedor de datos agregados (legal), su feed JSON entra por el adaptador http."
            cfg="HTTP_SOURCE_FEED_URL"
          />
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Fotocasa no ofrece API pública de búsqueda; su vía práctica es el bookmarklet y las alertas por email. Idealista sí
        tiene API oficial (con aprobación). Ninguna vía raspa los portales.
      </p>
    </div>
  );
}

function Method({ active, title, desc, cfg }: { active: boolean; title: string; desc: string; cfg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-slate-100 p-3">
      <span className={"mt-1 inline-block h-2 w-2 shrink-0 rounded-full " + (active ? "bg-emerald-500" : "bg-slate-300")} />
      <div>
        <div className="font-medium text-slate-800">
          {title} <span className={active ? "text-xs text-emerald-600" : "text-xs text-slate-400"}>· {active ? "configurado" : "sin configurar"}</span>
        </div>
        <div className="text-slate-600">{desc}</div>
        <div className="mt-0.5 text-xs text-slate-400">{cfg}</div>
      </div>
    </div>
  );
}

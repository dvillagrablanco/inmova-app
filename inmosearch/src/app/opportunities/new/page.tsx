import Link from "next/link";
import { NewOpportunityForm } from "@/components/NewOpportunityForm";

export default function NewOpportunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-brand-700 hover:underline">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">Nueva oportunidad</h1>
        <p className="mt-1 text-sm text-ink-500">
          Introduce los datos del activo. INMOSEARCH estima el CapEx y calcula los escenarios de flip y alquiler.
        </p>
      </div>
      <NewOpportunityForm />
    </div>
  );
}

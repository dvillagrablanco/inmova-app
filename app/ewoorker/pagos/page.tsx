"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Euro, CreditCard, Download, Calendar, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Pago {
  id: string;
  tipo: string;
  concepto: string;
  montoBase: number;
  montoNeto: number;
  estado: string;
  fechaSolicitud: string;
  fechaPago: string | null;
}

interface PlanInfo {
  planActual: string;
  fechaProximoPago: string | null;
}

export default function PagosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPendiente, setTotalPendiente] = useState(0);
  const [totalPagado, setTotalPagado] = useState(0);

  useEffect(() => {
    fetchPagos();
    fetchPlanInfo();
  }, []);

  const fetchPagos = async () => {
    try {
      const res = await fetch("/api/ewoorker/pagos");
      if (res.ok) {
        const data = await res.json();
        setPagos(data.pagos || []);
        
        // Calcular totales
        const pendiente = data.pagos
          .filter((p: Pago) => p.estado === "PENDIENTE")
          .reduce((sum: number, p: Pago) => sum + p.montoNeto, 0);
        const pagado = data.pagos
          .filter((p: Pago) => p.estado === "PAGADO")
          .reduce((sum: number, p: Pago) => sum + p.montoNeto, 0);
        
        setTotalPendiente(pendiente / 100); // Convertir de céntimos
        setTotalPagado(pagado / 100);
      }
    } catch (error) {
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanInfo = async () => {
    try {
      const res = await fetch("/api/ewoorker/pagos/plan");
      if (res.ok) {
        const data = await res.json();
        setPlanInfo(data);
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    }
  };

  const cambiarPlan = (nuevoPlan: string) => {
    router.push(`/ewoorker/pagos/cambiar-plan?plan=${nuevoPlan}`);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      PENDIENTE: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      RETENIDO_ESCROW: { bg: "bg-blue-100", text: "text-blue-800", icon: Clock },
      PAGADO: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
      LIBERADO: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 }
    };

    const badge = badges[estado] || badges.PENDIENTE;
    const Icon = badge.icon;

    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {estado}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Euro className="h-8 w-8 text-green-600" />
            Sistema de Pagos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu suscripción, pagos y facturación
          </p>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pendiente de Cobro</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  €{totalPendiente.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Cobrado</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{totalPagado.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Plan Actual</p>
                <p className="text-xl font-bold text-blue-600 mt-2">
                  {planInfo?.planActual === "OBRERO_FREE" && "Obrero (Gratis)"}
                  {planInfo?.planActual === "CAPATAZ_PRO" && "Capataz Pro"}
                  {planInfo?.planActual === "CONSTRUCTOR_ENTERPRISE" && "Constructor"}
                </p>
              </div>
              <CreditCard className="h-12 w-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Planes de suscripción */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Planes de Suscripción</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Obrero */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Obrero</h3>
              <p className="text-3xl font-bold mb-4">€0<span className="text-sm text-gray-600">/mes</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>✓ Perfil público</li>
                <li>✓ Recibir invitaciones</li>
                <li>✓ Gestión básica</li>
              </ul>
              <button
                onClick={() => cambiarPlan("OBRERO_FREE")}
                disabled={planInfo?.planActual === "OBRERO_FREE"}
                className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700 disabled:bg-gray-300"
              >
                {planInfo?.planActual === "OBRERO_FREE" ? "Plan Actual" : "Seleccionar"}
              </button>
            </div>

            {/* Plan Capataz */}
            <div className="border-2 border-blue-500 rounded-lg p-6 relative">
              <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl">
                Popular
              </span>
              <h3 className="text-lg font-bold mb-2">Capataz Pro</h3>
              <p className="text-3xl font-bold mb-4">€39<span className="text-sm text-gray-600">/mes</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>✓ Todo de Obrero +</li>
                <li>✓ Búsqueda activa</li>
                <li>✓ Alertas ilimitadas</li>
                <li>✓ Visibilidad destacada</li>
              </ul>
              <button
                onClick={() => cambiarPlan("CAPATAZ_PRO")}
                disabled={planInfo?.planActual === "CAPATAZ_PRO"}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {planInfo?.planActual === "CAPATAZ_PRO" ? "Plan Actual" : "Seleccionar"}
              </button>
            </div>

            {/* Plan Constructor */}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Constructor</h3>
              <p className="text-3xl font-bold mb-4">€119<span className="text-sm text-gray-600">/mes</span></p>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>✓ Todo de Capataz +</li>
                <li>✓ Publicación ilimitada</li>
                <li>✓ Validación CAE</li>
                <li>✓ Soporte prioritario</li>
              </ul>
              <button
                onClick={() => cambiarPlan("CONSTRUCTOR_ENTERPRISE")}
                disabled={planInfo?.planActual === "CONSTRUCTOR_ENTERPRISE"}
                className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:bg-orange-300"
              >
                {planInfo?.planActual === "CONSTRUCTOR_ENTERPRISE" ? "Plan Actual" : "Seleccionar"}
              </button>
            </div>
          </div>
        </div>

        {/* Historial de pagos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Historial de Pagos</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : pagos.length === 0 ? (
            <div className="p-12 text-center">
              <Euro className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {pago.concepto}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{pago.tipo}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          €{(pago.montoNeto / 100).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getEstadoBadge(pago.estado)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(pago.fechaPago || pago.fechaSolicitud).toLocaleDateString("es-ES")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

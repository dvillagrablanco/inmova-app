"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Euro, 
  Users, 
  Building2, 
  FileCheck, 
  DollarSign,
  Download,
  Calendar,
  PieChart,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface MetricasSocio {
  mes: number;
  ano: number;
  // Usuarios
  totalEmpresas: number;
  empresasActivas: number;
  nuevasEmpresasMes: number;
  empresasVerificadas: number;
  // Actividad
  obrasPublicadas: number;
  ofertasEnviadas: number;
  contratosActivos: number;
  contratosCompletados: number;
  // Financiero (en céntimos)
  gmvTotal: number;
  comisionesGeneradas: number;
  beneficioSocio: number;
  beneficioPlataforma: number;
  // Suscripciones
  suscripcionesActivas: number;
  mrrSuscripciones: number;
  // Por plan
  usuariosObrero: number;
  usuariosCapataz: number;
  usuariosConstructor: number;
  // Engagement
  tasaConversion: number;
  tiempoMedioAdjudicacion: number;
  valoracionMediaPlataforma: number;
  // Desglose comisiones
  comisionSuscripciones: number;
  comisionEscrow: number;
  comisionUrgentes: number;
  comisionOtros: number;
}

export default function AdminSocioPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metricas, setMetricas] = useState<MetricasSocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "ano">("mes");
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchMetricas();
    }
  }, [session, periodo]);

  const fetchMetricas = async () => {
    try {
      const res = await fetch(`/api/ewoorker/admin-socio/metricas?periodo=${periodo}`);
      
      if (res.status === 403) {
        setUnauthorized(true);
        toast.error("No tienes permisos para acceder a este panel");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMetricas(data);
      } else {
        toast.error("Error al cargar métricas");
      }
    } catch (error) {
      console.error("Error fetching metricas:", error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = async () => {
    try {
      const res = await fetch(`/api/ewoorker/admin-socio/exportar?periodo=${periodo}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ewoorker-reporte-${periodo}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Reporte descargado correctamente");
      } else {
        toast.error("Error al exportar reporte");
      }
    } catch (error) {
      toast.error("Error al exportar reporte");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 p-8 rounded-full inline-block mb-4">
            <Euro className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h1>
          <p className="text-gray-600 mb-6">
            Este panel es exclusivo para el socio fundador de ewoorker
          </p>
          <button
            onClick={() => router.push("/ewoorker/dashboard")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!metricas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando métricas...</p>
      </div>
    );
  }

  // Conversión de céntimos a euros
  const gmvEuros = metricas.gmvTotal / 100;
  const comisionesEuros = metricas.comisionesGeneradas / 100;
  const beneficioSocioEuros = metricas.beneficioSocio / 100;
  const beneficioPlataformaEuros = metricas.beneficioPlataforma / 100;
  const mrrEuros = metricas.mrrSuscripciones / 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header Exclusivo */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Euro className="h-8 w-8" />
                Panel del Socio Fundador
              </h1>
              <p className="mt-2 text-purple-100">
                Seguimiento exclusivo de beneficios y métricas de ewoorker
              </p>
            </div>
            <div className="flex gap-4">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as any)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
              >
                <option value="mes" className="text-gray-900">Este Mes</option>
                <option value="trimestre" className="text-gray-900">Trimestre</option>
                <option value="ano" className="text-gray-900">Año Completo</option>
              </select>
              <button
                onClick={exportarReporte}
                className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 flex items-center gap-2 font-medium"
              >
                <Download className="h-5 w-5" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Financieros Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="GMV Total"
            value={`€${gmvEuros.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}
            subtitle="Volumen transaccionado"
            icon={<TrendingUp className="h-6 w-6" />}
            color="blue"
          />
          
          <MetricCard
            title="Comisiones Generadas"
            value={`€${comisionesEuros.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}
            subtitle="Total de ingresos"
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          
          <MetricCard
            title="Tu Beneficio (50%)"
            value={`€${beneficioSocioEuros.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}
            subtitle="Tu parte"
            icon={<Euro className="h-6 w-6" />}
            color="purple"
            highlighted
          />
          
          <MetricCard
            title="Plataforma (50%)"
            value={`€${beneficioPlataformaEuros.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}
            subtitle="Reinversión"
            icon={<Building2 className="h-6 w-6" />}
            color="orange"
          />
        </div>

        {/* Métricas de Usuarios y Suscripciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Usuarios */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Empresas en Plataforma
            </h2>
            <div className="space-y-4">
              <StatRow label="Total Empresas" value={metricas.totalEmpresas} />
              <StatRow 
                label="Empresas Activas" 
                value={metricas.empresasActivas} 
                badge={`${((metricas.empresasActivas / metricas.totalEmpresas) * 100).toFixed(1)}%`}
              />
              <StatRow 
                label="Nuevas Este Mes" 
                value={metricas.nuevasEmpresasMes} 
                highlighted
              />
              <StatRow label="Verificadas" value={metricas.empresasVerificadas} />
            </div>
          </div>

          {/* Suscripciones */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Suscripciones
            </h2>
            <div className="space-y-4">
              <StatRow 
                label="MRR Total" 
                value={`€${mrrEuros.toLocaleString("es-ES")}`}
                badge="Recurrente"
              />
              <StatRow label="Activas" value={metricas.suscripcionesActivas} />
              <div className="border-t pt-4 mt-4">
                <StatRow label="Plan Obrero (Free)" value={metricas.usuariosObrero} small />
                <StatRow label="Plan Capataz (Pro)" value={metricas.usuariosCapataz} small />
                <StatRow label="Plan Constructor" value={metricas.usuariosConstructor} small />
              </div>
            </div>
          </div>
        </div>

        {/* Actividad del Marketplace */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Actividad del Marketplace
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActivityStat label="Obras Publicadas" value={metricas.obrasPublicadas} />
            <ActivityStat label="Ofertas Enviadas" value={metricas.ofertasEnviadas} />
            <ActivityStat label="Contratos Activos" value={metricas.contratosActivos} />
            <ActivityStat label="Completados" value={metricas.contratosCompletados} />
          </div>
        </div>

        {/* Engagement y Calidad */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <EngagementCard
            title="Tasa de Conversión"
            value={`${metricas.tasaConversion.toFixed(1)}%`}
            description="Ofertas → Contratos"
            color="green"
          />
          <EngagementCard
            title="Tiempo Medio"
            value={`${metricas.tiempoMedioAdjudicacion.toFixed(1)} días`}
            description="Publicación → Adjudicación"
            color="blue"
          />
          <EngagementCard
            title="Valoración Media"
            value={`${metricas.valoracionMediaPlataforma.toFixed(2)}/5.0`}
            description="Rating de la plataforma"
            color="yellow"
          />
        </div>

        {/* Desglose de Comisiones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-orange-600" />
            Desglose de Comisiones
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CommissionBreakdown
              label="Suscripciones"
              value={metricas.comisionSuscripciones / 100}
              color="bg-blue-500"
            />
            <CommissionBreakdown
              label="Escrow (Pagos)"
              value={metricas.comisionEscrow / 100}
              color="bg-green-500"
            />
            <CommissionBreakdown
              label="Urgentes"
              value={metricas.comisionUrgentes / 100}
              color="bg-orange-500"
            />
            <CommissionBreakdown
              label="Otros"
              value={metricas.comisionOtros / 100}
              color="bg-purple-500"
            />
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r mt-8">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium">Período actual: {metricas.mes}/{metricas.ano}</p>
              <p className="mt-1">
                Este panel muestra tus beneficios en tiempo real según el acuerdo 50/50. 
                Los pagos se procesan automáticamente cada mes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function MetricCard({ title, value, subtitle, icon, color, highlighted }: any) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600"
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-lg shadow-md p-6 ${highlighted ? "ring-4 ring-purple-300" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-lg">{icon}</div>
      </div>
      <p className="text-white/80 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-white/70 text-xs">{subtitle}</p>
    </div>
  );
}

function StatRow({ label, value, badge, highlighted, small }: any) {
  return (
    <div className={`flex items-center justify-between ${small ? "text-sm" : ""} ${highlighted ? "font-bold" : ""}`}>
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-900 font-semibold">{value}</span>
        {badge && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityStat({ label, value }: any) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function EngagementCard({ title, value, description, color }: any) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800"
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-gray-600 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

function CommissionBreakdown({ label, value, color }: any) {
  return (
    <div className="text-center">
      <div className={`${color} text-white p-4 rounded-lg mb-2`}>
        <p className="text-2xl font-bold">€{value.toLocaleString("es-ES")}</p>
      </div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

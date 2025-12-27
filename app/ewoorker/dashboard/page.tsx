"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Building2, 
  FileCheck, 
  Briefcase, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Euro
} from "lucide-react";

export default function EwoorkerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    obrasActivas: 0,
    ofertasPendientes: 0,
    contratosVigentes: 0,
    documentosVencer: 0,
    facturacionMes: 0,
    calificacionMedia: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/ewoorker/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con branding ewoorker */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                ewoorker
              </h1>
              <p className="mt-2 text-orange-100">
                Tu plataforma B2B para la subcontratación en construcción
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Bienvenido,</p>
              <p className="text-lg font-semibold">{session?.user?.nombre}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Briefcase className="h-6 w-6" />}
            title="Obras Activas"
            value={stats.obrasActivas}
            color="blue"
            onClick={() => router.push("/ewoorker/obras")}
          />
          <StatCard
            icon={<FileCheck className="h-6 w-6" />}
            title="Ofertas Pendientes"
            value={stats.ofertasPendientes}
            color="purple"
            onClick={() => router.push("/ewoorker/ofertas")}
          />
          <StatCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Contratos Vigentes"
            value={stats.contratosVigentes}
            color="green"
            onClick={() => router.push("/ewoorker/contratos")}
          />
          <StatCard
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Docs a Vencer"
            value={stats.documentosVencer}
            color={stats.documentosVencer > 0 ? "red" : "green"}
            onClick={() => router.push("/ewoorker/compliance")}
          />
          <StatCard
            icon={<Euro className="h-6 w-6" />}
            title="Facturación Mes"
            value={`€${stats.facturacionMes.toLocaleString()}`}
            color="orange"
            onClick={() => router.push("/ewoorker/pagos")}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Calificación"
            value={`${stats.calificacionMedia.toFixed(1)}/5.0`}
            color="yellow"
            onClick={() => router.push("/ewoorker/perfil")}
          />
        </div>

        {/* Módulos principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compliance Hub */}
          <ModuleCard
            icon={<FileCheck className="h-10 w-10" />}
            title="Compliance Hub"
            description="Gestión documental y cumplimiento legal (Ley 32/2006)"
            color="green"
            href="/ewoorker/compliance"
          />

          {/* Marketplace */}
          <ModuleCard
            icon={<Building2 className="h-10 w-10" />}
            title="Marketplace"
            description="Encuentra obras y conecta con profesionales"
            color="blue"
            href="/ewoorker/buscar"
          />

          {/* Mis Obras */}
          <ModuleCard
            icon={<Briefcase className="h-10 w-10" />}
            title="Mis Obras"
            description="Gestiona tus proyectos y subcontratas"
            color="purple"
            href="/ewoorker/obras"
          />

          {/* Pagos */}
          <ModuleCard
            icon={<Euro className="h-10 w-10" />}
            title="Sistema de Pagos"
            description="Facturación, escrow y suscripciones"
            color="orange"
            href="/ewoorker/pagos"
          />
        </div>

        {/* Alertas importantes */}
        {stats.documentosVencer > 0 && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Tienes {stats.documentosVencer} documento(s) próximo(s) a vencer
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Revisa el Compliance Hub para evitar sanciones.
                </p>
              </div>
              <button
                onClick={() => router.push("/ewoorker/compliance")}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Ver Documentos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de estadística
function StatCard({ icon, title, value, color, onClick }: any) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500"
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className={`${colorClasses[color]} text-white p-3 rounded-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Componente de tarjeta de módulo
function ModuleCard({ icon, title, description, color, href }: any) {
  const router = useRouter();

  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600"
  };

  return (
    <div
      onClick={() => router.push(href)}
      className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1`}
    >
      <div className="flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-lg">{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-white/90 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

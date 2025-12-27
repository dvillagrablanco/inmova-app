"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  FileCheck, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  XCircle,
  Download,
  Eye,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

interface Documento {
  id: string;
  tipo: string;
  nombreArchivo: string;
  fechaCaducidad: Date | null;
  estado: string;
  confianzaOCR?: number;
}

export default function ComplianceHub() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [semaforo, setSemaforo] = useState({
    verde: 0,
    amarillo: 0,
    rojo: 0
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchDocumentos();
    }
  }, [session]);

  const fetchDocumentos = async () => {
    try {
      const res = await fetch("/api/ewoorker/compliance/documentos");
      if (res.ok) {
        const data = await res.json();
        setDocumentos(data.documentos || []);
        setSemaforo(data.semaforo || { verde: 0, amarillo: 0, rojo: 0 });
      }
    } catch (error) {
      console.error("Error fetching documentos:", error);
      toast.error("Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await fetch("/api/ewoorker/compliance/upload", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        toast.success("Documento subido correctamente. Procesando con OCR...");
        fetchDocumentos(); // Recargar lista
      } else {
        toast.error("Error al subir documento");
      }
    } catch (error) {
      toast.error("Error al subir documento");
    } finally {
      setUploading(false);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "VERDE":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "AMARILLO":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "ROJO":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const classes: Record<string, string> = {
      VERDE: "bg-green-100 text-green-800",
      AMARILLO: "bg-yellow-100 text-yellow-800",
      ROJO: "bg-red-100 text-red-800",
      PENDIENTE_VALIDACION: "bg-gray-100 text-gray-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[estado] || "bg-gray-100 text-gray-800"}`}>
        {estado.replace("_", " ")}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileCheck className="h-8 w-8 text-green-600" />
                Compliance Hub
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión documental y cumplimiento Ley 32/2006
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUpload}
                disabled={uploading}
              />
              <div className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors">
                <Upload className="h-5 w-5" />
                {uploading ? "Subiendo..." : "Subir Documento"}
              </div>
            </label>
          </div>
        </div>

        {/* Semáforo de Cumplimiento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Documentos OK</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{semaforo.verde}</p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Próximos a Vencer</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{semaforo.amarillo}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Vencidos/Faltantes</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{semaforo.rojo}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Alertas críticas */}
        {semaforo.rojo > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Atención: Tienes {semaforo.rojo} documento(s) vencido(s) o faltante(s)
                </p>
                <p className="text-sm text-red-700 mt-1">
                  El incumplimiento de la Ley 32/2006 puede resultar en multas de hasta €187,515
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Documentos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Documentos</h2>
          </div>

          {documentos.length === 0 ? (
            <div className="p-12 text-center">
              <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay documentos cargados</p>
              <p className="text-gray-500 text-sm mt-2">
                Sube tu primer documento para empezar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caducidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OCR
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(doc.estado)}
                          {getEstadoBadge(doc.estado)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {doc.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {doc.nombreArchivo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.fechaCaducidad ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(doc.fechaCaducidad).toLocaleDateString("es-ES")}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.confianzaOCR ? (
                          <span className="text-sm text-gray-600">
                            {doc.confianzaOCR}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-blue-600 hover:text-blue-800 mr-3">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
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

        {/* Info Legal */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
          <div className="flex items-start">
            <FileCheck className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">Documentos obligatorios según Ley 32/2006:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>REA (Registro de Empresas Acreditadas) vigente</li>
                <li>Seguro de Responsabilidad Civil (mínimo €300,000)</li>
                <li>TC1 y TC2 de trabajadores actualizados</li>
                <li>Certificados de formación en PRL</li>
                <li>Documentación fiscal (alta AEAT, IAE)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

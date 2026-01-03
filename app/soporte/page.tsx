import { Metadata } from 'next';
import { MessageCircle, FileText, Video, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Soporte | Inmova',
  description: 'Centro de ayuda y soporte técnico',
};

export default function SoportePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🆘 Centro de Soporte</h1>
        <p className="text-gray-600 mt-2">
          Obtén ayuda con el uso de la plataforma Inmova
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Chat en Vivo</h3>
          <p className="text-gray-600 mb-4">
            Habla con nuestro equipo de soporte en tiempo real
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Iniciar Chat
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Mail className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Email</h3>
          <p className="text-gray-600 mb-4">
            Envíanos un email y te responderemos en 24h
          </p>
          <a 
            href="mailto:soporte@inmovaapp.com"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            soporte@inmovaapp.com
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">📚 Recursos de Ayuda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold mb-2">Documentación</h3>
            <p className="text-sm text-gray-600 mb-3">
              Guías completas de uso de la plataforma
            </p>
            <a href="/docs" className="text-blue-600 hover:underline text-sm">
              Ver documentación →
            </a>
          </div>

          <div className="border rounded-lg p-4">
            <Video className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-semibold mb-2">Tutoriales en Video</h3>
            <p className="text-sm text-gray-600 mb-3">
              Aprende con videos paso a paso
            </p>
            <a href="/tutorials" className="text-green-600 hover:underline text-sm">
              Ver tutoriales →
            </a>
          </div>

          <div className="border rounded-lg p-4">
            <MessageCircle className="h-8 w-8 text-indigo-600 mb-2" />
            <h3 className="font-semibold mb-2">FAQ</h3>
            <p className="text-sm text-gray-600 mb-3">
              Preguntas frecuentes resueltas
            </p>
            <a href="/faq" className="text-indigo-600 hover:underline text-sm">
              Ver FAQ →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

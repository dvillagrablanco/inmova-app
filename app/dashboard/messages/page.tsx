import { Metadata } from 'next';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export const metadata: Metadata = {
  title: 'Mensajes | Inmova',
  description: 'Centro de mensajería',
};

export default function MessagesPage() {
  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-64px)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
          <p className="text-gray-600 mt-1">
            Comunicación directa con inquilinos y proveedores
          </p>
        </div>

        <ChatInterface />
      </div>
    </AuthenticatedLayout>
  );
}

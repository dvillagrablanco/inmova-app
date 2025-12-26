import { Metadata } from 'next';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = {
  title: 'Mensajes | INMOVA',
  description: 'Chat interno entre usuarios de la plataforma',
};

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Mensajes" description="Comunicate con otros usuarios de tu empresa" />
      <ChatPanel />
    </div>
  );
}

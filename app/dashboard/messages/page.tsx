'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Send,
  Inbox,
  Mail,
  MailOpen,
  RefreshCw,
  Star,
  Archive,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  asunto: string;
  contenido: string;
  remitente: {
    id: string;
    nombre: string;
    email: string;
  };
  destinatario?: {
    id: string;
    nombre: string;
    email: string;
  };
  leido: boolean;
  destacado: boolean;
  archivado: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [filter, setFilter] = useState<'inbox' | 'starred' | 'archived'>('inbox');
  const [newMessage, setNewMessage] = useState({
    destinatario: '',
    asunto: '',
    contenido: '',
  });

  const handleOpenCompose = () => {
    setIsComposeOpen(true);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setNewMessage({
      destinatario: selectedMessage.remitente?.email || '',
      asunto: selectedMessage.asunto ? `Re: ${selectedMessage.asunto}` : '',
      contenido: '',
    });
    setSelectedMessage(null);
    setIsComposeOpen(true);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });

      if (response.ok) {
        toast.success('Mensaje enviado');
        setIsComposeOpen(false);
        setNewMessage({ destinatario: '', asunto: '', contenido: '' });
        fetchMessages();
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch (error) {
      toast.error('Error al enviar mensaje');
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.asunto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.contenido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.remitente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'starred') return matchesSearch && msg.destacado;
    if (filter === 'archived') return matchesSearch && msg.archivado;
    return matchesSearch && !msg.archivado;
  });

  const unreadCount = messages.filter(m => !m.leido && !m.archivado).length;
  const starredCount = messages.filter(m => m.destacado).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <Skeleton className="h-64" />
          </div>
          <div className="col-span-9">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mensajes</h1>
          <p className="text-gray-600 mt-1">Comunicación con inquilinos y proveedores</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
                <Button size="sm" onClick={handleOpenCompose}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Mensaje
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Mensaje</DialogTitle>
                <DialogDescription>Envía un mensaje a un inquilino o proveedor</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendMessage}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="destinatario">Para</Label>
                    <Input
                      id="destinatario"
                      value={newMessage.destinatario}
                      onChange={(e) => setNewMessage({ ...newMessage, destinatario: e.target.value })}
                      placeholder="Email del destinatario"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input
                      id="asunto"
                      value={newMessage.asunto}
                      onChange={(e) => setNewMessage({ ...newMessage, asunto: e.target.value })}
                      placeholder="Asunto del mensaje"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contenido">Mensaje</Label>
                    <Textarea
                      id="contenido"
                      value={newMessage.contenido}
                      onChange={(e) => setNewMessage({ ...newMessage, contenido: e.target.value })}
                      placeholder="Escribe tu mensaje..."
                      rows={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                <Button
                  variant={filter === 'inbox' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('inbox')}
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Bandeja de entrada
                  {unreadCount > 0 && (
                    <Badge className="ml-auto" variant="secondary">{unreadCount}</Badge>
                  )}
                </Button>
                <Button
                  variant={filter === 'starred' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('starred')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Destacados
                  {starredCount > 0 && (
                    <Badge className="ml-auto" variant="secondary">{starredCount}</Badge>
                  )}
                </Button>
                <Button
                  variant={filter === 'archived' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setFilter('archived')}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archivados
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar mensajes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Messages List */}
          <Card>
            <CardContent className="p-0">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay mensajes</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'No se encontraron mensajes' : 'Tu bandeja está vacía'}
                  </p>
                  <Button onClick={() => setIsComposeOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Mensaje
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer flex items-start gap-4 ${
                        !message.leido ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <Avatar>
                        <AvatarFallback>
                          {message.remitente?.nombre?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${!message.leido ? 'font-semibold' : ''}`}>
                            {message.remitente?.nombre || 'Usuario'}
                          </p>
                          {message.destacado && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                          {!message.leido && (
                            <Badge variant="secondary" className="ml-auto">Nuevo</Badge>
                          )}
                        </div>
                        <p className={`text-sm truncate ${!message.leido ? 'font-medium' : 'text-gray-600'}`}>
                          {message.asunto}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{message.contenido}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>
                    {selectedMessage.remitente?.nombre?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle>{selectedMessage.asunto}</DialogTitle>
                  <DialogDescription>
                    De: {selectedMessage.remitente?.nombre} ({selectedMessage.remitente?.email})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="whitespace-pre-wrap">{selectedMessage.contenido}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Cerrar
              </Button>
              <Button onClick={handleReply}>
                <Send className="h-4 w-4 mr-2" />
                Responder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

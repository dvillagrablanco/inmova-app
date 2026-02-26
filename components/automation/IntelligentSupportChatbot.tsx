'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
  Paperclip,
  Users,
  Home,
  Wrench,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type ChatChannel = 'ai' | 'team' | 'tenants';

interface AIMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatConversation {
  id: string;
  asunto: string;
  estado: string;
  participantName: string;
  participantType: string;
  companyName?: string;
  ultimoMensaje: string | null;
  ultimoMensajeFecha: string | null;
  unreadCount: number;
}

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: { nombre: string };
}

interface ChatMsg {
  id: string;
  mensaje: string;
  senderType: string;
  senderId?: string;
  createdAt: string;
  leido: boolean;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function IntelligentSupportChatbot() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState<ChatChannel>('ai');
  
  // AI state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    { id: '1', sender: 'bot', text: '¡Hola! Soy el asistente IA de INMOVA. Puedo ayudarte con cualquier gestión, analizar documentos o responder preguntas. 🚀', timestamp: new Date() }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team/Tenant chat state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  // Unread counts
  const [unreadTeam, setUnreadTeam] = useState(0);
  const [unreadTenants, setUnreadTenants] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { scrollToBottom(); }, [aiMessages, chatMessages]);

  // ═══════════════════════════════════════════════════════════
  // AI CHANNEL
  // ═══════════════════════════════════════════════════════════

  const sendAIMessage = async () => {
    if (!aiInput.trim() && !attachedFile) return;

    const userText = attachedFile
      ? `${aiInput || 'Analiza este archivo'} 📎 ${attachedFile.name}`
      : aiInput;

    setAiMessages(prev => [...prev, {
      id: Date.now().toString(), sender: 'user', text: userText, timestamp: new Date()
    }]);

    const currentInput = aiInput;
    const currentFile = attachedFile;
    setAiInput('');
    setAttachedFile(null);
    setAiTyping(true);

    try {
      const history = aiMessages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      let res;
      if (currentFile) {
        const formData = new FormData();
        formData.append('message', currentInput || `Analiza: ${currentFile.name}`);
        formData.append('file', currentFile);
        formData.append('conversationHistory', JSON.stringify(history));
        res = await fetch('/api/ai/assistant', { method: 'POST', body: formData });
      } else {
        res = await fetch('/api/ai/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: currentInput, conversationHistory: history })
        });
      }

      if (res.ok) {
        const data = await res.json();
        setAiMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.content || data.message || 'Respuesta recibida.',
          timestamp: new Date()
        }]);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.content || err.error || 'Error');
      }
    } catch (error: any) {
      logger.error('AI error:', error);
      setAiMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'bot',
        text: error.message?.includes('upgrade') ? error.message : 'Error procesando tu mensaje. Inténtalo de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setAiTyping(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // TEAM / TENANT CHANNELS
  // ═══════════════════════════════════════════════════════════

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) return;
      const data = await res.json();
      
      const allConvs: ChatConversation[] = data.conversations || [];
      setConversations(allConvs);
      setInternalUsers(data.internalUsers || []);
      
      // Calculate unread counts per channel
      const tenantConvs = allConvs.filter(c => c.participantType === 'tenant');
      const teamConvs = allConvs.filter(c => c.participantType !== 'tenant');
      setUnreadTenants(tenantConvs.reduce((s, c) => s + (c.unreadCount || 0), 0));
      setUnreadTeam(teamConvs.reduce((s, c) => s + (c.unreadCount || 0), 0));
    } catch {
      // Silent fail - widget should not block app
    }
  }, []);

  useEffect(() => {
    if (isOpen && (channel === 'team' || channel === 'tenants')) {
      loadConversations();
    }
  }, [isOpen, channel, loadConversations]);

  // Poll for new messages every 10s when chat is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [isOpen, loadConversations]);

  const loadChatMessages = async (conversationId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch {
      toast.error('Error cargando mensajes');
    } finally {
      setChatLoading(false);
    }
  };

  const loadUserMessages = async (userId: string) => {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/chat/messages/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages((data.messages || []).map((m: any) => ({
          id: m.id,
          mensaje: m.mensaje || m.titulo,
          senderType: m.isSent ? 'other' : 'user',
          createdAt: m.createdAt,
          leido: m.leida,
        })));
      }
    } catch {
      toast.error('Error cargando mensajes');
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    setChatSending(true);
    try {
      if (selectedConvId) {
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: selectedConvId, mensaje: chatInput.trim() })
        });
        loadChatMessages(selectedConvId);
      } else if (selectedUserId) {
        await fetch(`/api/chat/messages/${selectedUserId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: chatInput.trim() })
        });
        loadUserMessages(selectedUserId);
      }
      setChatInput('');
    } catch {
      toast.error('Error enviando mensaje');
    } finally {
      setChatSending(false);
    }
  };

  const openConversation = (conv: ChatConversation) => {
    setSelectedConvId(conv.id);
    setSelectedUserId(null);
    loadChatMessages(conv.id);
  };

  const openUserChat = (user: InternalUser) => {
    setSelectedUserId(user.id);
    setSelectedConvId(null);
    loadUserMessages(user.id);
  };

  const backToList = () => {
    setSelectedConvId(null);
    setSelectedUserId(null);
    setChatMessages([]);
  };

  // ═══════════════════════════════════════════════════════════
  // CHANNEL TABS
  // ═══════════════════════════════════════════════════════════

  const tabs: { key: ChatChannel; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'ai', label: 'IA', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { key: 'team', label: 'Equipo', icon: <Users className="h-3.5 w-3.5" />, badge: unreadTeam },
    { key: 'tenants', label: 'Inquilinos', icon: <Home className="h-3.5 w-3.5" />, badge: unreadTenants },
  ];

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  const totalUnread = unreadTeam + unreadTenants;
  const currentUserId = session?.user?.id;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[9998]"
          >
            <Button
              size="lg"
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-2 border-white/20 relative"
              aria-label="Abrir chat"
            >
              <MessageCircle className="h-6 w-6" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[9998] w-[380px] h-[540px] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {(selectedConvId || selectedUserId) && channel !== 'ai' ? (
                  <button onClick={backToList} className="hover:bg-white/20 rounded p-0.5">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                ) : null}
                <span className="font-semibold text-sm">
                  {channel === 'ai' ? '🤖 Asistente IA' :
                   selectedConvId || selectedUserId ? 'Conversación' :
                   channel === 'team' ? '👥 Equipo' : '🏠 Inquilinos'}
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Channel tabs */}
            <div className="flex border-b shrink-0 bg-muted/30">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setChannel(tab.key); backToList(); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors relative ${
                    channel === tab.key
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-background'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="ml-0.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {/* ═══ AI TAB ═══ */}
              {channel === 'ai' && (
                <>
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {aiMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                          {msg.sender === 'bot' && (
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                              <Bot className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-muted'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                      {aiTyping && (
                        <div className="flex gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
                            <Bot className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="bg-muted rounded-xl px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* AI Input */}
                  <div className="border-t p-2 shrink-0">
                    {attachedFile && (
                      <div className="flex items-center gap-2 px-2 py-1 mb-1 bg-muted rounded text-xs">
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate flex-1">{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendAIMessage())}
                        placeholder="Pregunta a la IA..."
                        className="h-9 text-sm"
                        disabled={aiTyping}
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 bg-indigo-600 hover:bg-indigo-700"
                        onClick={sendAIMessage}
                        disabled={aiTyping || (!aiInput.trim() && !attachedFile)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* ═══ TEAM / TENANTS TAB ═══ */}
              {(channel === 'team' || channel === 'tenants') && !selectedConvId && !selectedUserId && (
                <ScrollArea className="flex-1">
                  {/* Conversations */}
                  {conversations
                    .filter(c => channel === 'tenants' ? c.participantType === 'tenant' : c.participantType !== 'tenant')
                    .map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b flex items-start gap-2.5 transition-colors"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        conv.participantType === 'tenant' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {conv.participantType === 'tenant' ? <Home className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{conv.participantName}</span>
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px]">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        {conv.companyName && (
                          <span className="text-[10px] text-muted-foreground">{conv.companyName}</span>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.ultimoMensaje || conv.asunto || 'Sin mensajes'}
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Internal users (Team tab only) */}
                  {channel === 'team' && internalUsers.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase bg-muted/30">
                        Usuarios del equipo
                      </div>
                      {internalUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => openUserChat(user)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b flex items-center gap-2.5 transition-colors"
                        >
                          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{user.name || user.email}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {user.role} {user.company ? `· ${user.company.nombre}` : ''}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Empty state */}
                  {conversations.filter(c => channel === 'tenants' ? c.participantType === 'tenant' : c.participantType !== 'tenant').length === 0 && 
                   (channel === 'tenants' || internalUsers.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <MessageCircle className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm">Sin conversaciones</p>
                      <p className="text-xs mt-1">
                        {channel === 'tenants' ? 'Los inquilinos pueden contactarte desde su portal' : 'Selecciona un usuario del equipo'}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              )}

              {/* ═══ CONVERSATION VIEW ═══ */}
              {(channel === 'team' || channel === 'tenants') && (selectedConvId || selectedUserId) && (
                <>
                  <ScrollArea className="flex-1 p-3">
                    {chatLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chatMessages.map(msg => {
                          const isMe = msg.senderType === 'user' && msg.senderId === currentUserId;
                          const isOther = msg.senderType === 'other' || (msg.senderType === 'user' && msg.senderId !== currentUserId);
                          const isTenant = msg.senderType === 'tenant';
                          const alignRight = isMe || (!isTenant && !isOther && msg.senderType === 'user');
                          
                          return (
                            <div key={msg.id} className={`flex ${alignRight ? 'justify-end' : ''}`}>
                              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                alignRight
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-muted'
                              }`}>
                                <p className="whitespace-pre-wrap break-words">{msg.mensaje}</p>
                                <p className={`text-[9px] mt-1 ${alignRight ? 'text-white/60' : 'text-muted-foreground'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {chatMessages.length === 0 && !chatLoading && (
                          <p className="text-center text-xs text-muted-foreground py-8">
                            No hay mensajes. Envía el primero.
                          </p>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Chat input */}
                  <div className="border-t p-2 shrink-0">
                    <div className="flex gap-1.5">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                        placeholder="Escribe un mensaje..."
                        className="h-9 text-sm"
                        disabled={chatSending}
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 bg-indigo-600 hover:bg-indigo-700"
                        onClick={sendChatMessage}
                        disabled={chatSending || !chatInput.trim()}
                      >
                        {chatSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

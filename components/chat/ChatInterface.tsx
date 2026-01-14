'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/queries/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Search, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';

export function ChatInterface() {
  const { conversations, useMessages, sendMessage } = useChat();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');

  const { data: messages, isLoading: messagesLoading } = useMessages(selectedUserId || '');

  const filteredConversations = conversations.data?.filter(c =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    try {
      await sendMessage.mutateAsync({
        receiverId: selectedUserId,
        content: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar conversaciones..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.isLoading ? (
            <div className="p-4 text-center text-gray-500">Cargando chats...</div>
          ) : filteredConversations?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No hay conversaciones</p>
            </div>
          ) : (
            filteredConversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedUserId(conv.user.id)}
                className={cn(
                  "flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0",
                  selectedUserId === conv.user.id && "bg-indigo-50 border-indigo-100"
                )}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={conv.user.image} />
                    <AvatarFallback>{conv.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-medium text-sm text-gray-900 truncate">{conv.user.name}</h4>
                    <span className="text-xs text-gray-400">
                      {formatRelative(new Date(conv.updatedAt), new Date(), { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUserId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-white">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {conversations.data?.find(c => c.user.id === selectedUserId)?.user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-gray-900">
                  {conversations.data?.find(c => c.user.id === selectedUserId)?.user.name}
                </h3>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                </span>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messagesLoading ? (
                <div className="flex justify-center p-4">Cargando mensajes...</div>
              ) : messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare className="h-12 w-12 mb-2" />
                  <p>No hay mensajes aún. ¡Saluda!</p>
                </div>
              ) : (
                messages?.map((msg) => {
                  const isMe = msg.senderId !== selectedUserId; // Assuming current user is sender if not selectedUser
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1 text-right",
                            isMe ? "text-indigo-200" : "text-gray-400"
                          )}
                        >
                          {formatRelative(new Date(msg.createdAt), new Date(), { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || sendMessage.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-600">Selecciona una conversación</h3>
            <p>Elige un contacto de la lista para comenzar a chatear</p>
          </div>
        )}
      </div>
    </div>
  );
}

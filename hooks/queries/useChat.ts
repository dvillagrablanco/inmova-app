import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Conversation, Message } from '@/types/chat';

async function fetchConversations(): Promise<Conversation[]> {
  const response = await fetch('/api/chat/conversations');
  if (!response.ok) throw new Error('Error fetching conversations');
  return response.json();
}

async function fetchMessages(userId: string): Promise<Message[]> {
  if (!userId) return [];
  const response = await fetch(`/api/chat/messages/${userId}`);
  if (!response.ok) throw new Error('Error fetching messages');
  return response.json();
}

async function sendMessage(data: { receiverId: string; content: string }) {
  const response = await fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error sending message');
  return response.json();
}

export function useChat() {
  const queryClient = useQueryClient();

  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });

  const useMessages = (userId: string) => useQuery({
    queryKey: ['messages', userId],
    queryFn: () => fetchMessages(userId),
    enabled: !!userId,
    refetchInterval: 5000, // Polling for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations,
    useMessages,
    sendMessage: sendMessageMutation,
  };
}

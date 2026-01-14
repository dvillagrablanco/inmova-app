export interface Conversation {
  id: string;
  userId: string;
  lastMessage: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    email: string;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
}

export interface MessagesResponse {
  conversations: Conversation[];
}

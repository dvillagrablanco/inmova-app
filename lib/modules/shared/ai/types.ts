/**
 * Common types for AI services
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context?: Record<string, any>;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export interface AIChatResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface AISuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AIPrediction {
  prediction: any;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    value: any;
  }>;
}

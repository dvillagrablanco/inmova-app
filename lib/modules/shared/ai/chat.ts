/**
 * AI Chat Service
 * Handles conversational AI interactions
 */

import { AIMessage, AIConversation, AIChatOptions, AIChatResponse } from './types';
import logger from '@/lib/logger';
import { OpenAIService } from '@/lib/openai-service';

function ensureOpenAIConfigured(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurado');
  }
}

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  message: string,
  conversation?: AIConversation,
  options?: AIChatOptions
): Promise<AIChatResponse> {
  try {
    ensureOpenAIConfigured();

    logger.info('Sending chat message to AI', {
      messageLength: message.length,
      model: options?.model || 'default',
    });

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (conversation?.messages?.length) {
      messages.push(
        ...conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
    }

    messages.push({ role: 'user', content: message });

    const response = await OpenAIService.chatCompletion(messages);

    return {
      message: response || '',
      metadata: {
        provider: 'openai',
        model: options?.model || 'default',
      },
    };
  } catch (error: any) {
    logger.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Create a new conversation
 */
export function createConversation(
  systemPrompt?: string,
  context?: Record<string, any>
): AIConversation {
  const conversation: AIConversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    messages: [],
    context,
  };

  if (systemPrompt) {
    conversation.messages.push({
      role: 'system',
      content: systemPrompt,
      timestamp: new Date(),
    });
  }

  return conversation;
}

/**
 * Add message to conversation
 */
export function addMessageToConversation(
  conversation: AIConversation,
  role: 'user' | 'assistant',
  content: string
): AIConversation {
  conversation.messages.push({
    role,
    content,
    timestamp: new Date(),
  });

  return conversation;
}

/**
 * Get conversation summary
 */
export async function summarizeConversation(
  conversation: AIConversation
): Promise<string> {
  try {
    ensureOpenAIConfigured();

    logger.info('Summarizing conversation', {
      messageCount: conversation.messages.length,
    });

    const transcript = conversation.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const summary = await OpenAIService.chatCompletion([
      {
        role: 'system',
        content:
          'Resume la conversación de forma breve, en español, destacando acciones y decisiones.',
      },
      { role: 'user', content: transcript },
    ]);

    return summary || '';
  } catch (error: any) {
    logger.error('Error summarizing conversation:', error);
    throw error;
  }
}

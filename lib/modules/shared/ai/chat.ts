/**
 * AI Chat Service
 * Handles conversational AI interactions using Anthropic Claude
 */

import { AIMessage, AIConversation, AIChatOptions, AIChatResponse } from './types';
import logger from '@/lib/logger';
import { generateAICompletion } from '@/lib/ai-service';

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  message: string,
  conversation?: AIConversation,
  options?: AIChatOptions
): Promise<AIChatResponse> {
  try {
    logger.info('Sending chat message to AI (Claude)', {
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

    const response = await generateAICompletion(messages, {
      systemPrompt: options?.systemPrompt,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 1000,
    });

    return {
      message: response || '',
      metadata: {
        provider: 'anthropic',
        model: options?.model || 'claude',
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
    logger.info('Summarizing conversation (Claude)', {
      messageCount: conversation.messages.length,
    });

    const transcript = conversation.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const summary = await generateAICompletion(
      [{ role: 'user', content: transcript }],
      {
        systemPrompt: 'Resume la conversación de forma breve, en español, destacando acciones y decisiones.',
        temperature: 0.3,
        maxTokens: 500,
      }
    );

    return summary || '';
  } catch (error: any) {
    logger.error('Error summarizing conversation:', error);
    throw error;
  }
}

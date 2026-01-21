/**
 * AI Chat Service
 * Handles conversational AI interactions
 */

import { AIMessage, AIConversation, AIChatOptions, AIChatResponse } from './types';
import logger from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  message: string,
  conversation?: AIConversation,
  options?: AIChatOptions
): Promise<AIChatResponse> {
  try {
    logger.info('Sending chat message to AI', {
      messageLength: message.length,
      model: options?.model || 'default',
    });

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY no configurada');
    }

    const systemPrompt =
      options?.systemPrompt ||
      conversation?.messages.find((msg) => msg.role === 'system')?.content;

    const messages: Anthropic.Messages.MessageParam[] = [
      ...(conversation?.messages || [])
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      { role: 'user', content: message },
    ];

    const response = await anthropic.messages.create({
      model: options?.model || DEFAULT_MODEL,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.2,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

    return {
      message: content,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      metadata: {
        model: response.model,
        stopReason: response.stop_reason,
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
    logger.info('Summarizing conversation', {
      messageCount: conversation.messages.length,
    });

    if (!process.env.ANTHROPIC_API_KEY) {
      const recent = conversation.messages.slice(-5).map((msg) => `${msg.role}: ${msg.content}`);
      return recent.join(' | ').slice(0, 500);
    }

    const summaryPrompt = `Resume brevemente la conversación en 3-5 frases:\n\n${conversation.messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n')}`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 300,
      temperature: 0.2,
      messages: [{ role: 'user', content: summaryPrompt }],
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return content.trim();
  } catch (error: any) {
    logger.error('Error summarizing conversation:', error);
    return '';
  }
}

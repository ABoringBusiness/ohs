import { ApiClient } from './api-client';
import { Conversation, ConversationList, Message, MessageList, MessageType } from '../models/types';

/**
 * Service for managing conversations
 */
export class ConversationService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get all conversations
   */
  async getConversations(limit: number = 20, offset: number = 0): Promise<ConversationList> {
    return this.apiClient.get<ConversationList>(`/conversations?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return this.apiClient.get<Conversation>(`/conversations/${conversationId}`);
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<Conversation> {
    return this.apiClient.post<Conversation>('/conversations', { title });
  }

  /**
   * Update a conversation
   */
  async updateConversation(conversationId: string, title: string): Promise<Conversation> {
    return this.apiClient.put<Conversation>(`/conversations/${conversationId}`, { title });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.apiClient.delete(`/conversations/${conversationId}`);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<MessageList> {
    return this.apiClient.get<MessageList>(
      `/conversation/${conversationId}/messages?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    return this.apiClient.post<Message>(`/conversation/${conversationId}/messages`, {
      content,
      type: MessageType.USER_MESSAGE,
    });
  }

  /**
   * Get the stream URL for a conversation
   */
  getStreamUrl(conversationId: string): string {
    return `${this.apiClient.getBaseUrl()}/api/conversation/${conversationId}/stream`;
  }
}
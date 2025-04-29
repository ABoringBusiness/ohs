import { HttpClient, Conversation, ConversationList, Message, MessageList, MessageType, ContextData } from '../types';

/**
 * Service for managing conversations
 */
export class ConversationService {
  private httpClient: HttpClient;
  private apiBaseUrl: string;

  constructor(httpClient: HttpClient, apiBaseUrl: string) {
    this.httpClient = httpClient;
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Get all conversations
   */
  async getConversations(limit: number = 20, offset: number = 0): Promise<ConversationList> {
    return this.httpClient.get<ConversationList>(`/conversations?limit=${limit}&offset=${offset}`);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return this.httpClient.get<Conversation>(`/conversations/${conversationId}`);
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<Conversation> {
    return this.httpClient.post<Conversation>('/conversations', { title });
  }

  /**
   * Update a conversation
   */
  async updateConversation(conversationId: string, title: string): Promise<Conversation> {
    return this.httpClient.put<Conversation>(`/conversations/${conversationId}`, { title });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.httpClient.delete(`/conversations/${conversationId}`);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<MessageList> {
    return this.httpClient.get<MessageList>(
      `/conversation/${conversationId}/messages?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(conversationId: string, content: string, context?: ContextData): Promise<Message> {
    const payload: any = {
      content,
      type: MessageType.USER_MESSAGE,
    };
    
    // Add context if provided
    if (context) {
      payload.metadata = {
        context
      };
    }
    
    return this.httpClient.post<Message>(`/conversation/${conversationId}/messages`, payload);
  }

  /**
   * Get the stream URL for a conversation
   */
  getStreamUrl(conversationId: string): string {
    return `${this.apiBaseUrl}/api/conversation/${conversationId}/stream`;
  }

  /**
   * Ask a question with context (convenience method)
   * Creates a new conversation if conversationId is not provided
   */
  async ask(question: string, context?: ContextData, conversationId?: string): Promise<{message: Message, conversation: Conversation}> {
    // Create a new conversation if needed
    let conversation: Conversation;
    if (!conversationId) {
      const title = question.length > 30 ? `${question.substring(0, 30)}...` : question;
      conversation = await this.createConversation(title);
      conversationId = conversation.id;
    } else {
      conversation = await this.getConversation(conversationId);
    }
    
    // Send the message
    const message = await this.sendMessage(conversationId, question, context);
    
    return { message, conversation };
  }
}
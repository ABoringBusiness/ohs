import { HttpClient, BotMessage, BotResponse, ContextData } from '../types';
import { ConversationService } from './conversation-service';

/**
 * Client for bot integrations (e.g., Loop Message)
 */
export class BotClient {
  private httpClient: HttpClient;
  private conversationService: ConversationService;
  private apiBaseUrl: string;

  constructor(httpClient: HttpClient, conversationService: ConversationService, apiBaseUrl: string) {
    this.httpClient = httpClient;
    this.conversationService = conversationService;
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Process a message from a bot platform
   */
  async processMessage(message: BotMessage): Promise<BotResponse> {
    try {
      // Use existing conversation or create a new one
      let conversationId = message.conversationId;
      let response;
      
      if (conversationId) {
        // Send message to existing conversation
        const aiMessage = await this.conversationService.sendMessage(
          conversationId,
          message.text,
          message.context
        );
        
        response = {
          text: aiMessage.content,
          conversationId: conversationId,
          messageId: aiMessage.id
        };
      } else {
        // Create a new conversation and send message
        const result = await this.conversationService.ask(message.text, message.context);
        
        response = {
          text: result.message.content,
          conversationId: result.conversation.id,
          messageId: result.message.id
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error processing bot message:', error);
      throw error;
    }
  }

  /**
   * Send a message to a webhook
   */
  async sendWebhookMessage(webhookUrl: string, message: BotResponse): Promise<void> {
    try {
      await this.httpClient.post(webhookUrl, message);
    } catch (error) {
      console.error('Error sending webhook message:', error);
      throw error;
    }
  }

  /**
   * Process a message and send the response to a webhook
   */
  async processAndRespond(message: BotMessage, webhookUrl: string): Promise<BotResponse> {
    const response = await this.processMessage(message);
    await this.sendWebhookMessage(webhookUrl, response);
    return response;
  }
}
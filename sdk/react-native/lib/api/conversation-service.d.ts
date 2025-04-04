import { ApiClient } from './api-client';
import { Conversation, ConversationList, Message, MessageList } from '../models/types';
/**
 * Service for managing conversations
 */
export declare class ConversationService {
    private apiClient;
    constructor(apiClient: ApiClient);
    /**
     * Get all conversations
     */
    getConversations(limit?: number, offset?: number): Promise<ConversationList>;
    /**
     * Get a specific conversation
     */
    getConversation(conversationId: string): Promise<Conversation>;
    /**
     * Create a new conversation
     */
    createConversation(title: string): Promise<Conversation>;
    /**
     * Update a conversation
     */
    updateConversation(conversationId: string, title: string): Promise<Conversation>;
    /**
     * Delete a conversation
     */
    deleteConversation(conversationId: string): Promise<void>;
    /**
     * Get messages for a conversation
     */
    getMessages(conversationId: string, limit?: number, offset?: number): Promise<MessageList>;
    /**
     * Send a message in a conversation
     */
    sendMessage(conversationId: string, content: string): Promise<Message>;
    /**
     * Get the stream URL for a conversation
     */
    getStreamUrl(conversationId: string): string;
}
//# sourceMappingURL=conversation-service.d.ts.map
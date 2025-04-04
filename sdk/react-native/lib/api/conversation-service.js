"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const types_1 = require("../models/types");
/**
 * Service for managing conversations
 */
class ConversationService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Get all conversations
     */
    async getConversations(limit = 20, offset = 0) {
        return this.apiClient.get(`/conversations?limit=${limit}&offset=${offset}`);
    }
    /**
     * Get a specific conversation
     */
    async getConversation(conversationId) {
        return this.apiClient.get(`/conversations/${conversationId}`);
    }
    /**
     * Create a new conversation
     */
    async createConversation(title) {
        return this.apiClient.post('/conversations', { title });
    }
    /**
     * Update a conversation
     */
    async updateConversation(conversationId, title) {
        return this.apiClient.put(`/conversations/${conversationId}`, { title });
    }
    /**
     * Delete a conversation
     */
    async deleteConversation(conversationId) {
        await this.apiClient.delete(`/conversations/${conversationId}`);
    }
    /**
     * Get messages for a conversation
     */
    async getMessages(conversationId, limit = 50, offset = 0) {
        return this.apiClient.get(`/conversation/${conversationId}/messages?limit=${limit}&offset=${offset}`);
    }
    /**
     * Send a message in a conversation
     */
    async sendMessage(conversationId, content) {
        return this.apiClient.post(`/conversation/${conversationId}/messages`, {
            content,
            type: types_1.MessageType.USER_MESSAGE,
        });
    }
    /**
     * Get the stream URL for a conversation
     */
    getStreamUrl(conversationId) {
        return `${this.apiClient.getBaseUrl()}/api/conversation/${conversationId}/stream`;
    }
}
exports.ConversationService = ConversationService;
//# sourceMappingURL=conversation-service.js.map
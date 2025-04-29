"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const types_1 = require("../models/types");
/**
 * Service for managing shared sessions
 */
class SessionService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Share a conversation as a collaborative session
     */
    async shareSession(conversationId, title, options = {}) {
        const payload = {
            conversation_id: conversationId,
            title,
            description: options.description || '',
            visibility: options.visibility || types_1.SessionVisibility.PRIVATE,
            password: options.password,
            expires_in: options.expiresIn,
            allow_viewer_chat: options.allowViewerChat !== false,
            show_participant_cursors: options.showParticipantCursors !== false,
            max_viewers: options.maxViewers,
        };
        return this.apiClient.post('/session-sharing/share', payload);
    }
    /**
     * Get a specific session
     */
    async getSession(sessionId) {
        return this.apiClient.get(`/session-sharing/sessions/${sessionId}`);
    }
    /**
     * Join a shared session
     */
    async joinSession(sessionId, options = {}) {
        return this.apiClient.post(`/session-sharing/sessions/${sessionId}/join`, {
            password: options.password,
            invitation_token: options.invitationToken,
        });
    }
    /**
     * Invite a user to a session
     */
    async inviteUser(sessionId, options) {
        return this.apiClient.post(`/session-sharing/sessions/${sessionId}/invite`, {
            email: options.email,
            user_id: options.userId,
            role: options.role || types_1.ParticipantRole.VIEWER,
            expires_in: options.expiresIn,
        });
    }
    /**
     * Update a session's visibility
     */
    async updateSessionVisibility(sessionId, visibility, password) {
        return this.apiClient.put(`/session-sharing/sessions/${sessionId}/visibility`, {
            visibility,
            password,
        });
    }
    /**
     * Get public sessions
     */
    async getPublicSessions(limit = 20, offset = 0) {
        return this.apiClient.get(`/session-sharing/public?limit=${limit}&offset=${offset}`);
    }
    /**
     * Get session participants
     */
    async getSessionParticipants(sessionId) {
        return this.apiClient.get(`/session-sharing/sessions/${sessionId}/participants`);
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session-service.js.map
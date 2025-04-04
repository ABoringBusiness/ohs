import { ApiClient } from './api-client';
import { Session, SessionInvitation, SessionParticipant, SessionVisibility, ParticipantRole } from '../models/types';
/**
 * Service for managing shared sessions
 */
export declare class SessionService {
    private apiClient;
    constructor(apiClient: ApiClient);
    /**
     * Share a conversation as a collaborative session
     */
    shareSession(conversationId: string, title: string, options?: {
        description?: string;
        visibility?: SessionVisibility;
        password?: string;
        expiresIn?: number;
        allowViewerChat?: boolean;
        showParticipantCursors?: boolean;
        maxViewers?: number;
    }): Promise<Session>;
    /**
     * Get a specific session
     */
    getSession(sessionId: string): Promise<Session>;
    /**
     * Join a shared session
     */
    joinSession(sessionId: string, options?: {
        password?: string;
        invitationToken?: string;
    }): Promise<SessionParticipant>;
    /**
     * Invite a user to a session
     */
    inviteUser(sessionId: string, options: {
        email?: string;
        userId?: string;
        role?: ParticipantRole;
        expiresIn?: number;
    }): Promise<SessionInvitation>;
    /**
     * Update a session's visibility
     */
    updateSessionVisibility(sessionId: string, visibility: SessionVisibility, password?: string): Promise<Session>;
    /**
     * Get public sessions
     */
    getPublicSessions(limit?: number, offset?: number): Promise<{
        sessions: Session[];
        total: number;
    }>;
    /**
     * Get session participants
     */
    getSessionParticipants(sessionId: string): Promise<SessionParticipant[]>;
}
//# sourceMappingURL=session-service.d.ts.map
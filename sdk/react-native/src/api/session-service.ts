import { ApiClient } from './api-client';
import { 
  Session, 
  SessionInvitation, 
  SessionParticipant, 
  SessionVisibility, 
  ParticipantRole 
} from '../models/types';

/**
 * Service for managing shared sessions
 */
export class SessionService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Share a conversation as a collaborative session
   */
  async shareSession(
    conversationId: string,
    title: string,
    options: {
      description?: string;
      visibility?: SessionVisibility;
      password?: string;
      expiresIn?: number;
      allowViewerChat?: boolean;
      showParticipantCursors?: boolean;
      maxViewers?: number;
    } = {}
  ): Promise<Session> {
    const payload = {
      conversation_id: conversationId,
      title,
      description: options.description || '',
      visibility: options.visibility || SessionVisibility.PRIVATE,
      password: options.password,
      expires_in: options.expiresIn,
      allow_viewer_chat: options.allowViewerChat !== false,
      show_participant_cursors: options.showParticipantCursors !== false,
      max_viewers: options.maxViewers,
    };

    return this.apiClient.post<Session>('/session-sharing/share', payload);
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId: string): Promise<Session> {
    return this.apiClient.get<Session>(`/session-sharing/sessions/${sessionId}`);
  }

  /**
   * Join a shared session
   */
  async joinSession(
    sessionId: string,
    options: {
      password?: string;
      invitationToken?: string;
    } = {}
  ): Promise<SessionParticipant> {
    return this.apiClient.post<SessionParticipant>(
      `/session-sharing/sessions/${sessionId}/join`,
      {
        password: options.password,
        invitation_token: options.invitationToken,
      }
    );
  }

  /**
   * Invite a user to a session
   */
  async inviteUser(
    sessionId: string,
    options: {
      email?: string;
      userId?: string;
      role?: ParticipantRole;
      expiresIn?: number;
    }
  ): Promise<SessionInvitation> {
    return this.apiClient.post<SessionInvitation>(
      `/session-sharing/sessions/${sessionId}/invite`,
      {
        email: options.email,
        user_id: options.userId,
        role: options.role || ParticipantRole.VIEWER,
        expires_in: options.expiresIn,
      }
    );
  }

  /**
   * Update a session's visibility
   */
  async updateSessionVisibility(
    sessionId: string,
    visibility: SessionVisibility,
    password?: string
  ): Promise<Session> {
    return this.apiClient.put<Session>(
      `/session-sharing/sessions/${sessionId}/visibility`,
      {
        visibility,
        password,
      }
    );
  }

  /**
   * Get public sessions
   */
  async getPublicSessions(limit: number = 20, offset: number = 0): Promise<{ sessions: Session[], total: number }> {
    return this.apiClient.get<{ sessions: Session[], total: number }>(
      `/session-sharing/public?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Get session participants
   */
  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return this.apiClient.get<SessionParticipant[]>(`/session-sharing/sessions/${sessionId}/participants`);
  }
}
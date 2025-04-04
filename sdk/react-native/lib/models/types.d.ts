/**
 * OpenHands SDK Types
 */
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
}
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}
export interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    last_message?: string;
    last_message_at?: string;
    is_pinned?: boolean;
    tags?: string[];
}
export interface ConversationList {
    conversations: Conversation[];
    total: number;
}
export declare enum MessageType {
    USER_MESSAGE = "user_message",
    AI_MESSAGE = "ai_message",
    SYSTEM_MESSAGE = "system_message"
}
export interface Message {
    id: string;
    conversation_id: string;
    content: string;
    type: MessageType;
    created_at: string;
    user_id?: string;
    metadata?: Record<string, any>;
}
export interface MessageList {
    messages: Message[];
    total: number;
}
export declare enum SessionVisibility {
    PRIVATE = "private",
    LINK = "link",
    PUBLIC = "public"
}
export declare enum ParticipantRole {
    OWNER = "owner",
    COLLABORATOR = "collaborator",
    VIEWER = "viewer",
    MODERATOR = "moderator"
}
export interface SessionSettings {
    allow_viewer_chat: boolean;
    show_participant_cursors: boolean;
    max_viewers?: number;
}
export interface Session {
    id: string;
    owner_id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    visibility: SessionVisibility;
    expires_at?: string;
    is_active: boolean;
    conversation_id: string;
    settings: SessionSettings;
    view_count: number;
    participant_count: number;
    share_url: string;
}
export interface SessionParticipant {
    id: string;
    user_id: string;
    role: ParticipantRole;
    joined_at: string;
    last_active_at: string;
    is_online: boolean;
    settings: Record<string, any>;
}
export interface SessionInvitation {
    id: string;
    session_id: string;
    created_by: string;
    created_at: string;
    expires_at?: string;
    role: ParticipantRole;
    email?: string;
    user_id?: string;
    token: string;
    invitation_url: string;
}
export declare enum WebSocketMessageType {
    AUTHENTICATE = "authenticate",
    USER_MESSAGE = "user_message",
    AI_MESSAGE = "ai_message",
    STATUS_UPDATE = "status_update",
    ERROR = "error",
    PARTICIPANT_JOINED = "participant_joined",
    PARTICIPANT_LEFT = "participant_left",
    CHAT_MESSAGE = "chat_message",
    CURSOR_POSITION = "cursor_position",
    PING = "ping",
    PONG = "pong"
}
export interface WebSocketMessage {
    type: WebSocketMessageType;
    [key: string]: any;
}
export interface OpenHandsConfig {
    apiUrl: string;
    wsUrl: string;
    storage?: 'keychain' | 'async-storage';
}
//# sourceMappingURL=types.d.ts.map
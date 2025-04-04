/**
 * OpenHands Universal SDK Types
 */

// Environment types
export enum Environment {
  BROWSER = 'browser',
  NODE = 'node',
  CHROME_EXTENSION = 'chrome-extension',
  REACT_NATIVE = 'react-native',
}

// Storage types
export enum StorageType {
  LOCAL_STORAGE = 'local-storage',
  CHROME_STORAGE = 'chrome-storage',
  MEMORY = 'memory',
  CUSTOM = 'custom',
}

// User types
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

// Conversation types
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

// Message types
export enum MessageType {
  USER_MESSAGE = 'user_message',
  AI_MESSAGE = 'ai_message',
  SYSTEM_MESSAGE = 'system_message',
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

// Session sharing types
export enum SessionVisibility {
  PRIVATE = 'private',
  LINK = 'link',
  PUBLIC = 'public',
}

export enum ParticipantRole {
  OWNER = 'owner',
  COLLABORATOR = 'collaborator',
  VIEWER = 'viewer',
  MODERATOR = 'moderator',
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

// WebSocket message types
export enum WebSocketMessageType {
  AUTHENTICATE = 'authenticate',
  USER_MESSAGE = 'user_message',
  AI_MESSAGE = 'ai_message',
  STATUS_UPDATE = 'status_update',
  ERROR = 'error',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
  CHAT_MESSAGE = 'chat_message',
  CURSOR_POSITION = 'cursor_position',
  PING = 'ping',
  PONG = 'pong',
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

// SDK Configuration
export interface OpenHandsConfig {
  apiUrl: string;
  wsUrl: string;
  environment?: Environment;
  storage?: StorageType | CustomStorageAdapter;
  debug?: boolean;
  customFetch?: typeof fetch;
  customWebSocket?: typeof WebSocket;
}

// Storage adapter interface
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Custom storage adapter
export interface CustomStorageAdapter {
  type: StorageType.CUSTOM;
  implementation: StorageAdapter;
}

// HTTP client interface
export interface HttpClient {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
}

// WebSocket client interface
export interface WebSocketClient {
  connect(url: string): Promise<void>;
  disconnect(): void;
  send(message: any): Promise<void>;
  onMessage(callback: (message: any) => void): () => void;
  onOpen(callback: () => void): () => void;
  onClose(callback: (event: any) => void): () => void;
  onError(callback: (error: any) => void): () => void;
  isConnected(): boolean;
}

// Auth manager interface
export interface AuthManager {
  initialize(): Promise<boolean>;
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, name: string): Promise<User>;
  signOut(): Promise<void>;
  refreshToken(): Promise<string | null>;
  getAccessToken(): Promise<string | null>;
  getCurrentUser(): User | null;
  isAuthenticated(): Promise<boolean>;
  onAuthStateChanged(callback: (isAuthenticated: boolean, user: User | null) => void): () => void;
}

// Context data for bots and extensions
export interface ContextData {
  url?: string;
  title?: string;
  text?: string;
  metadata?: Record<string, any>;
}

// Bot message interface
export interface BotMessage {
  text: string;
  userId: string;
  conversationId?: string;
  context?: ContextData;
}

// Bot response interface
export interface BotResponse {
  text: string;
  conversationId: string;
  messageId: string;
}

// Extension context interface
export interface ExtensionContext {
  tabId?: number;
  frameId?: number;
  url?: string;
  title?: string;
  selectedText?: string;
  pageContent?: string;
}
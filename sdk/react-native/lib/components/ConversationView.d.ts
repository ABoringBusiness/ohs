import React from 'react';
import { ConversationService } from '../api/conversation-service';
import { WebSocketManager } from '../websocket/websocket-manager';
interface ConversationViewProps {
    conversationId: string;
    conversationService: ConversationService;
    webSocketManager: WebSocketManager;
    onError?: (error: Error) => void;
}
export declare const ConversationView: React.FC<ConversationViewProps>;
export {};
//# sourceMappingURL=ConversationView.d.ts.map
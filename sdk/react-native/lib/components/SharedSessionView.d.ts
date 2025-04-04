import React from 'react';
import { SessionService } from '../api/session-service';
import { WebSocketManager } from '../websocket/websocket-manager';
interface SharedSessionViewProps {
    sessionId: string;
    sessionService: SessionService;
    webSocketManager: WebSocketManager;
    onError?: (error: Error) => void;
}
export declare const SharedSessionView: React.FC<SharedSessionViewProps>;
export {};
//# sourceMappingURL=SharedSessionView.d.ts.map
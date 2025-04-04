"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.ConnectionState = exports.SharedSessionView = exports.ConversationView = exports.OpenHandsClient = void 0;
// Main client
var OpenHandsClient_1 = require("./OpenHandsClient");
Object.defineProperty(exports, "OpenHandsClient", { enumerable: true, get: function () { return OpenHandsClient_1.OpenHandsClient; } });
// Components
var ConversationView_1 = require("./components/ConversationView");
Object.defineProperty(exports, "ConversationView", { enumerable: true, get: function () { return ConversationView_1.ConversationView; } });
var SharedSessionView_1 = require("./components/SharedSessionView");
Object.defineProperty(exports, "SharedSessionView", { enumerable: true, get: function () { return SharedSessionView_1.SharedSessionView; } });
// Models
__exportStar(require("./models/types"), exports);
// WebSocket
var websocket_manager_1 = require("./websocket/websocket-manager");
Object.defineProperty(exports, "ConnectionState", { enumerable: true, get: function () { return websocket_manager_1.ConnectionState; } });
// Version
exports.VERSION = '0.1.0';
//# sourceMappingURL=index.js.map
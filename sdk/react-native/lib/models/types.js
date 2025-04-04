"use strict";
/**
 * OpenHands SDK Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketMessageType = exports.ParticipantRole = exports.SessionVisibility = exports.MessageType = void 0;
// Message types
var MessageType;
(function (MessageType) {
    MessageType["USER_MESSAGE"] = "user_message";
    MessageType["AI_MESSAGE"] = "ai_message";
    MessageType["SYSTEM_MESSAGE"] = "system_message";
})(MessageType || (exports.MessageType = MessageType = {}));
// Session sharing types
var SessionVisibility;
(function (SessionVisibility) {
    SessionVisibility["PRIVATE"] = "private";
    SessionVisibility["LINK"] = "link";
    SessionVisibility["PUBLIC"] = "public";
})(SessionVisibility || (exports.SessionVisibility = SessionVisibility = {}));
var ParticipantRole;
(function (ParticipantRole) {
    ParticipantRole["OWNER"] = "owner";
    ParticipantRole["COLLABORATOR"] = "collaborator";
    ParticipantRole["VIEWER"] = "viewer";
    ParticipantRole["MODERATOR"] = "moderator";
})(ParticipantRole || (exports.ParticipantRole = ParticipantRole = {}));
// WebSocket message types
var WebSocketMessageType;
(function (WebSocketMessageType) {
    WebSocketMessageType["AUTHENTICATE"] = "authenticate";
    WebSocketMessageType["USER_MESSAGE"] = "user_message";
    WebSocketMessageType["AI_MESSAGE"] = "ai_message";
    WebSocketMessageType["STATUS_UPDATE"] = "status_update";
    WebSocketMessageType["ERROR"] = "error";
    WebSocketMessageType["PARTICIPANT_JOINED"] = "participant_joined";
    WebSocketMessageType["PARTICIPANT_LEFT"] = "participant_left";
    WebSocketMessageType["CHAT_MESSAGE"] = "chat_message";
    WebSocketMessageType["CURSOR_POSITION"] = "cursor_position";
    WebSocketMessageType["PING"] = "ping";
    WebSocketMessageType["PONG"] = "pong";
})(WebSocketMessageType || (exports.WebSocketMessageType = WebSocketMessageType = {}));
//# sourceMappingURL=types.js.map
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedSessionView = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const types_1 = require("../models/types");
const websocket_manager_1 = require("../websocket/websocket-manager");
const SharedSessionView = ({ sessionId, sessionService, webSocketManager, onError, }) => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [chatMessages, setChatMessages] = (0, react_1.useState)([]);
    const [inputText, setInputText] = (0, react_1.useState)('');
    const [chatInputText, setChatInputText] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSending, setIsSending] = (0, react_1.useState)(false);
    const [connectionState, setConnectionState] = (0, react_1.useState)(webSocketManager.getConnectionState());
    const [participants, setParticipants] = (0, react_1.useState)([]);
    const [showParticipants, setShowParticipants] = (0, react_1.useState)(false);
    const [showChat, setShowChat] = (0, react_1.useState)(false);
    const flatListRef = (0, react_1.useRef)(null);
    const chatListRef = (0, react_1.useRef)(null);
    // Load initial data and set up WebSocket connection
    (0, react_1.useEffect)(() => {
        const loadSessionData = async () => {
            try {
                setIsLoading(true);
                // Get session participants
                const sessionParticipants = await sessionService.getSessionParticipants(sessionId);
                setParticipants(sessionParticipants);
                // Get session details to get the conversation ID
                const session = await sessionService.getSession(sessionId);
                // We would need to get messages from the conversation service
                // This is simplified for the example
                setMessages([]);
            }
            catch (error) {
                console.error('Error loading session data:', error);
                onError === null || onError === void 0 ? void 0 : onError(error);
            }
            finally {
                setIsLoading(false);
            }
        };
        // Connect to WebSocket
        const connectWebSocket = async () => {
            try {
                await webSocketManager.connectToSession(sessionId);
            }
            catch (error) {
                console.error('Error connecting to WebSocket:', error);
                onError === null || onError === void 0 ? void 0 : onError(error);
            }
        };
        loadSessionData();
        connectWebSocket();
        // Set up WebSocket message listener
        const removeMessageListener = webSocketManager.addMessageListener(handleWebSocketMessage);
        // Set up connection state listener
        const removeStateListener = webSocketManager.addStateChangeListener(setConnectionState);
        // Clean up
        return () => {
            webSocketManager.disconnect();
            removeMessageListener();
            removeStateListener();
        };
    }, [sessionId]);
    // Scroll to bottom when messages change
    (0, react_1.useEffect)(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                var _a;
                (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);
    // Scroll to bottom when chat messages change
    (0, react_1.useEffect)(() => {
        if (chatMessages.length > 0 && chatListRef.current) {
            setTimeout(() => {
                var _a;
                (_a = chatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages]);
    // Handle WebSocket messages
    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case types_1.WebSocketMessageType.AI_MESSAGE:
                const aiMessage = {
                    id: message.message_id || `temp-${Date.now()}`,
                    conversation_id: message.conversation_id,
                    content: message.content,
                    type: types_1.MessageType.AI_MESSAGE,
                    created_at: new Date().toISOString(),
                };
                setMessages(prevMessages => [...prevMessages, aiMessage]);
                break;
            case types_1.WebSocketMessageType.CHAT_MESSAGE:
                setChatMessages(prevMessages => [...prevMessages, message.message]);
                break;
            case types_1.WebSocketMessageType.PARTICIPANT_JOINED:
                setParticipants(prevParticipants => {
                    // Check if participant already exists
                    const exists = prevParticipants.some(p => p.id === message.participant.id);
                    if (exists) {
                        return prevParticipants.map(p => p.id === message.participant.id ? { ...p, is_online: true } : p);
                    }
                    else {
                        return [...prevParticipants, message.participant];
                    }
                });
                break;
            case types_1.WebSocketMessageType.PARTICIPANT_LEFT:
                setParticipants(prevParticipants => prevParticipants.map(p => p.user_id === message.user_id ? { ...p, is_online: false } : p));
                break;
        }
    };
    // Send a message
    const sendMessage = async () => {
        if (!inputText.trim() || isSending)
            return;
        const content = inputText.trim();
        setInputText('');
        setIsSending(true);
        try {
            // Add user message to the UI immediately
            const tempUserMessage = {
                id: `temp-${Date.now()}`,
                conversation_id: 'session',
                content,
                type: types_1.MessageType.USER_MESSAGE,
                created_at: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, tempUserMessage]);
            // Send via WebSocket
            await webSocketManager.sendUserMessage(content);
        }
        catch (error) {
            console.error('Error sending message:', error);
            onError === null || onError === void 0 ? void 0 : onError(error);
        }
        finally {
            setIsSending(false);
        }
    };
    // Send a chat message
    const sendChatMessage = async () => {
        if (!chatInputText.trim())
            return;
        const content = chatInputText.trim();
        setChatInputText('');
        try {
            await webSocketManager.sendChatMessage(content);
        }
        catch (error) {
            console.error('Error sending chat message:', error);
            onError === null || onError === void 0 ? void 0 : onError(error);
        }
    };
    // Render a message
    const renderMessage = ({ item }) => (<react_native_1.View style={[
            styles.messageBubble,
            item.type === types_1.MessageType.USER_MESSAGE ? styles.userMessage : styles.aiMessage
        ]}>
      <react_native_1.Text style={styles.messageText}>{item.content}</react_native_1.Text>
    </react_native_1.View>);
    // Render a chat message
    const renderChatMessage = ({ item }) => (<react_native_1.View style={styles.chatMessage}>
      <react_native_1.Text style={styles.chatSender}>{item.user_id}</react_native_1.Text>
      <react_native_1.Text style={styles.chatContent}>{item.content}</react_native_1.Text>
    </react_native_1.View>);
    // Render a participant
    const renderParticipant = ({ item }) => (<react_native_1.View style={styles.participantItem}>
      <react_native_1.View style={[styles.statusIndicator, item.is_online ? styles.onlineIndicator : styles.offlineIndicator]}/>
      <react_native_1.Text style={styles.participantName}>{item.user_id}</react_native_1.Text>
      <react_native_1.Text style={styles.participantRole}>{item.role}</react_native_1.Text>
    </react_native_1.View>);
    // Render connection status
    const renderConnectionStatus = () => {
        switch (connectionState) {
            case websocket_manager_1.ConnectionState.CONNECTING:
            case websocket_manager_1.ConnectionState.RECONNECTING:
                return (<react_native_1.View style={styles.connectionStatus}>
            <react_native_1.ActivityIndicator size="small" color="#0000ff"/>
            <react_native_1.Text style={styles.connectionStatusText}>Connecting...</react_native_1.Text>
          </react_native_1.View>);
            case websocket_manager_1.ConnectionState.ERROR:
                return (<react_native_1.View style={styles.connectionStatus}>
            <react_native_1.Text style={[styles.connectionStatusText, styles.errorText]}>Connection error</react_native_1.Text>
          </react_native_1.View>);
            case websocket_manager_1.ConnectionState.DISCONNECTED:
                return (<react_native_1.View style={styles.connectionStatus}>
            <react_native_1.Text style={[styles.connectionStatusText, styles.warningText]}>Disconnected</react_native_1.Text>
          </react_native_1.View>);
            default:
                return null;
        }
    };
    return (<react_native_1.KeyboardAvoidingView style={styles.container} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <react_native_1.View style={styles.header}>
        <react_native_1.TouchableOpacity style={styles.headerButton} onPress={() => setShowParticipants(true)}>
          <react_native_1.Text style={styles.headerButtonText}>Participants ({participants.length})</react_native_1.Text>
        </react_native_1.TouchableOpacity>
        
        <react_native_1.TouchableOpacity style={styles.headerButton} onPress={() => setShowChat(true)}>
          <react_native_1.Text style={styles.headerButtonText}>Chat</react_native_1.Text>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      
      {renderConnectionStatus()}
      
      {isLoading ? (<react_native_1.View style={styles.loadingContainer}>
          <react_native_1.ActivityIndicator size="large" color="#0000ff"/>
        </react_native_1.View>) : (<react_native_1.FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={item => item.id} contentContainerStyle={styles.messageList}/>)}
      
      <react_native_1.View style={styles.inputContainer}>
        <react_native_1.TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Type a message..." multiline returnKeyType="send" onSubmitEditing={sendMessage}/>
        <react_native_1.TouchableOpacity style={[styles.sendButton, (!inputText.trim() || isSending) && styles.disabledButton]} onPress={sendMessage} disabled={!inputText.trim() || isSending}>
          {isSending ? (<react_native_1.ActivityIndicator size="small" color="#ffffff"/>) : (<react_native_1.Text style={styles.sendButtonText}>Send</react_native_1.Text>)}
        </react_native_1.TouchableOpacity>
      </react_native_1.View>
      
      {/* Participants Modal */}
      <react_native_1.Modal visible={showParticipants} animationType="slide" transparent={true} onRequestClose={() => setShowParticipants(false)}>
        <react_native_1.View style={styles.modalContainer}>
          <react_native_1.View style={styles.modalContent}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={styles.modalTitle}>Participants</react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={() => setShowParticipants(false)}>
                <react_native_1.Text style={styles.closeButton}>Close</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
            
            <react_native_1.FlatList data={participants} renderItem={renderParticipant} keyExtractor={item => item.id} contentContainerStyle={styles.participantList}/>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
      
      {/* Chat Modal */}
      <react_native_1.Modal visible={showChat} animationType="slide" transparent={true} onRequestClose={() => setShowChat(false)}>
        <react_native_1.View style={styles.modalContainer}>
          <react_native_1.View style={styles.modalContent}>
            <react_native_1.View style={styles.modalHeader}>
              <react_native_1.Text style={styles.modalTitle}>Chat</react_native_1.Text>
              <react_native_1.TouchableOpacity onPress={() => setShowChat(false)}>
                <react_native_1.Text style={styles.closeButton}>Close</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
            
            <react_native_1.FlatList ref={chatListRef} data={chatMessages} renderItem={renderChatMessage} keyExtractor={(item, index) => `chat-${index}`} contentContainerStyle={styles.chatList}/>
            
            <react_native_1.View style={styles.chatInputContainer}>
              <react_native_1.TextInput style={styles.chatInput} value={chatInputText} onChangeText={setChatInputText} placeholder="Type a chat message..." returnKeyType="send" onSubmitEditing={sendChatMessage}/>
              <react_native_1.TouchableOpacity style={styles.chatSendButton} onPress={sendChatMessage} disabled={!chatInputText.trim()}>
                <react_native_1.Text style={styles.sendButtonText}>Send</react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Modal>
    </react_native_1.KeyboardAvoidingView>);
};
exports.SharedSessionView = SharedSessionView;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
    },
    headerButton: {
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
    },
    headerButtonText: {
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        padding: 10,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginVertical: 5,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#0084ff',
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e5e5ea',
    },
    messageText: {
        fontSize: 16,
        color: '#000000',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5ea',
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: '#0084ff',
        borderRadius: 20,
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#b3d9ff',
    },
    sendButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
        backgroundColor: '#f0f0f0',
    },
    connectionStatusText: {
        marginLeft: 5,
        fontSize: 12,
    },
    errorText: {
        color: '#ff0000',
    },
    warningText: {
        color: '#ff9900',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#0084ff',
        fontSize: 16,
    },
    participantList: {
        padding: 10,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    onlineIndicator: {
        backgroundColor: '#4CAF50',
    },
    offlineIndicator: {
        backgroundColor: '#9E9E9E',
    },
    participantName: {
        flex: 1,
        fontSize: 16,
    },
    participantRole: {
        fontSize: 14,
        color: '#666666',
    },
    chatList: {
        padding: 10,
    },
    chatMessage: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginVertical: 5,
    },
    chatSender: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    chatContent: {
        fontSize: 14,
    },
    chatInputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e5ea',
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    chatSendButton: {
        marginLeft: 10,
        backgroundColor: '#0084ff',
        borderRadius: 20,
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
//# sourceMappingURL=SharedSessionView.js.map
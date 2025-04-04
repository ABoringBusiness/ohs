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
exports.ConversationView = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const types_1 = require("../models/types");
const websocket_manager_1 = require("../websocket/websocket-manager");
const ConversationView = ({ conversationId, conversationService, webSocketManager, onError, }) => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [inputText, setInputText] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isSending, setIsSending] = (0, react_1.useState)(false);
    const [connectionState, setConnectionState] = (0, react_1.useState)(webSocketManager.getConnectionState());
    const flatListRef = (0, react_1.useRef)(null);
    // Load initial messages and set up WebSocket connection
    (0, react_1.useEffect)(() => {
        const loadMessages = async () => {
            try {
                setIsLoading(true);
                const response = await conversationService.getMessages(conversationId);
                setMessages(response.messages);
            }
            catch (error) {
                console.error('Error loading messages:', error);
                onError === null || onError === void 0 ? void 0 : onError(error);
            }
            finally {
                setIsLoading(false);
            }
        };
        // Connect to WebSocket
        const connectWebSocket = async () => {
            try {
                await webSocketManager.connectToConversation(conversationId);
            }
            catch (error) {
                console.error('Error connecting to WebSocket:', error);
                onError === null || onError === void 0 ? void 0 : onError(error);
            }
        };
        loadMessages();
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
    }, [conversationId]);
    // Scroll to bottom when messages change
    (0, react_1.useEffect)(() => {
        if (messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                var _a;
                (_a = flatListRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);
    // Handle WebSocket messages
    const handleWebSocketMessage = (message) => {
        if (message.type === types_1.WebSocketMessageType.AI_MESSAGE) {
            const aiMessage = {
                id: message.message_id || `temp-${Date.now()}`,
                conversation_id: conversationId,
                content: message.content,
                type: types_1.MessageType.AI_MESSAGE,
                created_at: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, aiMessage]);
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
                conversation_id: conversationId,
                content,
                type: types_1.MessageType.USER_MESSAGE,
                created_at: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, tempUserMessage]);
            // Send via WebSocket if connected
            if (connectionState === websocket_manager_1.ConnectionState.CONNECTED) {
                await webSocketManager.sendUserMessage(content);
            }
            else {
                // Fall back to REST API
                const userMessage = await conversationService.sendMessage(conversationId, content);
                // Replace the temp message with the real one
                setMessages(prevMessages => prevMessages.map(msg => msg.id === tempUserMessage.id ? userMessage : msg));
            }
        }
        catch (error) {
            console.error('Error sending message:', error);
            onError === null || onError === void 0 ? void 0 : onError(error);
        }
        finally {
            setIsSending(false);
        }
    };
    // Render a message
    const renderMessage = ({ item }) => (<react_native_1.View style={[
            styles.messageBubble,
            item.type === types_1.MessageType.USER_MESSAGE ? styles.userMessage : styles.aiMessage
        ]}>
      <react_native_1.Text style={styles.messageText}>{item.content}</react_native_1.Text>
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
    </react_native_1.KeyboardAvoidingView>);
};
exports.ConversationView = ConversationView;
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
});
//# sourceMappingURL=ConversationView.js.map
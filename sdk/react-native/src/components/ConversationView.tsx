import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Message, MessageType, WebSocketMessage, WebSocketMessageType } from '../models/types';
import { ConversationService } from '../api/conversation-service';
import { WebSocketManager, ConnectionState } from '../websocket/websocket-manager';

interface ConversationViewProps {
  conversationId: string;
  conversationService: ConversationService;
  webSocketManager: WebSocketManager;
  onError?: (error: Error) => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  conversationService,
  webSocketManager,
  onError,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketManager.getConnectionState()
  );
  
  const flatListRef = useRef<FlatList>(null);

  // Load initial messages and set up WebSocket connection
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await conversationService.getMessages(conversationId);
        setMessages(response.messages);
      } catch (error) {
        console.error('Error loading messages:', error);
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketManager.connectToConversation(conversationId);
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        onError?.(error as Error);
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
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    if (message.type === WebSocketMessageType.AI_MESSAGE) {
      const aiMessage: Message = {
        id: message.message_id || `temp-${Date.now()}`,
        conversation_id: conversationId,
        content: message.content,
        type: MessageType.AI_MESSAGE,
        created_at: new Date().toISOString(),
      };

      setMessages(prevMessages => [...prevMessages, aiMessage]);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      // Add user message to the UI immediately
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        content,
        type: MessageType.USER_MESSAGE,
        created_at: new Date().toISOString(),
      };

      setMessages(prevMessages => [...prevMessages, tempUserMessage]);

      // Send via WebSocket if connected
      if (connectionState === ConnectionState.CONNECTED) {
        await webSocketManager.sendUserMessage(content);
      } else {
        // Fall back to REST API
        const userMessage = await conversationService.sendMessage(conversationId, content);
        
        // Replace the temp message with the real one
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempUserMessage.id ? userMessage : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onError?.(error as Error);
    } finally {
      setIsSending(false);
    }
  };

  // Render a message
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble,
      item.type === MessageType.USER_MESSAGE ? styles.userMessage : styles.aiMessage
    ]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  // Render connection status
  const renderConnectionStatus = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return (
          <View style={styles.connectionStatus}>
            <ActivityIndicator size="small" color="#0000ff" />
            <Text style={styles.connectionStatusText}>Connecting...</Text>
          </View>
        );
      case ConnectionState.ERROR:
        return (
          <View style={styles.connectionStatus}>
            <Text style={[styles.connectionStatusText, styles.errorText]}>Connection error</Text>
          </View>
        );
      case ConnectionState.DISCONNECTED:
        return (
          <View style={styles.connectionStatus}>
            <Text style={[styles.connectionStatusText, styles.warningText]}>Disconnected</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {renderConnectionStatus()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.disabledButton]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
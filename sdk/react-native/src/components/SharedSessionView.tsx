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
  Modal,
  ScrollView,
} from 'react-native';
import {
  Message,
  MessageType,
  WebSocketMessage,
  WebSocketMessageType,
  SessionParticipant,
} from '../models/types';
import { SessionService } from '../api/session-service';
import { WebSocketManager, ConnectionState } from '../websocket/websocket-manager';

interface SharedSessionViewProps {
  sessionId: string;
  sessionService: SessionService;
  webSocketManager: WebSocketManager;
  onError?: (error: Error) => void;
}

export const SharedSessionView: React.FC<SharedSessionViewProps> = ({
  sessionId,
  sessionService,
  webSocketManager,
  onError,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketManager.getConnectionState()
  );
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const chatListRef = useRef<FlatList>(null);

  // Load initial data and set up WebSocket connection
  useEffect(() => {
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
      } catch (error) {
        console.error('Error loading session data:', error);
        onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Connect to WebSocket
    const connectWebSocket = async () => {
      try {
        await webSocketManager.connectToSession(sessionId);
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        onError?.(error as Error);
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
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Scroll to bottom when chat messages change
  useEffect(() => {
    if (chatMessages.length > 0 && chatListRef.current) {
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case WebSocketMessageType.AI_MESSAGE:
        const aiMessage: Message = {
          id: message.message_id || `temp-${Date.now()}`,
          conversation_id: message.conversation_id,
          content: message.content,
          type: MessageType.AI_MESSAGE,
          created_at: new Date().toISOString(),
        };
        setMessages(prevMessages => [...prevMessages, aiMessage]);
        break;
        
      case WebSocketMessageType.CHAT_MESSAGE:
        setChatMessages(prevMessages => [...prevMessages, message.message]);
        break;
        
      case WebSocketMessageType.PARTICIPANT_JOINED:
        setParticipants(prevParticipants => {
          // Check if participant already exists
          const exists = prevParticipants.some(p => p.id === message.participant.id);
          if (exists) {
            return prevParticipants.map(p => 
              p.id === message.participant.id ? { ...p, is_online: true } : p
            );
          } else {
            return [...prevParticipants, message.participant];
          }
        });
        break;
        
      case WebSocketMessageType.PARTICIPANT_LEFT:
        setParticipants(prevParticipants => 
          prevParticipants.map(p => 
            p.user_id === message.user_id ? { ...p, is_online: false } : p
          )
        );
        break;
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
        conversation_id: 'session',
        content,
        type: MessageType.USER_MESSAGE,
        created_at: new Date().toISOString(),
      };

      setMessages(prevMessages => [...prevMessages, tempUserMessage]);

      // Send via WebSocket
      await webSocketManager.sendUserMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
      onError?.(error as Error);
    } finally {
      setIsSending(false);
    }
  };

  // Send a chat message
  const sendChatMessage = async () => {
    if (!chatInputText.trim()) return;

    const content = chatInputText.trim();
    setChatInputText('');

    try {
      await webSocketManager.sendChatMessage(content);
    } catch (error) {
      console.error('Error sending chat message:', error);
      onError?.(error as Error);
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

  // Render a chat message
  const renderChatMessage = ({ item }: { item: any }) => (
    <View style={styles.chatMessage}>
      <Text style={styles.chatSender}>{item.user_id}</Text>
      <Text style={styles.chatContent}>{item.content}</Text>
    </View>
  );

  // Render a participant
  const renderParticipant = ({ item }: { item: SessionParticipant }) => (
    <View style={styles.participantItem}>
      <View style={[styles.statusIndicator, item.is_online ? styles.onlineIndicator : styles.offlineIndicator]} />
      <Text style={styles.participantName}>{item.user_id}</Text>
      <Text style={styles.participantRole}>{item.role}</Text>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowParticipants(true)}
        >
          <Text style={styles.headerButtonText}>Participants ({participants.length})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowChat(true)}
        >
          <Text style={styles.headerButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>
      
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
      
      {/* Participants Modal */}
      <Modal
        visible={showParticipants}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParticipants(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participants</Text>
              <TouchableOpacity onPress={() => setShowParticipants(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={participants}
              renderItem={renderParticipant}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.participantList}
            />
          </View>
        </View>
      </Modal>
      
      {/* Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChat(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              ref={chatListRef}
              data={chatMessages}
              renderItem={renderChatMessage}
              keyExtractor={(item, index) => `chat-${index}`}
              contentContainerStyle={styles.chatList}
            />
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                value={chatInputText}
                onChangeText={setChatInputText}
                placeholder="Type a chat message..."
                returnKeyType="send"
                onSubmitEditing={sendChatMessage}
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={sendChatMessage}
                disabled={!chatInputText.trim()}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
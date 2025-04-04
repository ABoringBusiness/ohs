import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { OpenHandsClient, ConversationView, SharedSessionView } from '../src';

// Create a client instance
const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
  storage: 'keychain',
});

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newConversationTitle, setNewConversationTitle] = useState('');

  // Initialize the client
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await client.initialize();
        setIsInitialized(true);
        setIsAuthenticated(initialized);
        
        if (initialized) {
          loadConversations();
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Set up auth state listener
    const removeListener = client.addAuthStateListener((authenticated) => {
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        loadConversations();
      }
    });

    return () => {
      removeListener();
    };
  }, []);

  // Load conversations
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await client.conversations().getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      await client.signIn(email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please enter email, password, and name');
      return;
    }

    try {
      setIsLoading(true);
      await client.signUp(email, password, name);
      setEmail('');
      setPassword('');
      setName('');
      setIsSignUp(false);
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await client.signOut();
      setSelectedConversationId(null);
      setSelectedSessionId(null);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new conversation
  const createConversation = async () => {
    if (!newConversationTitle) {
      Alert.alert('Error', 'Please enter a conversation title');
      return;
    }

    try {
      setIsLoading(true);
      const conversation = await client.conversations().createConversation(newConversationTitle);
      setConversations([...conversations, conversation]);
      setNewConversationTitle('');
    } catch (error) {
      console.error('Create conversation error:', error);
      Alert.alert('Error', 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };

  // Share a conversation
  const shareConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const session = await client.sessions().shareSession(
        conversationId,
        'Shared Conversation',
        {
          visibility: 'link',
        }
      );
      
      Alert.alert(
        'Session Shared',
        `Share URL: ${session.share_url}`,
        [
          {
            text: 'Join Session',
            onPress: () => setSelectedSessionId(session.id),
          },
          {
            text: 'OK',
          },
        ]
      );
    } catch (error) {
      console.error('Share conversation error:', error);
      Alert.alert('Error', 'Failed to share conversation');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the auth screen
  const renderAuthScreen = () => (
    <View style={styles.authContainer}>
      <Text style={styles.title}>OpenHands AI</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
        
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={isLoading}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render the conversation list
  const renderConversationList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.newConversationContainer}>
        <TextInput
          style={styles.newConversationInput}
          placeholder="New conversation title"
          value={newConversationTitle}
          onChangeText={setNewConversationTitle}
        />
        <TouchableOpacity
          style={styles.newConversationButton}
          onPress={createConversation}
          disabled={!newConversationTitle || isLoading}
        >
          <Text style={styles.buttonText}>Create</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0084ff" />
      ) : (
        <ScrollView style={styles.conversationList}>
          {conversations.length === 0 ? (
            <Text style={styles.emptyText}>No conversations yet</Text>
          ) : (
            conversations.map((conversation) => (
              <View key={conversation.id} style={styles.conversationItem}>
                <TouchableOpacity
                  style={styles.conversationButton}
                  onPress={() => setSelectedConversationId(conversation.id)}
                >
                  <Text style={styles.conversationTitle}>{conversation.title}</Text>
                  <Text style={styles.conversationDate}>
                    {new Date(conversation.updated_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => shareConversation(conversation.id)}
                >
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );

  // Main render logic
  if (!isInitialized || isLoading && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        {renderAuthScreen()}
      </SafeAreaView>
    );
  }

  if (selectedConversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.conversationHeader}>
          <TouchableOpacity onPress={() => setSelectedConversationId(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <ConversationView
          conversationId={selectedConversationId}
          conversationService={client.conversations()}
          webSocketManager={client.getWebSocketManager()}
          onError={(error) => {
            console.error('Conversation error:', error);
            Alert.alert('Error', 'An error occurred in the conversation');
          }}
        />
      </SafeAreaView>
    );
  }

  if (selectedSessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.conversationHeader}>
          <TouchableOpacity onPress={() => setSelectedSessionId(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>
        
        <SharedSessionView
          sessionId={selectedSessionId}
          sessionService={client.sessions()}
          webSocketManager={client.getWebSocketManager()}
          onError={(error) => {
            console.error('Session error:', error);
            Alert.alert('Error', 'An error occurred in the session');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderConversationList()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#0084ff',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0084ff',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#0084ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  signOutButton: {
    padding: 8,
  },
  signOutButtonText: {
    color: '#ff3b30',
  },
  newConversationContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  newConversationInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  newConversationButton: {
    backgroundColor: '#0084ff',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
  },
  loader: {
    marginTop: 20,
  },
  conversationList: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#8e8e93',
  },
  conversationItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  conversationButton: {
    flex: 1,
    padding: 15,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  conversationDate: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 5,
  },
  shareButton: {
    justifyContent: 'center',
    padding: 15,
  },
  shareButtonText: {
    color: '#0084ff',
  },
  conversationHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  backButton: {
    color: '#0084ff',
    fontSize: 16,
  },
});

export default App;
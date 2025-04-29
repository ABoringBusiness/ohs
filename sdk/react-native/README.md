# OpenHands React Native SDK

A React Native SDK for integrating with the OpenHands AI Assistant platform.

## Installation

```bash
npm install openhands-react-native-sdk
# or
yarn add openhands-react-native-sdk
```

### Dependencies

This SDK has the following peer dependencies:

```
"react": ">=16.8.0",
"react-native": ">=0.60.0"
```

And uses the following dependencies that you may need to install:

```
@react-native-async-storage/async-storage
react-native-keychain
axios
```

## Usage

### Initializing the Client

```javascript
import { OpenHandsClient } from 'openhands-react-native-sdk';

// Create a client instance
const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
  storage: 'keychain', // or 'async-storage'
});

// Initialize the client
await client.initialize();
```

### Authentication

```javascript
// Sign in
try {
  const user = await client.signIn('user@example.com', 'password');
  console.log('Signed in as:', user.name);
} catch (error) {
  console.error('Sign in failed:', error);
}

// Sign up
try {
  const user = await client.signUp('user@example.com', 'password', 'User Name');
  console.log('Signed up as:', user.name);
} catch (error) {
  console.error('Sign up failed:', error);
}

// Sign out
await client.signOut();

// Check authentication status
const isAuthenticated = await client.isAuthenticated();
console.log('Is authenticated:', isAuthenticated);

// Get current user
const currentUser = client.getCurrentUser();

// Listen for auth state changes
const removeListener = client.addAuthStateListener((isAuthenticated, user) => {
  console.log('Auth state changed:', isAuthenticated, user);
});

// Later, remove the listener
removeListener();
```

### Conversations

```javascript
// Get the conversation service
const conversationService = client.conversations();

// Get all conversations
const { conversations, total } = await conversationService.getConversations();

// Create a new conversation
const newConversation = await conversationService.createConversation('New Conversation');

// Get a specific conversation
const conversation = await conversationService.getConversation(conversationId);

// Get messages for a conversation
const { messages, total } = await conversationService.getMessages(conversationId);

// Send a message
const message = await conversationService.sendMessage(conversationId, 'Hello, AI!');
```

### Using the ConversationView Component

```jsx
import React from 'react';
import { View } from 'react-native';
import { OpenHandsClient, ConversationView } from 'openhands-react-native-sdk';

const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
});

const MyConversationScreen = ({ conversationId }) => {
  return (
    <View style={{ flex: 1 }}>
      <ConversationView
        conversationId={conversationId}
        conversationService={client.conversations()}
        webSocketManager={client.getWebSocketManager()}
        onError={(error) => console.error('Conversation error:', error)}
      />
    </View>
  );
};

export default MyConversationScreen;
```

### Collaborative Sessions

```javascript
// Get the session service
const sessionService = client.sessions();

// Share a conversation as a collaborative session
const session = await sessionService.shareSession(
  conversationId,
  'Shared Conversation',
  {
    description: 'Let\'s collaborate on this conversation',
    visibility: 'link',
    password: 'optional-password',
    expiresIn: 3600, // 1 hour
  }
);

// Join a session
const participant = await sessionService.joinSession(
  sessionId,
  {
    password: 'optional-password',
    invitationToken: 'optional-invitation-token',
  }
);

// Invite a user to a session
const invitation = await sessionService.inviteUser(
  sessionId,
  {
    email: 'colleague@example.com',
    role: 'collaborator',
    expiresIn: 86400, // 24 hours
  }
);

// Get public sessions
const { sessions, total } = await sessionService.getPublicSessions();
```

### Using the SharedSessionView Component

```jsx
import React from 'react';
import { View } from 'react-native';
import { OpenHandsClient, SharedSessionView } from 'openhands-react-native-sdk';

const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
});

const MySharedSessionScreen = ({ sessionId }) => {
  return (
    <View style={{ flex: 1 }}>
      <SharedSessionView
        sessionId={sessionId}
        sessionService={client.sessions()}
        webSocketManager={client.getWebSocketManager()}
        onError={(error) => console.error('Session error:', error)}
      />
    </View>
  );
};

export default MySharedSessionScreen;
```

### WebSocket Communication

```javascript
// Get the WebSocket manager
const webSocketManager = client.getWebSocketManager();

// Connect to a conversation
await webSocketManager.connectToConversation(conversationId);

// Connect to a session
await webSocketManager.connectToSession(sessionId);

// Send a user message
await webSocketManager.sendUserMessage('Hello, AI!');

// Send a chat message (for session side chat)
await webSocketManager.sendChatMessage('Hey everyone, check this out!');

// Send cursor position (for collaborative sessions)
await webSocketManager.sendCursorPosition({ x: 100, y: 200 });

// Listen for messages
const removeMessageListener = webSocketManager.addMessageListener((message) => {
  console.log('Received message:', message);
});

// Listen for connection state changes
const removeStateListener = webSocketManager.addStateChangeListener((state) => {
  console.log('Connection state changed:', state);
});

// Disconnect
webSocketManager.disconnect();

// Later, remove listeners
removeMessageListener();
removeStateListener();
```

## Advanced Usage

### Offline Support

The SDK automatically handles offline scenarios by:

1. Storing authentication tokens securely
2. Providing fallback to REST API when WebSocket is not available
3. Showing appropriate connection status in the UI components

### Secure Storage

The SDK supports two storage mechanisms:

- `keychain`: Uses react-native-keychain for secure storage (default, recommended)
- `async-storage`: Uses AsyncStorage for broader compatibility

## License

MIT
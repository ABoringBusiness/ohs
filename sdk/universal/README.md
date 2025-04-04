# OpenHands Universal SDK

A universal TypeScript SDK for integrating with the OpenHands AI Assistant platform across multiple environments:

- Next.js and other web applications
- Chrome extensions
- Bot platforms (like Loop Message)
- React Native applications

## Installation

```bash
npm install openhands-universal-sdk
# or
yarn add openhands-universal-sdk
```

## Key Features

- **Environment Detection**: Automatically adapts to different runtime environments
- **Universal Storage**: Works with localStorage, Chrome storage, or in-memory storage
- **Flexible Networking**: Uses the best available HTTP and WebSocket clients for each environment
- **Authentication**: Secure token management across platforms
- **Real-time Communication**: WebSocket support with automatic reconnection
- **Extension Support**: Special utilities for Chrome extensions
- **Bot Integration**: Simplified API for bot platforms
- **TypeScript Support**: Full type definitions for all APIs

## Basic Usage

```typescript
import { OpenHandsClient, Environment } from 'openhands-universal-sdk';

// Create a client instance
const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
  // Optional: explicitly set environment (auto-detected by default)
  environment: Environment.BROWSER,
});

// Initialize the client
await client.initialize();

// Authentication
const user = await client.signIn('user@example.com', 'password');

// Create a conversation
const conversation = await client.conversations().createConversation('New Conversation');

// Send a message
const message = await client.conversations().sendMessage(
  conversation.id, 
  'Hello, AI!'
);

// Connect to WebSocket for real-time updates
const wsManager = client.getWebSocketManager();
await wsManager.connectToConversation(conversation.id);

// Listen for messages
wsManager.addMessageListener((message) => {
  console.log('Received message:', message);
});
```

## Environment-Specific Usage

### Next.js Web Application

```typescript
import { OpenHandsClient } from 'openhands-universal-sdk';
import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [client] = useState(() => new OpenHandsClient({
    apiUrl: process.env.NEXT_PUBLIC_OPENHANDS_API_URL,
    wsUrl: process.env.NEXT_PUBLIC_OPENHANDS_WS_URL,
  }));
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Initialize client
    client.initialize().then(initialized => {
      setIsAuthenticated(initialized);
    });
    
    // Listen for auth state changes
    const unsubscribe = client.onAuthStateChanged((authenticated) => {
      setIsAuthenticated(authenticated);
    });
    
    return () => unsubscribe();
  }, [client]);
  
  // Rest of your component...
}
```

### Chrome Extension

```typescript
// In background.js
import { OpenHandsClient, Environment, StorageType } from 'openhands-universal-sdk';

// Create client with Chrome storage
const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
  environment: Environment.CHROME_EXTENSION,
  storage: StorageType.CHROME_STORAGE,
});

// Initialize on extension load
client.initialize();

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ASK_AI') {
    handleAskAI(message.question, message.context, sender.tab.id)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
});

async function handleAskAI(question, context, tabId) {
  // Use the extension client
  return client.extension().askAboutPage(question, context);
}

// In content script
chrome.runtime.sendMessage({
  type: 'ASK_AI',
  question: 'What is this page about?',
  context: {
    url: window.location.href,
    title: document.title,
    selectedText: window.getSelection().toString(),
  }
}, response => {
  if (response.success) {
    // Show the AI's answer
    showAnswer(response.data.answer);
  }
});
```

### Bot Integration (Loop Message)

```typescript
import { OpenHandsClient, Environment, StorageType } from 'openhands-universal-sdk';
import express from 'express';

const app = express();
app.use(express.json());

// Create client with memory storage
const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
  environment: Environment.NODE,
  storage: StorageType.MEMORY,
});

// Initialize with bot credentials
async function initializeBot() {
  await client.signIn('bot@example.com', 'bot-password');
  console.log('Bot initialized');
}

initializeBot();

// Handle incoming webhook from Loop Message
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body;
    
    // Process the message using the bot client
    const response = await client.bot().processMessage({
      text: message.text,
      userId: message.userId,
      conversationId: message.conversationId,
      context: {
        metadata: message.metadata
      }
    });
    
    // Send response back to Loop Message
    res.json(response);
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Bot server running on port 3000');
});
```

## Advanced Usage

### Custom Storage Adapter

```typescript
import { OpenHandsClient, StorageType, StorageAdapter } from 'openhands-universal-sdk';

// Create a custom storage adapter
class RedisStorageAdapter implements StorageAdapter {
  private redisClient: any;
  
  constructor(redisClient: any) {
    this.redisClient = redisClient;
  }
  
  async getItem(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }
  
  async setItem(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}

// Use the custom storage adapter
const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
  storage: {
    type: StorageType.CUSTOM,
    implementation: new RedisStorageAdapter(redisClient)
  }
});
```

### Collaborative Sessions

```typescript
import { OpenHandsClient, SessionVisibility } from 'openhands-universal-sdk';

const client = new OpenHandsClient({
  apiUrl: 'https://app.openhands.ai',
  wsUrl: 'wss://app.openhands.ai',
});

// Create and share a session
async function shareConversation(conversationId) {
  const session = await client.sessions().shareSession(
    conversationId,
    'Shared Conversation',
    {
      visibility: SessionVisibility.LINK,
      allowViewerChat: true,
      showParticipantCursors: true,
    }
  );
  
  console.log('Share URL:', session.share_url);
  
  // Connect to the session WebSocket
  const wsManager = client.getWebSocketManager();
  await wsManager.connectToSession(session.id);
  
  // Listen for participants joining
  wsManager.addMessageListener((message) => {
    if (message.type === 'participant_joined') {
      console.log('Participant joined:', message.participant);
    }
  });
  
  return session;
}
```

## Environment Detection

The SDK automatically detects the environment it's running in:

```typescript
import { detectEnvironment, Environment } from 'openhands-universal-sdk';

const env = detectEnvironment();
console.log('Current environment:', env);

if (env === Environment.CHROME_EXTENSION) {
  // Chrome extension specific code
} else if (env === Environment.BROWSER) {
  // Browser specific code
} else if (env === Environment.NODE) {
  // Node.js specific code
} else if (env === Environment.REACT_NATIVE) {
  // React Native specific code
}
```

## License

MIT
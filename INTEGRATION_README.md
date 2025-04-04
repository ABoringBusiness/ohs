# OpenHands Integration Guide

This guide explains how to integrate external applications, messaging platforms, and browser extensions with OpenHands.

## Table of Contents

- [Authentication](#authentication)
- [Socket.io Real-time Updates](#socketio-real-time-updates)
- [REST API Endpoints](#rest-api-endpoints)
- [Integration Examples](#integration-examples)
  - [Browser Extension](#browser-extension)
  - [Messaging App](#messaging-app)
  - [Webhook Integration](#webhook-integration)
- [Security Considerations](#security-considerations)

## Authentication

All API requests require authentication using a JWT token obtained through the authentication endpoints.

### Sign In

```
POST /api/auth/signin
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### Sign Up

```
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "name": "User Name"
}
```

**Response:** Same as Sign In

### Google OAuth

```
GET /api/auth/google/signin
```

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/..."
}
```

## Socket.io Real-time Updates

OpenHands provides real-time updates through Socket.io. This allows external applications to receive instant notifications about changes to conversations, files, and settings.

### Connecting to Socket.io

```javascript
const socket = io('https://your-openhands-server.com', {
  path: '/socket.io',
  auth: { token: 'your-auth-token' },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to OpenHands real-time updates');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Joining a Conversation Room

To receive updates for a specific conversation:

```javascript
socket.emit('join_room', { room: `conversation_${conversationId}` });
```

### Listening for Events

```javascript
// Conversation updates
socket.on('conversation_update', (data) => {
  console.log('Conversation updated:', data);
});

socket.on('conversation_insert', (data) => {
  console.log('New conversation created:', data);
});

// File updates
socket.on('file_update', (data) => {
  console.log('File updated:', data);
});

socket.on('file_insert', (data) => {
  console.log('New file created:', data);
});

// Settings updates
socket.on('settings_update', (data) => {
  console.log('Settings updated:', data);
});

// User presence
socket.on('user_joined', (data) => {
  console.log('User joined:', data.user_id);
});

socket.on('user_left', (data) => {
  console.log('User left:', data.user_id);
});
```

### Sending Messages

```javascript
socket.emit('send_message', {
  room: `conversation_${conversationId}`,
  message: {
    content: 'Hello, world!',
    type: 'text'
  }
});
```

## REST API Endpoints

### Conversations

#### Create a Conversation

```
POST /api/conversation
```

**Headers:**
```
Authorization: Bearer your-token
```

**Request Body:**
```json
{
  "initialPrompt": "Your initial message"
}
```

**Response:**
```json
{
  "conversation_id": "conversation-id",
  "created_at": "2025-04-04T04:07:15Z"
}
```

#### Get Conversation

```
GET /api/conversation/{conversation_id}
```

**Headers:**
```
Authorization: Bearer your-token
```

**Response:**
```json
{
  "conversation_id": "conversation-id",
  "messages": [
    {
      "id": "message-id",
      "content": "Message content",
      "role": "user",
      "timestamp": "2025-04-04T04:07:15Z"
    }
  ]
}
```

#### Send Message

```
POST /api/conversation/{conversation_id}/message
```

**Headers:**
```
Authorization: Bearer your-token
```

**Request Body:**
```json
{
  "content": "Your message",
  "imageUrls": []
}
```

**Response:**
```json
{
  "message_id": "message-id",
  "status": "success"
}
```

### Files

#### Upload File

```
POST /api/files/upload
```

**Headers:**
```
Authorization: Bearer your-token
```

**Form Data:**
```
file: (binary file data)
```

**Response:**
```json
{
  "file_id": "file-id",
  "url": "https://your-openhands-server.com/files/file-id"
}
```

## Integration Examples

### Browser Extension

#### Background Script

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authenticate') {
    fetch('https://your-openhands-server.com/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.credentials)
    })
    .then(response => response.json())
    .then(data => {
      // Store token in chrome.storage
      chrome.storage.local.set({ 'auth_token': data.access_token });
      sendResponse({ success: true });
    })
    .catch(error => sendResponse({ success: false, error }));
    return true; // Required for async response
  }
  
  if (request.action === 'openConversation') {
    chrome.windows.create({
      url: `https://your-openhands-server.com/conversation/${request.conversationId}`,
      type: 'popup',
      width: 800,
      height: 600
    });
  }
});
```

#### Content Script

```javascript
// content.js
// Inject a button or UI element to trigger OpenHands
document.addEventListener('click', (event) => {
  if (event.target.matches('.openhands-trigger')) {
    chrome.storage.local.get(['auth_token'], (result) => {
      if (result.auth_token) {
        // Send selected text to OpenHands
        const selectedText = window.getSelection().toString();
        
        fetch('https://your-openhands-server.com/api/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.auth_token}`
          },
          body: JSON.stringify({ initialPrompt: selectedText })
        })
        .then(response => response.json())
        .then(data => {
          // Open a popup with the conversation
          chrome.runtime.sendMessage({
            action: 'openConversation',
            conversationId: data.conversation_id
          });
        });
      } else {
        // Prompt for login
        chrome.runtime.sendMessage({ action: 'showLogin' });
      }
    });
  }
});
```

### Messaging App

#### Authentication Module

```javascript
async function authenticate(email, password) {
  const response = await fetch('https://your-openhands-server.com/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  return data.access_token;
}
```

#### Real-time Updates

```javascript
function setupRealTimeUpdates(token, onUpdate) {
  const socket = io('https://your-openhands-server.com', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('Connected to OpenHands real-time updates');
  });
  
  socket.on('conversation_update', (data) => {
    onUpdate('conversation', data);
  });
  
  socket.on('file_update', (data) => {
    onUpdate('file', data);
  });
  
  return {
    joinRoom: (conversationId) => {
      socket.emit('join_room', { room: `conversation_${conversationId}` });
    },
    leaveRoom: (conversationId) => {
      socket.emit('leave_room', { room: `conversation_${conversationId}` });
    },
    disconnect: () => {
      socket.disconnect();
    }
  };
}
```

#### Conversation Integration

```javascript
async function createConversation(token, initialPrompt) {
  const response = await fetch('https://your-openhands-server.com/api/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ initialPrompt })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }
  
  return await response.json();
}

async function sendMessage(token, conversationId, message) {
  const response = await fetch(`https://your-openhands-server.com/api/conversation/${conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content: message })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return await response.json();
}
```

### Webhook Integration

For applications that need to receive notifications even when not actively connected to the Socket.io server, you can set up webhooks:

```javascript
// Register a webhook endpoint
async function registerWebhook(token, webhookUrl, events = ['conversation.update', 'file.update']) {
  const response = await fetch('https://your-openhands-server.com/api/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ url: webhookUrl, events })
  });
  
  if (!response.ok) {
    throw new Error('Failed to register webhook');
  }
  
  return await response.json();
}
```

## Security Considerations

1. **Token Storage**: Store authentication tokens securely. For web applications, use HttpOnly cookies or secure local storage.

2. **HTTPS**: Always use HTTPS for all API requests to ensure data is encrypted in transit.

3. **Token Expiration**: Be aware that authentication tokens expire. Implement token refresh logic in your application.

4. **Permissions**: Users can only access conversations and files they have permission to view. Ensure your application respects these permissions.

5. **Rate Limiting**: The API has rate limits to prevent abuse. Implement appropriate retry logic with exponential backoff.

6. **Error Handling**: Properly handle API errors and provide meaningful feedback to users.

7. **Sensitive Data**: Be cautious about what data you send to OpenHands, especially when integrating with browser extensions that can access page content.
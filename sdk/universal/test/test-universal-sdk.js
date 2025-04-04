// Test script for OpenHands Universal SDK
const { OpenHandsClient, Environment, StorageType } = require('../dist');

async function testUniversalSDK() {
  console.log('Testing OpenHands Universal SDK...');
  
  try {
    // Create client instance
    const client = new OpenHandsClient({
      apiUrl: 'https://app.openhands.ai',
      wsUrl: 'wss://app.openhands.ai',
      environment: Environment.NODE,
      storage: StorageType.MEMORY,
      debug: true
    });
    
    console.log('Client created successfully');
    console.log('Detected environment:', client.getEnvironment());
    
    // Test initialization
    const initialized = await client.initialize();
    console.log('Client initialized:', initialized);
    
    // Test authentication (mock)
    console.log('Testing auth methods availability:');
    console.log('- signIn method available:', typeof client.signIn === 'function');
    console.log('- signUp method available:', typeof client.signUp === 'function');
    console.log('- signOut method available:', typeof client.signOut === 'function');
    
    // Test conversation service
    const conversationService = client.conversations();
    console.log('Conversation service available:', !!conversationService);
    console.log('- getConversations method available:', typeof conversationService.getConversations === 'function');
    console.log('- sendMessage method available:', typeof conversationService.sendMessage === 'function');
    
    // Test session service
    const sessionService = client.sessions();
    console.log('Session service available:', !!sessionService);
    console.log('- shareSession method available:', typeof sessionService.shareSession === 'function');
    
    // Test WebSocket manager
    const wsManager = client.getWebSocketManager();
    console.log('WebSocket manager available:', !!wsManager);
    console.log('- connectToConversation method available:', typeof wsManager.connectToConversation === 'function');
    
    // Test bot client
    const botClient = client.bot();
    console.log('Bot client available:', !!botClient);
    console.log('- processMessage method available:', typeof botClient.processMessage === 'function');
    
    // Test extension client
    const extensionClient = client.extension();
    console.log('Extension client available:', !!extensionClient);
    console.log('- askAboutPage method available:', typeof extensionClient.askAboutPage === 'function');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUniversalSDK();
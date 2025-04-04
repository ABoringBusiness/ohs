# OpenHands SDK

This directory contains SDKs for integrating with the OpenHands AI Assistant platform.

## Available SDKs

### Universal SDK

A TypeScript-based SDK designed to work across multiple environments:
- Next.js and web applications
- Chrome extensions
- Bot platforms (like Loop Message)
- Node.js applications

[View Universal SDK Documentation](./universal/README.md)

### React Native SDK

A specialized SDK for React Native mobile applications with UI components:
- Authentication with secure storage
- Conversation management
- Real-time communication
- Ready-to-use UI components

[View React Native SDK Documentation](./react-native/README.md)

## SDK Comparison

Both SDKs provide access to the OpenHands API, but they have different focuses:

| Feature | Universal SDK | React Native SDK |
|---------|--------------|------------------|
| **Environments** | Multiple (browser, Node.js, extensions) | React Native only |
| **UI Components** | None | ConversationView, SharedSessionView |
| **Storage** | Multiple adapters | AsyncStorage, Keychain |
| **Bundle Size** | Larger due to adapters | Smaller, focused |

## Which SDK Should I Use?

- **For mobile apps**: Use the React Native SDK
- **For web applications**: Use the Universal SDK
- **For Chrome extensions**: Use the Universal SDK
- **For bot integrations**: Use the Universal SDK

## Future Plans

We're working on unifying these SDKs into a single package with platform-specific modules. This will provide a consistent API across platforms while maintaining optimized implementations for each environment.
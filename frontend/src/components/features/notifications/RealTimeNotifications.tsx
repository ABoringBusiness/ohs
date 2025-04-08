import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '#/context/socket-context';
import { useConversation } from '#/context/conversation-context';
import { useAuth } from '#/context/auth-context';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export const RealTimeNotifications: React.FC = () => {
  const { socket, isConnected, joinRoom } = useSocket();
  const { conversationId } = useConversation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Join the conversation room when the conversation ID changes
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;
    
    joinRoom(`conversation_${conversationId}`);
  }, [socket, isConnected, conversationId, joinRoom]);

  // Set up event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for conversation updates
    const handleConversationUpdate = (data: any) => {
      setNotifications(prev => [
        ...prev,
        {
          id: `conversation_${Date.now()}`,
          type: 'info',
          message: `Conversation updated: ${data.conversation_id}`,
          timestamp: Date.now(),
        }
      ]);
    };

    // Listen for file updates
    const handleFileUpdate = (data: any) => {
      setNotifications(prev => [
        ...prev,
        {
          id: `file_${Date.now()}`,
          type: 'info',
          message: `File updated: ${data.file_id}`,
          timestamp: Date.now(),
        }
      ]);
    };

    // Listen for settings updates
    const handleSettingsUpdate = (data: any) => {
      setNotifications(prev => [
        ...prev,
        {
          id: `settings_${Date.now()}`,
          type: 'info',
          message: 'Settings updated',
          timestamp: Date.now(),
        }
      ]);
    };

    // Listen for user joined/left events
    const handleUserJoined = (data: any) => {
      setNotifications(prev => [
        ...prev,
        {
          id: `user_joined_${Date.now()}`,
          type: 'success',
          message: `User joined: ${data.user_id}`,
          timestamp: Date.now(),
        }
      ]);
    };

    const handleUserLeft = (data: any) => {
      setNotifications(prev => [
        ...prev,
        {
          id: `user_left_${Date.now()}`,
          type: 'warning',
          message: `User left: ${data.user_id}`,
          timestamp: Date.now(),
        }
      ]);
    };

    // Register event listeners
    socket.on('conversation_update', handleConversationUpdate);
    socket.on('conversation_insert', handleConversationUpdate);
    socket.on('file_update', handleFileUpdate);
    socket.on('file_insert', handleFileUpdate);
    socket.on('settings_update', handleSettingsUpdate);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    // Clean up event listeners
    return () => {
      socket.off('conversation_update', handleConversationUpdate);
      socket.off('conversation_insert', handleConversationUpdate);
      socket.off('file_update', handleFileUpdate);
      socket.off('file_insert', handleFileUpdate);
      socket.off('settings_update', handleSettingsUpdate);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
    };
  }, [socket, isConnected]);

  // Remove notifications after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(notification => now - notification.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={`p-4 rounded-lg shadow-lg ${
              notification.type === 'info' ? 'bg-blue-500 text-white' :
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-medium">{notification.message}</p>
                <p className="text-sm opacity-80">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setNotifications(prev => 
                  prev.filter(n => n.id !== notification.id)
                )}
                className="ml-4 text-white opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
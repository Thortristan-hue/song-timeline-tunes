/**
 * Chat Integration Hook and Components
 * Provides easy integration of chat functionality into game views
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import RealtimeChat from '@/components/RealtimeChat';
import { cn } from '@/lib/utils';

interface ChatIntegrationProps {
  currentPlayerId: string;
  currentPlayerName: string;
  currentPlayerCharacter?: string;
  isHost?: boolean;
  showButton?: boolean;
  defaultMinimized?: boolean;
  className?: string;
}

export function ChatIntegration({
  currentPlayerId,
  currentPlayerName,
  currentPlayerCharacter,
  isHost = false,
  showButton = true,
  defaultMinimized = true,
  className
}: ChatIntegrationProps) {
  const [showChat, setShowChat] = useState(!defaultMinimized);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [hasUnread, setHasUnread] = useState(false);

  const handleToggleChat = useCallback(() => {
    if (!showChat) {
      setShowChat(true);
      setIsMinimized(false);
    } else if (!isMinimized) {
      setIsMinimized(true);
    } else {
      setShowChat(false);
    }
    setHasUnread(false);
  }, [showChat, isMinimized]);

  const handleToggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setHasUnread(false);
    }
  }, [isMinimized]);

  return (
    <>
      {/* Chat Toggle Button */}
      {showButton && (
        <Button
          onClick={handleToggleChat}
          className={cn(
            "fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 shadow-lg",
            showChat && !isMinimized && "hidden",
            className
          )}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {hasUnread && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </div>
        </Button>
      )}

      {/* Chat Component */}
      {showChat && (
        <RealtimeChat
          currentPlayerId={currentPlayerId}
          currentPlayerName={currentPlayerName}
          currentPlayerCharacter={currentPlayerCharacter}
          isHost={isHost}
          isMinimized={isMinimized}
          onToggleMinimize={handleToggleMinimize}
        />
      )}
    </>
  );
}

// Hook for chat state management
export function useChatIntegration(defaultMinimized = true) {
  const [showChat, setShowChat] = useState(!defaultMinimized);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [hasUnread, setHasUnread] = useState(false);

  const toggleChat = useCallback(() => {
    if (!showChat) {
      setShowChat(true);
      setIsMinimized(false);
    } else if (!isMinimized) {
      setIsMinimized(true);
    } else {
      setShowChat(false);
    }
    setHasUnread(false);
  }, [showChat, isMinimized]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setHasUnread(false);
    }
  }, [isMinimized]);

  const markAsRead = useCallback(() => {
    setHasUnread(false);
  }, []);

  const showNotification = useCallback(() => {
    if (isMinimized || !showChat) {
      setHasUnread(true);
    }
  }, [isMinimized, showChat]);

  return {
    showChat,
    isMinimized,
    hasUnread,
    toggleChat,
    toggleMinimize,
    markAsRead,
    showNotification
  };
}

export default ChatIntegration;
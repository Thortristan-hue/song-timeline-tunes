/**
 * Real-time Chat System
 * Supports text messages, emojis, reactions, and moderation
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageCircle, Send, Smile, Heart, ThumbsUp, Laugh, 
  X, Flag, Volume2, VolumeX, Minimize2, Maximize2, Settings, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnhancedAudio } from '@/lib/EnhancedAudioManager';
import { characterManager } from '@/lib/CharacterManager';

// Types
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  playerCharacter?: string;
  message: string;
  timestamp: Date;
  reactions: Record<string, string[]>; // reaction type -> player IDs
  isSystem?: boolean;
  isMuted?: boolean;
}

export interface ChatSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  autoScroll: boolean;
}

interface RealtimeChatProps {
  currentPlayerId: string;
  currentPlayerName: string;
  currentPlayerCharacter?: string;
  isHost?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

// Emoji reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const EMOJI_SHORTCUTS = {
  ':)': '😊',
  ':D': '😃',
  ':(': '😢',
  ':P': '😛',
  ':o': '😮',
  '<3': '❤️',
  ':thumbsup:': '👍',
  ':fire:': '🔥',
  ':clap:': '👏',
  ':music:': '🎵'
};

export default function RealtimeChat({
  currentPlayerId,
  currentPlayerName,
  currentPlayerCharacter,
  isHost = false,
  isMinimized = false,
  onToggleMinimize,
  className
}: RealtimeChatProps) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    soundEnabled: true,
    notificationsEnabled: true,
    showTimestamps: false,
    compactMode: false,
    autoScroll: true
  });

  // Refs
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Audio
  const { playNotificationSound } = useEnhancedAudio();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatSettings.autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSettings.autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Add system message helper
  const addSystemMessage = useCallback((message: string) => {
    const systemMsg: ChatMessage = {
      id: `system-${Date.now()}`,
      playerId: 'system',
      playerName: 'System',
      message,
      timestamp: new Date(),
      reactions: {},
      isSystem: true
    };
    setMessages(prev => [...prev, systemMsg]);
  }, []);

  // Process message with emoji shortcuts
  const processMessage = (text: string): string => {
    let processed = text;
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      processed = processed.replace(new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
    });
    return processed;
  };

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const processedMessage = processMessage(newMessage.trim());
    
    // Simple spam filter
    if (processedMessage.length > 500) {
      addSystemMessage('Message too long (max 500 characters)');
      return;
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${currentPlayerId}`,
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      playerCharacter: currentPlayerCharacter,
      message: processedMessage,
      timestamp: new Date(),
      reactions: {}
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Play sound for others (in real implementation, this would be handled by the server)
    if (chatSettings.soundEnabled) {
      setTimeout(() => playNotificationSound(), 100);
    }
  }, [newMessage, currentPlayerId, currentPlayerName, currentPlayerCharacter, chatSettings.soundEnabled, playNotificationSound, addSystemMessage]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [isTyping]);

  // Add reaction to message
  const handleReaction = useCallback((messageId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        const reactionKey = reaction;
        
        if (!reactions[reactionKey]) {
          reactions[reactionKey] = [];
        }

        if (reactions[reactionKey].includes(currentPlayerId)) {
          // Remove reaction
          reactions[reactionKey] = reactions[reactionKey].filter(id => id !== currentPlayerId);
          if (reactions[reactionKey].length === 0) {
            delete reactions[reactionKey];
          }
        } else {
          // Add reaction
          reactions[reactionKey].push(currentPlayerId);
        }

        return { ...msg, reactions };
      }
      return msg;
    }));
  }, [currentPlayerId]);

  // Toggle user mute (host only)
  const handleToggleMute = useCallback((playerId: string) => {
    if (!isHost) return;
    
    setMutedUsers(prev => {
      const newMuted = new Set(prev);
      if (newMuted.has(playerId)) {
        newMuted.delete(playerId);
        addSystemMessage(`${playerId} has been unmuted`);
      } else {
        newMuted.add(playerId);
        addSystemMessage(`${playerId} has been muted`);
      }
      return newMuted;
    });
  }, [isHost, addSystemMessage]);

  // Keyboard shortcuts
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get player character image
  const getPlayerCharacterImage = (characterId?: string, playerName?: string) => {
    if (characterId) {
      return characterManager.getCharacterImagePath(characterId);
    }
    return characterManager.getCharacterImagePath(playerName || 'mike');
  };

  if (isMinimized) {
    return (
      <Card className={cn("fixed bottom-4 right-4 bg-gray-900/95 backdrop-blur-xl border-gray-700", className)}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span className="text-white text-sm font-medium">Chat</span>
            {messages.length > 0 && (
              <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                {messages.length}
              </Badge>
            )}
          </div>
          <Button
            onClick={onToggleMinimize}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white p-1"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "flex flex-col bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white",
      "w-80 h-96 fixed bottom-4 right-4 z-50",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">Chat</span>
          {messages.length > 0 && (
            <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
              {messages.length}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white p-1">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Chat Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Sound notifications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                  >
                    {chatSettings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Show timestamps</span>
                  <input
                    type="checkbox"
                    checked={chatSettings.showTimestamps}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, showTimestamps: e.target.checked }))}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Compact mode</span>
                  <input
                    type="checkbox"
                    checked={chatSettings.compactMode}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {onToggleMinimize && (
            <Button
              onClick={onToggleMinimize}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white p-1"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {messages
            .filter(msg => !mutedUsers.has(msg.playerId))
            .map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "group relative",
                msg.isSystem && "text-center text-yellow-400 text-sm opacity-80"
              )}
            >
              {!msg.isSystem ? (
                <div className={cn(
                  "flex gap-2",
                  chatSettings.compactMode ? "items-start" : "items-start"
                )}>
                  {/* Avatar */}
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                    <img
                      src={getPlayerCharacterImage(msg.playerCharacter, msg.playerName)}
                      alt={msg.playerName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/char_mike.png';
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Player name and timestamp */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-blue-300">
                        {msg.playerName}
                      </span>
                      {isHost && msg.playerId === currentPlayerId && (
                        <Crown className="w-3 h-3 text-yellow-400" />
                      )}
                      {chatSettings.showTimestamps && (
                        <span className="text-xs text-white/50">
                          {formatTime(msg.timestamp)}
                        </span>
                      )}
                      
                      {/* Moderation controls (host only) */}
                      {isHost && msg.playerId !== currentPlayerId && (
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button
                            onClick={() => handleToggleMute(msg.playerId)}
                            variant="ghost"
                            size="sm"
                            className="p-0 h-4 w-4 text-red-400 hover:text-red-300"
                          >
                            <Flag className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Message content */}
                    <div className="text-sm text-white break-words">
                      {msg.message}
                    </div>
                    
                    {/* Reactions */}
                    {Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(msg.reactions).map(([reaction, userIds]) => (
                          <button
                            key={reaction}
                            onClick={() => handleReaction(msg.id, reaction)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
                              userIds.includes(currentPlayerId)
                                ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            )}
                          >
                            <span>{reaction}</span>
                            <span>{userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick reactions (on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 mt-1">
                      {QUICK_REACTIONS.map((reaction) => (
                        <button
                          key={reaction}
                          onClick={() => handleReaction(msg.id, reaction)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                        >
                          {reaction}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-1">
                  {msg.message}
                </div>
              )}
            </div>
          ))}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="text-sm text-white/50 italic">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 pr-10"
              maxLength={500}
            />
            
            {/* Emoji picker toggle */}
            <Button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Simple emoji picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-3 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-2 grid grid-cols-6 gap-1">
            {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        {/* Character count */}
        <div className="text-xs text-white/50 mt-1 text-right">
          {newMessage.length}/500
        </div>
      </div>
    </Card>
  );
}
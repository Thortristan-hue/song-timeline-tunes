
import React, { useState, useEffect, useRef } from 'react';
import { Music, Play, Pause, Clock, Volume2, VolumeX, Trophy, ArrowLeft, Zap, Star, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlayerView } from '@/components/PlayerView';
import { HostGameView } from '@/components/HostGameView';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { useToast } from '@/components/ui/use-toast';
import { Song, Player, GameState } from '@/types/game';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useGameLogic } from '@/hooks/useGameLogic';
import { supabase } from '@/integrations/supabase/client';

interface GamePlayProps {
  room: any;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  onSetCurrentSong: (song: Song) => Promise<void>;
  customSongs: Song[];
}

export function GamePlay({ 
  room, 
  players, 
  currentPlayer, 
  isHost, 
  onPlaceCard,
  onSetCurrentSong,
  customSongs 
}: GamePlayProps) {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [gameError, setGameError] = useState<string | null>(null);

  // Add detailed logging for debugging host white screen
  console.log('🎮 GamePlay render - DEBUG INFO:', {
    isHost,
    roomPhase: room?.phase,
    playersCount: players.length,
    currentPlayerExists: !!currentPlayer,
    roomId: room?.id,
    hostId: room?.host_id
  });

  // Use the game logic hook with room data
  const { gameState, setIsPlaying, getCurrentPlayer, initializeGame, startNewTurn } = useGameLogic(
    room?.id,
    players,
    room,
    onSetCurrentSong,
    async (songs: Song[]) => {
      try {
        if (room?.id) {
          const { gameService } = await import('@/services/gameService');
          await gameService.assignStartingCards(room.id, songs);
        }
      } catch (error) {
        console.error('Failed to assign starting cards:', error);
        setGameError('Failed to assign starting cards. Please refresh the page.');
      }
    }
  );
  
  const [localGameState, setLocalGameState] = useState({
    draggedSong: null as Song | null,
    mysteryCardRevealed: false,
    cardResult: null as { correct: boolean; song: Song } | null,
    isProcessingPlacement: false,
    userHasInteracted: false
  });

  // Audio control state for player-controlled, host-output system
  const [audioControlState, setAudioControlState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7
  });

  // Initialize game when component mounts
  useEffect(() => {
    console.log('🎮 GamePlay component mounted, initializing game...');
    try {
      initializeGame();
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setGameError('Failed to initialize game. Please refresh the page.');
    }
  }, [initializeGame]);

  // Handle user interaction for audio (only for players, not host)
  useEffect(() => {
    if (isHost) return; // Host doesn't need audio interaction
    
    const handleUserInteraction = () => {
      setLocalGameState(prev => ({ ...prev, userHasInteracted: true }));
      soundEffects.playPlayerJoin();
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [isHost, soundEffects]);

  // Real-time audio control subscription for player-controlled, host-output
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`audio-control-${room.id}`)
      .on('broadcast', { event: 'audio_control' }, (payload: any) => {
        console.log('🎵 Received audio control:', payload);
        
        if (isHost && audioRef.current) {
          const { action, currentTime, volume } = payload;
          
          switch (action) {
            case 'play':
              audioRef.current.currentTime = currentTime || 0;
              audioRef.current.play().catch(console.error);
              setIsPlaying(true);
              break;
            case 'pause':
              audioRef.current.pause();
              setIsPlaying(false);
              break;
            case 'seek':
              audioRef.current.currentTime = currentTime || 0;
              break;
            case 'volume':
              audioRef.current.volume = volume || 0.7;
              break;
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, isHost, setIsPlaying]);

  // Filter out host from players when determining current turn
  const activePlayers = players.filter(player => player.id !== room?.host_id);
  const currentTurnPlayer = getCurrentPlayer();
  const isMyTurn = currentPlayer?.id === currentTurnPlayer?.id;

  console.log('🎮 GamePlay render:', {
    isHost,
    currentTurnPlayer: currentTurnPlayer?.name,
    currentSong: gameState.currentSong?.deezer_title,
    activePlayers: activePlayers.length,
    gamePhase: gameState.phase,
    roomPhase: room?.phase
  });

  // Enhanced audio control for player-controlled, host-output
  const sendAudioControl = async (action: string, data: any = {}) => {
    if (!room?.id) return;
    
    try {
      await supabase
        .channel(`audio-control-${room.id}`)
        .send({
          type: 'broadcast',
          event: 'audio_control',
          payload: { action, ...data }
        });
    } catch (error) {
      console.error('Failed to send audio control:', error);
    }
  };

  const playPauseAudio = async () => {
    if (!gameState.currentSong?.preview_url) {
      toast({
        title: "Audio Error",
        description: "No audio available for this song",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isHost) {
        // Host controls audio directly
        if (!audioRef.current) return;

        if (gameState.isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
              })
              .catch(error => {
                console.error('Error playing audio:', error);
                toast({
                  title: "Audio Error",
                  description: "Could not play the song preview. Try a different browser or check your audio settings.",
                  variant: "destructive",
                });
              });
          }
        }
      } else {
        // Player sends control to host
        await sendAudioControl(gameState.isPlaying ? 'pause' : 'play', {
          currentTime: 0
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast({
        title: "Audio Error",
        description: "Failed to control audio playback",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (song: Song) => {
    if (!isMyTurn) return;
    setLocalGameState(prev => ({ ...prev, draggedSong: song }));
  };

  const handleDragEnd = () => {
    setLocalGameState(prev => ({ ...prev, draggedSong: null }));
  };

  // Optimized card placement with faster validation
  const handlePlaceCard = async (position: number) => {
    if (!gameState.currentSong || localGameState.isProcessingPlacement) return { success: false };

    console.log('🎯 Starting card placement optimization...');
    const startTime = Date.now();

    // Prevent spam clicking
    setLocalGameState(prev => ({ ...prev, isProcessingPlacement: true }));

    try {
      // Optimistic UI: Show card placement immediately
      setLocalGameState(prev => ({ ...prev, mysteryCardRevealed: true }));

      console.log('🎯 Placing card:', gameState.currentSong.deezer_title, 'at position:', position);
      
      // Call the placement with timeout for faster feedback
      const placementPromise = onPlaceCard(gameState.currentSong, position);
      const timeoutPromise = new Promise<{ success: boolean }>((_, reject) => {
        setTimeout(() => reject(new Error('Card placement timeout')), 5000);
      });

      const result = await Promise.race([placementPromise, timeoutPromise]);
      
      const endTime = Date.now();
      console.log(`🎯 Card placement completed in ${endTime - startTime}ms`);
      
      setLocalGameState(prev => ({
        ...prev,
        cardResult: { correct: result.success, song: gameState.currentSong! },
        isProcessingPlacement: false
      }));

      if (result.success) {
        soundEffects.playCardSuccess();
        toast({
          title: "Perfect!",
          description: `${gameState.currentSong.deezer_title} placed correctly!`,
        });
      } else {
        soundEffects.playCardError();
        toast({
          title: "Incorrect!",
          description: `${gameState.currentSong.deezer_title} - wrong position! Card destroyed.`,
          variant: "destructive",
        });
      }

      // Show result for 2 seconds, then start new turn
      setTimeout(() => {
        setLocalGameState(prev => ({ 
          ...prev, 
          cardResult: null, 
          mysteryCardRevealed: false 
        }));
        startNewTurn();
      }, 2000);

      return result;

    } catch (error) {
      console.error('Error placing card:', error);
      const endTime = Date.now();
      console.log(`🎯 Card placement failed after ${endTime - startTime}ms`);
      
      setLocalGameState(prev => ({ ...prev, isProcessingPlacement: false }));
      
      if (error instanceof Error && error.message.includes('timeout')) {
        toast({
          title: "Timeout",
          description: "Card placement is taking longer than expected. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to place card. Please try again.",
          variant: "destructive",
        });
      }
      return { success: false };
    }
  };

  // Error boundary display
  if (gameError) {
    return (
      <GameErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
          <Card className="max-w-md p-8 bg-red-900/20 border-red-500/50">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Game Error</h2>
              <p className="text-red-200">{gameError}</p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Refresh Game
              </Button>
            </div>
          </Card>
        </div>
      </GameErrorBoundary>
    );
  }

  // Check for winner
  const winner = players.find(player => player.score >= 10);
  if (winner) {
    return (
      <GameErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-800 to-violet-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.2),transparent_50%)]" />
          
          <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
            <div className="text-center space-y-8 max-w-2xl">
              <div className="relative">
                <Trophy className="w-32 h-32 mx-auto text-yellow-400 mb-6 animate-bounce" style={{
                  filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))',
                  animationDuration: '2s'
                }} />
                <div className="absolute -top-4 -right-4 text-6xl animate-spin" style={{animationDuration: '8s'}}>🎉</div>
                <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{animationDelay: '0.5s'}}>✨</div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 animate-pulse">
                  VICTORY!
                </h1>
                <div className="text-3xl font-bold text-white">
                  🏆 {winner.name} Takes the Crown! 🏆
                </div>
                <div className="text-xl text-gray-300 font-medium">
                  Final Score: <span className="text-yellow-400 font-bold text-2xl">{winner.score}</span> points
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 text-white">Final Leaderboard</h3>
                <div className="space-y-3">
                  {players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div 
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                          index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30' :
                          'bg-white/5 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-black">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white"
                              style={{ backgroundColor: player.color }}
                            />
                            <span className="font-semibold text-white text-lg">{player.name}</span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {player.score}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </GameErrorBoundary>
    );
  }

  // Audio element - only render for host
  const audioElement = isHost && gameState.currentSong?.preview_url && (
    <audio
      ref={audioRef}
      src={gameState.currentSong.preview_url}
      crossOrigin="anonymous"
      preload="metadata"
      onError={(e) => {
        console.error('Audio error:', e);
        toast({
          title: "Audio Error", 
          description: "Could not load song preview",
          variant: "destructive"
        });
      }}
      onEnded={() => setIsPlaying(false)}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
    />
  );

  // Enhanced host view with error boundary
  if (isHost) {
    console.log('🎮 Rendering HostGameView with:', {
      currentTurnPlayer: currentTurnPlayer?.name,
      players: activePlayers.length,
      currentSong: gameState.currentSong?.deezer_title,
      roomPhase: room?.phase
    });
    
    return (
      <GameErrorBoundary>
        {audioElement}
        <HostGameView
          currentTurnPlayer={currentTurnPlayer}
          currentSong={gameState.currentSong}
          roomCode={room?.lobby_code || ''}
          players={activePlayers}
          mysteryCardRevealed={localGameState.mysteryCardRevealed}
        />
      </GameErrorBoundary>
    );
  }

  // Player view with error boundary - only current player sees mystery card
  if (currentPlayer) {
    console.log('🎮 Rendering PlayerView for:', currentPlayer.name, 'isMyTurn:', isMyTurn);
    
    return (
      <GameErrorBoundary>
        <PlayerView
          currentPlayer={currentPlayer}
          currentTurnPlayer={currentTurnPlayer!}
          roomCode={room?.lobby_code || ''}
          isMyTurn={isMyTurn}
          gameState={{
            currentSong: isMyTurn ? gameState.currentSong : null, // Only show to current player
            isPlaying: gameState.isPlaying,
            timeLeft: gameState.timeLeft,
            cardPlacementPending: localGameState.isProcessingPlacement,
            mysteryCardRevealed: localGameState.mysteryCardRevealed,
            cardPlacementCorrect: localGameState.cardResult?.correct || null
          }}
          draggedSong={localGameState.draggedSong}
          onPlaceCard={handlePlaceCard}
          onPlayPause={playPauseAudio}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </GameErrorBoundary>
    );
  }

  return (
    <GameErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-spin">🎵</div>
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-slate-300">Setting up your game experience</div>
        </div>
      </div>
    </GameErrorBoundary>
  );
}

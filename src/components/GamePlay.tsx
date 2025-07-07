import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerVisuals';
import { HostGameView } from '@/components/HostVisuals';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GameService } from '@/services/gameService';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';

interface GamePlayProps {
  room: any;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number, availableSongs?: Song[]) => Promise<{ success: boolean; correct?: boolean }>;
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
  const soundEffects = useSoundEffects();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [lastTurnIndex, setLastTurnIndex] = useState<number>(-1);

  // Audio management - FIXED
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChannelRef = useRef<any>(null);

  const {
    gameState,
    setIsPlaying: setGameIsPlaying,
    initializeGame
  } = useGameLogic(room?.id, players, room, onSetCurrentSong);

  // CRITICAL FIX: Initialize game with starting cards
  useEffect(() => {
    const shouldInitialize = room?.phase === 'playing' && 
                           !gameInitialized &&
                           !gameState.playlistInitialized;

    if (shouldInitialize && isHost) {
      console.log('🎯 INIT: Host initializing game with starting cards...');
      
      setInitializationError(null);
      setGameInitialized(true);
      
      const initializeGameWithStartingCards = async () => {
        try {
          // Load only 10 random songs for better performance
          console.log('📥 Loading 10 random songs for game...');
          const allSongs = await defaultPlaylistService.loadDefaultPlaylist();
          
          if (allSongs.length === 0) {
            throw new Error('No songs available in playlist');
          }

          // PERFORMANCE FIX: Select only 10 random songs instead of entire playlist
          const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
          const selectedSongs = shuffledSongs.slice(0, 10);
          
          const songsWithPreviews = defaultPlaylistService.filterSongsWithPreviews(selectedSongs);
          
          console.log(`🔍 Performance optimization: Using ${selectedSongs.length} songs instead of ${allSongs.length}`);

          if (songsWithPreviews.length < 5) {
            throw new Error('Not enough songs with valid audio previews. Need at least 5 songs.');
          }

          // Initialize game with starting cards for all players
          await GameService.initializeGameWithStartingCards(room.id, selectedSongs);
          
          console.log('✅ INIT: Game initialized with starting cards for all players');
        } catch (error) {
          console.error('❌ INIT: Failed to initialize game:', error);
          setInitializationError(error instanceof Error ? error.message : 'Failed to initialize game');
          setGameInitialized(false);
        }
      };

      initializeGameWithStartingCards();
    }
  }, [room?.phase, gameInitialized, gameState.playlistInitialized, isHost, room?.id]);

  // Initialize game logic after host sets up the room
  useEffect(() => {
    if (room?.phase === 'playing' && !gameState.playlistInitialized) {
      initializeGame();
    }
  }, [room?.phase, gameState.playlistInitialized, initializeGame]);

  // Track turn changes for mystery card updates
  useEffect(() => {
    const currentTurn = room?.current_turn || 0;
    
    if (room?.id && currentTurn !== lastTurnIndex && lastTurnIndex !== -1) {
      console.log('🔄 TURN CHANGE: Mystery card should update automatically');
    }
    
    setLastTurnIndex(currentTurn);
  }, [room?.current_turn, room?.id, lastTurnIndex]);

  // Check for game end condition
  useEffect(() => {
    const activePlayers = players.filter(p => !p.id.includes(room?.host_id));
    const winningPlayer = activePlayers.find(player => player.timeline.length >= 10);
    
    if (winningPlayer && !gameEnded) {
      console.log('🎯 GAME END: Player reached 10 cards:', winningPlayer.name);
      setGameEnded(true);
      
      if (isHost) {
        GameService.endGame(room.id).catch(error => {
          console.error('Failed to end game in database:', error);
        });
      }
      
      try {
        soundEffects.playGameStart();
      } catch (error) {
        console.warn('Could not play victory sound:', error);
      }
    }
  }, [players, room?.host_id, gameEnded, soundEffects, room?.id, isHost]);

  // Get current game state
  const currentMysteryCard = room?.current_song;
  const currentTurnPlayerId = room?.current_player_id;
  const activePlayers = players.filter(p => !p.id.includes(room?.host_id));
  const currentTurnPlayer = activePlayers.find(p => p.id === currentTurnPlayerId) || activePlayers[room?.current_turn || 0];

  // FIXED: Audio playback with proper user interaction handling
  const handlePlayPause = async () => {
    if (gameEnded || !currentTurnPlayer || !currentMysteryCard) {
      console.log('🚫 Cannot play: game ended or missing data');
      return;
    }

    // Only current turn player can control audio
    if (currentPlayer && currentPlayer.id !== currentTurnPlayerId) {
      console.log('🚫 Not your turn - audio control blocked');
      return;
    }

    // Pause if already playing
    if (isPlaying && currentAudioRef.current) {
      console.log('🎵 Pausing audio');
      currentAudioRef.current.pause();
      setIsPlaying(false);
      setGameIsPlaying(false);
      return;
    }

    // Get preview URL
    const previewUrl = currentMysteryCard.preview_url;
    
    if (!previewUrl) {
      console.log('❌ No preview URL available');
      return;
    }
    
    console.log('🎵 PLAYING AUDIO:', previewUrl);
    
    // Stop any existing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Create new audio element
    const audio = new Audio(previewUrl);
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.7;
    currentAudioRef.current = audio;
    
    // Add event listeners
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio ended');
      setIsPlaying(false);
      setGameIsPlaying(false);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('🎵 Audio error:', e);
      setIsPlaying(false);
      setGameIsPlaying(false);
    });
    
    audio.addEventListener('loadstart', () => {
      console.log('🎵 Audio loading started');
    });
    
    audio.addEventListener('canplay', () => {
      console.log('🎵 Audio can play');
    });
    
    try {
      // CRITICAL FIX: Ensure user interaction before playing
      await audio.play();
      console.log('🎵 AUDIO PLAYING SUCCESSFULLY');
      setIsPlaying(true);
      setGameIsPlaying(true);
    } catch (error) {
      console.error('🎵 Audio play failed:', error);
      setIsPlaying(false);
      setGameIsPlaying(false);
      
      // Show user-friendly error
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.warn('🎵 Audio blocked by browser - user interaction required');
      }
    }
  };

  // CRITICAL FIX: Use new turn advancement method
  const handlePlaceCard = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (gameEnded || !currentPlayer) {
      return { success: false };
    }

    if (currentPlayer.id !== currentTurnPlayerId) {
      console.error('❌ Not your turn!');
      return { success: false };
    }

    try {
      console.log('🃏 CARD PLACEMENT: Using new turn advancement logic');
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      // Stop audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);

      // Use new method that handles turn advancement
      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        gameState.availableSongs
      );
      
      console.log('🃏 CARD PLACEMENT: Result with turn advancement:', result);
      
      if (result.success) {
        const isCorrect = result.correct ?? false;
        
        setCardPlacementResult({ 
          correct: isCorrect, 
          song: song 
        });

        if (isCorrect) {
          soundEffects.playCardSuccess();
        } else {
          soundEffects.playCardError();
        }

        // Show result for 3 seconds
        setTimeout(() => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
          setIsPlaying(false);
          
          if (result.gameEnded) {
            setGameEnded(true);
          }
        }, 3000);

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Failed to place card:', error);
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
      return { success: false };
    }
  };

  // Show initialization error
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">🚨</div>
          <div className="text-4xl font-bold mb-4">Cannot Start Game</div>
          <div className="text-xl mb-6">{initializationError}</div>
          <div className="text-lg text-white/60">Please check your playlist and try again.</div>
        </div>
      </div>
    );
  }

  // Show game over screen
  if (gameEnded) {
    const winningPlayer = activePlayers.find(player => player.timeline.length >= 10);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white relative z-10">
          <div className="text-6xl mb-6">🏆</div>
          <div className="text-4xl font-bold mb-4">Game Over!</div>
          {winningPlayer && (
            <div className="text-2xl mb-6">
              <span style={{ color: winningPlayer.color }}>{winningPlayer.name}</span> wins!
            </div>
          )}
          <div className="text-lg text-white/60">Thanks for playing!</div>
        </div>
      </div>
    );
  }

  // Check if game is ready
  const gameReady = 
    room?.phase === 'playing' &&
    activePlayers.length > 0 &&
    currentMysteryCard &&
    currentTurnPlayer;

  if (!gameReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        <div className="text-center text-white relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto border border-white/20">
            <div className="text-3xl animate-spin">🎵</div>
          </div>
          <div className="text-2xl font-semibold mb-2">Setting up the game...</div>
          <div className="text-white/60 max-w-md mx-auto">Preparing players and songs</div>
        </div>
      </div>
    );
  }

  // Host view
  if (isHost) {
    return (
      <div className="relative">
        <HostGameView
          currentTurnPlayer={currentTurnPlayer}
          currentSong={currentMysteryCard}
          roomCode={room.lobby_code}
          players={activePlayers}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          cardPlacementResult={cardPlacementResult}
        />
      </div>
    );
  }

  // Player view
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white relative z-10">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-semibold mb-2">Something went wrong</div>
          <div className="text-white/60">Couldn't find your player info</div>
        </div>
      </div>
    );
  }

  const isMyTurn = currentPlayer.id === currentTurnPlayerId;

  return (
    <div className="relative">
      <PlayerGameView
        currentPlayer={currentPlayer}
        currentTurnPlayer={currentTurnPlayer}
        currentSong={currentMysteryCard}
        roomCode={room.lobby_code}
        isMyTurn={isMyTurn}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onPlaceCard={handlePlaceCard}
        mysteryCardRevealed={mysteryCardRevealed}
        cardPlacementResult={cardPlacementResult}
        gameEnded={gameEnded}
      />
    </div>
  );
}

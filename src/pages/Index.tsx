import React, { useState, useEffect, useRef } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameCleanup } from '@/hooks/useGameCleanup';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Button } from '@/components/ui/button';
import { Player, Song, GameState, GamePhase } from '@/types/game';
import { gameService } from '@/services/gameService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AudioPlayer } from '@/components/AudioPlayer';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { PlayerView } from '@/components/PlayerView';
import { VictoryScreen } from '@/components/VictoryScreen';
import { HostDisplay } from '@/components/HostDisplay';

export default function Index() {
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [validGameSongs, setValidGameSongs] = useState<Song[]>([]);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [currentSongProgress, setCurrentSongProgress] = useState(0);
  const [currentSongDuration, setCurrentSongDuration] = useState(30);
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [songLoadingError, setSongLoadingError] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    startGame,
    leaveRoom
  } = useGameRoom();
  
  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    currentTurn: 0,
    currentSong: null,
    timeLeft: 30,
    isPlaying: false,
    isDarkMode: true,
    throwingCard: null,
    confirmingPlacement: null,
    cardResult: null,
    transitioningTurn: false,
    winner: null,
    isMuted: false,
    pendingPlacement: null,
    cardPlacementPending: false,
    cardPlacementConfirmed: false,
    cardPlacementCorrect: null,
    mysteryCardRevealed: false,
  });

  // Setup game cleanup for idle rooms - 15 minutes
  useGameCleanup({
    roomId: room?.id,
    isHost,
    timeout: 15 * 60 * 1000,
    onRoomClosed: () => {
      toast({
        title: "Room closed",
        description: "The room was closed due to inactivity.",
        variant: "destructive",
      });
      handleBackToMenu();
    }
  });

  // Audio progress tracking with enhanced error handling
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateProgress = () => {
        setCurrentSongProgress(audio.currentTime || 0);
        setCurrentSongDuration(audio.duration || 30);
      };
      
      const handleLoadedMetadata = () => {
        setCurrentSongDuration(audio.duration || 30);
        setAudioPlaybackError(null);
        console.log('🎵 Audio metadata loaded successfully');
      };

      const handleAudioError = (e: Event) => {
        console.error('🎵 Audio playback error:', e);
        const errorMsg = 'Unable to play this song preview. This may be due to network issues or browser restrictions.';
        setAudioPlaybackError(errorMsg);
        setGameState(prev => ({ ...prev, isPlaying: false }));
        
        toast({
          title: "Audio Error",
          description: errorMsg,
          variant: "destructive",
        });
      };

      const handleAudioEnded = () => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      };

      const handleCanPlay = () => {
        console.log('🎵 Audio ready to play');
        setAudioPlaybackError(null);
      };
      
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('error', handleAudioError);
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('canplay', handleCanPlay);
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('error', handleAudioError);
        audio.removeEventListener('ended', handleAudioEnded);
        audio.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [gameState.currentSong, toast]);

  // Filter songs only when customSongs changes
  useEffect(() => {
    const filterSongsOnce = async () => {
      if (customSongs.length === 0) {
        setValidGameSongs([]);
        return;
      }

      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const validSongs = defaultPlaylistService.filterValidSongs(customSongs);
        console.log('🎵 Filtered valid songs:', validSongs.length, 'out of', customSongs.length);
        setValidGameSongs(validSongs);

        if (room?.id && isHost && validSongs.length > 0) {
          await updateRoomSongs(validSongs);
        }
      } catch (error) {
        console.error('❌ Song filtering failed:', error);
        const errorMsg = 'Failed to process songs. Please try a different playlist or refresh the page.';
        setGameError(errorMsg);
        setValidGameSongs([]);
        
        toast({
          title: "Song Processing Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    };

    filterSongsOnce();
  }, [customSongs, room?.id, isHost, updateRoomSongs, toast]);

  // Get the current valid song list
  const getValidGameSongs = (): Song[] => {
    if (room?.songs && room.songs.length > 0) {
      return room.songs;
    }
    if (validGameSongs.length > 0) {
      return validGameSongs;
    }
    return [];
  };

  // Pick and prepare a song for the turn with comprehensive error handling
  const pickAndPrepareSong = async (): Promise<Song | null> => {
    const songs = getValidGameSongs();
    
    if (songs.length === 0) {
      console.error('❌ No songs available for turn');
      const errorMsg = 'No valid songs available. Please load a playlist first.';
      setSongLoadingError(errorMsg);
      setGameError(errorMsg);
      
      toast({
        title: "No Songs Available",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    }
    
    let attempts = 0;
    const maxAttempts = Math.min(5, songs.length);
    
    while (attempts < maxAttempts) {
      try {
        const randomIndex = Math.floor(Math.random() * songs.length);
        const selectedSong = songs[randomIndex];
        
        console.log('🎯 SELECTED SONG:', selectedSong.deezer_title, 'by', selectedSong.deezer_artist, '(' + selectedSong.release_year + ')');
        
        if (!selectedSong.preview_url) {
          console.log('🔄 Fetching preview URL for song...');
          const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
          const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(selectedSong);
          
          if (!songWithPreview.preview_url) {
            console.warn('⚠️ No preview URL available for this song, trying another...');
            attempts++;
            continue;
          }
          
          console.log('✅ SONG READY WITH PREVIEW');
          setSongLoadingError(null);
          setGameError(null);
          return songWithPreview;
        }
        
        console.log('✅ SONG READY (already had preview)');
        setSongLoadingError(null);
        setGameError(null);
        return selectedSong;
      } catch (error) {
        console.warn(`⚠️ Song preparation failed (attempt ${attempts + 1}):`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          const errorMsg = 'Failed to load song preview after multiple attempts. This may be due to network issues.';
          setSongLoadingError(errorMsg);
          setGameError(errorMsg);
          
          toast({
            title: "Song Loading Failed",
            description: errorMsg,
            variant: "destructive",
          });
          return null;
        }
      }
    }
    
    return null;
  };

  // Start a new turn with enhanced error handling and recovery
  const startNewTurn = async (turnIndex: number) => {
    console.log('🚀 STARTING TURN', turnIndex, 'for player:', players[turnIndex % players.length]?.name);
    
    const songs = getValidGameSongs();
    if (songs.length === 0) {
      console.error('❌ Cannot start turn - no valid songs available');
      const errorMsg = 'No songs available for gameplay. Please load a playlist first.';
      setGameError(errorMsg);
      setSongLoadingError(errorMsg);
      
      toast({
        title: "Cannot Start Turn",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingSong(true);
    setSongLoadingError(null);
    setGameError(null);
    setAudioPlaybackError(null);
    
    try {
      const selectedSong = await pickAndPrepareSong();
      
      if (selectedSong) {
        console.log('✅ UPDATING GAME STATE WITH SONG:', selectedSong.deezer_title);
        
        // Update local state immediately
        setGameState(prev => ({
          ...prev,
          currentTurn: turnIndex,
          timeLeft: 30,
          isPlaying: false,
          cardPlacementPending: false,
          cardPlacementConfirmed: false,
          cardPlacementCorrect: null,
          mysteryCardRevealed: false,
          currentSong: selectedSong
        }));

        // Update database if host with better error handling
        if (room?.id && isHost) {
          try {
            await gameService.updateGameState(room.id, {
              currentTurn: turnIndex,
              currentSong: selectedSong
            });
            console.log('✅ Game state updated in database');
          } catch (dbError) {
            console.error('❌ Database update failed:', dbError);
            // Don't fail the turn start, just log the error
            toast({
              title: "Database Warning",
              description: "Game continues locally. Some features may be limited.",
            });
          }
        }
        
        console.log('✅ TURN READY - Mystery card should now be visible');
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error('Failed to prepare song for turn');
      }
    } catch (error) {
      console.error('❌ Turn start error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error starting the turn';
      setSongLoadingError(errorMsg);
      setGameError(errorMsg);
      
      toast({
        title: "Turn Start Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSong(false);
    }
  };

  // Navigation handlers with sound effects
  const handleHostGame = async () => {
    try {
      soundEffects.playPlayerAction();
      
      const roomId = await createRoom();
      if (roomId) {
        setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
        setGameError(null); // Clear any previous errors
      }
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      toast({
        title: "Room Creation Failed",
        description: "Unable to create game room. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinGame = () => {
    soundEffects.playPlayerAction();
    setGameState(prev => ({ ...prev, phase: 'mobileJoin' }));
  };

  const handleBackToMenu = () => {
    soundEffects.playPlayerAction();
    soundEffects.stopAllSounds();
    leaveRoom();
    setGameState(prev => ({ 
      ...prev, 
      phase: 'menu',
      currentTurn: 0,
      currentSong: null,
      timeLeft: 30,
      isPlaying: false,
      throwingCard: null,
      confirmingPlacement: null,
      cardResult: null,
      transitioningTurn: false,
      winner: null,
      pendingPlacement: null,
      cardPlacementPending: false,
      cardPlacementConfirmed: false,
      cardPlacementCorrect: null,
      mysteryCardRevealed: false,
    }));
    setValidGameSongs([]);
    setGameError(null);
    setSongLoadingError(null);
    setAudioPlaybackError(null);
    setRetryCount(0);
  };

  const handleJoinLobby = async (lobbyCode: string, playerName: string) => {
    try {
      const success = await joinRoom(lobbyCode, playerName);
      if (success) {
        soundEffects.playSound('player-join');
        setGameState(prev => ({ ...prev, phase: 'mobileLobby' }));
        setGameError(null); // Clear any previous errors
      }
    } catch (error) {
      console.error('❌ Failed to join lobby:', error);
      toast({
        title: "Join Failed",
        description: "Unable to join game lobby. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlayer = async (name: string, color: string) => {
    try {
      await updatePlayer(name, color);
    } catch (error) {
      console.error('❌ Failed to update player:', error);
      toast({
        title: "Update Failed",
        description: "Unable to update player information.",
        variant: "destructive",
      });
    }
  };

  // Game control handlers with enhanced error handling
  const handleStartGame = async () => {
    if (players.length < 2) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "Need at least 2 players to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    const songs = getValidGameSongs();
    
    if (songs.length === 0) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "No valid songs available. Please add songs to continue.",
        variant: "destructive",
      });
      return;
    }

    if (songs.length < 5) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: `Only ${songs.length} valid songs found. Need at least 5 songs for optimal gameplay.`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (room?.id && (!room.songs || room.songs.length !== songs.length)) {
        await updateRoomSongs(songs);
      }
      
      if (room?.id) {
        await gameService.assignStartingCards(room.id, songs);
      }
      
      await startGame();
      
      soundEffects.playSound('game-start');
      
      setGameState(prev => ({
        ...prev,
        phase: 'playing',
        currentTurn: 0,
        timeLeft: 30,
        isPlaying: false,
        cardPlacementPending: false,
        cardPlacementConfirmed: false,
        cardPlacementCorrect: null,
        mysteryCardRevealed: false
      }));

      await startNewTurn(0);

      toast({
        title: "🎵 Game Started!",
        description: `Playing with ${songs.length} valid songs!`,
      });
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      soundEffects.playCardError();
      toast({
        title: "Game Start Failed",
        description: "Unable to start the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndGame = (winner: Player) => {
    setGameState(prev => ({
      ...prev,
      phase: 'finished',
      winner
    }));
    
    soundEffects.playGameVictory();
  };

  const getCurrentTurnPlayer = () => {
    if (players.length === 0) return null;
    return players[gameState.currentTurn % players.length];
  };

  const handlePlaceCard = async (position: number): Promise<{ success: boolean }> => {
    if (!gameState.currentSong || !currentPlayer || !room?.id) {
      return { success: false };
    }
    
    console.log('🎯 Placing card at position:', position);
    
    setGameState(prev => ({
      ...prev,
      cardPlacementPending: true,
      cardPlacementConfirmed: true
    }));

    try {
      // Update database
      const result = await gameService.placeCard(
        room.id, 
        currentPlayer.id, 
        gameState.currentSong, 
        position
      );
      
      if (result.success) {
        setGameState(prev => ({
          ...prev,
          cardPlacementCorrect: true,
          mysteryCardRevealed: true
        }));
        
        soundEffects.playSound('correct');
        
        // Move to next turn after delay
        setTimeout(async () => {
          const nextTurn = (gameState.currentTurn + 1) % players.length;
          await startNewTurn(nextTurn);
        }, 2000);
        
        return { success: true };
      } else {
        setGameState(prev => ({
          ...prev,
          cardPlacementCorrect: false,
          mysteryCardRevealed: true
        }));
        
        soundEffects.playSound('incorrect');
        
        setTimeout(async () => {
          const nextTurn = (gameState.currentTurn + 1) % players.length;
          await startNewTurn(nextTurn);
        }, 2000);
        
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Card placement error:', error);
      const errorMsg = 'Failed to place card. Please try again.';
      setSongLoadingError(errorMsg);
      
      toast({
        title: "Card Placement Failed",
        description: errorMsg,
        variant: "destructive",
      });
      
      return { success: false };
    }
  };

  const handleDragStart = (song: Song) => {
    console.log('🎯 Drag started for song:', song.deezer_title);
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    console.log('🎯 Drag ended');
    setDraggedSong(null);
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !gameState.currentSong?.preview_url) {
      const errorMsg = 'No audio available for this song';
      setAudioPlaybackError(errorMsg);
      
      toast({
        title: "Audio Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      if (gameState.isPlaying) {
        audioRef.current.pause();
        setGameState(prev => ({ ...prev, isPlaying: false }));
      } else {
        // Clear any previous errors
        setAudioPlaybackError(null);
        
        // Reset audio to beginning
        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setGameState(prev => ({ ...prev, isPlaying: true }));
        }
      }
    } catch (error) {
      console.error('🎵 Audio playback failed:', error);
      const errorMsg = 'Unable to play audio. This may be due to browser restrictions or network issues.';
      setAudioPlaybackError(errorMsg);
      setGameState(prev => ({ ...prev, isPlaying: false }));
      
      toast({
        title: "Playback Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleRetryAudio = async () => {
    setAudioPlaybackError(null);
    await handlePlayPause();
  };

  const handleSkipSong = async () => {
    if (isHost && gameState.phase === 'playing') {
      const nextTurn = (gameState.currentTurn + 1) % players.length;
      await startNewTurn(nextTurn);
      
      toast({
        title: "Song Skipped",
        description: "Moving to next song...",
      });
    }
  };

  const handleRetryGame = async () => {
    if (retryCount >= 3) {
      toast({
        title: "Too Many Retries",
        description: "Please refresh the page to continue.",
        variant: "destructive",
      });
      return;
    }

    setRetryCount(prev => prev + 1);
    
    if (gameState.phase === 'playing' && players.length > 0) {
      await startNewTurn(gameState.currentTurn);
    }
  };

  // Phase rendering with comprehensive error handling
  const renderPhase = () => {
    // Show game error overlay if there's a critical error
    if (gameError && gameState.phase === 'playing') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center p-8">
          <div className="bg-red-900/80 backdrop-blur-lg rounded-2xl p-8 border border-red-600/50 max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Game Error</h2>
            <p className="text-red-200 mb-6">{gameError}</p>
            <div className="space-y-3">
              <Button
                onClick={handleRetryGame}
                disabled={retryCount >= 3}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Try Again ({retryCount}/3)
              </Button>
              <Button
                onClick={handleBackToMenu}
                variant="outline"
                className="w-full border-red-400 text-red-200 hover:bg-red-800"
              >
                Back to Menu
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full border-red-400 text-red-200 hover:bg-red-800"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    switch (gameState.phase) {
      case 'menu':
        return (
          <MainMenu
            onHostGame={handleHostGame}
            onJoinGame={handleJoinGame}
          />
        );

      case 'hostLobby':
        return (
          <HostLobby
            lobbyCode={room?.lobby_code || ''}
            players={players}
            onStartGame={handleStartGame}
            onBackToMenu={handleBackToMenu}
            setCustomSongs={setCustomSongs}
            isLoading={isLoading}
            createRoom={async () => true}
            currentHostName=""
          />
        );

      case 'mobileJoin':
        return (
          <MobileJoin
            onJoinLobby={handleJoinLobby}
            onBackToMenu={handleBackToMenu}
            isLoading={isLoading}
          />
        );

      case 'mobileLobby':
        if (!currentPlayer || !room) return null;
        return (
          <MobilePlayerLobby
            player={currentPlayer}
            lobbyCode={room.lobby_code}
            onUpdatePlayer={handleUpdatePlayer}
            gamePhase={room.phase}
            onGameStart={() => setGameState(prev => ({ ...prev, phase: 'playing' }))}
          />
        );

      case 'playing':
        if (isHost) {
          const currentTurnPlayer = getCurrentTurnPlayer();
          if (!currentTurnPlayer) {
            return (
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-8">
                <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50 max-w-md text-center">
                  <div className="text-6xl mb-4">🎵</div>
                  <h2 className="text-2xl font-bold text-white mb-4">Waiting for Players</h2>
                  <p className="text-slate-300 mb-6">No players are currently in the game. Waiting for players to join...</p>
                  <Button onClick={handleBackToMenu} className="w-full">
                    Back to Lobby
                  </Button>
                </div>
              </div>
            );
          }
          
          return (
            <HostDisplay
              currentTurnPlayer={currentTurnPlayer}
              players={players}
              roomCode={room?.lobby_code || ''}
              currentSongProgress={currentSongProgress}
              currentSongDuration={currentSongDuration}
              gameState={{
                currentSong: gameState.currentSong,
                mysteryCardRevealed: gameState.mysteryCardRevealed,
                cardPlacementCorrect: gameState.cardPlacementCorrect
              }}
              songLoadingError={songLoadingError}
              retryingSong={isLoadingSong}
              onRetrySong={handleRetryGame}
              audioPlaybackError={audioPlaybackError}
              onRetryAudio={handleRetryAudio}
              onSkipSong={handleSkipSong}
            />
          );
        } else {
          const currentTurnPlayer = getCurrentTurnPlayer();
          if (!currentPlayer) {
            return (
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-8">
                <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50 max-w-md text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-white mb-4">Player Not Found</h2>
                  <p className="text-slate-300 mb-6">Your player data could not be loaded. Please rejoin the game.</p>
                  <Button onClick={handleBackToMenu} className="w-full">
                    Back to Menu
                  </Button>
                </div>
              </div>
            );
          }
          
          if (!currentTurnPlayer) {
            return (
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center p-8">
                <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50 max-w-md text-center">
                  <div className="text-6xl mb-4">🎵</div>
                  <h2 className="text-2xl font-bold text-white mb-4">Waiting for Game</h2>
                  <p className="text-slate-300 mb-6">Waiting for the game to start...</p>
                  <Button onClick={handleBackToMenu} className="w-full">
                    Back to Menu
                  </Button>
                </div>
              </div>
            );
          }
          
          return (
            <PlayerView
              currentPlayer={currentPlayer}
              currentTurnPlayer={currentTurnPlayer}
              roomCode={room?.lobby_code || ''}
              isMyTurn={currentPlayer.id === currentTurnPlayer.id}
              gameState={{
                currentSong: gameState.currentSong,
                isPlaying: gameState.isPlaying,
                timeLeft: gameState.timeLeft,
                cardPlacementPending: gameState.cardPlacementPending,
                mysteryCardRevealed: gameState.mysteryCardRevealed,
                cardPlacementCorrect: gameState.cardPlacementCorrect
              }}
              draggedSong={draggedSong}
              onPlaceCard={handlePlaceCard}
              onPlayPause={handlePlayPause}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              songLoadingError={songLoadingError}
              retryingSong={isLoadingSong}
              audioPlaybackError={audioPlaybackError}
              onRetryAudio={handleRetryAudio}
              onSkipSong={handleSkipSong}
            />
          );
        }

      case 'finished':
        if (!gameState.winner) return null;
        return (
          <VictoryScreen 
            winner={gameState.winner}
            players={players}
            onBackToMenu={handleBackToMenu}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary onReset={handleBackToMenu}>
      {isHost && gameState.phase === 'playing' && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          crossOrigin="anonymous"
          preload="metadata"
        />
      )}
      {renderPhase()}
    </ErrorBoundary>
  );
}

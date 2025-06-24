import React, { useState, useEffect, useRef } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useGameCleanup } from '@/hooks/useGameCleanup';
import { useToast } from '@/components/ui/use-toast';
import { useSoundEffects } from '@/lib/SoundEffects';
import { Player, Song, GameState, GamePhase } from '@/types/game';
import { gameService } from '@/services/gameService';
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

  // Audio progress tracking
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateProgress = () => {
        setCurrentSongProgress(audio.currentTime || 0);
        setCurrentSongDuration(audio.duration || 30);
      };
      
      const handleLoadedMetadata = () => {
        setCurrentSongDuration(audio.duration || 30);
      };
      
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [gameState.currentSong]);

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
        setValidGameSongs([]);
      }
    };

    filterSongsOnce();
  }, [customSongs, room?.id, isHost, updateRoomSongs]);

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

  // Pick and prepare a song for the turn
  const pickAndPrepareSong = async (): Promise<Song | null> => {
    const songs = getValidGameSongs();
    
    if (songs.length === 0) {
      console.error('❌ No songs available for turn');
      setSongLoadingError('No valid songs available');
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * songs.length);
    const selectedSong = songs[randomIndex];
    
    console.log('🎯 SELECTED SONG:', selectedSong.deezer_title, 'by', selectedSong.deezer_artist, '(' + selectedSong.release_year + ')');
    
    if (!selectedSong.preview_url) {
      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(selectedSong);
        console.log('✅ SONG READY WITH PREVIEW');
        setSongLoadingError(null);
        return songWithPreview;
      } catch (error) {
        console.warn('⚠️ Preview fetch failed, using song without preview:', error);
        setSongLoadingError(null);
        return selectedSong;
      }
    }
    
    console.log('✅ SONG READY (already had preview)');
    setSongLoadingError(null);
    return selectedSong;
  };

  // Start a new turn with proper state management
  const startNewTurn = async (turnIndex: number) => {
    console.log('🚀 STARTING TURN', turnIndex, 'for player:', players[turnIndex % players.length]?.name);
    
    const songs = getValidGameSongs();
    if (songs.length === 0) {
      console.error('❌ Cannot start turn - no valid songs available');
      setSongLoadingError('No valid songs available for gameplay');
      return;
    }
    
    setIsLoadingSong(true);
    setSongLoadingError(null);
    
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

        // Update database if host
        if (room?.id && isHost) {
          await gameService.updateGameState(room.id, {
            currentTurn: turnIndex,
            currentSong: selectedSong
          });
        }
        
        console.log('✅ TURN READY - Mystery card should now be visible');
      } else {
        console.error('❌ Failed to prepare song for turn');
        setSongLoadingError('Failed to load a song for this turn');
      }
    } catch (error) {
      console.error('❌ Turn start error:', error);
      setSongLoadingError('Error starting the turn. Please try again.');
    } finally {
      setIsLoadingSong(false);
    }
  };

  // Navigation handlers with sound effects
  const handleHostGame = async () => {
    soundEffects.playPlayerAction();
    
    const roomId = await createRoom();
    if (roomId) {
      setGameState(prev => ({ ...prev, phase: 'hostLobby' }));
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
  };

  const handleJoinLobby = async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      soundEffects.playSound('player-join');
      setGameState(prev => ({ ...prev, phase: 'mobileLobby' }));
    }
  };

  const handleUpdatePlayer = async (name: string, color: string) => {
    await updatePlayer(name, color);
  };

  // Game control handlers with sound effects
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
      setSongLoadingError('Failed to place card');
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

  const handlePlayPause = () => {
    if (audioRef.current && gameState.currentSong) {
      if (gameState.isPlaying) {
        audioRef.current.pause();
        setGameState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current.play().then(() => {
          setGameState(prev => ({ ...prev, isPlaying: true }));
        }).catch(console.error);
      }
    }
  };

  // Phase rendering
  const renderPhase = () => {
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
          if (!currentTurnPlayer) return null;
          
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
              onRetrySong={async () => {
                await startNewTurn(gameState.currentTurn);
              }}
            />
          );
        } else {
          const currentTurnPlayer = getCurrentTurnPlayer();
          if (!currentPlayer || !currentTurnPlayer) return null;
          
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
    <>
      {isHost && gameState.phase === 'playing' && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          crossOrigin="anonymous"
          preload="auto"
          onError={(e) => {
            console.error('Audio error:', e);
          }}
        />
      )}
      {renderPhase()}
    </>
  );
}

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
  const [validatedSongs, setValidatedSongs] = useState<Song[]>([]);
  const [songLoadingError, setSongLoadingError] = useState<string | null>(null);
  const [retryingSong, setRetryingSong] = useState(false);
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

  const [currentSongProgress, setCurrentSongProgress] = useState(0);
  const [currentSongDuration, setCurrentSongDuration] = useState(30);

  // Setup game cleanup for idle rooms - extended to 15 minutes
  useGameCleanup({
    roomId: room?.id,
    isHost,
    timeout: 15 * 60 * 1000, // 15 minutes
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

  // Filter and validate songs only when customSongs changes
  useEffect(() => {
    const validateAndSyncSongs = async () => {
      if (customSongs.length === 0) {
        console.log('🔄 No custom songs to validate');
        setValidatedSongs([]);
        return;
      }

      console.log('=== FILTERING SONGS (ONE TIME) ===');
      console.log(`Input: ${customSongs.length} custom songs to validate`);

      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const filteredSongs = defaultPlaylistService.filterValidSongs(customSongs);
        
        console.log(`✅ One-time filtering complete: ${filteredSongs.length} valid songs stored`);
        console.log('Valid songs stored:', filteredSongs.map(s => `"${s.deezer_title}" (${s.release_year})`));
        setValidatedSongs(filteredSongs);

        // If we have a room and are the host, update room songs
        if (room?.id && isHost && filteredSongs.length > 0) {
          console.log('🔄 Syncing validated songs to room...');
          await updateRoomSongs(filteredSongs);
          console.log('✅ Songs synced to room successfully');
        }
      } catch (error) {
        console.error('❌ Song validation failed:', error);
        setValidatedSongs([]);
      }
    };

    validateAndSyncSongs();
  }, [customSongs, room?.id, isHost, updateRoomSongs]);

  // Get available songs for gameplay (no filtering, just return what's already filtered)
  const getAvailableSongs = (): Song[] => {
    if (room?.songs && room.songs.length > 0) {
      console.log(`📂 Using room songs: ${room.songs.length}`);
      return room.songs;
    }
    if (validatedSongs.length > 0) {
      console.log(`📂 Using validated songs: ${validatedSongs.length}`);
      return validatedSongs;
    }
    console.log('📂 No filtered songs available');
    return [];
  };

  // Simplified function to pick a random song from the pre-filtered list
  const pickRandomSongForTurn = async (): Promise<Song | null> => {
    console.log('=== PICKING RANDOM SONG FOR TURN ===');
    
    const availableSongs = getAvailableSongs();
    
    if (!availableSongs || availableSongs.length === 0) {
      console.error('❌ NO FILTERED SONGS AVAILABLE for turn');
      setSongLoadingError('No songs available. Please add songs to continue.');
      return null;
    }
    
    console.log(`🎯 Picking from ${availableSongs.length} pre-filtered songs`);
    
    // Pick a random song from the already-filtered list
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const selectedSong = availableSongs[randomIndex];
    
    console.log(`🎵 Selected song:`, {
      title: selectedSong.deezer_title,
      artist: selectedSong.deezer_artist,
      release_year: selectedSong.release_year,
      id: selectedSong.id,
      index: randomIndex
    });
    
    // Double-check the song is valid (should always be true since it's pre-filtered)
    const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
    if (!defaultPlaylistService.isValidSong(selectedSong)) {
      console.error('❌ Selected song failed validation check - this should not happen!');
      // Try another song
      const backupIndex = (randomIndex + 1) % availableSongs.length;
      return availableSongs[backupIndex];
    }
    
    // Fetch preview URL if needed
    if (!selectedSong.preview_url) {
      console.log('🔄 Fetching preview URL for selected song...');
      setRetryingSong(true);
      
      try {
        const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(selectedSong);
        console.log('✅ Song with preview URL ready');
        setRetryingSong(false);
        return songWithPreview;
      } catch (error) {
        console.error('❌ Preview fetch failed:', error);
        setRetryingSong(false);
        // Return song without preview - game can continue
        return selectedSong;
      }
    }
    
    console.log('✅ Song ready for turn');
    return selectedSong;
  };

  // Simplified function to start a new turn
  const startNewTurn = async (turnIndex: number) => {
    console.log('🚀 Starting new turn:', turnIndex);
    setSongLoadingError(null);
    setRetryingSong(false);
    
    // Verify we have pre-filtered songs available
    const availableSongs = getAvailableSongs();
    if (!availableSongs || availableSongs.length === 0) {
      console.error('❌ Cannot start turn - no filtered songs available');
      setSongLoadingError('No songs available. Please add songs to continue.');
      return;
    }
    
    // Reset card states and show loading
    setGameState(prev => ({
      ...prev,
      currentTurn: turnIndex,
      currentSong: null, // Clear current song first
      timeLeft: 30,
      isPlaying: false,
      cardPlacementPending: false,
      cardPlacementConfirmed: false,
      cardPlacementCorrect: null,
      mysteryCardRevealed: false
    }));
    
    // Pick and load the song
    const newSong = await pickRandomSongForTurn();
    if (newSong) {
      setGameState(prev => ({
        ...prev,
        currentSong: newSong
      }));
      setSongLoadingError(null);
      console.log('✅ New turn started successfully with song:', newSong.deezer_title);
    } else {
      setSongLoadingError('Failed to load a valid song for this turn. Please retry.');
      console.error('❌ Failed to start new turn - could not pick valid song');
    }
  };

  // Enhanced function to retry fetching song
  const retrySongFetch = async () => {
    console.log('🔄 Retrying song fetch...');
    const newSong = await pickRandomSongForTurn();
    if (newSong) {
      setGameState(prev => ({
        ...prev,
        currentSong: newSong
      }));
      setSongLoadingError(null);
    }
  };

  // Navigation handlers with sound effects
  const handleHostGame = async () => {
    soundEffects.playPlayerAction();
    
    // Host doesn't need to enter name - go straight to lobby
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
    
    // Get the pre-filtered songs
    const availableSongs = getAvailableSongs();
    
    console.log('🎮 Game start with pre-filtered songs:', {
      roomSongs: room?.songs?.length || 0,
      validatedSongs: validatedSongs.length,
      availableSongs: availableSongs.length
    });
    
    if (availableSongs.length === 0) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "Need songs to start the game.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation check
    if (availableSongs.length < 5) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: `Only ${availableSongs.length} valid songs found. Need at least 5 songs for optimal gameplay.`,
        variant: "destructive",
      });
      return;
    }

    console.log(`🎮 Starting game with ${availableSongs.length} pre-filtered songs`);
    
    // Ensure room has the validated songs
    if (room?.id && (!room.songs || room.songs.length !== availableSongs.length)) {
      console.log('🔄 Updating room songs before game start...');
      await updateRoomSongs(availableSongs);
    }
    
    // Assign starting cards to all players
    if (room?.id) {
      await gameService.assignStartingCards(room.id, availableSongs);
    }
    
    await startGame();
    
    soundEffects.playSound('game-start');
    
    // Transition ALL players to playing phase
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

    // Start the first turn
    await startNewTurn(0);

    toast({
      title: "🎵 Game Started!",
      description: `Each player has received a starting card. Playing with ${availableSongs.length} valid songs!`,
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

  const handlePlaceCard = (position: number) => {
    console.log(`Placing card at position ${position}`);
    
    if (!gameState.currentSong || !currentPlayer) return;
    
    // Set card placement as pending
    setGameState(prev => ({
      ...prev,
      cardPlacementPending: true,
      cardPlacementConfirmed: true
    }));

    // Simulate placement logic (you would implement actual placement validation here)
    const isCorrect = Math.random() > 0.3; // 70% chance of being correct for demo
    
    setTimeout(() => {
      if (isCorrect) {
        // Add the song to the player's timeline at the specified position
        const newTimeline = [...currentPlayer.timeline];
        newTimeline.splice(position, 0, gameState.currentSong!);
        
        // Update the player's timeline in the backend
        updatePlayer(currentPlayer.name, currentPlayer.color);
        
        setGameState(prev => ({
          ...prev,
          cardPlacementCorrect: true,
          mysteryCardRevealed: true
        }));
        
        soundEffects.playSound('correct');
        
        // Move to next turn after a delay
        setTimeout(async () => {
          const nextTurn = (gameState.currentTurn + 1) % players.length;
          await startNewTurn(nextTurn);
        }, 2000);
        
      } else {
        // Incorrect placement
        setGameState(prev => ({
          ...prev,
          cardPlacementCorrect: false,
          mysteryCardRevealed: true
        }));
        
        soundEffects.playSound('incorrect');
        
        // Move to next turn after showing the result
        setTimeout(async () => {
          const nextTurn = (gameState.currentTurn + 1) % players.length;
          await startNewTurn(nextTurn);
        }, 2000);
      }
    }, 1000); // Simulate processing time
  };

  const handlePlayPause = () => {
    console.log('Play/pause mystery song from player');
    
    // If this is called from a player's device, control the host's audio
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

  // Effect to monitor room changes
  useEffect(() => {
    if (room?.songs && room.songs.length > 0) {
      console.log('🔄 Room songs updated:', room.songs.length);
    }
  }, [room?.songs]);

  // Phase rendering with enhanced components
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
            createRoom={async () => true} // Host already created room
            currentHostName="" // Host doesn't have a name
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
          // Host sees the host display
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
              retryingSong={retryingSong}
              onRetrySong={retrySongFetch}
            />
          );
        } else {
          // Players see their mobile view
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
              onPlaceCard={handlePlaceCard}
              onPlayPause={handlePlayPause}
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
      {/* Audio element for song playback - only for host */}
      {isHost && gameState.phase === 'playing' && gameState.currentSong?.preview_url && (
        <audio
          ref={audioRef}
          src={gameState.currentSong.preview_url}
          crossOrigin="anonymous"
          preload="auto"
          onError={(e) => {
            console.error('Audio error:', e);
            console.log('Failed to load:', gameState.currentSong?.preview_url);
          }}
          onLoadStart={() => console.log('Audio load start')}
          onCanPlay={() => console.log('Audio can play')}
        />
      )}
      {renderPhase()}
    </>
  );
}

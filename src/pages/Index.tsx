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

  // Setup game cleanup for idle rooms
  useGameCleanup({
    roomId: room?.id,
    isHost,
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

  // Enhanced function to get a random song with proper validation and retry logic
  const getRandomSongForTurn = async (maxRetries: number = 10): Promise<Song | null> => {
    console.log('=== MYSTERY SONG SELECTION START ===');
    
    // First check if we have any songs available
    const availableSongs = room?.songs || customSongs;
    
    if (!availableSongs || availableSongs.length === 0) {
      console.error('❌ NO SONGS AVAILABLE - room songs:', room?.songs?.length, 'custom songs:', customSongs.length);
      setSongLoadingError('No songs available. Please add songs to continue.');
      return null;
    }
    
    console.log(`🎵 Starting song selection with ${availableSongs.length} songs available`);
    console.log('Available songs preview:', availableSongs.map(s => `"${s.deezer_title}" (${s.release_year})`).slice(0, 5));
    
    // Import and validate the playlist
    const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
    const validationResult = defaultPlaylistService.validatePlaylistForGameplay(availableSongs, 1);
    
    if (!validationResult.isValid) {
      console.error('❌ Playlist validation failed:', validationResult.errorMessage);
      setSongLoadingError(validationResult.errorMessage || 'No valid songs available');
      return null;
    }
    
    console.log(`✅ Playlist validation passed: ${validationResult.validCount} valid songs available`);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🎯 Song selection attempt ${attempt + 1}/${maxRetries}`);
        
        // Get a random valid song from the available songs
        const selectedSong = defaultPlaylistService.getRandomValidSong(availableSongs);
        
        if (!selectedSong) {
          throw new Error('No valid songs found in available playlist');
        }
        
        console.log(`🎵 Selected song for turn:`, {
          title: selectedSong.deezer_title,
          artist: selectedSong.deezer_artist,
          release_year: selectedSong.release_year,
          id: selectedSong.id,
          attempt: attempt + 1
        });
        
        // Fetch preview URL if not already available
        if (!selectedSong.preview_url) {
          console.log('🔄 Fetching preview URL for mystery song...');
          setSongLoadingError(null);
          setRetryingSong(true);
          
          try {
            const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(selectedSong);
            
            console.log('✅ Mystery song with preview URL ready:', {
              title: songWithPreview.deezer_title,
              artist: songWithPreview.deezer_artist,
              release_year: songWithPreview.release_year,
              preview_url: songWithPreview.preview_url ? 'Available' : 'Not available',
              id: songWithPreview.id
            });
            
            setRetryingSong(false);
            console.log('=== MYSTERY SONG SELECTION SUCCESS ===');
            return songWithPreview;
          } catch (error) {
            console.error(`❌ Preview fetch failed on attempt ${attempt + 1}:`, error);
            
            if (attempt === maxRetries - 1) {
              // Last attempt - return song without preview if validation passes
              console.log('⚠️ Returning song without preview URL after all preview fetch attempts failed');
              setRetryingSong(false);
              return selectedSong;
            }
            
            // Continue to next attempt
            continue;
          }
        }
        
        console.log('✅ Using existing preview URL:', selectedSong.preview_url);
        console.log('=== MYSTERY SONG SELECTION SUCCESS ===');
        return selectedSong;
        
      } catch (error) {
        console.error(`❌ Song selection attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          setSongLoadingError(`Failed to load a valid song after ${maxRetries} attempts. ${error instanceof Error ? error.message : 'Unknown error'}`);
          setRetryingSong(false);
          return null;
        }
        
        // Brief delay before retry for mobile reliability
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('=== MYSTERY SONG SELECTION FAILED ===');
    return null;
  };

  // Enhanced function to retry fetching song with better error handling
  const retrySongFetch = async () => {
    if (!gameState.currentSong) {
      console.log('Retrying song selection with new random song...');
      const newSong = await getRandomSongForTurn();
      if (newSong) {
        setGameState(prev => ({
          ...prev,
          currentSong: newSong
        }));
        setSongLoadingError(null);
      }
    } else {
      console.log('Retrying preview URL fetch for current song...');
      try {
        setRetryingSong(true);
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(gameState.currentSong);
        setGameState(prev => ({
          ...prev,
          currentSong: songWithPreview
        }));
        setSongLoadingError(null);
      } catch (error) {
        console.error('Retry failed:', error);
        setSongLoadingError('Still unable to load song preview. The game can continue without audio.');
      } finally {
        setRetryingSong(false);
      }
    }
  };

  // Enhanced function to start a new turn with better error handling and validation
  const startNewTurn = async (turnIndex: number) => {
    console.log('🚀 Starting new turn:', turnIndex);
    setSongLoadingError(null);
    setRetryingSong(false);
    
    // Verify we have songs available before starting
    const availableSongs = room?.songs || customSongs;
    console.log('📊 Available songs check:', {
      roomSongs: room?.songs?.length || 0,
      customSongs: customSongs.length,
      totalAvailable: availableSongs.length
    });
    
    if (!availableSongs || availableSongs.length === 0) {
      console.error('❌ Cannot start turn - no songs available');
      setSongLoadingError('No songs available. Please add songs to continue.');
      return;
    }
    
    // Reset card states
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
    
    // Show loading feedback
    setSongLoadingError('Loading new song...');
    
    // Fetch new song with enhanced validation and retry logic
    const newSong = await getRandomSongForTurn();
    if (newSong) {
      setGameState(prev => ({
        ...prev,
        currentSong: newSong
      }));
      setSongLoadingError(null);
      console.log('✅ New turn started successfully with song:', newSong.deezer_title);
    } else {
      setSongLoadingError('Failed to load a valid song for this turn. Please retry.');
      console.error('❌ Failed to start new turn - could not load valid song');
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
    
    // Use room songs if available, otherwise use custom songs
    const songsToUse = room?.songs && room.songs.length > 0 ? room.songs : customSongs;
    
    if (songsToUse.length === 0) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "Need songs to start the game.",
        variant: "destructive",
      });
      return;
    }

    // Validate playlist before starting game
    const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
    const validationResult = defaultPlaylistService.validatePlaylistForGameplay(songsToUse, 5);
    
    if (!validationResult.isValid) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: validationResult.errorMessage,
        variant: "destructive",
      });
      return;
    }

    console.log(`🎮 Starting game with ${validationResult.validCount} valid songs`);
    
    // Only update room songs if we're using custom songs
    if (room?.songs !== songsToUse) {
      await updateRoomSongs(songsToUse);
    }
    
    // Assign starting cards to all players
    if (room?.id) {
      await gameService.assignStartingCards(room.id, songsToUse);
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

    // Start the first turn (will fetch song with preview URL)
    await startNewTurn(0);

    toast({
      title: "🎵 Game Started!",
      description: `Each player has received a starting card. Playing with ${validationResult.validCount} valid songs!`,
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

  // Effect to monitor room changes and update songs
  useEffect(() => {
    if (room?.songs && room.songs.length > 0 && customSongs.length === 0) {
      setCustomSongs(room.songs);
    }
  }, [room?.songs, customSongs.length]);

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

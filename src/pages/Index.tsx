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

  // Function to get a random song and fetch its preview URL
  const getRandomSongForTurn = async (): Promise<Song | null> => {
    if (!room?.songs || room.songs.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * room.songs.length);
    const baseSong = room.songs[randomIndex];
    
    console.log('=== MYSTERY SONG DEBUG ===');
    console.log('Selected song for turn:', {
      title: baseSong.deezer_title,
      artist: baseSong.deezer_artist,
      release_year: baseSong.release_year,
      id: baseSong.id
    });
    
    // Fetch preview URL if not already available
    if (!baseSong.preview_url) {
      console.log('Fetching preview URL for mystery song...');
      setSongLoadingError(null);
      setRetryingSong(true);
      
      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(baseSong);
        
        console.log('Mystery song with preview URL:', {
          title: songWithPreview.deezer_title,
          artist: songWithPreview.deezer_artist,
          release_year: songWithPreview.release_year,
          preview_url: songWithPreview.preview_url,
          id: songWithPreview.id
        });
        console.log('=== END MYSTERY SONG DEBUG ===');
        
        setRetryingSong(false);
        return songWithPreview;
      } catch (error) {
        console.error('Failed to fetch preview URL:', error);
        setSongLoadingError('Failed to fetch song preview. Retrying...');
        setRetryingSong(false);
        
        // Return the song without preview URL for now
        console.log('Returning song without preview URL due to error');
        console.log('=== END MYSTERY SONG DEBUG ===');
        return baseSong;
      }
    }
    
    console.log('Using existing preview URL:', baseSong.preview_url);
    console.log('=== END MYSTERY SONG DEBUG ===');
    return baseSong;
  };

  // Function to retry fetching song with preview URL
  const retrySongFetch = async () => {
    if (!gameState.currentSong) return;
    
    console.log('Retrying song fetch...');
    const songWithPreview = await getRandomSongForTurn();
    if (songWithPreview) {
      setGameState(prev => ({
        ...prev,
        currentSong: songWithPreview
      }));
      setSongLoadingError(null);
    }
  };

  // Function to start a new turn
  const startNewTurn = async (turnIndex: number) => {
    console.log('Starting new turn:', turnIndex);
    setSongLoadingError(null);
    
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
    
    // Fetch new song with preview URL
    const newSong = await getRandomSongForTurn();
    if (newSong) {
      setGameState(prev => ({
        ...prev,
        currentSong: newSong
      }));
    } else {
      setSongLoadingError('Failed to load a song for this turn.');
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
    
    if (customSongs.length === 0) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "Need songs to start the game.",
        variant: "destructive",
      });
      return;
    }
    
    await updateRoomSongs(customSongs);
    
    // Assign starting cards to all players
    if (room?.id) {
      await gameService.assignStartingCards(room.id, customSongs);
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
      description: "Each player has received a starting card. Let the timeline battle begin!",
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

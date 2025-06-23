
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
  const [validGameSongs, setValidGameSongs] = useState<Song[]>([]); // Filtered once and stored
  const [isLoadingSong, setIsLoadingSong] = useState(false);
  const [currentSongProgress, setCurrentSongProgress] = useState(0);
  const [currentSongDuration, setCurrentSongDuration] = useState(30);
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

  // SINGLE-TIME FILTERING: Only filter when customSongs changes
  useEffect(() => {
    const filterSongsOnce = async () => {
      if (customSongs.length === 0) {
        console.log('🎵 No custom songs to filter');
        setValidGameSongs([]);
        return;
      }

      console.log('🔍 FILTERING SONGS ONCE - Input:', customSongs.length, 'songs');

      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const validSongs = defaultPlaylistService.filterValidSongs(customSongs);
        
        console.log('✅ FILTERING COMPLETE - Valid songs:', validSongs.length);
        setValidGameSongs(validSongs);

        // Sync to room if we're the host
        if (room?.id && isHost && validSongs.length > 0) {
          console.log('🔄 Syncing valid songs to room...');
          await updateRoomSongs(validSongs);
        }
      } catch (error) {
        console.error('❌ Song filtering failed:', error);
        setValidGameSongs([]);
      }
    };

    filterSongsOnce();
  }, [customSongs, room?.id, isHost, updateRoomSongs]);

  // Get the current valid song list (no more filtering)
  const getValidGameSongs = (): Song[] => {
    // Priority: room songs > validGameSongs
    if (room?.songs && room.songs.length > 0) {
      console.log('📂 Using room songs:', room.songs.length);
      return room.songs;
    }
    if (validGameSongs.length > 0) {
      console.log('📂 Using valid game songs:', validGameSongs.length);
      return validGameSongs;
    }
    console.log('📂 No valid songs available');
    return [];
  };

  // Pick a random song and prepare it for the turn
  const pickAndPrepareSong = async (): Promise<Song | null> => {
    const songs = getValidGameSongs();
    
    if (songs.length === 0) {
      console.error('❌ No songs available for turn');
      return null;
    }
    
    // Pick random song
    const randomIndex = Math.floor(Math.random() * songs.length);
    const selectedSong = songs[randomIndex];
    
    console.log('🎯 Selected song for turn:', {
      title: selectedSong.deezer_title,
      artist: selectedSong.deezer_artist,
      year: selectedSong.release_year
    });
    
    // If preview URL is missing, try to fetch it
    if (!selectedSong.preview_url) {
      console.log('🔄 Fetching preview URL...');
      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(selectedSong);
        console.log('✅ Preview URL ready');
        return songWithPreview;
      } catch (error) {
        console.warn('⚠️ Preview fetch failed, using song without preview:', error);
        return selectedSong; // Still playable without preview
      }
    }
    
    return selectedSong;
  };

  // Start a new turn with proper loading states
  const startNewTurn = async (turnIndex: number) => {
    console.log('🚀 Starting turn', turnIndex, 'for player:', players[turnIndex % players.length]?.name);
    
    const songs = getValidGameSongs();
    if (songs.length === 0) {
      console.error('❌ Cannot start turn - no valid songs available');
      toast({
        title: "Game Error",
        description: "No valid songs available for gameplay.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset turn state
    setGameState(prev => ({
      ...prev,
      currentTurn: turnIndex,
      timeLeft: 30,
      isPlaying: false,
      cardPlacementPending: false,
      cardPlacementConfirmed: false,
      cardPlacementCorrect: null,
      mysteryCardRevealed: false,
      currentSong: null
    }));
    
    // Show loading only while picking/preparing song
    setIsLoadingSong(true);
    
    try {
      const selectedSong = await pickAndPrepareSong();
      
      if (selectedSong) {
        console.log('✅ Song ready for turn:', selectedSong.deezer_title);
        setGameState(prev => ({
          ...prev,
          currentSong: selectedSong
        }));
      } else {
        console.error('❌ Failed to prepare song for turn');
        toast({
          title: "Turn Error",
          description: "Failed to load a song for this turn.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Turn start error:', error);
      toast({
        title: "Turn Error", 
        description: "Error starting the turn. Please try again.",
        variant: "destructive",
      });
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
    
    console.log('🎮 Starting game with', songs.length, 'valid songs');
    
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

    // Ensure room has the validated songs
    if (room?.id && (!room.songs || room.songs.length !== songs.length)) {
      console.log('🔄 Updating room songs before game start...');
      await updateRoomSongs(songs);
    }
    
    // Assign starting cards to all players
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

    // Start the first turn
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

  const handlePlaceCard = (position: number) => {
    console.log('🎯 Placing card at position', position);
    
    if (!gameState.currentSong || !currentPlayer) return;
    
    setGameState(prev => ({
      ...prev,
      cardPlacementPending: true,
      cardPlacementConfirmed: true
    }));

    const isCorrect = Math.random() > 0.3;
    
    setTimeout(() => {
      if (isCorrect) {
        const newTimeline = [...currentPlayer.timeline];
        newTimeline.splice(position, 0, gameState.currentSong!);
        
        updatePlayer(currentPlayer.name, currentPlayer.color);
        
        setGameState(prev => ({
          ...prev,
          cardPlacementCorrect: true,
          mysteryCardRevealed: true
        }));
        
        soundEffects.playSound('correct');
        
        setTimeout(async () => {
          const nextTurn = (gameState.currentTurn + 1) % players.length;
          await startNewTurn(nextTurn);
        }, 2000);
        
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
      }
    }, 1000);
  };

  const handlePlayPause = () => {
    console.log('🎵 Play/pause mystery song from player');
    
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
              songLoadingError={null}
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

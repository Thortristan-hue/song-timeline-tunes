
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
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [songLoadingError, setSongLoadingError] = useState<string | null>(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);
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

  // Filter songs ONLY ONCE when customSongs changes
  useEffect(() => {
    const filterSongsOnce = async () => {
      if (customSongs.length === 0) {
        console.log('🔄 No custom songs to filter');
        setFilteredSongs([]);
        return;
      }

      console.log('=== FILTERING SONGS ONCE (ON PLAYLIST CHANGE) ===');
      console.log(`Input: ${customSongs.length} songs to filter`);

      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const validSongs = defaultPlaylistService.filterValidSongs(customSongs);
        
        console.log(`✅ Playlist filtered once: ${validSongs.length} valid songs`);
        console.log('Valid songs:', validSongs.map(s => `"${s.deezer_title}" (${s.release_year})`));
        
        setFilteredSongs(validSongs);

        // Sync to room if we're the host
        if (room?.id && isHost && validSongs.length > 0) {
          console.log('🔄 Syncing filtered songs to room...');
          await updateRoomSongs(validSongs);
          console.log('✅ Filtered songs synced to room');
        }
      } catch (error) {
        console.error('❌ Song filtering failed:', error);
        setFilteredSongs([]);
      }
    };

    filterSongsOnce();
  }, [customSongs, room?.id, isHost, updateRoomSongs]);

  // Get the current valid song list (no more filtering)
  const getValidSongs = (): Song[] => {
    if (room?.songs && room.songs.length > 0) {
      console.log(`📂 Using room songs: ${room.songs.length}`);
      return room.songs;
    }
    if (filteredSongs.length > 0) {
      console.log(`📂 Using filtered songs: ${filteredSongs.length}`);
      return filteredSongs;
    }
    console.log('📂 No valid songs available');
    return [];
  };

  // Simplified song picker - just pick from pre-filtered list
  const pickRandomValidSong = async (): Promise<Song | null> => {
    const validSongs = getValidSongs();
    
    if (validSongs.length === 0) {
      console.error('❌ No valid songs available for turn');
      return null;
    }
    
    console.log(`🎯 Picking random song from ${validSongs.length} valid songs`);
    
    const randomIndex = Math.floor(Math.random() * validSongs.length);
    const selectedSong = validSongs[randomIndex];
    
    console.log(`🎵 Selected song: "${selectedSong.deezer_title}" by ${selectedSong.deezer_artist} (${selectedSong.release_year})`);
    
    // Fetch preview URL if needed
    if (!selectedSong.preview_url) {
      console.log('🔄 Fetching preview URL...');
      try {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(selectedSong);
        console.log('✅ Preview URL fetched');
        return songWithPreview;
      } catch (error) {
        console.error('❌ Preview fetch failed:', error);
        // Return song without preview - game can continue
        return selectedSong;
      }
    }
    
    return selectedSong;
  };

  // Simplified turn start function
  const startNewTurn = async (turnIndex: number) => {
    console.log('🚀 Starting new turn:', turnIndex);
    setSongLoadingError(null);
    setIsLoadingSong(true);
    
    const validSongs = getValidSongs();
    if (validSongs.length === 0) {
      console.error('❌ Cannot start turn - no valid songs');
      setSongLoadingError('No valid songs available. Please add songs to continue.');
      setIsLoadingSong(false);
      return;
    }
    
    // Reset game state for new turn
    setGameState(prev => ({
      ...prev,
      currentTurn: turnIndex,
      timeLeft: 30,
      isPlaying: false,
      cardPlacementPending: false,
      cardPlacementConfirmed: false,
      cardPlacementCorrect: null,
      mysteryCardRevealed: false,
      currentSong: null // Clear current song while loading
    }));
    
    // Pick and load the song
    try {
      const selectedSong = await pickRandomValidSong();
      
      if (selectedSong) {
        console.log('✅ Song loaded successfully, updating game state');
        setGameState(prev => ({
          ...prev,
          currentSong: selectedSong
        }));
        setSongLoadingError(null);
      } else {
        console.error('❌ Failed to pick valid song');
        setSongLoadingError('Failed to load a song for this turn. Please retry.');
      }
    } catch (error) {
      console.error('❌ Error in song selection:', error);
      setSongLoadingError('Error loading song. Please retry.');
    } finally {
      setIsLoadingSong(false);
    }
  };

  const retrySongFetch = async () => {
    console.log('🔄 Retrying song selection...');
    setIsLoadingSong(true);
    setSongLoadingError(null);
    
    try {
      const newSong = await pickRandomValidSong();
      if (newSong) {
        setGameState(prev => ({
          ...prev,
          currentSong: newSong
        }));
        setSongLoadingError(null);
      } else {
        setSongLoadingError('Failed to load a song. Please try again.');
      }
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setSongLoadingError('Error loading song. Please try again.');
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
    
    const validSongs = getValidSongs();
    
    console.log('🎮 Starting game with songs:', {
      roomSongs: room?.songs?.length || 0,
      filteredSongs: filteredSongs.length,
      validSongs: validSongs.length
    });
    
    if (validSongs.length === 0) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: "No valid songs available. Please add songs to continue.",
        variant: "destructive",
      });
      return;
    }

    if (validSongs.length < 5) {
      soundEffects.playCardError();
      toast({
        title: "Cannot start game",
        description: `Only ${validSongs.length} valid songs found. Need at least 5 songs for optimal gameplay.`,
        variant: "destructive",
      });
      return;
    }

    console.log(`🎮 Starting game with ${validSongs.length} valid songs`);
    
    // Ensure room has the validated songs
    if (room?.id && (!room.songs || room.songs.length !== validSongs.length)) {
      console.log('🔄 Updating room songs before game start...');
      await updateRoomSongs(validSongs);
    }
    
    // Assign starting cards to all players
    if (room?.id) {
      await gameService.assignStartingCards(room.id, validSongs);
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
      description: `Each player has received a starting card. Playing with ${validSongs.length} valid songs!`,
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
    console.log('Play/pause mystery song from player');
    
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
              onRetrySong={retrySongFetch}
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

import { useState, useCallback, useEffect } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Song, GamePhase, Player } from '@/types/game';
import { MainMenu } from './MainMenu';
import { HostLobby } from './HostLobby';
import { MobileJoinFlow } from './MobileJoinFlow';
import MobilePlayerLobby from './MobilePlayerLobby';
import { GamePlay } from './GamePlay';
import { VictoryScreen } from './VictoryScreen';
import { Feedback } from './Feedback';
import { useToast } from '@/components/ui/use-toast';
import { useConfettiStore } from '@/stores/useConfettiStore';
import { GameService } from '@/services/gameService';
import { unifiedAudioEngine } from '@/utils/unifiedAudioEngine';

interface GameState {
  phase: GamePhase;
  lobbyCode?: string;
  playerName?: string;
  isHost: boolean;
  songs: Song[];
  // Game orchestration state
  isProcessingMove: boolean;
  feedback: { show: boolean; correct: boolean; song: Song | null };
  winner: Player | null;
  showVictoryScreen: boolean;
  isPlaying: boolean;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function Game() {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.MENU,
    isHost: false,
    songs: [],
    // Game orchestration state
    isProcessingMove: false,
    feedback: { show: false, correct: false, song: null },
    winner: null,
    showVictoryScreen: false,
    isPlaying: false,
    mysteryCardRevealed: false,
    cardPlacementResult: null
  });

  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    leaveRoom,
    setCurrentSong,
    connectionStatus
  } = useGameRoom();

  const { toast } = useToast();
  const { fire } = useConfettiStore();

  // Handle create room
  const handleCreateRoom = useCallback(async (hostName: string) => {
    const lobbyCode = await createRoom(hostName);
    if (lobbyCode) {
      setGameState(prev => ({
        ...prev,
        phase: GamePhase.HOST_LOBBY,
        lobbyCode,
        isHost: true
      }));
    }
  }, [createRoom]);

  // Handle join room
  const handleJoinRoom = useCallback(async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      setGameState(prev => ({
        ...prev,
        phase: GamePhase.MOBILE_LOBBY,
        lobbyCode,
        playerName,
        isHost: false
      }));
    }
    return success;
  }, [joinRoom]);

  // Handle pending character update when room and player are ready
  useEffect(() => {
    const handlePendingCharacter = async () => {
      const pendingCharacter = localStorage.getItem('pendingCharacter');
      
      // Only proceed if we have all the necessary conditions
      if (pendingCharacter && room?.id && currentPlayer?.id && !isHost) {
        console.log('Applying pending character:', pendingCharacter, 'for player:', currentPlayer.id);
        
        try {
          const updateSuccess = await updatePlayer({ character: pendingCharacter });
          if (updateSuccess) {
            localStorage.removeItem('pendingCharacter');
            console.log('Character successfully updated');
          } else {
            console.error('Failed to update character');
          }
        } catch (error) {
          console.error('Error updating character:', error);
        }
      }
    };

    // Add a small delay to ensure all state is settled
    const timeoutId = setTimeout(handlePendingCharacter, 1000);
    return () => clearTimeout(timeoutId);
  }, [room?.id, currentPlayer?.id, isHost, updatePlayer]);

  // Handle card placement with full orchestration
  const handlePlaceCard = useCallback(async (song: Song, position: number) => {
    if (!room || !currentPlayer || gameState.isProcessingMove) return { success: false };

    setGameState(prev => ({ ...prev, isProcessingMove: true }));
    
    try {
      console.log('🃏 Card placement attempted:', { song: song.deezer_title, position });
      
      const result = await GameService.placeCard(
        room.id,
        currentPlayer.id,
        song,
        position
      );

      if (result.success) {
        console.log('✅ Card placed successfully');
        
        // Show feedback if correctness information is available
        if (result.correct !== undefined) {
          setGameState(prev => ({
            ...prev,
            feedback: {
              show: true,
              correct: result.correct || false,
              song: song
            },
            cardPlacementResult: {
              correct: result.correct || false,
              song: song
            }
          }));
          
          // Auto-hide feedback after delay
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              feedback: { show: false, correct: false, song: null },
              cardPlacementResult: null
            }));
          }, 3000);
        }
        
        // Check for game end with winner
        if (result.gameEnded && result.winner) {
          console.log('🎉 Game ended with winner:', result.winner.name);
          setGameState(prev => ({
            ...prev,
            phase: GamePhase.FINISHED,
            winner: result.winner || null,
            showVictoryScreen: true
          }));
          fire(); // Trigger confetti
        } else if (result.gameEnded) {
          // Game ended without specific winner info
          setGameState(prev => ({
            ...prev,
            phase: GamePhase.FINISHED
          }));
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Card placement failed:', error);
      toast({
        title: "Card placement failed",
        description: "Please try again",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setGameState(prev => ({ ...prev, isProcessingMove: false }));
    }
  }, [room, currentPlayer, gameState.isProcessingMove, toast, fire]);

  // Handle audio playback control
  const handlePlayPause = useCallback(async () => {
    const newIsPlaying = !gameState.isPlaying;
    
    // Actually control audio playback using audio engine
    if (room?.current_song?.preview_url) {
      if (newIsPlaying) {
        console.log('[Game] Starting audio playback for player:', room.current_song.deezer_title);
        try {
          await unifiedAudioEngine.playPreview(room.current_song.preview_url);
          setGameState(prev => ({ ...prev, isPlaying: true }));
          
          // Auto-stop after 30 seconds
          setTimeout(() => {
            setGameState(prev => ({ ...prev, isPlaying: false }));
          }, 30000);
        } catch (error) {
          console.error('[Game] Failed to start audio playback:', error);
          toast({
            title: "Audio playback failed",
            description: "Unable to play song preview",
            variant: "destructive",
          });
          setGameState(prev => ({ ...prev, isPlaying: false }));
        }
      } else {
        console.log('[Game] Stopping audio playback for player');
        unifiedAudioEngine.stopPreview();
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }
    } else {
      console.warn('[Game] No preview URL available for current song');
      setGameState(prev => ({ ...prev, isPlaying: false }));
      if (newIsPlaying) {
        toast({
          title: "No preview available",
          description: "This song doesn't have a preview",
          variant: "destructive",
        });
      }
    }
  }, [gameState.isPlaying, room?.current_song, toast]);

  const handleLeaveRoom = useCallback(() => {
    // Clear any pending character data
    localStorage.removeItem('pendingCharacter');
    // Stop any audio playback
    unifiedAudioEngine.stopPreview();
    leaveRoom();
    setGameState({
      phase: GamePhase.MENU,
      isHost: false,
      songs: [],
      // Reset game orchestration state
      isProcessingMove: false,
      feedback: { show: false, correct: false, song: null },
      winner: null,
      showVictoryScreen: false,
      isPlaying: false,
      mysteryCardRevealed: false,
      cardPlacementResult: null
    });
  }, [leaveRoom]);

  // Handle back to menu
  const handleBackToMenu = useCallback(() => {
    handleLeaveRoom();
  }, [handleLeaveRoom]);

  // Handle going to mobile join
  const handleGoToMobileJoin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.MOBILE_JOIN
    }));
  }, []);

  // Handle player update with correct signature
  const handleUpdatePlayer = useCallback(async (name: string, character: string) => {
    if (!currentPlayer || !room?.id) return;
    
    const updates = {
      name,
      character
    };
    
    await updatePlayer(updates);
  }, [currentPlayer, room?.id, updatePlayer]);

  // Update game state when room changes - but preserve proper UI states
  useEffect(() => {
    if (room) {
      setGameState(prev => {
        // Only update phase when it's an actual game phase change
        if (room.phase === GamePhase.PLAYING && prev.phase !== GamePhase.PLAYING) {
          return { ...prev, phase: GamePhase.PLAYING, lobbyCode: room.lobby_code };
        }
        if (room.phase === GamePhase.FINISHED && prev.phase !== GamePhase.FINISHED) {
          return { ...prev, phase: GamePhase.FINISHED, lobbyCode: room.lobby_code };
        }
        
        // Just update lobby code for other phases
        return { ...prev, lobbyCode: room.lobby_code };
      });
    }
  }, [room?.phase, room?.lobby_code]);

  // Cleanup audio when mystery card changes and reset playing state
  useEffect(() => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    return () => {
      unifiedAudioEngine.stopPreview();
    };
  }, [room?.current_song?.id]);

  // Render current phase
  const renderCurrentPhase = () => {
    switch (gameState.phase) {
      case GamePhase.MENU:
        return (
          <MainMenu 
            onCreateRoom={() => {
              // Host doesn't need a name since they're not a player
              handleCreateRoom('');
            }}
            onJoinRoom={handleGoToMobileJoin}
          />
        );

      case GamePhase.HOST_LOBBY:
        return room ? (
          <HostLobby
            room={room}
            players={players}
            customSongs={gameState.songs}
          />
        ) : null;

      case GamePhase.MOBILE_JOIN:
        return (
          <MobileJoinFlow
            onJoinRoom={handleJoinRoom}
            onBackToMenu={handleBackToMenu}
            isLoading={isLoading}
          />
        );

      case GamePhase.MOBILE_LOBBY:
        return (
          <MobilePlayerLobby
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onBackToMenu={handleBackToMenu}
          />
        );

      case GamePhase.PLAYING:
        // Show feedback overlay if active
        if (gameState.feedback.show) {
          return <Feedback correct={gameState.feedback.correct} song={gameState.feedback.song} />;
        }
        
        return room && currentPlayer ? (
          <GamePlay
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            onPlaceCard={handlePlaceCard}
            customSongs={gameState.songs}
            onSetCurrentSong={setCurrentSong}
            connectionStatus={connectionStatus}
            onReconnect={() => {}}
            onReplayGame={() => {}}
            // Pass consolidated orchestration state
            isProcessingMove={gameState.isProcessingMove}
            isPlaying={gameState.isPlaying}
            onPlayPause={handlePlayPause}
            mysteryCardRevealed={gameState.mysteryCardRevealed}
            cardPlacementResult={gameState.cardPlacementResult}
            gameEnded={room?.phase === GamePhase.FINISHED}
          />
        ) : null;

      case GamePhase.FINISHED:
        // Show victory screen or use winner from game state if available
        const winner = gameState.winner || (players.length > 0 ? players.find(p => p.score === Math.max(...players.map(p => p.score))) : null);
        
        if (!winner) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Game Finished</h2>
                <p className="mb-4">No winner could be determined</p>
                <button 
                  onClick={handleBackToMenu}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded"
                >
                  Back to Menu
                </button>
              </div>
            </div>
          );
        }

        return (
          <VictoryScreen
            winner={winner}
            players={players}
            onBackToMenu={handleBackToMenu}
            onPlayAgain={() => {
              setGameState(prev => ({
                ...prev,
                phase: isHost ? GamePhase.HOST_LOBBY : GamePhase.MOBILE_LOBBY,
                // Reset game state for new game
                winner: null,
                showVictoryScreen: false,
                isPlaying: false,
                mysteryCardRevealed: false,
                cardPlacementResult: null,
                feedback: { show: false, correct: false, song: null }
              }));
            }}
          />
        );

      default:
        return (
          <MainMenu 
            onCreateRoom={() => {
              // Host doesn't need a name since they're not a player
              handleCreateRoom('');
            }}
            onJoinRoom={handleGoToMobileJoin}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentPhase()}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

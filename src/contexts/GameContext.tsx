import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Song, Player, GameRoom, GamePhase } from '@/types/game';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/components/ui/use-toast';

interface GameState {
  // Core game state
  gamePhase: GamePhase;
  winner: Player | null;
  playerName: string;
  customSongs: Song[];
  
  // Performance metrics
  performance: {
    lastRenderTime: number;
    renderCount: number;
    lastNetworkLatency: number;
    errorCount: number;
  };
  
  // Error handling
  lastError: string | null;
  recoveryAttempts: number;
}

type GameAction = 
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'SET_WINNER'; payload: Player | null }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'SET_CUSTOM_SONGS'; payload: Song[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INCREMENT_RECOVERY'; payload?: undefined }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<GameState['performance']> }
  | { type: 'RESET_GAME'; payload?: undefined };

interface GameContextValue {
  // State
  state: GameState;
  
  // Game Room Hook
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  dispatch: React.Dispatch<GameAction>;
  
  // Game operations
  createRoom: () => Promise<boolean>;
  joinRoom: (lobbyCode: string, name: string) => Promise<boolean>;
  startGame: () => Promise<void>;
  backToMenu: () => void;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  updatePlayer: (name: string, color: string) => Promise<void>;
  
  // Sound effects
  soundEffects: ReturnType<typeof useSoundEffects>;
  
  // Performance monitoring
  recordRender: () => void;
  recordNetworkLatency: (latency: number) => void;
  recordError: (error: string) => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const initialState: GameState = {
  gamePhase: 'menu',
  winner: null,
  playerName: '',
  customSongs: [],
  performance: {
    lastRenderTime: 0,
    renderCount: 0,
    lastNetworkLatency: 0,
    errorCount: 0,
  },
  lastError: null,
  recoveryAttempts: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, gamePhase: action.payload };
    case 'SET_WINNER':
      return { ...state, winner: action.payload };
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };
    case 'SET_CUSTOM_SONGS':
      return { ...state, customSongs: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        lastError: action.payload,
        performance: {
          ...state.performance,
          errorCount: action.payload ? state.performance.errorCount + 1 : state.performance.errorCount
        }
      };
    case 'INCREMENT_RECOVERY':
      return { ...state, recoveryAttempts: state.recoveryAttempts + 1 };
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };
    case 'RESET_GAME':
      return {
        ...initialState,
        performance: state.performance // Keep performance data
      };
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { toast } = useToast();
  const soundEffects = useSoundEffects();
  
  const gameRoom = useGameRoom();
  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom: createRoomHook,
    joinRoom: joinRoomHook,
    updatePlayer: updatePlayerHook,
    updateRoomSongs,
    startGame: startGameHook,
    leaveRoom,
    placeCard: placeCardHook,
    setCurrentSong,
    assignStartingCards
  } = gameRoom;

  // Performance monitoring
  const recordRender = () => {
    const now = performance.now();
    dispatch({
      type: 'UPDATE_PERFORMANCE',
      payload: {
        lastRenderTime: now,
        renderCount: state.performance.renderCount + 1
      }
    });
  };

  const recordNetworkLatency = (latency: number) => {
    dispatch({
      type: 'UPDATE_PERFORMANCE',
      payload: { lastNetworkLatency: latency }
    });
  };

  const recordError = (error: string) => {
    console.error('🚨 Game Error:', error);
    dispatch({ type: 'SET_ERROR', payload: error });
    
    toast({
      title: "Game Error",
      description: error,
      variant: "destructive",
    });
  };

  // Auto-join from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode && state.gamePhase === 'menu') {
      console.log('🔗 Auto-joining from URL:', joinCode);
      dispatch({ type: 'SET_PHASE', payload: 'mobileJoin' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [state.gamePhase]);

  // Room phase transitions
  useEffect(() => {
    if (room?.phase === 'playing' && state.gamePhase !== 'playing') {
      console.log('🎮 Room transitioned to playing phase');
      dispatch({ type: 'SET_PHASE', payload: 'playing' });
      soundEffects.playGameStart();
    }
  }, [room?.phase, state.gamePhase, soundEffects]);

  // Winner detection
  useEffect(() => {
    const winningPlayer = players.find(player => player.score >= 10);
    if (winningPlayer && !state.winner) {
      dispatch({ type: 'SET_WINNER', payload: winningPlayer });
      dispatch({ type: 'SET_PHASE', payload: 'finished' });
      soundEffects.playGameStart(); // Victory sound
    }
  }, [players, state.winner, soundEffects]);

  // Game operations with error handling
  const createRoom = async (): Promise<boolean> => {
    try {
      const startTime = performance.now();
      const lobbyCode = await createRoomHook('Host');
      const endTime = performance.now();
      
      recordNetworkLatency(endTime - startTime);
      
      if (lobbyCode) {
        dispatch({ type: 'SET_PHASE', payload: 'hostLobby' });
        soundEffects.playGameStart();
        return true;
      }
      return false;
    } catch (error) {
      recordError(error instanceof Error ? error.message : 'Failed to create room');
      return false;
    }
  };

  const joinRoom = async (lobbyCode: string, name: string): Promise<boolean> => {
    try {
      const startTime = performance.now();
      const success = await joinRoomHook(lobbyCode, name);
      const endTime = performance.now();
      
      recordNetworkLatency(endTime - startTime);
      
      if (success) {
        dispatch({ type: 'SET_PLAYER_NAME', payload: name });
        dispatch({ type: 'SET_PHASE', payload: 'mobileLobby' });
        soundEffects.playPlayerJoin();
        return true;
      }
      return false;
    } catch (error) {
      recordError(error instanceof Error ? error.message : 'Failed to join room');
      return false;
    }
  };

  const startGame = async () => {
    try {
      console.log('🎮 Host starting game...');
      await startGameHook();
      soundEffects.playGameStart();
    } catch (error) {
      recordError(error instanceof Error ? error.message : 'Failed to start game');
    }
  };

  const backToMenu = () => {
    leaveRoom();
    dispatch({ type: 'RESET_GAME' });
    soundEffects.playButtonClick();
  };

  const placeCard = async (song: Song, position: number) => {
    const result = await placeCardHook(song, position);
    return result;
  };

  const updatePlayer = async (name: string, color: string): Promise<void> => {
    await updatePlayerHook({ name, color });
  };

  const contextValue: GameContextValue = {
    state,
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    dispatch,
    createRoom,
    joinRoom,
    startGame,
    backToMenu,
    placeCard,
    updatePlayer,
    soundEffects,
    recordRender,
    recordNetworkLatency,
    recordError,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
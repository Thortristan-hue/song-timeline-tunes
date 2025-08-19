
import { create } from 'zustand';
import { Song, GamePhase } from '@/types/game';

interface GameState {
  // Game phase and flow
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // Current song (mystery card)
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;

  // UI preferences
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;

  // Card placement state
  cardPlacementPending: boolean;
  setCardPlacementPending: (pending: boolean) => void;
  cardPlacementConfirmed: boolean;
  setCardPlacementConfirmed: (confirmed: boolean) => void;
  cardPlacementCorrect: boolean | null;
  setCardPlacementCorrect: (correct: boolean | null) => void;

  // Mystery card state
  mysteryCardRevealed: boolean;
  setMysteryCardRevealed: (revealed: boolean) => void;

  // Game end state
  gameEnded: boolean;
  setGameEnded: (ended: boolean) => void;

  // UI state
  highlightedGapIndex: number | null;
  setHighlightedGapIndex: (index: number | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Game phase and flow
  phase: 'menu',
  setPhase: (phase) => set({ phase }),

  // Current song (mystery card)
  currentSong: null,
  setCurrentSong: (currentSong) => set({ currentSong }),

  // UI preferences
  isDarkMode: false,
  setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
  isMuted: false,
  setIsMuted: (isMuted) => set({ isMuted }),

  // Card placement state
  cardPlacementPending: false,
  setCardPlacementPending: (cardPlacementPending) => set({ cardPlacementPending }),
  cardPlacementConfirmed: false,
  setCardPlacementConfirmed: (cardPlacementConfirmed) => set({ cardPlacementConfirmed }),
  cardPlacementCorrect: null,
  setCardPlacementCorrect: (cardPlacementCorrect) => set({ cardPlacementCorrect }),

  // Mystery card state
  mysteryCardRevealed: false,
  setMysteryCardRevealed: (mysteryCardRevealed) => set({ mysteryCardRevealed }),

  // Game end state
  gameEnded: false,
  setGameEnded: (gameEnded) => set({ gameEnded }),

  // UI state
  highlightedGapIndex: null,
  setHighlightedGapIndex: (highlightedGapIndex) => set({ highlightedGapIndex }),
}));

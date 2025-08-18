
// UI-specific phase types for better type safety
export const GamePhase = {
  MENU: 'menu',
  HOST_LOBBY: 'hostLobby',
  MOBILE_JOIN: 'mobileJoin', 
  MOBILE_LOBBY: 'mobileLobby',
  PLAYING: 'playing',
  FINISHED: 'finished'
} as const;

export type GamePhase = typeof GamePhase[keyof typeof GamePhase];

// Game mode discriminated union
export const GameMode = {
  CLASSIC: 'classic',
  FIEND: 'fiend', 
  SPRINT: 'sprint'
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];

// Database phase type (what's actually stored in the database)
export const DatabasePhase = {
  LOBBY: 'lobby',
  PLAYING: 'playing', 
  FINISHED: 'finished'
} as const;

export type DatabasePhase = typeof DatabasePhase[keyof typeof DatabasePhase];

// Phase transition helpers
export const canTransitionTo = (from: GamePhase, to: GamePhase): boolean => {
  const transitions: Record<GamePhase, GamePhase[]> = {
    [GamePhase.MENU]: [GamePhase.HOST_LOBBY, GamePhase.MOBILE_JOIN],
    [GamePhase.HOST_LOBBY]: [GamePhase.PLAYING, GamePhase.MENU],
    [GamePhase.MOBILE_JOIN]: [GamePhase.MOBILE_LOBBY, GamePhase.MENU],
    [GamePhase.MOBILE_LOBBY]: [GamePhase.PLAYING, GamePhase.MENU],
    [GamePhase.PLAYING]: [GamePhase.FINISHED, GamePhase.MENU],
    [GamePhase.FINISHED]: [GamePhase.MENU, GamePhase.HOST_LOBBY, GamePhase.MOBILE_LOBBY]
  };
  
  return transitions[from]?.includes(to) ?? false;
};

export const isHostPhase = (phase: GamePhase): boolean => {
  return phase === GamePhase.HOST_LOBBY;
};

export const isPlayerPhase = (phase: GamePhase): boolean => {
  return [GamePhase.MOBILE_JOIN, GamePhase.MOBILE_LOBBY].includes(phase);
};

export function isMobilePhase(phase: GamePhase): phase is typeof GamePhase.MOBILE_JOIN | typeof GamePhase.MOBILE_LOBBY {
  return phase === GamePhase.MOBILE_JOIN || phase === GamePhase.MOBILE_LOBBY;
}

export function isGamePhase(phase: GamePhase): phase is typeof GamePhase.PLAYING | typeof GamePhase.FINISHED {
  return phase === GamePhase.PLAYING || phase === GamePhase.FINISHED;
}

export interface GameModeSettings {
  // Fiend Mode settings
  rounds?: number;
  
  // Sprint Mode settings
  targetCards?: number;
}

export interface GameState {
  phase: GamePhase;
  currentTurn: number;
  currentSong: Song | null;
  timeLeft: number;
  isPlaying: boolean;
  isDarkMode: boolean;
  throwingCard: null | number;
  confirmingPlacement: null | { song: Song; position: number };
  cardResult: null | { correct: boolean; song: Song };
  transitioningTurn: boolean;
  winner: Player | null;
  isMuted: boolean;
  pendingPlacement: null | { song: Song; position: number };
  cardPlacementPending: boolean;
  cardPlacementConfirmed: boolean;
  cardPlacementCorrect: boolean | null;
  mysteryCardRevealed: boolean;
  gameEnded: boolean;
  highlightedGapIndex: number | null;
}

export interface Song {
  id: string;
  deezer_title: string;
  deezer_artist: string;
  deezer_album: string;
  release_year: string;
  genre: string;
  cardColor: string;
  preview_url?: string;
  deezer_url?: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  timelineColor: string;
  score: number;
  timeline: Song[];
  character: string; // Now required - every player must have a character
}

export interface GameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  host_name: string;
  phase: GamePhase; // This should use GamePhase for the UI state
  gamemode: GameMode;
  gamemode_settings: GameModeSettings;
  songs: Song[];
  created_at: string;
  updated_at: string;
  current_turn?: number;
  current_song?: Song | null;
  current_player_id?: string;
}

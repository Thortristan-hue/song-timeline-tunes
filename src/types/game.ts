
export type GamePhase = 'menu' | 'hostLobby' | 'mobileJoin' | 'mobileLobby' | 'playing' | 'finished';

export type GameMode = 'classic' | 'fiend' | 'sprint';

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
  phase: 'lobby' | 'playing' | 'finished';
  gamemode: GameMode;
  gamemode_settings: GameModeSettings;
  songs: Song[];
  created_at: string;
  updated_at: string;
  current_turn?: number;
  current_song?: Song | null;
  current_player_id?: string;
}

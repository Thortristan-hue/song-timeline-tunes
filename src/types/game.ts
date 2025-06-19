export type GamePhase = 'menu' | 'hostLobby' | 'mobileJoin' | 'mobileLobby' | 'playing' | 'finished';

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
}

export interface Player {
  id: string;
  name: string;
  color: string;
  timelineColor: string;
  score: number;
  timeline: Song[];
}

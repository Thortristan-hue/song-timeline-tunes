
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
  character: string;
  score: number;
  timeline: Song[];
  color: string;
  timelineColor: string;
}

export interface GameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  host_name: string;
  phase: GamePhase;
  current_player_id: string;
  current_song: Song | null;
  gamemode: string;
  gamemode_settings: Record<string, any>;
  songs: Song[];
  created_at: string;
  updated_at: string;
  current_turn: number;
}

export type GamePhase =
  | 'menu'
  | 'mobileJoin'
  | 'mobileLobby'
  | 'lobby'
  | 'hostLobby'
  | 'playing'
  | 'gameOver'
  | 'finished';

export enum GameMode {
  CLASSIC = 'classic',
  FIEND = 'fiend',
  SPRINT = 'sprint'
}

export enum DatabasePhase {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export interface Character {
  id: string;
  name: string;
  image: string;
}

export interface Move {
  songId: string;
  position: number;
}

export interface Round {
  roundNumber: number;
  currentPlayerId: string;
  song: Song;
}

// Type guard functions
export const isMobilePhase = (phase: GamePhase): phase is 'mobileJoin' | 'mobileLobby' => {
  return phase === 'mobileJoin' || phase === 'mobileLobby';
};

export const isGamePhase = (phase: GamePhase): phase is 'lobby' | 'playing' | 'gameOver' => {
  return phase === 'lobby' || phase === 'playing' || phase === 'gameOver';
};

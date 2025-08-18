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
}

export interface GameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  phase: GamePhase;
  current_player_id: string;
  current_song: Song | null;
}

export type GamePhase =
  | 'menu'
  | 'mobileJoin'
  | 'mobileLobby'
  | 'lobby'
  | 'playing'
  | 'gameOver';

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

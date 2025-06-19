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

export interface GameState {
  phase: 'menu' | 'hostLobby' | 'mobileJoin' | 'mobileLobby' | 'playing' | 'finished';
  currentTurn: number;
  currentSong: Song | null;
  timeLeft: number;
  isPlaying: boolean;
  winner: Player | null;
  isMuted: boolean;
}

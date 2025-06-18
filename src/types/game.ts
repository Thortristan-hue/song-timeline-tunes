
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

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  phase: 'lobby' | 'playing' | 'finished';
  songs: Song[];
  currentTurn: number;
  currentSong: Song | null;
}

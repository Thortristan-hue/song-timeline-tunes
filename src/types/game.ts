export interface Song {
  id: string;
  title: string;  // Added - your components expect this
  artist: string; // Added - your components expect this
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
  lobby_code: string; // Added - your components expect this property
}

// Additional types that might be needed based on your components
export interface HostLobbyProps {
  lobbyCode: string;
  players: Player[];
  onStartGame: () => Promise<void>;
  onBackToMenu: () => void;
  setCustomSongs: (songs: Song[]) => void;
  createRoom: (hostName: string) => Promise<void>;
  isLoading: boolean;
}

export interface MobileJoinProps {
  onJoinLobby: (lobbyCode: string, playerName: string) => Promise<void>;
  onBackToMenu: () => void;
  isLoading: boolean;
}

export interface MobilePlayerLobbyProps {
  player: Player;
  lobbyCode: string;
  onUpdatePlayer: (name: string, color: string) => Promise<void>;
}

export interface MainMenuProps {
  onHostGame: () => Promise<void>;
  onJoinGame: () => void;
}

export interface VictoryScreenProps {
  winner: Player;
  players: Player[];
}
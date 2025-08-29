import { Song } from '@/types/game';

export class UniqueSongService {
  private usedSongIds: Set<string> = new Set();
  private availableSongs: Song[] = [];

  constructor(songs: Song[]) {
    this.availableSongs = [...songs];
  }

  /**
   * Fetch a unique random song that hasn't been used yet
   * @returns Song object or null if no unique songs are left
   */
  fetchUniqueRandomSong(): Song | null {
    // Filter available songs to exclude used ones
    const unusedSongs = this.availableSongs.filter(
      song => !this.usedSongIds.has(song.id)
    );

    if (unusedSongs.length === 0) {
      console.warn('⚠️ No more unique songs available');
      return null;
    }

    // Pick a random song from unused ones
    const randomIndex = Math.floor(Math.random() * unusedSongs.length);
    const selectedSong = unusedSongs[randomIndex];

    // Mark this song as used
    this.usedSongIds.add(selectedSong.id);
    
    console.log(`🎵 Fetched unique song: "${selectedSong.deezer_title}" by ${selectedSong.deezer_artist}`);
    console.log(`🎲 Remaining unique songs: ${unusedSongs.length - 1}`);

    return selectedSong;
  }

  /**
   * Get the number of remaining unique songs
   */
  getRemainingCount(): number {
    return this.availableSongs.length - this.usedSongIds.size;
  }

  /**
   * Get all used song IDs
   */
  getUsedSongIds(): string[] {
    return Array.from(this.usedSongIds);
  }

  /**
   * Reset the service to start fresh
   */
  reset(): void {
    this.usedSongIds.clear();
    console.log('🔄 UniqueSongService reset - all songs available again');
  }

  /**
   * Initialize from existing used songs (for game restoration)
   */
  initializeFromUsedSongs(usedSongIds: string[]): void {
    this.usedSongIds = new Set(usedSongIds);
    console.log(`🔄 UniqueSongService initialized with ${usedSongIds.length} used songs`);
  }

  /**
   * Check if any unique songs are left
   */
  hasUniqueSongsLeft(): boolean {
    return this.getRemainingCount() > 0;
  }
}

// Global instance for the current game
let globalUniqueSongService: UniqueSongService | null = null;

export const initializeUniqueSongService = (songs: Song[]): UniqueSongService => {
  globalUniqueSongService = new UniqueSongService(songs);
  return globalUniqueSongService;
};

export const getUniqueSongService = (): UniqueSongService | null => {
  return globalUniqueSongService;
};

export const resetUniqueSongService = (): void => {
  if (globalUniqueSongService) {
    globalUniqueSongService.reset();
  }
};

// Helper functions for integration with existing code
export const getStartingCardForPlayer = (songs: Song[], usedSongIds: Set<string>): Song | null => {
  const availableSongs = songs.filter(song => !usedSongIds.has(song.id));
  if (availableSongs.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  const selectedSong = availableSongs[randomIndex];
  usedSongIds.add(selectedSong.id);
  
  return selectedSong;
};

export const getFirstMysterySong = (songs: Song[], usedSongIds: Set<string>): Song | null => {
  const availableSongs = songs.filter(song => !usedSongIds.has(song.id));
  if (availableSongs.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableSongs.length);
  const selectedSong = availableSongs[randomIndex];
  usedSongIds.add(selectedSong.id);
  
  return selectedSong;
};

export const initializeUniqueRoom = () => {
  const usedSongIds = new Set<string>();
  return { usedSongIds, mysterySong: null };
};
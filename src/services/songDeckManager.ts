// Song deck management service for proper mystery song selection
// Implements Fisher-Yates shuffle and sequential deck consumption

import { Song } from '@/types/game';

export interface SongDeckState {
  allSongs: Song[];
  remainingSongs: Song[];
  usedSongs: Song[];
  currentIndex: number;
  isExhausted: boolean;
}

export class SongDeckManager {
  private state: SongDeckState;

  constructor(songs: Song[]) {
    this.state = {
      allSongs: [...songs],
      remainingSongs: this.shuffleSongs([...songs]),
      usedSongs: [],
      currentIndex: 0,
      isExhausted: false
    };
    
    console.log('🎵 SongDeckManager initialized with', songs.length, 'songs');
  }

  /**
   * Fisher-Yates shuffle implementation for proper randomization
   */
  private shuffleSongs(songs: Song[]): Song[] {
    const shuffled = [...songs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    console.log('🔀 Songs shuffled using Fisher-Yates algorithm');
    return shuffled;
  }

  /**
   * Get the next mystery song from the deck
   * Ensures no duplicates and proper sequential consumption
   */
  getNextMysterySong(): Song | null {
    if (this.state.isExhausted || this.state.currentIndex >= this.state.remainingSongs.length) {
      console.log('⚠️ Song deck exhausted - no more mystery songs available');
      this.state.isExhausted = true;
      return null;
    }

    const nextSong = this.state.remainingSongs[this.state.currentIndex];
    this.state.currentIndex++;
    
    console.log(`🎵 Next mystery song: "${nextSong.deezer_title}" by ${nextSong.deezer_artist} (${this.getRemainingCount()} remaining)`);
    
    return nextSong;
  }

  /**
   * Mark a song as used (when placed on timeline)
   * This doesn't affect the mystery deck, just tracks usage
   */
  markSongAsUsed(song: Song): void {
    if (!this.state.usedSongs.find(s => s.id === song.id)) {
      this.state.usedSongs.push(song);
      console.log(`✅ Song marked as used: "${song.deezer_title}"`);
    }
  }

  /**
   * Get count of remaining mystery songs
   */
  getRemainingCount(): number {
    return Math.max(0, this.state.remainingSongs.length - this.state.currentIndex);
  }

  /**
   * Check if deck is exhausted
   */
  isExhausted(): boolean {
    return this.state.isExhausted || this.state.currentIndex >= this.state.remainingSongs.length;
  }

  /**
   * Get current deck state for debugging
   */
  getState(): SongDeckState {
    return { ...this.state };
  }

  /**
   * Reset deck with new songs (for new game)
   */
  reset(songs: Song[]): void {
    this.state = {
      allSongs: [...songs],
      remainingSongs: this.shuffleSongs([...songs]),
      usedSongs: [],
      currentIndex: 0,
      isExhausted: false
    };
    console.log('🔄 Song deck reset with', songs.length, 'songs');
  }

  /**
   * Create a deck excluding specific songs (e.g., starting cards)
   */
  static createDeckExcluding(allSongs: Song[], excludeSongs: Song[]): SongDeckManager {
    const excludeIds = new Set(excludeSongs.map(s => s.id));
    const availableSongs = allSongs.filter(s => !excludeIds.has(s.id));
    
    console.log(`🎵 Creating deck excluding ${excludeSongs.length} songs, ${availableSongs.length} remaining`);
    
    return new SongDeckManager(availableSongs);
  }

  /**
   * Get songs that are safe to use as starting cards
   * Returns a subset that leaves enough for mystery cards
   */
  static getStartingCardCandidates(allSongs: Song[], playersCount: number, cardsPerPlayer: number = 1): Song[] {
    const requiredStartingCards = playersCount * cardsPerPlayer;
    const minimumMysteryCards = 5; // Keep at least 5 songs for mystery cards
    
    if (allSongs.length < requiredStartingCards + minimumMysteryCards) {
      console.warn('⚠️ Not enough songs for proper game setup');
      return allSongs.slice(0, requiredStartingCards);
    }
    
    // Shuffle and take songs for starting cards
    const shuffled = [...allSongs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, requiredStartingCards);
  }
}

// Utility functions for working with song decks
export const songDeckUtils = {
  /**
   * Normalize song comparison to handle potential data inconsistencies
   */
  normalizeSongForComparison(song: Song): string {
    return `${song.deezer_title?.toLowerCase().trim()}-${song.deezer_artist?.toLowerCase().trim()}-${song.release_year}`;
  },

  /**
   * Check if two songs are the same (handle string vs number ids, etc.)
   */
  isSameSong(song1: Song, song2: Song): boolean {
    return song1.id === song2.id || 
           this.normalizeSongForComparison(song1) === this.normalizeSongForComparison(song2);
  },

  /**
   * Validate song object has required properties
   */
  isValidSong(song: Song): boolean {
    return !!(song && 
              song.id && 
              song.deezer_title && 
              song.deezer_artist && 
              song.release_year);
  }
};
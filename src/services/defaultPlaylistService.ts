
import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';
import { DeezerAudioService } from './DeezerAudioService';

/**
 * Service for managing the default song playlist with performance optimizations
 */
class DefaultPlaylistService {
  private songs: Song[] = [];

  /**
   * Loads and validates the default playlist with API optimization
   * @returns Promise<Song[]> Array of valid songs
   */
  async loadDefaultPlaylist(): Promise<Song[]> {
    console.log('🎵 Loading default playlist with performance optimization...');
    
    // Initial processing - get all valid songs regardless of preview status
    this.songs = defaultPlaylist
      .filter(item => this.validateSong(item))
      .map(item => this.mapToSong(item));

    console.log(`📋 Total valid songs in playlist: ${this.songs.length}`);
    
    // PERFORMANCE FIX: Don't fetch previews for all songs - let game logic decide
    // This prevents the API spam issue by deferring preview fetching
    console.log(`⚡ PERFORMANCE OPTIMIZATION: Skipping bulk preview fetching to prevent API spam`);
    console.log(`📊 API CALLS SAVED: Prevented ${this.songs.length} immediate preview requests`);
    
    // Return all songs without previews - they'll be fetched on-demand
    console.log(`✅ Loaded ${this.songs.length} songs (previews will be fetched on-demand to prevent API spam)`);
    return this.songs;
  }

  /**
   * Filters valid songs from an array
   * @param songs Array of songs to filter
   * @returns Array of valid songs
   */
  filterValidSongs(songs: Song[]): Song[] {
    return songs.filter(song => {
      // Check if song has required fields
      if (!song.release_year || !song.deezer_title || !song.deezer_artist) {
        return false;
      }
      
      // Validate release year
      const year = parseInt(song.release_year.toString());
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Filters songs that have valid preview URLs
   * @param songs Array of songs to filter
   * @returns Array of songs with valid previews
   */
  filterSongsWithPreviews(songs: Song[]): Song[] {
    return songs.filter(song => song.preview_url && song.preview_url.trim() !== '');
  }

  /**
   * Fetches preview URL for a song (ON-DEMAND to prevent API spam)
   * @param song Song object
   * @returns Promise<Song> Song with preview URL if available
   */
  async fetchPreviewUrl(song: Song): Promise<Song> {
    try {
      if (song.preview_url) {
        return song;
      }

      // Try to extract track ID from deezer_url if available
      const deezerUrl = (song as any).deezer_url;
      if (deezerUrl) {
        const trackId = deezerUrl.match(/track\/(\d+)/)?.[1];
        if (trackId) {
          console.log(`🎵 ON-DEMAND FETCH: Getting preview for ${song.deezer_title} (prevents bulk API spam)`);
          const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
          return { ...song, preview_url: previewUrl };
        }
      }

      return song;
    } catch (error) {
      console.warn(`Failed to fetch on-demand preview for ${song.deezer_title}:`, error);
      return song;
    }
  }

  private validateSong(item: any): boolean {
    if (!item.release_year?.toString().trim()) {
      console.log('⏭️ Skipping song without release year:', item.deezer_title);
      return false;
    }
    
    const year = parseInt(item.release_year.toString());
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      console.log('⏭️ Skipping song with invalid release year:', item.deezer_title, item.release_year);
      return false;
    }
    
    return true;
  }

  private mapToSong(item: any): Song {
    return {
      id: Math.random().toString(36).substring(2, 11),
      deezer_title: item.deezer_title || 'Unknown Title',
      deezer_artist: item.deezer_artist || 'Unknown Artist',
      deezer_album: item.deezer_album || 'Unknown Album',
      release_year: item.release_year.toString(),
      genre: item.genre || 'Unknown',
      cardColor: this.generateCardColor(),
      preview_url: item.preview_url || undefined, // Keep existing previews but don't fetch new ones
      deezer_url: item.deezer_url || undefined
    };
  }

  /**
   * REMOVED: bulk preview enrichment to prevent API spam
   * This method was causing the proxy server to be flooded with requests
   */

  private generateCardColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getSongsCount(): number {
    return this.songs.length;
  }

  getRandomSong(): Song | null {
    return this.songs.length > 0 
      ? this.songs[Math.floor(Math.random() * this.songs.length)]
      : null;
  }

  /**
   * Get a random song that has a valid preview URL (for immediate use)
   * @returns Song with preview URL or null if none available
   */
  getRandomSongWithPreview(): Song | null {
    const songsWithPreviews = this.songs.filter(song => song.preview_url);
    return songsWithPreviews.length > 0 
      ? songsWithPreviews[Math.floor(Math.random() * songsWithPreviews.length)]
      : null;
  }

  /**
   * Get a random song and fetch preview on-demand (prevents API spam)
   * @returns Promise<Song | null> Song with freshly fetched preview
   */
  async getRandomSongWithFreshPreview(): Promise<Song | null> {
    const randomSong = this.getRandomSong();
    if (!randomSong) return null;
    
    console.log(`🎵 FRESH PREVIEW: Fetching on-demand for ${randomSong.deezer_title} (anti-spam)`);
    return await this.fetchPreviewUrl(randomSong);
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

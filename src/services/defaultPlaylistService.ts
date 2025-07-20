import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';
import { DeezerAudioService } from './DeezerAudioService';

// Define types for the playlist item formats
interface PlaylistItemV1 {
  artist: string;
  title: string;
  year: string | number;
  deezer_link?: string;
}

interface PlaylistItemV2 {
  deezer_artist: string;
  deezer_title: string;
  deezer_album?: string;
  release_year: string | number;
  genre?: string;
  deezer_url?: string;
  preview_url?: string;
}

type PlaylistItem = PlaylistItemV1 | PlaylistItemV2;

interface SongWithOptionalPreview extends Song {
  deezer_url?: string;
  preview_url?: string;
}

/**
 * Service for managing the default song playlist with performance optimizations
 * Now supports both old and new playlist formats!
 */
class DefaultPlaylistService {
  private songs: Song[] = [];

  /**
   * Loads and validates the default playlist with API optimization
   * Supports both v1 and v2 playlist formats
   * @returns Promise<Song[]> Array of valid songs
   */
  async loadDefaultPlaylist(): Promise<Song[]> {
    console.log('🎵 Loading default playlist with performance optimization...');

    // Accept both v1 and v2 formats
    this.songs = defaultPlaylist
      .filter(item => this.validateSong(item))
      .map(item => this.mapToSong(item));

    console.log(`📋 Total valid songs in playlist: ${this.songs.length}`);

    console.log(`⚡ PERFORMANCE OPTIMIZATION: Skipping bulk preview fetching to prevent API spam`);
    console.log(`📊 API CALLS SAVED: Prevented ${this.songs.length} immediate preview requests`);

    // Return all songs without previews - they'll be fetched on-demand
    console.log(`✅ Loaded ${this.songs.length} songs (previews will be fetched on-demand to prevent API spam)`);
    return this.songs;
  }

  /**
   * Loads a limited set of songs with previews for immediate game start
   * ENHANCED: Keeps trying additional songs until we get enough with previews
   * @param minSongs Minimum number of songs needed with previews
   * @returns Promise<Song[]> Array of songs with valid previews
   */
  async loadOptimizedGameSongs(minSongs: number = 20): Promise<Song[]> {
    console.log(`🚀 ENHANCED LOAD: Fetching previews until we get ${minSongs} songs with working previews`);

    // Get all valid songs first
    if (this.songs.length === 0) {
      await this.loadDefaultPlaylist();
    }

    // Shuffle all songs to get random selection
    const shuffledSongs = [...this.songs].sort(() => Math.random() - 0.5);

    const songsWithPreviews: Song[] = [];
    let songsProcessed = 0;
    let successCount = 0;
    let failCount = 0;

    console.log(`🎯 RESILIENT APPROACH: Will keep trying songs until we get ${minSongs} with working previews`);

    // Keep processing songs until we have enough with previews
    for (const song of shuffledSongs) {
      // Stop if we have enough songs with previews
      if (songsWithPreviews.length >= minSongs) {
        break;
      }

      // Stop if we've processed too many songs (safety limit - increased to 80)
      if (songsProcessed >= Math.min(80, this.songs.length)) {
        console.log(`⚠️ SAFETY LIMIT: Processed ${songsProcessed} songs, stopping to prevent excessive API calls`);
        break;
      }

      try {
        songsProcessed++;
        console.log(`🎵 Trying song ${songsProcessed}: ${song.deezer_title} by ${song.deezer_artist}`);

        const songWithPreview = await this.fetchPreviewUrl(song);
        if (songWithPreview.preview_url) {
          songsWithPreviews.push(songWithPreview);
          successCount++;
          console.log(`✅ Preview ${successCount}/${minSongs}: ${song.deezer_title} by ${song.deezer_artist}`);
        } else {
          failCount++;
          console.log(`❌ No preview (${failCount} failed): ${song.deezer_title} by ${song.deezer_artist}`);
        }
      } catch (error) {
        failCount++;
        console.log(`❌ Preview fetch failed (${failCount} failed): ${song.deezer_title} - ${error}`);
      }
    }

    console.log(`🎯 RESILIENT RESULT: ${songsWithPreviews.length} songs with previews after processing ${songsProcessed} songs`);
    console.log(`📊 SUCCESS RATE: ${successCount}/${songsProcessed} songs had working previews (${(successCount/songsProcessed*100).toFixed(1)}%)`);
    console.log(`📊 API EFFICIENCY: Processed ${songsProcessed} songs instead of all ${this.songs.length} (${((this.songs.length - songsProcessed) / this.songs.length * 100).toFixed(1)}% reduction)`);

    return songsWithPreviews;
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
      const songWithUrl = song as SongWithOptionalPreview;
      const deezerUrl = songWithUrl.deezer_url;
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

  /**
   * Accepts both v1 and v2 playlist formats and validates
   */
  private validateSong(item: PlaylistItem): boolean {
    // Type guards for different formats
    const isV1 = (item: PlaylistItem): item is PlaylistItemV1 => 
      'artist' in item && 'title' in item && 'year' in item;
    
    const isV2 = (item: PlaylistItem): item is PlaylistItemV2 => 
      'deezer_artist' in item && 'deezer_title' in item && 'release_year' in item;
    
    const hasV2 = isV2(item);
    const hasV1 = isV1(item);
    
    if (!hasV1 && !hasV2) {
      return false;
    }

    // Release year logic
    const year = parseInt(((item as unknown as {release_year?: string | number; year?: string | number}).release_year ?? (item as unknown as {release_year?: string | number; year?: string | number}).year)?.toString());
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      return false;
    }

    return true;
  }

  /**
   * Accepts both v1 and v2 playlist formats and maps to Song
   */
  private mapToSong(item: PlaylistItem): Song {
    // Type guards for different formats
    const isV1 = (item: PlaylistItem): item is PlaylistItemV1 => 
      'artist' in item && 'title' in item && 'year' in item;
    
    const isV2 = (item: PlaylistItem): item is PlaylistItemV2 => 
      'deezer_artist' in item && 'deezer_title' in item && 'release_year' in item;

    if (isV1(item)) {
      return {
        id: Math.random().toString(36).substring(2, 11),
        deezer_title: item.title || 'Unknown Title',
        deezer_artist: item.artist || 'Unknown Artist',
        deezer_album: 'Unknown Album',
        release_year: item.year?.toString() || 'Unknown',
        genre: 'Unknown',
        cardColor: this.generateCardColor(),
        preview_url: undefined,
        deezer_url: item.deezer_link || undefined
      };
    } else if (isV2(item)) {
      return {
        id: Math.random().toString(36).substring(2, 11),
        deezer_title: item.deezer_title || 'Unknown Title',
        deezer_artist: item.deezer_artist || 'Unknown Artist',
        deezer_album: item.deezer_album || 'Unknown Album',
        release_year: item.release_year?.toString() || 'Unknown',
        genre: item.genre || 'Unknown',
        cardColor: this.generateCardColor(),
        preview_url: item.preview_url || undefined,
        deezer_url: item.deezer_url || undefined
      };
    } else {
      // Should never hit this, but fallback
      return {
        id: Math.random().toString(36).substring(2, 11),
        deezer_title: 'Unknown Title',
        deezer_artist: 'Unknown Artist',
        deezer_album: 'Unknown Album',
        release_year: 'Unknown',
        genre: 'Unknown',
        cardColor: this.generateCardColor(),
        preview_url: undefined,
        deezer_url: undefined
      };
    }
  }

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

// LEXICAL DECLARATION FIX: Export as default to prevent hoisting issues
const defaultPlaylistServiceInstance = new DefaultPlaylistService();
export { defaultPlaylistServiceInstance as defaultPlaylistService };
export default defaultPlaylistServiceInstance;

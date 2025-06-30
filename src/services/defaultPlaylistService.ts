import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';
import { DeezerAudioService } from './DeezerAudioService';

/**
 * Service for managing the default song playlist
 */
class DefaultPlaylistService {
  private songs: Song[] = [];

  /**
   * Loads and validates the default playlist
   * @returns Promise<Song[]> Array of valid songs
   */
  async loadDefaultPlaylist(): Promise<Song[]> {
    console.log('🎵 Loading default playlist...');
    
    // Initial processing
    this.songs = defaultPlaylist
      .filter(item => this.validateSong(item))
      .map(item => this.mapToSong(item));

    // Enrich with preview URLs and filter out songs without previews
    this.songs = await this.enrichWithPreviews(this.songs);
    
    console.log(`✅ Loaded ${this.songs.length} valid songs with previews`);
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
   * Fetches preview URL for a song
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
          const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
          return { ...song, preview_url: previewUrl };
        }
      }

      return song;
    } catch (error) {
      console.warn(`Failed to fetch preview for ${song.deezer_title}:`, error);
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
      preview_url: item.preview_url || undefined,
      deezer_url: item.deezer_url || undefined
    };
  }

  private async enrichWithPreviews(songs: Song[]): Promise<Song[]> {
    const songsWithPreviews: Song[] = [];
    
    for (const song of songs) {
      try {
        // If song already has preview_url, keep it
        if (song.preview_url) {
          songsWithPreviews.push(song);
          continue;
        }

        // Try to get preview from Deezer URL
        if (song.deezer_url) {
          const trackId = song.deezer_url.match(/track\/(\d+)/)?.[1];
          if (trackId) {
            console.log(`🎵 Fetching preview for: ${song.deezer_title}`);
            const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
            song.preview_url = previewUrl;
            songsWithPreviews.push(song);
            console.log(`✅ Got preview for: ${song.deezer_title}`);
          } else {
            console.log(`⏭️ No track ID found for: ${song.deezer_title}`);
          }
        } else {
          console.log(`⏭️ No Deezer URL for: ${song.deezer_title}`);
        }
      } catch (error) {
        console.log(`⏭️ Skipping ${song.deezer_title} - no preview available:`, error instanceof Error ? error.message : 'Unknown error');
        // Don't add songs without previews to the final list
      }
    }

    return songsWithPreviews;
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
}

export const defaultPlaylistService = new DefaultPlaylistService();


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
    
    // Initial processing - get all valid songs regardless of preview status
    this.songs = defaultPlaylist
      .filter(item => this.validateSong(item))
      .map(item => this.mapToSong(item));

    console.log(`📋 Total valid songs in playlist: ${this.songs.length}`);
    
    // Try to enrich with preview URLs but don't filter out songs without previews yet
    const enrichedSongs = await this.enrichWithPreviews(this.songs);
    
    // Count songs with previews
    const songsWithPreviews = enrichedSongs.filter(song => song.preview_url);
    console.log(`🎵 Songs with previews: ${songsWithPreviews.length}/${enrichedSongs.length}`);
    
    // Return all songs (with and without previews) - let the game logic decide what to do
    this.songs = enrichedSongs;
    
    console.log(`✅ Loaded ${this.songs.length} total songs (${songsWithPreviews.length} with previews)`);
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
    const enrichedSongs: Song[] = [];
    
    for (const song of songs) {
      try {
        // If song already has preview_url, keep it
        if (song.preview_url) {
          enrichedSongs.push(song);
          continue;
        }

        // Try to get preview from Deezer URL
        if (song.deezer_url) {
          const trackId = song.deezer_url.match(/track\/(\d+)/)?.[1];
          if (trackId) {
            console.log(`🎵 Fetching preview for: ${song.deezer_title}`);
            try {
              const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
              song.preview_url = previewUrl;
              console.log(`✅ Got preview for: ${song.deezer_title}`);
            } catch (error) {
              console.log(`⏭️ No preview available for: ${song.deezer_title}`);
            }
          } else {
            console.log(`⏭️ No track ID found for: ${song.deezer_title}`);
          }
        } else {
          console.log(`⏭️ No Deezer URL for: ${song.deezer_title}`);
        }
        
        // Add the song regardless of whether we got a preview or not
        enrichedSongs.push(song);
      } catch (error) {
        console.log(`⏭️ Error processing ${song.deezer_title}:`, error instanceof Error ? error.message : 'Unknown error');
        // Still add the song even if there was an error
        enrichedSongs.push(song);
      }
    }

    return enrichedSongs;
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
   * Get a random song that has a valid preview URL
   * @returns Song with preview URL or null if none available
   */
  getRandomSongWithPreview(): Song | null {
    const songsWithPreviews = this.songs.filter(song => song.preview_url);
    return songsWithPreviews.length > 0 
      ? songsWithPreviews[Math.floor(Math.random() * songsWithPreviews.length)]
      : null;
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

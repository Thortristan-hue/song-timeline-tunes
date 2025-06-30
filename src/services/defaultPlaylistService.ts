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

    // Enrich with preview URLs
    this.songs = await this.enrichWithPreviews(this.songs);
    
    console.log(`✅ Loaded ${this.songs.length} valid songs`);
    return this.songs;
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
    return Promise.all(songs.map(async song => {
      if (!song.preview_url && song.deezer_url) {
        try {
          const trackId = song.deezer_url.match(/track\/(\d+)/)?.[1];
          if (trackId) {
            song.preview_url = await DeezerAudioService.getPreviewUrl(trackId);
          }
        } catch (error) {
          console.error(`Failed to get preview for ${song.deezer_title}:`, error);
        }
      }
      return song;
    }));
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

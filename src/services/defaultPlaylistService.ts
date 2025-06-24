
import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';
import { CorsProxyService } from './corsProxyService';

export interface DefaultPlaylistServiceType {
  loadDefaultPlaylist(): Promise<Song[]>;
  filterValidSongs(songs: Song[]): Song[];
  fetchPreviewUrl(song: Song): Promise<Song>;
}

class DefaultPlaylistService implements DefaultPlaylistServiceType {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  async loadDefaultPlaylist(): Promise<Song[]> {
    try {
      console.log('🎵 Loading default playlist...');
      
      if (!defaultPlaylist || !Array.isArray(defaultPlaylist)) {
        throw new Error('Default playlist data is invalid or missing');
      }

      // Convert and validate the playlist
      const songs: Song[] = defaultPlaylist.map((item: any, index: number) => ({
        id: item.id || `default_${index}`,
        deezer_title: item.deezer_title || item.title || 'Unknown Title',
        deezer_artist: item.deezer_artist || item.artist || 'Unknown Artist',
        deezer_album: item.deezer_album || item.album || 'Unknown Album',
        release_year: item.release_year || item.year || 'Unknown',
        genre: item.genre || 'Unknown',
        preview_url: item.preview_url || null,
        cardColor: item.cardColor || this.generateRandomColor()
      }));

      console.log(`✅ Loaded ${songs.length} songs from default playlist`);
      return this.filterValidSongs(songs);
    } catch (error) {
      console.error('❌ Failed to load default playlist:', error);
      throw new Error('Failed to load default playlist. Please try again or refresh the page.');
    }
  }

  filterValidSongs(songs: Song[]): Song[] {
    const validSongs = songs.filter(song => {
      const isValid = song &&
        song.deezer_title &&
        song.deezer_title.trim() !== '' &&
        song.deezer_artist &&
        song.deezer_artist.trim() !== '' &&
        song.release_year &&
        song.release_year !== 'undefined' &&
        song.release_year !== 'null' &&
        song.release_year.trim() !== '';

      if (!isValid) {
        console.warn('🚫 Filtering out invalid song:', song);
      }

      return isValid;
    });

    console.log(`✅ Filtered to ${validSongs.length} valid songs out of ${songs.length} total`);
    return validSongs;
  }

  async fetchPreviewUrl(song: Song): Promise<Song> {
    if (song.preview_url) {
      console.log('✅ Song already has preview URL:', song.deezer_title);
      return song;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Fetching preview for "${song.deezer_title}" by ${song.deezer_artist} (attempt ${attempt}/${this.MAX_RETRIES})`);
        
        const searchQuery = encodeURIComponent(`${song.deezer_artist} ${song.deezer_title}`);
        const deezerApiUrl = `https://api.deezer.com/search?q=${searchQuery}&limit=1`;
        
        const data = await CorsProxyService.fetchJson<any>(deezerApiUrl);
        
        if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
          throw new Error('No search results found');
        }

        const track = data.data[0];
        if (!track.preview) {
          throw new Error('No preview URL available');
        }

        const updatedSong = {
          ...song,
          preview_url: track.preview
        };

        console.log(`✅ Successfully fetched preview for "${song.deezer_title}"`);
        return updatedSong;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Attempt ${attempt} failed for "${song.deezer_title}":`, lastError.message);
        
        if (attempt < this.MAX_RETRIES) {
          console.log(`⏳ Waiting ${this.RETRY_DELAY}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    // All attempts failed
    console.error(`❌ Failed to fetch preview for "${song.deezer_title}" after ${this.MAX_RETRIES} attempts:`, lastError);
    
    // Return song without preview_url but don't throw error
    return {
      ...song,
      preview_url: null
    };
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF', '#D7BDE2',
      '#A9DFBF', '#F9E79F', '#FAD7A0', '#FFA07A'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

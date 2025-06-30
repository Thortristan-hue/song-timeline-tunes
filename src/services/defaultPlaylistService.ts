
import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';

class DefaultPlaylistService {
  private songs: Song[] = [];

  async loadDefaultPlaylist(): Promise<Song[]> {
    console.log('🎵 Loading default playlist...');
    
    // Convert the imported data to Song objects with validation
    this.songs = defaultPlaylist
      .filter(item => {
        // Filter out songs without valid release year
        if (!item.release_year || item.release_year.toString().trim() === '') {
          console.log('⏭️ Skipping song without release year:', item.deezer_title);
          return false;
        }
        
        // Filter out songs with invalid release year format
        const year = parseInt(item.release_year.toString());
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
          console.log('⏭️ Skipping song with invalid release year:', item.deezer_title, item.release_year);
          return false;
        }
        
        return true;
      })
      .map(item => ({
        id: Math.random().toString(36).substr(2, 9), // Generate random ID since it's not in the JSON
        deezer_title: item.deezer_title || 'Unknown Title',
        deezer_artist: item.deezer_artist || 'Unknown Artist',
        deezer_album: item.deezer_album || 'Unknown Album',
        release_year: item.release_year.toString(),
        genre: item.genre || 'Unknown',
        cardColor: this.generateCardColor(),
        preview_url: item.deezer_url || undefined // Use deezer_url as preview_url fallback
      }));

    console.log(`✅ Loaded ${this.songs.length} valid songs (filtered out songs without release years)`);
    return this.songs;
  }

  filterValidSongs(songs: Song[]): Song[] {
    const validSongs = songs.filter(song => {
      // Additional validation for songs that already made it through
      const hasTitle = song.deezer_title && song.deezer_title.trim() !== '';
      const hasArtist = song.deezer_artist && song.deezer_artist.trim() !== '';
      const hasValidYear = song.release_year && song.release_year.trim() !== '';
      
      if (!hasValidYear) {
        console.log('⏭️ Filtering out song without release year:', song.deezer_title);
        return false;
      }
      
      return hasTitle && hasArtist && hasValidYear;
    });

    console.log(`🎵 Filtered to ${validSongs.length} valid songs with release years`);
    return validSongs;
  }

  async fetchPreviewUrl(song: Song): Promise<Song> {
    try {
      if (song.preview_url) {
        return song;
      }

      // If no preview URL is available, return the song as-is
      // The game will handle missing preview URLs gracefully
      console.warn(`No preview URL available for ${song.deezer_title}`);
      return song;
    } catch (error) {
      console.error(`Failed to fetch preview for ${song.deezer_title}:`, error);
      return song;
    }
  }

  private generateCardColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
      '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getSongsCount(): number {
    return this.songs.length;
  }

  getRandomSong(): Song | null {
    if (this.songs.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.songs.length);
    return this.songs[randomIndex];
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

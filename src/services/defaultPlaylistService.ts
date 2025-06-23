
import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';

class DefaultPlaylistService {
  private basePlaylist: Song[] = [];

  constructor() {
    this.loadBasePlaylist();
  }

  private loadBasePlaylist() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF',
      '#D7BDE2', '#A9DFBF', '#F9E79F', '#FAD7A0'
    ];

    this.basePlaylist = defaultPlaylist
      .map((song: any, index: number) => ({
        id: song.id || `default_${index}`,
        deezer_title: song.deezer_title || song.title,
        deezer_artist: song.deezer_artist || song.artist,
        deezer_album: song.deezer_album || song.album,
        release_year: song.release_year?.toString() || song.year?.toString(),
        genre: song.genre || 'Unknown',
        cardColor: colors[index % colors.length],
      }))
      .filter(song => this.isValidSong(song));
  }

  isValidSong(song: Song): boolean {
    const releaseYearStr = song.release_year?.toString().trim();
    const hasValidReleaseYear = releaseYearStr && 
                               releaseYearStr !== 'undefined' && 
                               releaseYearStr !== 'null' && 
                               releaseYearStr !== '' &&
                               !isNaN(Number(releaseYearStr)) &&
                               Number(releaseYearStr) > 1900 && 
                               Number(releaseYearStr) <= new Date().getFullYear() + 1 &&
                               isFinite(Number(releaseYearStr));
    
    const hasTitle = song.deezer_title && song.deezer_title.trim() !== '';
    const hasArtist = song.deezer_artist && song.deezer_artist.trim() !== '';
    
    return hasValidReleaseYear && hasTitle && hasArtist;
  }

  // Filter an entire playlist ONCE - this should only be called when playlist changes
  filterValidSongs(songs: Song[]): Song[] {
    const validSongs = songs.filter((song, index) => {
      const isValid = this.isValidSong(song);
      if (!isValid) {
        console.log(`❌ Invalid song ${index + 1}: "${song.deezer_title}" by ${song.deezer_artist} (${song.release_year})`);
      }
      return isValid;
    });
    
    if (validSongs.length === 0) {
      console.error('⚠️ NO VALID SONGS FOUND AFTER FILTERING!');
    }
    
    return validSongs;
  }

  async loadDefaultPlaylist(): Promise<Song[]> {
    return [...this.basePlaylist];
  }

  async fetchPreviewUrl(song: Song): Promise<Song> {
    if (!this.isValidSong(song)) {
      throw new Error(`Song validation failed: missing required data for ${song.deezer_title}`);
    }
    
    try {
      const searchQuery = encodeURIComponent(`${song.deezer_artist} ${song.deezer_title}`);
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const deezerApiUrl = `https://api.deezer.com/search?q=${searchQuery}&limit=1`;
      const proxiedUrl = corsProxy + encodeURIComponent(deezerApiUrl);

      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status} ${response.statusText}`);
      }

      const searchData = await response.json();
      
      if (searchData.data && searchData.data.length > 0) {
        const track = searchData.data[0];
        const updatedSong = {
          ...song,
          preview_url: track.preview || undefined
        };
        
        return updatedSong;
      } else {
        return song;
      }
    } catch (error) {
      console.error(`❌ Failed to fetch preview URL for ${song.deezer_artist} - ${song.deezer_title}:`, error);
      return song;
    }
  }

  validatePlaylistForGameplay(songs: Song[], minRequired: number = 10): { isValid: boolean; validCount: number; errorMessage?: string } {
    const validSongs = this.filterValidSongs(songs);
    const validCount = validSongs.length;
    
    if (validCount === 0) {
      return {
        isValid: false,
        validCount: 0,
        errorMessage: "No valid songs available. Please add more songs or check your playlist source."
      };
    }
    
    if (validCount < minRequired) {
      return {
        isValid: false,
        validCount,
        errorMessage: `Only ${validCount} valid songs found. Need at least ${minRequired} songs for optimal gameplay.`
      };
    }
    
    return {
      isValid: true,
      validCount
    };
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();


import { Song } from '@/types/game';
import defaultPlaylist from '@/data/defaultPlaylist.json';

class DefaultPlaylistService {
  private basePlaylist: Song[] = [];

  constructor() {
    this.loadBasePlaylist();
  }

  private loadBasePlaylist() {
    console.log('Loading base playlist without preview URLs...');
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF',
      '#D7BDE2', '#A9DFBF', '#F9E79F', '#FAD7A0'
    ];

    this.basePlaylist = defaultPlaylist.map((song: any, index: number) => ({
      id: song.id || `default_${index}`,
      deezer_title: song.deezer_title || song.title,
      deezer_artist: song.deezer_artist || song.artist,
      deezer_album: song.deezer_album || song.album,
      release_year: song.release_year?.toString() || song.year?.toString(),
      genre: song.genre || 'Unknown',
      cardColor: colors[index % colors.length],
      // Don't include preview_url - will be fetched when needed
    }));

    console.log(`Base playlist loaded: ${this.basePlaylist.length} songs`);
  }

  async loadDefaultPlaylist(): Promise<Song[]> {
    return [...this.basePlaylist];
  }

  // New method to fetch preview URL for a specific song
  async fetchPreviewUrl(song: Song): Promise<Song> {
    console.log(`Fetching preview URL for: ${song.deezer_artist} - ${song.deezer_title}`);
    
    try {
      // Use Deezer API to search for the song and get preview URL
      const searchQuery = encodeURIComponent(`${song.deezer_artist} ${song.deezer_title}`);
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const deezerApiUrl = `https://api.deezer.com/search?q=${searchQuery}&limit=1`;
      const proxiedUrl = corsProxy + encodeURIComponent(deezerApiUrl);

      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.status}`);
      }

      const searchData = await response.json();
      
      if (searchData.data && searchData.data.length > 0) {
        const track = searchData.data[0];
        const updatedSong = {
          ...song,
          preview_url: track.preview || undefined
        };
        
        console.log(`Preview URL fetched successfully: ${updatedSong.preview_url}`);
        return updatedSong;
      } else {
        console.warn(`No search results found for: ${song.deezer_artist} - ${song.deezer_title}`);
        return song; // Return original song without preview_url
      }
    } catch (error) {
      console.error(`Failed to fetch preview URL for ${song.deezer_artist} - ${song.deezer_title}:`, error);
      return song; // Return original song without preview_url
    }
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

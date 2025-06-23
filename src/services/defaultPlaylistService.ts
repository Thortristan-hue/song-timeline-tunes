
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

    this.basePlaylist = defaultPlaylist
      .map((song: any, index: number) => ({
        id: song.id || `default_${index}`,
        deezer_title: song.deezer_title || song.title,
        deezer_artist: song.deezer_artist || song.artist,
        deezer_album: song.deezer_album || song.album,
        release_year: song.release_year?.toString() || song.year?.toString(),
        genre: song.genre || 'Unknown',
        cardColor: colors[index % colors.length],
        // Don't include preview_url - will be fetched when needed
      }))
      .filter(song => this.isValidSong(song)); // Filter out invalid songs

    console.log(`Base playlist loaded: ${this.basePlaylist.length} valid songs`);
  }

  private isValidSong(song: Song): boolean {
    const hasReleaseYear = song.release_year && 
                          song.release_year !== 'undefined' && 
                          song.release_year !== 'null' && 
                          song.release_year.trim() !== '' &&
                          !isNaN(parseInt(song.release_year));
    
    const hasTitle = song.deezer_title && song.deezer_title.trim() !== '';
    const hasArtist = song.deezer_artist && song.deezer_artist.trim() !== '';
    
    const isValid = hasReleaseYear && hasTitle && hasArtist;
    
    if (!isValid) {
      console.warn('Invalid song filtered out:', {
        title: song.deezer_title,
        artist: song.deezer_artist,
        release_year: song.release_year,
        hasReleaseYear,
        hasTitle,
        hasArtist
      });
    }
    
    return isValid;
  }

  async loadDefaultPlaylist(): Promise<Song[]> {
    return [...this.basePlaylist];
  }

  // Get a random valid song from the playlist
  getRandomValidSong(): Song | null {
    const validSongs = this.basePlaylist.filter(song => this.isValidSong(song));
    
    if (validSongs.length === 0) {
      console.error('No valid songs available in playlist');
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * validSongs.length);
    const selectedSong = validSongs[randomIndex];
    
    console.log('Selected valid song for mystery card:', {
      title: selectedSong.deezer_title,
      artist: selectedSong.deezer_artist,
      release_year: selectedSong.release_year,
      id: selectedSong.id
    });
    
    return selectedSong;
  }

  // New method to fetch preview URL for a specific song with enhanced error handling
  async fetchPreviewUrl(song: Song): Promise<Song> {
    console.log(`Fetching preview URL for: ${song.deezer_artist} - ${song.deezer_title}`);
    
    // Validate song before attempting to fetch preview
    if (!this.isValidSong(song)) {
      throw new Error(`Song validation failed: missing required data for ${song.deezer_title}`);
    }
    
    try {
      // Use Deezer API to search for the song and get preview URL
      const searchQuery = encodeURIComponent(`${song.deezer_artist} ${song.deezer_title}`);
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const deezerApiUrl = `https://api.deezer.com/search?q=${searchQuery}&limit=1`;
      const proxiedUrl = corsProxy + encodeURIComponent(deezerApiUrl);

      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout for mobile reliability
        signal: AbortSignal.timeout(10000) // 10 second timeout
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
        
        console.log(`Preview URL fetched successfully: ${updatedSong.preview_url}`);
        return updatedSong;
      } else {
        console.warn(`No search results found for: ${song.deezer_artist} - ${song.deezer_title}`);
        return song; // Return original song without preview_url
      }
    } catch (error) {
      console.error(`Failed to fetch preview URL for ${song.deezer_artist} - ${song.deezer_title}:`, error);
      
      // For mobile reliability, still return the song even if preview fails
      // The game can continue without audio preview
      return song;
    }
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

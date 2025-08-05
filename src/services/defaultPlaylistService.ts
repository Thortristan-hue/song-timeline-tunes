
import defaultPlaylistData from '@/data/defaultPlaylist.json';
import { Song } from '@/types/game';

export async function loadDefaultPlaylist(): Promise<Song[]> {
  try {
    console.log('🎵 Loading default playlist...');
    
    // Transform the JSON data to match our Song interface
    const songs: Song[] = defaultPlaylistData.map((item: any) => ({
      id: item.id || `song-${Math.random().toString(36).substr(2, 9)}`,
      deezer_title: item.title || item.deezer_title || 'Unknown Title',
      deezer_artist: item.artist || item.deezer_artist || 'Unknown Artist',
      deezer_album: item.album || item.deezer_album || 'Unknown Album',
      release_year: item.year || item.release_year || '2000',
      genre: item.genre || 'Unknown',
      cardColor: item.cardColor || '#007AFF',
      preview_url: item.preview_url || item.preview || '',
      deezer_url: item.deezer_url || item.url || ''
    }));

    console.log(`✅ Loaded ${songs.length} songs from default playlist`);
    return songs;
  } catch (error) {
    console.error('❌ Failed to load default playlist:', error);
    return [];
  }
}

// Helper function to filter valid songs
export function filterValidSongs(songs: Song[]): Song[] {
  return songs.filter(song => 
    song && 
    song.deezer_title && 
    song.deezer_artist && 
    song.release_year
  );
}

// Enhanced service with optimized loading
export const defaultPlaylistService = {
  loadDefaultPlaylist,
  filterValidSongs,
  
  async loadOptimizedGameSongs(maxSongs: number): Promise<Song[]> {
    try {
      const allSongs = await loadDefaultPlaylist();
      
      // Filter songs with valid preview URLs
      const songsWithPreviews = allSongs.filter(song => 
        song.preview_url && song.preview_url.trim() !== ''
      );
      
      // Return up to maxSongs songs
      return songsWithPreviews.slice(0, maxSongs);
    } catch (error) {
      console.error('❌ Failed to load optimized songs:', error);
      return [];
    }
  }
};

// Keep the old export for backward compatibility
export const getDefaultPlaylist = loadDefaultPlaylist;

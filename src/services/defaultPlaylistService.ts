
import { Song } from '@/types/game';
import defaultPlaylistData from '@/data/defaultPlaylist.json';

const PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/?url=';

interface DefaultPlaylistTrack {
  deezer_artist: string;
  deezer_title: string;
  deezer_album: string;
  deezer_duration: number;
  preview_url: string;
  deezer_url: string;
  enhanced_artist: string;
  enhanced_title: string;
  enhanced_album: string;
  release_year: string;
  genre: string;
  metadata_source: string;
}

class DefaultPlaylistService {
  private colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF',
    '#D7BDE2', '#A9DFBF', '#F9E79F', '#FAD7A0'
  ];

  private async fetchFreshPreviewUrl(deezerUrl: string): Promise<string | undefined> {
    try {
      // Extract track ID from Deezer URL
      const trackId = deezerUrl.match(/track\/(\d+)/)?.[1];
      if (!trackId) return undefined;

      const apiUrl = `https://api.deezer.com/track/${trackId}`;
      const proxiedUrl = PROXY_BASE + encodeURIComponent(apiUrl);
      
      const response = await fetch(proxiedUrl);
      if (!response.ok) return undefined;
      
      const data = await response.json();
      return data.preview || undefined;
    } catch (error) {
      console.error('Error fetching fresh preview URL:', error);
      return undefined;
    }
  }

  async loadDefaultPlaylist(): Promise<Song[]> {
    console.log('Loading default playlist...');
    
    const songs: Song[] = [];
    
    for (let i = 0; i < defaultPlaylistData.length; i++) {
      const track = defaultPlaylistData[i] as DefaultPlaylistTrack;
      
      // Fetch fresh preview URL
      const freshPreviewUrl = await this.fetchFreshPreviewUrl(track.deezer_url);
      
      const song: Song = {
        id: `default-song-${i}-${Date.now()}`,
        deezer_title: track.enhanced_title || track.deezer_title,
        deezer_artist: track.enhanced_artist || track.deezer_artist,
        deezer_album: track.enhanced_album || track.deezer_album,
        release_year: track.release_year,
        genre: track.genre || 'Unknown',
        cardColor: this.colors[i % this.colors.length],
        preview_url: freshPreviewUrl
      };
      
      songs.push(song);
    }
    
    console.log(`Successfully loaded ${songs.length} songs from default playlist`);
    return songs;
  }
}

export const defaultPlaylistService = new DefaultPlaylistService();

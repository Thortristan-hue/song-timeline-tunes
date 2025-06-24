// songService.ts
import { Song } from "@/types/game";

// Define types for external API responses
interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  album: { title: string; cover_medium: string; release_date?: string };
  duration: number;
  preview?: string;
  release_date?: string;
}

interface DeezerPlaylistResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  'artist-credit': Array<{ name: string }>;
  releases?: Array<{ date?: string }>;
  'release-group'?: { 'first-release-date'?: string };
}

interface MusicBrainzResponse {
  recordings?: MusicBrainzRecording[];
}

export class SongService {
  private static readonly PROXY_URL = 'https://timeliner-proxy.thortristanjd.workers.dev/';
  private static readonly DEEZER_BASE = 'https://api.deezer.com';
  private static readonly MUSICBRAINZ_BASE = 'https://musicbrainz.org';
  private static readonly DISCOGS_BASE = 'https://api.discogs.com';

  private requestQueue: Promise<void> = Promise.resolve();
  private lastRequestTime: number = 0;

  // Rate limit to 1 request per second
  private async rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    
    if (elapsed < 1000) {
      await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Main method to load a playlist
  public async loadPlaylist(playlistUrl: string): Promise<Song[]> {
    try {
      const playlistId = this.extractPlaylistId(playlistUrl);
      const tracks = await this.fetchPlaylistTracks(playlistId);
      
      // Process tracks in parallel with concurrency control
      const songPromises = tracks.map(track => 
        this.processTrackWithFallback(track)
      );
      
      const songs = await Promise.all(songPromises);
      return songs.filter(song => song !== null) as Song[];
    } catch (error) {
      console.error('Failed to load playlist:', error);
      throw new Error(`Playlist load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processTrackWithFallback(track: DeezerTrack): Promise<Song | null> {
    try {
      // Skip if no preview available
      if (!track.preview) {
        console.warn(`Skipping track without preview: ${track.title}`);
        return null;
      }

      // Try to get year from Deezer first
      let year = this.extractYearFromDeezer(track);
      
      // Fallback to MusicBrainz if year is missing
      if (!year) {
        year = await this.fetchYearFromMusicBrainz(track.artist.name, track.title);
      }
      
      // Final fallback if still no year
      if (!year) {
        console.warn(`Could not determine year for: ${track.title}`);
        return null;
      }

      return {
        id: `dzr-${track.id}`,
        deezer_title: track.title,
        deezer_artist: track.artist.name,
        deezer_album: track.album.title,
        preview_url: track.preview,
        release_year: year,
        cardColor: this.generateRandomColor(),
        album_cover: track.album.cover_medium
      };
    } catch (error) {
      console.warn(`Failed to process track ${track.title}:`, error);
      return null;
    }
  }

  private async fetchPlaylistTracks(playlistId: string): Promise<DeezerTrack[]> {
    await this.rateLimit();
    
    const url = `${SongService.DEEZER_BASE}/playlist/${playlistId}/tracks`;
    const proxyUrl = `${SongService.PROXY_URL}${encodeURIComponent(url)}`;
    
    try {
      const response = await this.fetchWithTimeout(proxyUrl);
      const data: DeezerPlaylistResponse = await response.json();
      
      if (!data?.data) {
        throw new Error('Invalid playlist data structure');
      }
      
      return data.data;
    } catch (error) {
      console.error('Failed to fetch playlist tracks:', error);
      throw error;
    }
  }

  private async fetchYearFromMusicBrainz(artist: string, title: string): Promise<string | null> {
    await this.rateLimit();
    
    try {
      const query = `artist:"${artist}" AND recording:"${title}"`;
      const url = `${SongService.MUSICBRAINZ_BASE}/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json`;
      const proxyUrl = `${SongService.PROXY_URL}${encodeURIComponent(url)}`;
      
      const response = await this.fetchWithTimeout(proxyUrl, {
        headers: { 'User-Agent': 'TimelineTunes/1.0 (your-email@example.com)' }
      });
      
      const data: MusicBrainzResponse = await response.json();
      
      if (data.recordings?.[0]) {
        const recording = data.recordings[0];
        
        // Try release group first
        if (recording['release-group']?.['first-release-date']) {
          return recording['release-group']['first-release-date'].split('-')[0];
        }
        
        // Fallback to individual releases
        if (recording.releases?.[0]?.date) {
          return recording.releases[0].date.split('-')[0];
        }
      }
      
      return null;
    } catch (error) {
      console.warn('MusicBrainz lookup failed:', error);
      return null;
    }
  }

  private extractPlaylistId(url: string): string {
    // Handle both full URLs and just IDs
    const match = url.match(/(?:playlist\/)?(\d+)/);
    if (!match?.[1]) {
      throw new Error('Invalid Deezer playlist URL or ID');
    }
    return match[1];
  }

  private extractYearFromDeezer(track: DeezerTrack): string | null {
    // Try track release date first
    if (track.release_date) {
      return track.release_date.split('-')[0];
    }
    
    // Fallback to album release date
    if (track.album?.release_date) {
      return track.album.release_date.split('-')[0];
    }
    
    return null;
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Singleton instance
export const songService = new SongService();

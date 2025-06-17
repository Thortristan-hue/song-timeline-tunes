import { Song } from "@/pages/Index";
const PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/?url=';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  album: { title: string };
  duration: number;
  preview?: string;
  link: string;
}

interface DeezerPlaylistResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

interface EnhancedMetadata {
  artist?: string;
  title?: string;
  album?: string;
  release_year?: string;
  source: 'musicbrainz' | 'discogs' | 'deezer_only';
}

class SongService {
  private cache: Song[] = [];
  private currentSong: Song | null = null;
  private nextSong: Song | null = null;
  private requestCount = 0;
  private lastRequestTime = 0;
  private playlistTracks: DeezerTrack[] = [];

  private rateLimit() {
    const now = Date.now();
    if (now - this.lastRequestTime < 1100) {
      return new Promise(resolve => {
        setTimeout(resolve, 1100 - (now - this.lastRequestTime));
      });
    }
    this.lastRequestTime = now;
    return Promise.resolve();
  }

  private extractPlaylistId(playlistUrl: string): string {
    const match = playlistUrl.match(/playlist\/(\d+)/);
    if (!match) throw new Error('Invalid Deezer playlist URL');
    return match[1];
  }

  private async fetchPlaylistTracks(playlistId: string): Promise<DeezerTrack[]> {
    const tracks: DeezerTrack[] = [];
    let index = 0;
    const limit = 50;

    while (true) {
      await this.rateLimit();
      
      const url = `https://api.deezer.com/playlist/${playlistId}/tracks?index=${index}&limit=${limit}`;
      const proxyUrl = `${PROXY_BASE}${encodeURIComponent(url)}`;
      
      try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Deezer API error: ${response.status}`);
        }
        
        const data: DeezerPlaylistResponse = await response.json();
        tracks.push(...data.data);
        
        if (data.data.length < limit) {
          break;
        }
        index += limit;
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        throw error;
      }
    }

    return tracks;
  }

  private async searchMusicBrainz(artist: string, title: string): Promise<EnhancedMetadata | null> {
    await this.rateLimit();
    
    const query = `"${artist}" AND recording:"${title}"`;
    const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=1`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TimelineTunes/1.0 (contact@timelinetunes.com)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`MusicBrainz API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.recordings || data.recordings.length === 0) {
        return null;
      }
      
      const recording = data.recordings[0];
      let releaseYear = null;
      
      // Try to get release year from release group
      if (recording['release-group']?.id) {
        const groupUrl = `https://musicbrainz.org/ws/2/release-group/${recording['release-group'].id}?fmt=json`;
        await this.rateLimit();
        
        try {
          const groupResponse = await fetch(groupUrl, {
            headers: {
              'User-Agent': 'TimelineTunes/1.0 (contact@timelinetunes.com)'
            }
          });
          
          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            const date = groupData['first-release-date'];
            if (date) {
              releaseYear = date.split('-')[0];
            }
          }
        } catch (error) {
          console.warn('Error fetching release group:', error);
        }
      }
      
      // Fallback to individual releases
      if (!releaseYear && recording.releases && recording.releases.length > 0) {
        const date = recording.releases[0].date;
        if (date) {
          releaseYear = date.split('-')[0];
        }
      }
      
      return {
        artist: recording['artist-credit']?.[0]?.name || artist,
        title: recording.title || title,
        album: recording.releases?.[0]?.title,
        release_year: releaseYear,
        source: 'musicbrainz'
      };
    } catch (error) {
      console.error('MusicBrainz search failed:', error);
      return null;
    }
  }

  private async searchDiscogs(artist: string, title: string): Promise<string | null> {
    await this.rateLimit();
    
    const query = `${artist} ${title}`;
    const url = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TimelineTunes/1.0',
        'Authorization': 'Discogs token=8c454de03e9c40e4926b95160145a221'
      }
    });
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TimelineTunes/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Discogs API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          if (result.year) {
            return result.year.toString();
          }
        }
      }
    } catch (error) {
      console.error('Discogs search failed:', error);
    }
    
    return null;
  }

  private async enhanceTrackMetadata(track: DeezerTrack): Promise<Song | null> {
    const artist = track.artist.name;
    const title = track.title;
    
    // Try MusicBrainz first
    let enhanced = await this.searchMusicBrainz(artist, title);
    
    // If MusicBrainz didn't provide a release year, try Discogs
    if (!enhanced?.release_year) {
      const discogsYear = await this.searchDiscogs(artist, title);
      if (discogsYear) {
        enhanced = {
          artist,
          title,
          album: track.album.title,
          release_year: discogsYear,
          source: 'discogs'
        };
      }
    }
    
    // If no enhanced metadata found, skip this track
    if (!enhanced?.release_year) {
      console.warn(`No release year found for ${artist} - ${title}, skipping`);
      return null;
    }
    
    // Verify preview URL is available
    if (!track.preview) {
      console.warn(`No preview available for ${artist} - ${title}, skipping`);
      return null;
    }
    
    // Generate a random card color
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', 
      '#BB8FCE', '#85C1E9', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C'
    ];
    const cardColor = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      deezer_artist: enhanced.artist || artist,
      deezer_title: enhanced.title || title,
      deezer_album: enhanced.album || track.album.title,
      preview_url: track.preview,
      release_year: enhanced.release_year,
      genre: "Unknown",
      cardColor
    };
  }

  async loadPlaylist(playlistUrl: string): Promise<Song[]> {
    try {
      const playlistId = this.extractPlaylistId(playlistUrl);
      console.log(`Loading playlist ${playlistId}...`);
  
      this.playlistTracks = await this.fetchPlaylistTracks(playlistId);
      console.log(`Found ${this.playlistTracks.length} tracks in playlist`);
  
      // Process all tracks and create Song objects
      const processedSongs: Song[] = [];
      for (const track of this.playlistTracks) {
        const song = await this.enhanceTrackMetadata(track);
        if (song) processedSongs.push(song);
      }
  
      return processedSongs;
    } catch (error) {
      console.error('Error loading playlist:', error);
      throw error;
    }
  }

  private async loadNextSong(): Promise<void> {
    if (this.playlistTracks.length === 0) {
      return;
    }
    
    let attempts = 0;
    const maxAttempts = Math.min(10, this.playlistTracks.length);
    
    while (attempts < maxAttempts) {
      const randomIndex = Math.floor(Math.random() * this.playlistTracks.length);
      const track = this.playlistTracks[randomIndex];
      
      try {
        const song = await this.enhanceTrackMetadata(track);
        if (song) {
          if (!this.currentSong) {
            this.currentSong = song;
          } else if (!this.nextSong) {
            this.nextSong = song;
          }
          return;
        }
      } catch (error) {
        console.warn(`Failed to process track ${track.artist.name} - ${track.title}:`, error);
      }
      
      attempts++;
    }
    
    console.error('Failed to load a valid song after maximum attempts');
  }

  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  async getNextSong(): Promise<Song | null> {
    if (!this.nextSong) {
      await this.loadNextSong();
    }
    
    // Move next song to current and load a new next song
    this.currentSong = this.nextSong;
    this.nextSong = null;
    
    // Load the next song in the background
    this.loadNextSong().catch(error => {
      console.error('Error pre-loading next song:', error);
    });
    
    return this.currentSong;
  }

  hasValidSongs(): boolean {
    return this.currentSong !== null;
  }
}

export const songService = new SongService();

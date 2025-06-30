
import { Song } from '@/types/game';
import { CorsProxyService } from '@/services/corsProxyService';

export class DeezerLoader {
  // Extract playlist ID from various Deezer URL formats
  extractPlaylistId(url: string): string | null {
    try {
      const patterns = [
        // Handle URLs with language codes like /en/, /fr/, etc.
        /deezer\.com\/[a-z]{2}\/playlist\/(\d+)/i,
        // Standard format without language code
        /deezer\.com\/playlist\/(\d+)/i,
        // Handle URLs with trailing periods or other characters
        /deezer\.com\/(?:[a-z]{2}\/)?playlist\/(\d+)[\.\?#]/i,
        // Mobile/share links
        /deezer\.page\.link\/.*playlist[/=](\d+)/i,
        // Short links
        /dzr\.lnk\.to\/.*playlist[/=](\d+)/i,
        // Just the ID
        /^(\d+)$/,
        // More flexible pattern for any format
        /\/playlist\/(\d+)/i
      ];

      // Clean the URL by removing trailing periods and other characters
      const cleanUrl = url.trim().replace(/[\.\?#].*$/, '');
      
      console.log('Attempting to parse URL:', cleanUrl);

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
          console.log(`Matched pattern: ${pattern}, extracted ID: ${match[1]}`);
          return match[1];
        }
      }
      console.log('No pattern matched for URL:', cleanUrl);
      return null;
    } catch (error) {
      console.error('Error extracting playlist ID:', error);
      return null;
    }
  }

  // Load songs from Deezer playlist
  async loadPlaylist(playlistUrl: string): Promise<Song[]> {
    try {
      const playlistId = this.extractPlaylistId(playlistUrl);
      if (!playlistId) {
        throw new Error('Invalid Deezer playlist URL. Please use a valid Deezer playlist link.');
      }

      console.log('Loading Deezer playlist with ID:', playlistId);

      const deezerApiUrl = `https://api.deezer.com/playlist/${playlistId}`;
      
      // Validate URL is supported by proxy
      if (!CorsProxyService.isSupportedUrl(deezerApiUrl)) {
        throw new Error('Deezer API is not supported by the proxy service');
      }

      const playlistData = await CorsProxyService.fetchJson<any>(deezerApiUrl);
      
      if (!playlistData.tracks || !playlistData.tracks.data || playlistData.tracks.data.length === 0) {
        throw new Error('No tracks found in this playlist. The playlist might be empty or private.');
      }

      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#AED6F1', '#E8DAEF',
        '#D7BDE2', '#A9DFBF', '#F9E79F', '#FAD7A0'
      ];

      const songs: Song[] = [];

      for (let i = 0; i < playlistData.tracks.data.length; i++) {
        const track = playlistData.tracks.data[i];
        
        // Fetch individual track data to get preview URL
        let previewUrl = track.preview || undefined;
        
        if (!previewUrl && track.id) {
          try {
            console.log(`🎵 Fetching preview URL for track ${track.id}...`);
            const trackData = await this.fetchTrackPreview(track.id.toString());
            previewUrl = trackData?.preview || undefined;
            console.log(`🎵 Preview URL for ${track.title}: ${previewUrl}`);
          } catch (error) {
            console.warn(`Failed to fetch preview for track ${track.id}:`, error);
          }
        }

        songs.push({
          id: track.id?.toString() || `track_${i}`,
          deezer_title: track.title || 'Unknown Title',
          deezer_artist: track.artist?.name || 'Unknown Artist',
          deezer_album: track.album?.title || 'Unknown Album',
          release_year: track.album?.release_date ? 
            new Date(track.album.release_date).getFullYear().toString() : 
            'Unknown',
          genre: this.getGenreFromTrack(track),
          cardColor: colors[i % colors.length],
          preview_url: previewUrl
        });
      }

      console.log(`Successfully loaded ${songs.length} songs from Deezer playlist`);
      return songs;

    } catch (error) {
      console.error('Error loading Deezer playlist:', error);
      throw error;
    }
  }

  // Fetch individual track data to get preview URL
  async fetchTrackPreview(trackId: string): Promise<{ preview?: string } | null> {
    try {
      const targetUrl = `https://api.deezer.com/track/${trackId}`;
      console.log(`🎵 Fetching track data from: ${targetUrl}`);
      
      const trackData = await CorsProxyService.fetchJson<any>(targetUrl);
      
      if (trackData && trackData.preview) {
        console.log(`✅ Found preview URL: ${trackData.preview}`);
        return { preview: trackData.preview };
      } else {
        console.warn(`❌ No preview URL found for track ${trackId}`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to fetch track preview for ${trackId}:`, error);
      return null;
    }
  }

  private getGenreFromTrack(track: any): string {
    // Try to get genre from various possible locations in the track data
    if (track.album?.genres?.data?.[0]?.name) {
      return track.album.genres.data[0].name;
    }
    if (track.artist?.genres?.data?.[0]?.name) {
      return track.artist.genres.data[0].name;
    }
    return 'Unknown';
  }

  // More permissive validation for Deezer URLs
  isValidDeezerUrl(url: string): boolean {
    const patterns = [
      /deezer\.com.*playlist/i,
      /deezer\.page\.link/i,
      /dzr\.lnk\.to/i,
      /^\d+$/ // Just numbers (playlist ID)
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  // Get user-friendly error messages
  getUrlFormatHelp(): string {
    return `Supported Deezer playlist URL formats:
• https://www.deezer.com/playlist/1234567890
• https://www.deezer.com/en/playlist/1234567890
• https://www.deezer.com/fr/playlist/1234567890
• https://deezer.page.link/...
• Just the playlist ID: 1234567890`;
  }
}

export const deezerLoader = new DeezerLoader();

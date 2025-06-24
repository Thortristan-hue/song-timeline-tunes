
import { Song } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";

export const songService = {
  async getSongsByRoomId(roomId: string): Promise<Song[]> {
    try {
      console.log('🎵 Fetching songs for room:', roomId);
      
      const { data, error } = await supabase
        .from('game_rooms')
        .select('songs')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error("❌ Supabase error fetching songs:", error);
        throw new Error(`Failed to fetch songs: ${error.message}`);
      }

      if (!data?.songs) {
        console.log('📝 No songs found for room, returning empty array');
        return [];
      }

      // Safely convert the JSON data to Song array
      if (!Array.isArray(data.songs)) {
        console.warn('⚠️ Songs data is not an array:', typeof data.songs);
        return [];
      }

      // Validate and convert each song
      const songs = (data.songs as unknown as Song[]).filter(song => {
        if (!song || typeof song !== 'object') return false;
        
        const isValid = song.id && 
                       song.deezer_title && 
                       song.deezer_artist && 
                       song.release_year;
        
        if (!isValid) {
          console.warn('🚫 Invalid song found:', song);
        }
        
        return isValid;
      });

      console.log(`✅ Successfully fetched ${songs.length} valid songs`);
      return songs;
    } catch (error) {
      console.error("❌ Error fetching songs:", error);
      throw error instanceof Error ? error : new Error('Unknown error fetching songs');
    }
  },

  async addSongToRoom(roomId: string, song: Song): Promise<Song | null> {
    try {
      console.log('➕ Adding song to room:', roomId, song.deezer_title);
      
      // Validate song data before adding
      if (!this.validateSong(song)) {
        throw new Error('Invalid song data provided');
      }

      // Get current songs
      const currentSongs = await this.getSongsByRoomId(roomId);
      const updatedSongs = [...currentSongs, song];

      const { data, error } = await supabase
        .from('game_rooms')
        .update({ songs: updatedSongs })
        .eq('id', roomId)
        .select('songs')
        .single();

      if (error) {
        console.error("❌ Supabase error adding song:", error);
        throw new Error(`Failed to add song: ${error.message}`);
      }

      console.log('✅ Successfully added song to room');
      return song;
    } catch (error) {
      console.error("❌ Error adding song:", error);
      throw error instanceof Error ? error : new Error('Unknown error adding song');
    }
  },

  async updateSong(song: Song): Promise<Song | null> {
    try {
      // Validate song data
      if (!this.validateSong(song)) {
        throw new Error('Invalid song data provided');
      }

      // For now, just return the song as we don't have individual song updates
      // This would require more complex logic to update within the JSONB array
      console.log('✅ Song validation passed');
      return song;
    } catch (error) {
      console.error("❌ Error updating song:", error);
      throw error instanceof Error ? error : new Error('Unknown error updating song');
    }
  },

  async deleteSong(songId: string): Promise<boolean> {
    try {
      if (!songId || typeof songId !== 'string') {
        throw new Error('Invalid song ID provided');
      }

      // This would require finding the room and removing the song from the JSONB array
      // For now, return true as we don't have this functionality implemented
      console.log('⚠️ Delete song functionality not yet implemented for ID:', songId);
      return true;
    } catch (error) {
      console.error("❌ Error deleting song:", error);
      return false;
    }
  },

  async loadPlaylist(url: string): Promise<Song[]> {
    try {
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid playlist URL provided');
      }

      // For now, return empty array as this would need external API integration
      console.warn("⚠️ External playlist loading not implemented - returning empty array");
      return [];
    } catch (error) {
      console.error("❌ Error loading playlist:", error);
      throw error instanceof Error ? error : new Error('Unknown error loading playlist');
    }
  },

  validateSong(song: any): song is Song {
    return song &&
           typeof song === 'object' &&
           typeof song.id === 'string' &&
           typeof song.deezer_title === 'string' &&
           typeof song.deezer_artist === 'string' &&
           typeof song.deezer_album === 'string' &&
           typeof song.release_year === 'string' &&
           song.deezer_title.trim() !== '' &&
           song.deezer_artist.trim() !== '' &&
           song.release_year.trim() !== '';
  },

  mapDeezerTrackToSong(track: any, previewUrl: string | null): Song {
    if (!track || typeof track !== 'object') {
      throw new Error('Invalid track data provided');
    }

    const song = {
      id: track.id ? track.id.toString() : `deezer_${Date.now()}`,
      deezer_title: track.title || 'Unknown Title',
      deezer_artist: track.artist?.name || 'Unknown Artist',
      deezer_album: track.album?.title || 'Unknown Album',
      release_year: track.release_date ? new Date(track.release_date).getFullYear().toString() : 'Unknown',
      genre: track.genre || 'Unknown',
      preview_url: previewUrl,
      cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
    };

    return song;
  },

  mapSpotifyTrackToSong(track: any, previewUrl: string | null): Song {
    if (!track || typeof track !== 'object') {
      throw new Error('Invalid track data provided');
    }

    const releaseYear = track.album?.release_date ? 
      new Date(track.album.release_date).getFullYear().toString() : 'Unknown';

    return {
      id: track.id || `spotify_${Date.now()}`,
      deezer_title: track.name || 'Unknown Title',
      deezer_artist: track.artists?.[0]?.name || 'Unknown Artist',
      deezer_album: track.album?.name || 'Unknown Album',
      release_year: releaseYear,
      genre: 'Unknown',
      preview_url: previewUrl,
      cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
    };
  },

  mapAppleTrackToSong(track: any, previewUrl: string | null): Song {
    if (!track || typeof track !== 'object') {
      throw new Error('Invalid track data provided');
    }

    const releaseYear = track.releaseDate ? 
      new Date(track.releaseDate).getFullYear().toString() : 'Unknown';

    return {
      id: track.id ? track.id.toString() : `apple_${Date.now()}`,
      deezer_title: track.name || track.trackName || 'Unknown Title',
      deezer_artist: track.artistName || 'Unknown Artist',
      deezer_album: track.collectionName || 'Unknown Album',
      release_year: releaseYear,
      genre: 'Unknown',
      preview_url: previewUrl,
      cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
    };
  },

  mapLocalTrackToSong(song: any, previewUrl: string | null): Song {
    if (!song || typeof song !== 'object') {
      throw new Error('Invalid song data provided');
    }

    return {
      id: song.id || `local_${Date.now()}`,
      deezer_title: song.deezer_title || 'Unknown Title',
      deezer_artist: song.deezer_artist || 'Unknown Artist',
      deezer_album: song.deezer_album || 'Unknown Album',
      release_year: song.release_year || 'Unknown',
      genre: song.genre || 'Unknown',
      preview_url: previewUrl,
      cardColor: song.cardColor || '#'+Math.floor(Math.random()*16777215).toString(16)
    };
  },

  createSongObject(song: any, previewUrl: string | null): Song {
    if (!song || typeof song !== 'object') {
      throw new Error('Invalid song data provided');
    }

    return {
      id: song.id || `song_${Date.now()}`,
      deezer_title: song.deezer_title || 'Unknown Title',
      deezer_artist: song.deezer_artist || 'Unknown Artist',
      deezer_album: song.deezer_album || 'Unknown Album',
      release_year: song.release_year || 'Unknown',
      genre: song.genre || 'Unknown',
      preview_url: previewUrl,
      cardColor: song.cardColor || '#'+Math.floor(Math.random()*16777215).toString(16)
    };
  }
};

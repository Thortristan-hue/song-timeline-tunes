
import { Song } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";

export const songService = {
  async getSongsByRoomId(roomId: string): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('songs')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error("Error fetching songs:", error);
        return [];
      }

      return (data?.songs as Song[]) || [];
    } catch (error) {
      console.error("Error fetching songs:", error);
      return [];
    }
  },

  async addSongToRoom(roomId: string, song: Song): Promise<Song | null> {
    try {
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
        console.error("Error adding song:", error);
        return null;
      }

      return song;
    } catch (error) {
      console.error("Error adding song:", error);
      return null;
    }
  },

  async updateSong(song: Song): Promise<Song | null> {
    try {
      // For now, just return the song as we don't have individual song updates
      // This would require more complex logic to update within the JSONB array
      return song;
    } catch (error) {
      console.error("Error updating song:", error);
      return null;
    }
  },

  async deleteSong(songId: string): Promise<boolean> {
    try {
      // This would require finding the room and removing the song from the JSONB array
      // For now, return true as we don't have this functionality implemented
      return true;
    } catch (error) {
      console.error("Error deleting song:", error);
      return false;
    }
  },

  async loadPlaylist(url: string): Promise<Song[]> {
    try {
      // For now, return empty array as this would need external API integration
      console.warn("loadPlaylist not implemented - returning empty array");
      return [];
    } catch (error) {
      console.error("Error loading playlist:", error);
      return [];
    }
  },

  mapDeezerTrackToSong(track: any, previewUrl: string | null): Song {
      const song = {
        id: track.id.toString(),
        deezer_title: track.title,
        deezer_artist: track.artist.name,
        deezer_album: track.album.title,
        release_year: track.release_date ? new Date(track.release_date).getFullYear().toString() : 'Unknown',
        genre: track.genre || 'Unknown',
        preview_url: previewUrl,
        cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
      };

      return song;
  },

  mapSpotifyTrackToSong(track: any, previewUrl: string | null): Song {
      const releaseYear = track.album.release_date ? new Date(track.album.release_date).getFullYear().toString() : 'Unknown';

      return {
        id: track.id,
        deezer_title: track.name,
        deezer_artist: track.artists[0].name,
        deezer_album: track.album.name,
        release_year: releaseYear,
        genre: 'Unknown',
        preview_url: previewUrl,
        cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
      };
  },

  mapAppleTrackToSong(track: any, previewUrl: string | null): Song {
      const releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear().toString() : 'Unknown';

      return {
        id: track.id,
        deezer_title: track.name,
        deezer_artist: track.artistName,
        deezer_album: track.collectionName,
        release_year: releaseYear,
        genre: 'Unknown',
        preview_url: previewUrl,
        cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
      };
  },

  mapLocalTrackToSong(song: any, previewUrl: string | null): Song {
      return {
        id: song.id,
        deezer_title: song.deezer_title,
        deezer_artist: song.deezer_artist,
        deezer_album: song.deezer_album,
        release_year: song.release_year,
        genre: song.genre || 'Unknown',
        preview_url: previewUrl,
        cardColor: song.cardColor
      };
  },

  createSongObject(song: any, previewUrl: string | null): Song {
      return {
        id: song.id,
        deezer_title: song.deezer_title,
        deezer_artist: song.deezer_artist,
        deezer_album: song.deezer_album,
        release_year: song.release_year,
        genre: song.genre || 'Unknown',
        preview_url: previewUrl,
        cardColor: song.cardColor
      };
  }
};

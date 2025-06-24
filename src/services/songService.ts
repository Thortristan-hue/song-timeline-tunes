import { Song } from "@/types/game";
import { supabase } from "@/integrations/supabase/client";

export const songService = {
  async getSongsByRoomId(roomId: string): Promise<Song[]> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('room_id', roomId);

      if (error) {
        console.error("Error fetching songs:", error);
        return [];
      }

      return data as Song[];
    } catch (error) {
      console.error("Error fetching songs:", error);
      return [];
    }
  },

  async addSongToRoom(roomId: string, song: Song): Promise<Song | null> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([{ ...song, room_id: roomId }])
        .select('*')
        .single();

      if (error) {
        console.error("Error adding song:", error);
        return null;
      }

      return data as Song;
    } catch (error) {
      console.error("Error adding song:", error);
      return null;
    }
  },

  async updateSong(song: Song): Promise<Song | null> {
    try {
      const { data, error } = await supabase
        .from('songs')
        .update(song)
        .eq('id', song.id)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating song:", error);
        return null;
      }

      return data as Song;
    } catch (error) {
      console.error("Error updating song:", error);
      return null;
    }
  },

  async deleteSong(songId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) {
        console.error("Error deleting song:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting song:", error);
      return false;
    }
  },

  mapDeezerTrackToSong(track: any, previewUrl: string | null): Song {
      const song = {
        id: track.id.toString(),
        deezer_id: track.id.toString(),
        deezer_title: track.title,
        deezer_artist: track.artist.name,
        deezer_album: track.album.title,
        release_year: track.release_date ? new Date(track.release_date).getFullYear().toString() : 'Unknown',
        preview_url: previewUrl,
        cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
      };

      return song;
  },

  mapSpotifyTrackToSong(track: any, previewUrl: string | null): Song {
      const releaseYear = track.album.release_date ? new Date(track.album.release_date).getFullYear().toString() : 'Unknown';

      return {
        id: track.id,
        deezer_id: track.id,
        deezer_title: track.name,
        deezer_artist: track.artists[0].name,
        deezer_album: track.album.name,
        release_year: releaseYear,
        preview_url: previewUrl,
        cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
      };
  },

  mapAppleTrackToSong(track: any, previewUrl: string | null): Song {
      const releaseYear = track.releaseDate ? new Date(track.releaseDate).getFullYear().toString() : 'Unknown';

      return {
        id: track.id,
        deezer_id: track.id,
        deezer_title: track.name,
        deezer_artist: track.artistName,
        deezer_album: track.collectionName,
        release_year: releaseYear,
        preview_url: previewUrl,
        cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
      };
  },

  mapLocalTrackToSong(song: any, previewUrl: string | null): Song {
      return {
        id: song.id,
        deezer_id: song.id,
        deezer_title: song.deezer_title,
        deezer_artist: song.deezer_artist,
        deezer_album: song.deezer_album,
        release_year: song.release_year,
        preview_url: previewUrl,
        cardColor: song.cardColor
      };
  },

  createSongObject(song: any, previewUrl: string | null): Song {
      return {
        id: song.id,
        deezer_id: song.deezer_id,
        deezer_title: song.deezer_title,
        deezer_artist: song.deezer_artist,
        deezer_album: song.deezer_album,
        release_year: song.release_year,
        preview_url: previewUrl,
        cardColor: song.cardColor
      };
  }
};

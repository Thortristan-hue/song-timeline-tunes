import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GamePhase, GameMode, GameModeSettings } from '@/types/game';
import { Json } from '@/integrations/supabase/types';

export class GameService {
  static async initializeGameWithStartingCards(roomId: string, songs: Song[]): Promise<void> {
    try {
      // Fetch all players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        throw new Error('Failed to fetch players');
      }

      if (!players || players.length === 0) {
        console.warn('No players found in the room.');
        return;
      }

      // Assign a starting card to each player
      for (const player of players) {
        if (!player || !player.id) {
          console.warn('Invalid player data:', player);
          continue;
        }

        // Select a random card from the provided songs
        const randomCard = songs[Math.floor(Math.random() * songs.length)];

        // Ensure randomCard is not undefined
        if (!randomCard) {
          console.warn('No songs available to assign.');
          continue;
        }

        // Update the player's timeline with the starting card at position 0
        const { error: updateError } = await supabase
          .from('players')
          .update({ timeline: [randomCard] as any })
          .eq('id', player.id);

        if (updateError) {
          console.error(`Error assigning starting card to player ${player.id}:`, updateError);
        } else {
          console.log(`Assigned starting card to player ${player.id}`);
        }
      }

      console.log('Successfully initialized game with starting cards for all players.');

    } catch (error) {
      console.error('Error in initializeGameWithStartingCards:', error);
      throw error;
    }
  }

  static async placeCard(roomId: string, playerId: string, song: Song, position: number): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }> {
    try {
      // Optimistic update: Assume the card placement is correct
      const { error: playerUpdateError } = await supabase
        .from('players')
        .update({ timeline: { [position]: song } as any })
        .eq('id', playerId);

      if (playerUpdateError) {
        console.error('Error placing card:', playerUpdateError);
        return { success: false };
      }

      // Check if the placed card is correct (you'll need to implement this logic)
      const isCorrect = await this.isCardPlacementCorrect(roomId, playerId, song, position);

      // If the card placement is incorrect, revert the timeline and return
      if (!isCorrect) {
        console.log('Incorrect card placement. Reverting timeline.');
        await this.revertTimeline(roomId, playerId, position);
        return { success: false, correct: false };
      }

      // Award points to the player (you'll need to implement this logic)
      await this.awardPoints(roomId, playerId, 10); // Example: Award 10 points

      // Check if the game has ended (you'll need to implement this logic)
      const gameEnded = await this.checkIfGameEnded(roomId);

      if (gameEnded) {
        console.log('Game has ended!');
        const winner = await this.determineWinner(roomId);
        return { success: true, correct: true, gameEnded: true, winner: winner || undefined };
      }

      return { success: true, correct: true, gameEnded: false };
    } catch (error) {
      console.error('Error in placeCard:', error);
      return { success: false };
    }
  }

  static async placeCardAndAdvanceTurn(roomId: string, playerId: string, song: Song, position: number): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }> {
    try {
      const result = await this.placeCard(roomId, playerId, song, position);
      
      if (result.success && result.correct) {
        // Advance to next turn if card placement was successful and correct
        await this.advanceTurn(roomId);
      }
      
      return result;
    } catch (error) {
      console.error('Error in placeCardAndAdvanceTurn:', error);
      return { success: false };
    }
  }

  static async advanceTurn(roomId: string): Promise<void> {
    try {
      const room = await this.getRoomDetails(roomId);
      if (!room) return;

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at');

      if (players && players.length > 0) {
        const currentTurnIndex = room.current_turn || 0;
        const nextTurnIndex = (currentTurnIndex + 1) % players.length;
        const nextPlayerId = players[nextTurnIndex]?.id;

        await supabase
          .from('game_rooms')
          .update({
            current_turn: nextTurnIndex,
            current_player_id: nextPlayerId
          })
          .eq('id', roomId);
      }
    } catch (error) {
      console.error('Error advancing turn:', error);
    }
  }

  static async endGame(roomId: string): Promise<void> {
    try {
      await supabase
        .from('game_rooms')
        .update({
          phase: 'finished',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  }

  static async isCardPlacementCorrect(roomId: string, playerId: string, song: Song, position: number): Promise<boolean> {
    try {
      // Fetch the game room details
      const room = await this.getRoomDetails(roomId);

      if (!room) {
        console.error('Room not found');
        return false;
      }

      // Fetch the current song
      const currentSong = room.current_song;

      if (!currentSong) {
        console.error('Current song not set');
        return false;
      }

      // Fetch the player's timeline
      const player = await this.getPlayer(playerId);

      if (!player) {
        console.error('Player not found');
        return false;
      }

      // Check if the placed card matches the current song
      if (song.id === currentSong.id) {
        console.log('Correct card placement!');
        return true;
      } else {
        console.log('Incorrect card placement.');
        return false;
      }
    } catch (error) {
      console.error('Error in isCardPlacementCorrect:', error);
      return false;
    }
  }

  static async revertTimeline(roomId: string, playerId: string, position: number): Promise<void> {
    try {
      // Revert the timeline by setting the placed card to null
      const { error } = await supabase
        .from('players')
        .update({ timeline: { [position]: null } as any })
        .eq('id', playerId);

      if (error) {
        console.error('Error reverting timeline:', error);
        throw new Error('Failed to revert timeline');
      }

      console.log('Timeline reverted successfully.');
    } catch (error) {
      console.error('Error in revertTimeline:', error);
      throw error;
    }
  }

  static async awardPoints(roomId: string, playerId: string, points: number): Promise<void> {
    try {
      // Fetch the player's current score
      const player = await this.getPlayer(playerId);

      if (!player) {
        console.error('Player not found');
        return;
      }

      const currentScore = player.score || 0;

      // Award points to the player
      const { error } = await supabase
        .from('players')
        .update({ score: currentScore + points })
        .eq('id', playerId);

      if (error) {
        console.error('Error awarding points:', error);
        throw new Error('Failed to award points');
      }

      console.log(`Awarded ${points} points to player ${playerId}.`);
    } catch (error) {
      console.error('Error in awardPoints:', error);
      throw error;
    }
  }

  static async checkIfGameEnded(roomId: string): Promise<boolean> {
    try {
      // Fetch all players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        return false;
      }

      if (!players || players.length === 0) {
        console.warn('No players found in the room.');
        return false;
      }

      // Check if all players have completed their timelines
      for (const player of players) {
        if (!player || !player.timeline) {
          continue;
        }

        const timeline = player.timeline as (Song | null)[];
        if (timeline.length < 5 || timeline.some(card => card === null)) {
          console.log(`Game not ended. Player ${player.id} has an incomplete timeline.`);
          return false;
        }
      }

      console.log('Game has ended!');
      return true;
    } catch (error) {
      console.error('Error in checkIfGameEnded:', error);
      return false;
    }
  }

  static async determineWinner(roomId: string): Promise<Player | null> {
    try {
      // Fetch all players in the room
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        return null;
      }

      if (!players || players.length === 0) {
        console.warn('No players found in the room.');
        return null;
      }

      // Determine the winner based on the highest score
      let winner: Player | null = null;
      let highestScore = -1;

      for (const player of players) {
        if (player.score !== undefined && player.score > highestScore) {
          highestScore = player.score;
          winner = this.convertDbPlayerToPlayer(player);
        }
      }

      if (winner) {
        console.log(`Winner is player ${winner.id} with a score of ${highestScore}.`);
      } else {
        console.warn('No winner could be determined.');
      }

      return winner;
    } catch (error) {
      console.error('Error in determineWinner:', error);
      return null;
    }
  }

  static async getPlayer(playerId: string): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) {
        console.error('Error fetching player:', error);
        return null;
      }

      if (!data) return null;

      return this.convertDbPlayerToPlayer(data);
    } catch (error) {
      console.error('Error in getPlayer:', error);
      return null;
    }
  }

  // Helper function to safely convert database player to Player type
  private static convertDbPlayerToPlayer(dbPlayer: any): Player {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color || '#007AFF',
      timelineColor: dbPlayer.timeline_color || '#007AFF',
      score: dbPlayer.score || 0,
      timeline: this.jsonArrayToSongs(dbPlayer.timeline),
      character: dbPlayer.character || 'char_dave'
    };
  }

  // Helper function to safely convert Json to Song
  private static jsonToSong = (json: Json): Song | null => {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
    
    const obj = json as Record<string, any>;
    if (!obj.deezer_title) return null;
    
    return {
      id: obj.id || `song-${Math.random().toString(36).substr(2, 9)}`,
      deezer_title: obj.deezer_title || 'Unknown Title',
      deezer_artist: obj.deezer_artist || 'Unknown Artist',
      deezer_album: obj.deezer_album || 'Unknown Album',
      release_year: obj.release_year || '2000',
      genre: obj.genre || 'Unknown',
      cardColor: obj.cardColor || '#007AFF',
      preview_url: obj.preview_url || '',
      deezer_url: obj.deezer_url || ''
    };
  };

  // Helper function to safely convert Json array to Song array
  private static jsonArrayToSongs = (jsonArray: Json): Song[] => {
    if (!Array.isArray(jsonArray)) return [];
    
    return jsonArray
      .map(item => this.jsonToSong(item))
      .filter((song): song is Song => song !== null);
  };

  // Helper function to safely convert database phase to GamePhase
  private static toGamePhase = (phase: string): GamePhase => {
    const validPhases: GamePhase[] = ['menu', 'hostLobby', 'mobileJoin', 'mobileLobby', 'lobby', 'playing', 'finished'];
    return validPhases.includes(phase as GamePhase) ? (phase as GamePhase) : 'lobby';
  };

  // Helper function to safely convert to GameMode
  private static toGameMode = (mode: string): GameMode => {
    const validModes: GameMode[] = ['classic', 'sprint', 'fiend'];
    return validModes.includes(mode as GameMode) ? (mode as GameMode) : 'classic';
  };

  // Helper function to safely convert Json to GameModeSettings
  private static toGameModeSettings = (settings: Json): GameModeSettings => {
    if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
      return settings as GameModeSettings;
    }
    return {};
  };

  static async getRoomDetails(roomId: string): Promise<GameRoom | null> {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room details:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: data.host_name || '',
        phase: this.toGamePhase(data.phase),
        gamemode: this.toGameMode(data.gamemode),
        gamemode_settings: this.toGameModeSettings(data.gamemode_settings),
        songs: this.jsonArrayToSongs(data.songs),
        created_at: data.created_at,
        updated_at: data.updated_at,
        current_turn: data.current_turn || 0,
        current_song: this.jsonToSong(data.current_song),
        current_player_id: data.current_player_id || null
      };
    } catch (error) {
      console.error('Error in getRoomDetails:', error);
      return null;
    }
  }
}

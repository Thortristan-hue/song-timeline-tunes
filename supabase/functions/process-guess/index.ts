import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessGuessRequest {
  roomId: string;
  playerId: string;
  guessedSong: {
    id: string;
    deezer_title: string;
    deezer_artist: string;
    release_year: string;
  };
  position: number;
  mysteryCard: {
    id: string;
    deezer_title: string;
    deezer_artist: string;
    release_year: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { roomId, playerId, guessedSong, position, mysteryCard }: ProcessGuessRequest = await req.json();

    console.log('[ProcessGuess] Processing guess:', { roomId, playerId, guessedSong, position, mysteryCard });

    // Step 1: Validate the guess
    const isCorrect = parseInt(mysteryCard.release_year) >= parseInt(guessedSong.release_year);
    
    console.log('[ProcessGuess] Guess validation:', {
      mysteryYear: mysteryCard.release_year,
      guessedYear: guessedSong.release_year,
      isCorrect
    });

    // Step 2: Get current room data
    const { data: roomData, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      throw new Error('Room not found');
    }

    // Step 3: Get all players to determine next player
    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_host', false)
      .order('joined_at', { ascending: true });

    if (playersError || !playersData) {
      throw new Error('Players not found');
    }

    // Step 4: Update player's timeline if guess is correct
    if (isCorrect) {
      const { data: currentPlayerData, error: playerError } = await supabase
        .from('players')
        .select('timeline')
        .eq('id', playerId)
        .single();

      if (playerError || !currentPlayerData) {
        throw new Error('Player not found');
      }

      const currentTimeline = Array.isArray(currentPlayerData.timeline) ? currentPlayerData.timeline : [];
      const newTimeline = [...currentTimeline];
      newTimeline.splice(position, 0, mysteryCard);

      const { error: updatePlayerError } = await supabase
        .from('players')
        .update({ 
          timeline: newTimeline,
          score: newTimeline.length 
        })
        .eq('id', playerId);

      if (updatePlayerError) {
        throw new Error('Failed to update player timeline');
      }

      console.log('[ProcessGuess] Player timeline updated successfully');
    }

    // Step 5: Advance to next player
    const currentPlayerIndex = playersData.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % playersData.length;
    const nextPlayerId = playersData[nextPlayerIndex].id;

    // Step 6: Select new mystery card from available songs
    const availableSongs = Array.isArray(roomData.songs) ? roomData.songs : [];
    if (availableSongs.length === 0) {
      throw new Error('No songs available for mystery card');
    }

    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    const newMysteryCard = availableSongs[randomIndex];

    // Step 7: Update room with new turn and mystery card
    const { error: updateRoomError } = await supabase
      .from('game_rooms')
      .update({
        current_turn: (roomData.current_turn || 0) + 1,
        current_player_id: nextPlayerId,
        current_song: newMysteryCard,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (updateRoomError) {
      throw new Error('Failed to update room state');
    }

    console.log('[ProcessGuess] Room state updated successfully');

    // Step 8: Log the move for game history
    const { error: moveError } = await supabase
      .from('game_moves')
      .insert({
        room_id: roomId,
        player_id: playerId,
        move_type: 'card_placement',
        move_data: {
          guessedSong,
          mysteryCard,
          position,
          isCorrect,
          timestamp: new Date().toISOString()
        }
      });

    if (moveError) {
      console.warn('[ProcessGuess] Failed to log move:', moveError);
      // Don't throw error for move logging failure
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isCorrect,
        nextPlayerId,
        newMysteryCard,
        message: `Guess processed. ${isCorrect ? 'Correct' : 'Incorrect'} placement.`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[ProcessGuess] Error processing guess:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process guess',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
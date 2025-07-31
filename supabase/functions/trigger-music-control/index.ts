import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MusicControlRequest {
  roomId: string;
  action: 'play' | 'pause' | 'stop';
  trackId?: string;
  trackUrl?: string;
  position?: number;
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

    const { roomId, action, trackId, trackUrl, position }: MusicControlRequest = await req.json();

    console.log('[MusicControl] Processing music control action:', { roomId, action, trackId });

    // Update the game room's music state in the database
    const musicState = {
      is_playing: action === 'play',
      current_track_id: trackId || null,
      current_track_url: trackUrl || null,
      playback_position: position || 0,
      last_updated: new Date().toISOString()
    };

    // Update the room's current_song field with music state
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        current_song: {
          ...musicState,
          action: action
        }
      })
      .eq('id', roomId);

    if (updateError) {
      console.error('[MusicControl] Error updating game room music state:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update music state' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Broadcast the music control event to all clients in the room
    const channel = supabase.channel(`room-${roomId}`);
    
    const musicEvent = {
      type: 'MUSIC_CONTROL',
      action,
      trackId,
      trackUrl,
      position,
      timestamp: Date.now()
    };

    // Send the event via broadcast
    const { error: broadcastError } = await channel.send({
      type: 'broadcast',
      event: 'music-control',
      payload: musicEvent
    });

    if (broadcastError) {
      console.error('[MusicControl] Error broadcasting music event:', broadcastError);
      return new Response(
        JSON.stringify({ error: 'Failed to broadcast music event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[MusicControl] Music event broadcasted successfully:', musicEvent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Music ${action} event sent to room ${roomId}`,
        musicState
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[MusicControl] Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
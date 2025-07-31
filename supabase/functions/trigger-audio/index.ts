import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AudioTriggerRequest {
  roomId: string;
  action: 'play' | 'pause' | 'stop';
  songData?: {
    id: string;
    preview_url: string;
    deezer_title: string;
    deezer_artist: string;
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

    const { roomId, action, songData }: AudioTriggerRequest = await req.json();

    console.log('[AudioTrigger] Processing audio action:', { roomId, action, songData });

    // Broadcast the audio control event to all clients in the room
    const channel = supabase.channel(`room-${roomId}`);
    
    const audioEvent = {
      type: 'AUDIO_CONTROL',
      action,
      songData,
      timestamp: Date.now()
    };

    // Send the event via broadcast
    const { error } = await channel.send({
      type: 'broadcast',
      event: 'audio-control',
      payload: audioEvent
    });

    if (error) {
      console.error('[AudioTrigger] Error broadcasting audio event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to broadcast audio event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[AudioTrigger] Audio event broadcasted successfully:', audioEvent);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Audio ${action} event sent to room ${roomId}` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[AudioTrigger] Error processing request:', error);
    
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
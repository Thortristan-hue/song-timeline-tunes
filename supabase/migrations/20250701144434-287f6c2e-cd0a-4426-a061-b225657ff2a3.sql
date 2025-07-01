
-- Add current_song column to game_rooms table to store the mystery card
ALTER TABLE public.game_rooms 
ADD COLUMN current_song JSONB;

-- Add current_player_id column to track whose turn it is
ALTER TABLE public.game_rooms 
ADD COLUMN current_player_id TEXT;

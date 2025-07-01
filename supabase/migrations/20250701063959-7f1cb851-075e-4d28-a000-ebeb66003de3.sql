
-- Add host_name column to game_rooms table
ALTER TABLE public.game_rooms 
ADD COLUMN host_name TEXT;

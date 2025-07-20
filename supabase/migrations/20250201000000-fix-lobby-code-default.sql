-- Fix lobby code generation by setting DEFAULT value on lobby_code column
-- This allows the generate_lobby_code() function to be used automatically when no lobby_code is provided

ALTER TABLE public.game_rooms 
ALTER COLUMN lobby_code SET DEFAULT generate_lobby_code();
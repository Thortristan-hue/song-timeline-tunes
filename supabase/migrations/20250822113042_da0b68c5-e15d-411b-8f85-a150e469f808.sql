-- Fix the host_id column to accept text session IDs instead of UUIDs
-- The current UUID constraint is causing "invalid input syntax for type uuid" errors

ALTER TABLE public.game_rooms 
ALTER COLUMN host_id TYPE TEXT;

ALTER TABLE public.players 
ALTER COLUMN player_session_id TYPE TEXT;
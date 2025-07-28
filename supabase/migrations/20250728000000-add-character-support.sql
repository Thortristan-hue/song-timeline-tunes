-- Add character support to players table
ALTER TABLE public.players ADD COLUMN character TEXT DEFAULT 'mike';

-- Create index for better performance when querying by character
CREATE INDEX idx_players_character ON public.players(character);

-- Update existing players to have a default character
UPDATE public.players SET character = 'mike' WHERE character IS NULL;
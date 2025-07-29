
-- Add character column to players table
ALTER TABLE public.players 
ADD COLUMN character text DEFAULT 'char_dave';

-- Update the character column to not be nullable and have a proper default
ALTER TABLE public.players 
ALTER COLUMN character SET NOT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.players.character IS 'Character ID selected by the player from the game characters list';

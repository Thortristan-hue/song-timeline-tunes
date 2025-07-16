-- Add gamemode support to game_rooms table
ALTER TABLE public.game_rooms 
ADD COLUMN gamemode TEXT NOT NULL DEFAULT 'classic' CHECK (gamemode IN ('classic', 'fiend', 'sprint'));

ALTER TABLE public.game_rooms 
ADD COLUMN gamemode_settings JSONB DEFAULT '{}'::jsonb;

-- Add index for gamemode queries
CREATE INDEX idx_game_rooms_gamemode ON public.game_rooms(gamemode);

-- Add comment for clarity
COMMENT ON COLUMN public.game_rooms.gamemode IS 'Type of game mode: classic (timeline), fiend (year guessing), sprint (simultaneous play)';
COMMENT ON COLUMN public.game_rooms.gamemode_settings IS 'JSON object containing gamemode-specific settings like rounds for fiend mode or target cards for sprint mode';